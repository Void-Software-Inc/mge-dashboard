import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Product } from "@/utils/types/products"
import { GET as getProduct } from "@/app/api/products/[id]/route"
import ProductForm from "./ProductForm"

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
      <ProductForm product={product} />
    </>
  )
}