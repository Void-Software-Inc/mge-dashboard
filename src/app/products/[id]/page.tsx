import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Product } from "@/utils/types/products"
import { GET as getProduct } from "@/app/api/products/[id]/route"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, DownloadIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

async function CallGetProduct(id: string): Promise<Product | null> {
  const res = await getProduct({url: `/api/products/${id}`})
  
  if (!res.ok) {
    console.error('Failed to fetch product:', res.statusText)
    return null
  }

  return res.json()
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  const product = await CallGetProduct(params.id)

  if (!product) {
    return <div>Product not found</div>
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
          <Button variant="secondary">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Valider
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center pt-20">
        <div className="w-full max-w-2xl">
          <div className="mb-4">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={product.name} className="w-full" />
          </div>
          <div className="mb-4">
            <Label htmlFor="type">Type</Label>
            <Input id="type" defaultValue={product.type} className="w-full" />
          </div>
          <div className="mb-4">
            <Label htmlFor="color">Color</Label>
            <Input id="color" defaultValue={product.color} className="w-full" />
          </div>
          <div className="mb-4">
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" defaultValue={product.stock.toString()} className="w-full" />
          </div>
          <div className="mb-4">
            <Label htmlFor="price">Price</Label>
            <Input id="price" defaultValue={product.price.toString()} className="w-full" />
          </div>
          <div className="mb-4">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" defaultValue={product.description} className="w-full" rows={4} />
          </div>
          <div className="mb-4">
            <Label>Image</Label>
            <img src={product.image_url} alt={product.name} className="w-full h-auto mb-2" />
            <Input type="file" className="w-full" />
          </div>
          <div className="mb-4">
            <Label>Created At</Label>
            <p>{product.created_at}</p>
          </div>
          <div className="mb-4">
            <Label>Last Update</Label>
            <p>{product.last_update}</p>
          </div>
        </div>
      </div>
    </>
  )
}