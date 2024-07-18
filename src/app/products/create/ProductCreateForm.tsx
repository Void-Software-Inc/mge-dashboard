'use client'

import { useCallback, useRef, useState } from 'react'
import { Product, productTypes } from "@/utils/types/products"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster, toast } from 'sonner'
import { ChevronLeftIcon, PlusIcon } from "@radix-ui/react-icons"
import { useRouter } from 'next/navigation'
import { useProductsContext } from '../context/ProductsContext'
import { createProduct } from '@/services/products'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGoBack = useCallback(() => {
    router.push('/products')
  }, [router])

  const isFormValid = () => {
    return formData.name && formData.type && formData.color && formData.price && formData.stock
  }
  
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }))
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
      if (fileInputRef.current?.files?.[0]) {
        formDataToSend.append('image', fileInputRef.current.files[0])
      }

      const result = await createProduct(formDataToSend);

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
            <Label htmlFor="name" className="text-base">Name</Label>
            <Input id="name" value={formData.name} onChange={handleInputChange} className="w-full text-base" required />
          </div>
          <div className="mb-4">
            <Label htmlFor="type" className="text-base">Type</Label>
            <Select
              onValueChange={handleSelectChange}
              required
            >
              <SelectTrigger className="w-full">
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
          </div>
          <div className="mb-4">
            <Label htmlFor="color" className="text-base">Color</Label>
            <Input id="color" value={formData.color} onChange={handleInputChange} className="w-full text-base" required />
          </div>
          <div className="mb-4">
            <Label htmlFor="stock" className="text-base">Stock</Label>
            <Input id="stock" value={formData.stock} onChange={handleInputChange} className="w-full text-base" required />
          </div>
          <div className="mb-4">
            <Label htmlFor="price" className="text-base">Price</Label>
            <Input id="price" value={formData.price} onChange={handleInputChange} className="w-full text-base" required />
          </div>
          <div className="mb-4">
            <Label htmlFor="description" className="text-base">Description</Label>
            <Textarea id="description" value={formData.description} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label htmlFor="image" className="text-base">Image</Label>
            <Input
              id="image"
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/jpg,image/heic,image/heif,image/webp"
              className="w-full text-base"
            />
          </div>
        </div>
      </form>
      <Toaster />
    </>
  )
}