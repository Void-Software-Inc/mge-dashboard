'use client'

import { useCallback, useEffect, useState } from 'react'

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster, toast } from 'sonner'
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeftIcon, DownloadIcon } from "@radix-ui/react-icons"

import { useRouter } from 'next/navigation'
import { useProductsContext } from '../context/ProductsContext'
import { getProduct, updateProduct } from "@/services/products"
import { Product, productTypes } from "@/utils/types/products"

export default function ProductForm({ productId }: { productId: string }) {
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isChanged, setIsChanged] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setShouldRefetch } = useProductsContext()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleGoBack = useCallback(() => {
    router.push('/products')
  }, [router])
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const fetchedProduct = await getProduct(parseInt(productId))
        setProduct(fetchedProduct)
        setFormData(fetchedProduct)
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
      JSON.stringify(product) !== JSON.stringify(formData) || selectedFile !== null
    )
  }, [product, formData, selectedFile])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => prev ? { ...prev, [id]: value } : null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setIsChanged(true)
    }
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => prev ? { ...prev, type: value } : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isChanged) return
  
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
  
     
      console.log('Product updated:', response)
      setProduct(response)
      setFormData(response)
      setIsChanged(false)
      setSelectedFile(null)
      setShouldRefetch(true)
      toast.custom((t) => (
        <div className="bg-lime-300 text-black px-6 py-4 rounded-md">
          Produit mis à jour avec succès
        </div>
      ), {
        duration: 3000,
      })
    } catch (error) {
      console.error('Error updating product:', error)
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-2xl">
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
        <div className="text-2xl font-semibold">Product not found</div>
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
              ${isChanged 
                ? "bg-lime-300 hover:bg-lime-400" 
                : "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
              }
            `}
            variant="secondary"
            disabled={!isChanged || isSubmitting}
            onClick={handleSubmit}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Updating...' : 'Valider'}
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-2xl">
          <div className="mb-4">
            <Label className="text-base">ID</Label>
            <Input id="id" value={formData?.id ?? ''} className="w-full text-base" disabled />
          </div>
          <div className="mb-4">
            <Label htmlFor="name" className="text-base">Name</Label>
            <Input id="name" value={formData?.name ?? ''} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label htmlFor="type" className="text-base">Type</Label>
            <Select
              onValueChange={handleSelectChange}
              defaultValue={formData?.type ?? ''}
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
            <Input id="color" value={formData?.color ?? ''} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label htmlFor="price" className="text-base">Price</Label>
            <Input id="price" value={formData?.price ?? ''} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label htmlFor="description" className="text-base">Description</Label>
            <Textarea id="description" value={formData?.description ?? ''} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label className="text-base">Image</Label>
            <img src={product.image_url} alt={product.name} className="w-full h-auto mb-2" />
            <Input
              type="file"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/jpg,image/heic,image/heif,image/webp"
              className="w-full text-base"
            />
          </div>
          <div className="mb-4">
            <Label className="text-base">Created At</Label>
            <Input id="created_at" value={formData?.created_at ? new Date(formData.created_at).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
                timeZone: 'Europe/Paris'
              }) : ''} className="w-full text-base" disabled />
          </div>
          <div className="mb-4">
            <Label className="text-base">Last Update</Label>
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