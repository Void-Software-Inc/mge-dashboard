import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Product } from "@/utils/types/products"
import { GET as getProduct } from "@/app/api/products/[id]/route"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, DownloadIcon } from "@radix-ui/react-icons"
import Link from "next/link"

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
      <div className="w-[100vw] h-14 fixed bg-white flex items-center">
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
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
        <img src={product.image_url} alt={product.name} className="mb-4" />
        <p><strong>Type:</strong> {product.type}</p>
        <p><strong>Color:</strong> {product.color}</p>
        <p><strong>Stock:</strong> {product.stock}</p>
        <p><strong>Price:</strong> {product.price}</p>
        <p><strong>Description:</strong> {product.description}</p>
        <p><strong>Created At:</strong> {product.created_at}</p>
        <p><strong>Last Update:</strong> {product.last_update}</p>
      </div>
    </>
  )
}