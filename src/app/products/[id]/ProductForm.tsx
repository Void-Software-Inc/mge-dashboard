'use client'

import { useEffect, useState } from 'react'
import { Product, productTypes } from "@/utils/types/products"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeftIcon, DownloadIcon } from "@radix-ui/react-icons"
import Link from "next/link"

export default function ProductForm({ product }: { product: Product }) {
  const [formData, setFormData] = useState(product)
  const [isChanged, setIsChanged] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    setIsChanged(JSON.stringify(product) !== JSON.stringify(formData))
  }, [formData, product])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isChanged) return
  
    setIsSubmitting(true)
    try {
      const updatedFormData = {
        ...formData
      }
  
      const response = await fetch('/api/products/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFormData),
      })
  
      const result = await response.json()
  
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product')
      }
  
      console.log('Product updated:', result.data)
      setFormData(result.data) // Update the form data with the response
    } catch (error) {
      console.error('Error updating product:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="w-[100vw] h-14 fixed bg-white flex items-center z-10">
        <div className="p-4 flex justify-start w-full">
          <Button variant="secondary" size="icon">
            <Link legacyBehavior href="/products">
              <ChevronLeftIcon className="w-4 h-4" />
            </Link>
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
            <Input id="id" value={formData.id} className="w-full text-base" disabled />
          </div>
          <div className="mb-4">
            <Label htmlFor="name" className="text-base">Name</Label>
            <Input id="name" value={formData.name} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label htmlFor="type" className="text-base">Type</Label>
            <Select
              onValueChange={handleSelectChange}
              defaultValue={formData.type}
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
            <Input id="color" value={formData.color} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label htmlFor="price" className="text-base">Price</Label>
            <Input id="price" value={formData.price} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label htmlFor="description" className="text-base">Description</Label>
            <Textarea id="description" value={formData.description} onChange={handleInputChange} className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label className="text-base">Image</Label>
            <img src={product.image_url} alt={product.name} className="w-full h-auto mb-2" />
            <Input type="file" className="w-full text-base" />
          </div>
          <div className="mb-4">
            <Label className="text-base">Created At</Label>
            <Input id="created_at" value={new Date(formData.created_at).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
              timeZone: 'Europe/Paris'
            })} className="w-full text-base" disabled />
          </div>
          <div className="mb-4">
            <Label className="text-base">Last Update</Label>
            <Input id="last_update" value={new Date(formData.last_update).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
              timeZone: 'Europe/Paris'
            })} className="w-full text-base" disabled />
          </div>
        </div>
      </form>
    </>
  )
}