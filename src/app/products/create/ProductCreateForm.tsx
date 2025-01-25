'use client'

import { useCallback, useEffect, useState } from 'react'
import { Product, productTypes, productColors } from "@/utils/types/products"
import Image from 'next/image'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Toaster, toast } from 'sonner'
import { ChevronLeftIcon, PlusIcon, Cross2Icon, UploadIcon, InfoCircledIcon } from "@radix-ui/react-icons"
import { useRouter } from 'next/navigation'
import { useAppContext } from "@/app/context/AppContext"
import { createProduct, createProductImage } from '@/services/products'

interface FormErrors {
  name?: string;
  type?: string;
  color?: string;
  price?: string;
  stock?: string;
  image_url?: string;
}

interface TouchedFields {
  name: boolean;
  type: boolean;
  color: boolean;
  price: boolean;
  stock: boolean;
  image_url: boolean;
}

const initialProduct: Partial<Product> = {
  name: '',
  type: '',
  color: '',
  stock: 0,
  price: 0,
  description: '',
  image_url: '',
}

export default function ProductCreateForm() {
  const router = useRouter()
  const [formData, setFormData] = useState(initialProduct)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setProductsShouldRefetch } = useAppContext()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [createdImages, setCreatedImages] = useState<File[]>([])

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    type: false,
    color: false,
    price: false,
    stock: false,
    image_url: false,
  })
  const [isFormValid, setIsFormValid] = useState(false)

  const handleGoBack = useCallback(() => {
    router.push('/products')
  }, [router])

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {}
    let isValid = false

    if (!formData.name && touched.name) {
      newErrors.name = "Le nom du produit est obligatoire"
      isValid = false
    }
    if (!formData.type && touched.type) {
      newErrors.type = "Le type du produit est obligatoire"
      isValid = false
    }
    if (!formData.color && touched.color) {
      newErrors.color = "La couleur du produit est obligatoire"
      isValid = false
    }
    if (formData.price !== undefined && (formData.price === null || formData.price <= 0) && touched.price) {
      newErrors.price = "Le prix du produit est invalide"
      isValid = false
    }
    if (formData.stock !== undefined && (formData.stock === null || formData.stock <= 0) && touched.stock) {
      newErrors.stock = "Le stock du produit est invalide"
      isValid = false
    }
    if (!selectedFile && touched.image_url) {
      newErrors.image_url = "L'image principale du produit est obligatoire"
      isValid = false
    }
    if(formData.name && formData.type && formData.color && formData.price && formData.stock && selectedFile) {
      isValid = true
    }

    setErrors(newErrors)
    setIsFormValid(isValid)
    return isValid
  }, [formData, selectedFile])

  useEffect(() => {
    validateForm()
  }, [formData, touched, selectedFile, validateForm])
    
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    if (id === 'stock') {
      // Only allow integers for stock
      if (!/^\d*$/.test(value)) return
      const numValue = value === '' ? null : parseInt(value) // Default to 0 instead of empty string
      //@ts-ignore
      setFormData(prev => ({ ...prev, [id]: numValue }))
    } else if (id === 'price') {
      // Allow decimal numbers for price
      if (!/^\d*\.?\d*$/.test(value)) return
      const numValue = value === '' ? null : parseFloat(value) // Default to 0 instead of empty string
      //@ts-ignore
      setFormData(prev => ({ ...prev, [id]: numValue }))
    } else {
      setFormData(prev => ({ ...prev, [id]: value }))
    }
    setTouched(prev => ({ ...prev, [id]: true }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }))
    setTouched(prev => ({ ...prev, [id]: true }))
  }

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setTouched(prev => ({ ...prev, image_url: true }))
    }
  }

  const handleCancelMainImageChange = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setTouched(prev => ({ ...prev, image_url: true }))
  }

  const handleSecondaryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCreatedImages(prev => [...prev, e.target.files![0]])
    }
  }

  const handleRemoveCreatedImage = (index: number) => {
    setCreatedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
  
    setIsSubmitting(true)
    try {
      const formDataToSend = new FormData()
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Append the file if it exists
      if (selectedFile) {
        formDataToSend.append('image', selectedFile)
      }

      const result = await createProduct(formDataToSend);

      if (createdImages.length > 0) {
        await Promise.all(
          createdImages.map(file => createProductImage(result.id, file))
        )
      }

      setProductsShouldRefetch(true)

    console.log('Product created:', result)
    toast.custom((t) => (
      <div className="bg-lime-300 text-black px-6 py-4 rounded-md">
        Produit créé avec succès
      </div>
    ), {
      duration: 3000,
    })
    router.push(`/products/${result.id}`)
  } catch (error) {
    console.error('Error creating product:', error)
    toast.custom((t) => (
      <div className="bg-red-400 text-black px-6 py-4 rounded-md">
        {error instanceof Error ? error.message : 'An error occurred'}
      </div>
    ), {
      duration: 3000,
    })
  } finally {
    setIsSubmitting(false)
  }
  }

  return (
    <>
      <TooltipProvider>
        <div className="w-[100vw] h-14 fixed bg-white flex items-center z-10">
          <div className="p-4 flex justify-start w-full">
            <Button variant="secondary" size="icon" onClick={handleGoBack}>
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 md:p-6 flex justify-end w-full">
          <Button 
              className={`
                ${isFormValid 
                  ? "bg-lime-300 hover:bg-lime-400" 
                  : "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                }
              `}
              variant="secondary"
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
          <div className="w-full max-w-5xl">
            <div className="mb-4">
              <Label htmlFor="name" className="text-base flex items-center">
                Nom du produit
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="w-3 h-3 text-gray-500 ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Le nom du produit est obligatoire</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className={`w-full text-base ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div className="mb-4">
              <Label htmlFor="type" className="text-base flex items-center">
                Type du produit
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="w-3 h-3 text-gray-500 ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Le type du produit est obligatoire</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select onValueChange={(value) => handleSelectChange('type', value)}>
                <SelectTrigger className={`w-full ${errors.type ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Sélectionner un type de produit" />
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
              <Label htmlFor="color" className="text-base flex items-center">
                Couleur du produit
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="w-3 h-3 text-gray-500 ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>La couleur du produit est obligatoire</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select
                onValueChange={(value) => handleSelectChange('color', value)}
                value={formData.color}
              >
                <SelectTrigger className={`w-full ${errors.color ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Sélectionner une couleur" />
                </SelectTrigger>
                <SelectContent>
                  {productColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        {color.value === 'multicolore' ? (
                          <div className="w-4 h-4 mr-2 rounded-full overflow-hidden flex flex-wrap">
                            <div className="w-2 h-2 bg-yellow-400"></div>
                            <div className="w-2 h-2 bg-green-500"></div>
                            <div className="w-2 h-2 bg-pink-400"></div>
                            <div className="w-2 h-2 bg-blue-500"></div>
                          </div>
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
              <Label htmlFor="stock" className="text-base flex items-center">
                Stock du produit
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="w-3 h-3 text-gray-500 ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Le stock du produit est obligatoire</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input 
                id="stock" 
                type="number"
                step="1"
                min="0"
                value={formData.stock} 
                onChange={handleInputChange} 
                className={`w-full text-base ${errors.stock ? 'border-red-500' : ''}`}
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
            </div>
            <div className="mb-4">
              <Label htmlFor="price" className="text-base flex items-center">
                Prix du produit
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="w-3 h-3 text-gray-500 ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Le prix du produit est obligatoire</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input 
                id="price" 
                type="number"
                step="1"
                min="0"
                value={formData.price} 
                onChange={handleInputChange} 
                className={`w-full text-base ${errors.price ? 'border-red-500' : ''}`}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
            <div className="mb-4">
              <Label htmlFor="description" className="text-base">Description du produit</Label>
              <Textarea id="description" value={formData.description} onChange={handleInputChange} className="w-full text-base" />
            </div>
            <div className="mb-4">
              <Label className="text-base flex items-center">
                Image principale du produit
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="w-3 h-3 text-gray-500 ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>L'image principale du produit est obligatoire</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="relative">
                {previewUrl && (
                  <div className={`w-full h-auto flex items-center justify-center ${previewUrl ? 'border-4 rounded-md border-lime-300' : ''}`}>
                    <Image 
                      src={previewUrl} 
                      alt="Preview" 
                      width={500}
                      height={500}
                    />
                  </div>
                )}
                {previewUrl && (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 bg-lime-300 rounded-md text-black text-xs p-1 text-center">
                      Cette image sera l'image principale du produit
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
                className={`mt-2 p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer flex items-center justify-center ${errors.image_url ? 'border-red-500' : ''}`}
                onClick={() => document.getElementById('main-image-upload')?.click()}
              >
                <UploadIcon className={`w-6 h-6 text-gray-400 mr-2 ${errors.image_url ? 'text-red-500' : ''}`} />
                <span className={`text-gray-600 ${errors.image_url ? 'text-red-500' : ''}`}>Choisir l'image principale</span>
                <input
                  id="main-image-upload"
                  type="file"
                  className="hidden"
                  onChange={handleMainImageChange}
                  accept="image/jpeg,image/png,image/jpg,image/heic,image/heif,image/webp"
                />
              </div>
              {errors.image_url && <p className="text-red-500 text-sm mt-1">{errors.image_url}</p>}
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
                      L'image sera ajoutée lors de la création
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
        <Toaster />
      </TooltipProvider>
    </>
  )
}