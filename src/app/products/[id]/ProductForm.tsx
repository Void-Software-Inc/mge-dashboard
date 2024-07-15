'use client'

import { useState } from 'react'
import { Product } from "@/utils/types/products"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, DownloadIcon } from "@radix-ui/react-icons"
import Link from "next/link"

export default function ProductForm({ product }: { product: Product }) {
  const [formData, setFormData] = useState(product)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting:', formData)
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
          <Button className="bg-lime-300 hover:bg-lime-400" variant="secondary">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Valider
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center pt-20 px-4 md:px-0">
        <div className="w-full max-w-2xl">
          <div className="mb-4">
            <Label>ID</Label>
            <Input id="id" value={formData.id} className="w-full" disabled />
          </div>
          <div className="mb-4">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={formData.name} onChange={handleInputChange} className="w-full" />
          </div>
          <div className="mb-4">
            <Label htmlFor="type">Type</Label>
            <Input id="type" value={formData.type} onChange={handleInputChange} className="w-full" />
          </div>
          <div className="mb-4">
            <Label htmlFor="color">Color</Label>
            <Input id="color" value={formData.color} onChange={handleInputChange} className="w-full" />
          </div>
          <div className="mb-4">
            <Label htmlFor="price">Price</Label>
            <Input id="price" value={formData.price} onChange={handleInputChange} className="w-full" />
          </div>
          <div className="mb-4">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={handleInputChange} className="w-full" />
          </div>
          <div className="mb-4">
            <Label>Image</Label>
            <img src={product.image_url} alt={product.name} className="w-full h-auto mb-2" />
            <Input type="file" className="w-full" />
          </div>
          <div className="mb-4">
            <Label>Created At</Label>
            <Input id="created_at" value={new Date(formData.created_at).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
              timeZone: 'Europe/Paris'
            })} className="w-full" disabled />
          </div>
          <div className="mb-4">
            <Label>Last Update</Label>
            <Input id="last_update" value={new Date(formData.last_update).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
              timeZone: 'Europe/Paris'
            })} className="w-full" disabled />
          </div>
        </div>
      </form>
    </>
  )
}