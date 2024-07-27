'use client'

import { useCallback, useState } from 'react'
import { Product, productTypes } from "@/utils/types/products"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster, toast } from 'sonner'
import { ChevronLeftIcon, PlusIcon, Cross2Icon, UploadIcon } from "@radix-ui/react-icons"
import { useRouter } from 'next/navigation'
import { useProductsContext } from '../context/ProductsContext'
import { createProduct, createProductImage } from '@/services/products'

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
  const { setShouldRefetch } = useProductsContext()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [createdImages, setCreatedImages] = useState<File[]>([])

  const handleGoBack = useCallback(() => {
    router.push('/products')
  }, [router])

  const isFormValid = () => {
    return formData.name && formData.type && formData.color && formData.price && formData.stock && selectedFile
  }
  
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return
  
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

      setShouldRefetch(true)

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
      <div className="w-[100vw] h-14 fixed bg-white flex items-center z-10">
        <div className="p-4 flex justify-start w-full">
          <Button variant="secondary" size="icon" onClick={handleGoBack}>
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 md:p-6 flex justify-end w-full">
        <Button 
            className={`
              ${isFormValid() 
                ? "bg-lime-300 hover:bg-lime-400" 
                : "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
              }
            `}
            variant="secondary"
            disabled={!isFormValid() || isSubmitting}
            onClick={handleSubmit}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-2xl">
          <div className="mb-4">
            <Label htmlFor="name" className="text-base">Nom du produit</Label>
            <Input id="name" value={formData.name} onChange={handleInputChange} className="w-full text-base" required />
          </div>
          <div className="mb-4">
            <Label htmlFor="type" className="text-base">Type du produit</Label>
            <Select
              onValueChange={handleSelectChange}
              required
            >
              <SelectTrigger className="w-full">
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
          </div>
          <div className="mb-4">
            <Label htmlFor="color" className="text-base">Couleur du produit</Label>
            <Input id="color" value={formData.color} onChange={handleInputChange} className="w-full text-base" required />
          </div>
          <div className="mb-4">
            <Label htmlFor="stock" className="text-base">Stock du produit</Label>
            <Input id="stock" value={formData.stock} onChange={handleInputChange} className="w-full text-base" required />
          </div>
          <div className="mb-4">
            <Label htmlFor="price" className="text-base">Prix du produit</Label>
            <Input id="price" value={formData.price} onChange={handleInputChange} className="w-full text-base" required />
          </div>
          <div className="mb-4">
            <Label htmlFor="description" className="text-base">Description du produit</Label>
            <Textarea id="description" value={formData.description} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label className="text-base">Image principale du produit</Label>
            <div className="relative">
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-auto mb-2 border-4 rounded-md border-lime-300" 
                />
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
              className="mt-2 p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer flex items-center justify-center"
              onClick={() => document.getElementById('main-image-upload')?.click()}
            >
              <UploadIcon className="w-6 h-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Choisir l'image principale</span>
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
    </>
  )
}