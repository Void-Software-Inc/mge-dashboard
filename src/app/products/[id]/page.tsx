import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Product } from "@/utils/types/products"
import { GET as getProduct } from "@/app/api/products/[id]/route"

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
      <img src={product.image_url} alt={product.name} className="mb-4" />
      <p><strong>Type:</strong> {product.type}</p>
      <p><strong>Color:</strong> {product.color}</p>
      <p><strong>Stock:</strong> {product.stock}</p>
      <p><strong>Price:</strong> {product.price}</p>
      <p><strong>Description:</strong> {product.description}</p>
    </div>
  )
}