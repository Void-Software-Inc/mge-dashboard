'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster, toast } from 'sonner'
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeftIcon, DownloadIcon, Cross2Icon, UploadIcon } from "@radix-ui/react-icons"

import { useRouter } from 'next/navigation'
import { useAppContext } from '@/app/context/AppContext'
import { getProduct, getProductImages, updateProduct, deleteProductImage, createProductImage } from "@/services/products"
import { Product, productTypes, ProductImage, productColors } from "@/utils/types/products"

interface FormErrors {
  name?: string;
  type?: string;
  color?: string;
  price?: string;
  stock?: string;
}

export default function ProductForm({ productId }: { productId: string }) {
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [secondaryImages, setSecondaryImages] = useState<ProductImage[] | null>(null)
  const [taintedImages, setTaintedImages] = useState<Set<number>>(new Set())
  const [createdImages, setCreatedImages] = useState<File[]>([])
  const [formData, setFormData] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isFormValid, setIsFormValid] = useState(true)

  const [isChanged, setIsChanged] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setProductsShouldRefetch } = useAppContext()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleGoBack = useCallback(() => {
    router.push('/products')
  }, [router])
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [fetchedProduct, fetchedProductImages] = await Promise.all([
          getProduct(parseInt(productId)),
          getProductImages(parseInt(productId))
        ])
        setProduct(fetchedProduct)
        setFormData(fetchedProduct)
        setSecondaryImages(fetchedProductImages)
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Failed to load product')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  useEffect(() => {
    setIsChanged(
      JSON.stringify(product) !== JSON.stringify(formData) || 
      selectedFile !== null ||
      taintedImages.size > 0 ||
      createdImages.length > 0
    )
  }, [product, formData, selectedFile, taintedImages, createdImages])

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {}
    let isValid = true

    if (!formData?.name) {
      newErrors.name = "Le nom du produit est obligatoire"
      isValid = false
    }
    if (!formData?.type) {
      newErrors.type = "Le type du produit est obligatoire"
      isValid = false
    }
    if (!formData?.color) {
      newErrors.color = "La couleur du produit est obligatoire"
      isValid = false
    }
    if (!formData?.price) {
      newErrors.price = "Le prix du produit est invalide"
      isValid = false
    }
    if (!formData?.stock) {
      newErrors.stock = "Le stock du produit est invalide"
      isValid = false
    }

    setErrors(newErrors)
    setIsFormValid(isValid)
    return isValid
  }, [formData])

  useEffect(() => {
    validateForm()
  }, [formData, validateForm])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    if (id === 'stock') {
      // Only allow numeric input for stock
      if (!/^\d*$/.test(value)) return
      // Convert to number or null if empty
      const numValue = value === '' ? null : parseInt(value, 10)
      //@ts-ignore
      setFormData(prev => ({
        ...prev,
        [id]: numValue
      }));
    } else if (id === 'price') {
      // Allow decimal numbers for price
      if (!/^\d*\.?\d*$/.test(value)) return
      // Convert to number or null if empty
      const numValue = value === '' ? null : parseFloat(value)
      //@ts-ignore
      setFormData(prev => ({
        ...prev,
        [id]: numValue
      }));
    } else {
      setFormData(prev => prev ? { ...prev, [id]: value } : null)
    }
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => prev ? { ...prev, [id]: value } : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !isChanged) return
  
    setIsSubmitting(true)
    try {
      const formDataToSend = new FormData()
      
      // Append all form fields
      if (formData) {
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formDataToSend.append(key, value.toString())
          }
        })
      }
  
      // Append the file if it exists
      if (selectedFile) {
        formDataToSend.append('image', selectedFile)
      }
  
      const response = await updateProduct(formDataToSend)

      if (taintedImages.size > 0) {
        await Promise.all(
          Array.from(taintedImages).map(imageId => 
            deleteProductImage(parseInt(productId), imageId)
          )
        )
        setSecondaryImages(prevImages => 
          prevImages ? prevImages.filter(img => !taintedImages.has(img.id)) : null
        )
        setTaintedImages(new Set())
      }

      if (createdImages.length > 0) {
        await Promise.all(
          createdImages.map(file => createProductImage(parseInt(productId), file))
        )
        const updatedImages = await getProductImages(parseInt(productId))
        setSecondaryImages(updatedImages)
        setCreatedImages([])
      }
  
     
      console.log('Product updated:', response)
      setProduct(response)
      setFormData(response)
      setIsChanged(false)

      // Reset main image state
      setPreviewUrl(null)
      setSelectedFile(null)
      setProductsShouldRefetch(true)
      toast.success('Produit mis à jour avec succès')
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleCancelMainImageChange = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleSecondaryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCreatedImages(prev => [...prev, e.target.files![0]])
    }
  }

  const handleRemoveCreatedImage = (index: number) => {
    setCreatedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleImageTaint = (imageId: number) => {
    setTaintedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  const getMetallicBackground = (color: string) => {
    if (color === 'gold') {
      return `linear-gradient(45deg, #B8860B, #FFD700, #DAA520)`;
    } else if (color === 'silver') {
      return `linear-gradient(45deg, #C0C0C0, #E8E8E8, #A9A9A9)`;
    }
    return '';
  };

  const handleDownloadAllMedia = async () => {
    if (!product || !secondaryImages) return;

    const zip = new JSZip();

    // Download main image
    try {
      const mainImageResponse = await fetch(product.image_url);
      const mainImageBlob = await mainImageResponse.blob();
      zip.file(`main_image.${getFileExtension(product.image_url)}`, mainImageBlob);
    } catch (error) {
      console.error('Error downloading main image:', error);
    }

    // Download secondary images
    for (let i = 0; i < secondaryImages.length; i++) {
      try {
        const response = await fetch(secondaryImages[i].url);
        const blob = await response.blob();
        zip.file(`secondary_image_${i + 1}.${getFileExtension(secondaryImages[i].url)}`, blob);
      } catch (error) {
        console.error(`Error downloading secondary image ${i + 1}:`, error);
      }
    }

    // Generate and save zip file
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${product.name}_images.zip`);
    } catch (error) {
      console.error('Error generating zip file:', error);
    }
  };

  const getFileExtension = (url: string): string => {
    const extension = url.split('.').pop();
    return extension || 'jpg'; // Default to jpg if no extension found
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-5xl">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-48 w-full mb-4" />
        </div>
      </div>
    )
  }
  
  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold">Produit non trouvé</div>
      </div>
    )
  }

  return (
    <>
      <div className="w-[100vw] h-14 fixed bg-white flex items-center z-10">
        <div className="p-4 flex justify-start w-full">
          <Button variant="secondary" size="icon" onClick={handleGoBack}>
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 md:p-6 flex justify-end w-full">
        <Button 
            className={`
              ${isChanged && isFormValid 
                ? "bg-lime-300 hover:bg-lime-400" 
                : "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
              }
            `}
            variant="secondary"
            disabled={!isFormValid || !isChanged || isSubmitting}
            onClick={handleSubmit}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Mise à jour...' : 'Valider'}
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-5xl">
          <div className="mb-4">
            <Label className="text-base">Identifiant du produit</Label>
            <Input id="id" value={formData?.id ?? ''} className="w-full text-base" disabled />
          </div>
          <div className="mb-4">
            <Label htmlFor="name" className="text-base">Nom du produit</Label>
            <Input 
              id="name" 
              value={formData?.name ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.name ? 'border-red-500' : ''}`} 
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="type" className="text-base">Type de produit</Label>
            <Select
              onValueChange={(value) => handleSelectChange('type', value)}
              value={formData?.type ?? ''}
            >
              <SelectTrigger className={`w-full ${errors.type ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select a product type" />
              </SelectTrigger>
              <SelectContent className="text-base">
                {productTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="color" className="text-base">Couleur du produit</Label>
            <Select
              onValueChange={(value) => handleSelectChange('color', value)}
              value={formData?.color ?? ''}
            >
              <SelectTrigger className={`w-full ${errors.color ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Sélectionner une couleur" />
              </SelectTrigger>
              <SelectContent>
                {productColors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center">
                      {color.value === 'transparent' ? (
                        <div className="w-4 h-4 mr-2 rounded-full overflow-hidden border border-gray-300 bg-white relative">
                          <div className="absolute inset-0 bg-gray-200 bg-opacity-50" style={{
                            backgroundImage: `
                              linear-gradient(45deg, #ccc 25%, transparent 25%),
                              linear-gradient(-45deg, #ccc 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #ccc 75%),
                              linear-gradient(-45deg, transparent 75%, #ccc 75%)
                            `,
                            backgroundSize: '4px 4px',
                            backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px'
                          }} />
                        </div>
                      ) : color.value === 'multicolore' ? (
                        <div className="w-4 h-4 mr-2 rounded-full overflow-hidden flex flex-wrap">
                          <div className="w-2 h-2 bg-yellow-400"></div>
                          <div className="w-2 h-2 bg-green-500"></div>
                          <div className="w-2 h-2 bg-pink-400"></div>
                          <div className="w-2 h-2 bg-blue-500"></div>
                        </div>
                      ) : color.value === 'gold' || color.value === 'silver' ? (
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ background: getMetallicBackground(color.value) }}
                        />
                      ) : (
                        <div 
                          className={`w-4 h-4 rounded-full mr-2 ${color.value === 'blanc' ? 'border border-gray-300' : ''}`}
                          style={{ backgroundColor: color.hex }}
                        />
                      )}
                      {color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="price" className="text-base">Prix du produit</Label>
            <Input 
              id="price" 
              type="number"
              step="1"
              min="0"
              value={formData?.price ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.price ? 'border-red-500' : ''}`} 
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="stock" className="text-base">Stock du produit</Label>
            <Input 
              id="stock"
              type="number"
              step="1"
              min="0"
              value={formData?.stock ?? ''} 
              onChange={handleInputChange} 
              className={`w-full text-base ${errors.stock ? 'border-red-500' : ''}`} 
            />
            {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
          </div>
          <div className="mb-4">
            <Label htmlFor="description" className="text-base">Description du produit</Label>
            <Textarea id="description" value={formData?.description ?? ''} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label className="text-base">Image principale du produit</Label>
            <div className="relative w-full h-auto mb-2">
              <div className={`w-full h-auto flex items-center justify-center ${previewUrl ? 'border-4 rounded-md border-lime-300' : ''}`}>
                <Image 
                  src={previewUrl || product.image_url} 
                  alt={product.name} 
                  width={500}
                  height={500}
                />
              </div>
              {previewUrl && (
                <>
                  <div className="absolute bottom-0 left-0 right-0 bg-lime-300 text-black text-xs p-1 text-center">
                    Cette image remplacera l'image principale lors de la validation
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelMainImageChange}
                    className="absolute top-2 right-2 bg-red-400 text-white rounded-md p-1 hover:bg-red-600"
                  >
                    <Cross2Icon className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <div 
              className="mt-2 p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer flex items-center justify-center"
              onClick={() => document.getElementById('main-image-upload')?.click()}
            >
              <UploadIcon className="w-6 h-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Changer l'image principale</span>
              <input
                id="main-image-upload"
                type="file"
                className="hidden"
                onChange={handleMainImageChange}
                accept="image/*"
              />
            </div>
          </div>
          <div className="mb-4">
            <Label className="text-base">Images secondaires du produit</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              <div 
                  className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <UploadIcon className="w-8 h-8 text-gray-400" />
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    onChange={handleSecondaryImageUpload}
                    accept="image/*"
                  />
                </label>
              </div>
              {secondaryImages?.map((image) => (
                <div 
                  key={image.id} 
                  className={`relative aspect-square ${taintedImages.has(image.id) ? 'border-2 border-red-400 rounded-md' : ''}`}
                >
                  <img 
                    src={image.url} 
                    alt={`Secondary image ${image.id}`} 
                    className="w-full h-full object-cover rounded-md cursor-pointer" 
                  />
                  <button
                    type="button"
                    onClick={() => handleImageTaint(image.id)}
                    className="absolute top-2 right-2 bg-red-400 text-white rounded-md p-1 hover:bg-red-500"
                  >
                    <Cross2Icon className="w-4 h-4" />
                  </button>
                  {taintedImages.has(image.id) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-400 text-black text-xs p-1 text-center">
                      Cette image sera supprimée lors de la validation
                    </div>
                  )}
                </div>
              ))}
              {createdImages.map((file, index) => (
                <div key={index} className="relative aspect-square border-2 border-lime-300 rounded-md">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`New image ${index + 1}`} 
                    className="w-full h-full object-cover rounded-md" 
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCreatedImage(index)}
                    className="absolute top-2 right-2 bg-red-400 text-white rounded-md p-1 hover:bg-red-600"
                  >
                    <Cross2Icon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-lime-300 text-black text-xs p-1 text-center">
                    L'image sera ajoutée lors de la validation
                  </div>
                </div>
              ))}
            </div>
            <Button 
              onClick={handleDownloadAllMedia}
              className="mt-4 w-full bg-lime-300 text-blqck hover:bg-lime-400"
            >
              Télécharger toutes les images
            </Button>
          </div>
          <div className="mb-4">
            <Label className="text-base">Date de création du produit</Label>
            <Input id="created_at" value={formData?.created_at ? new Date(formData.created_at).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
                timeZone: 'Europe/Paris'
              }) : ''} className="w-full text-base" disabled />
          </div>
          <div className="mb-4">
            <Label className="text-base">Date de dernière mise à jour du produit</Label>
            <Input id="last_update" value={formData?.last_update ? new Date(formData.last_update).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
                timeZone: 'Europe/Paris'
              }) : ''} className="w-full text-base" disabled />
          </div>
        </div>
      </form>
      <Toaster />
    </>
  )
}