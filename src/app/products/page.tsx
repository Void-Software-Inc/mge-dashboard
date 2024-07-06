import { Product, columns } from "./components/columns"
import { createClient } from "@/utils/supabase/server"
import { DataTable } from "./components/data-table"
import {GET as getProducts} from "@/app/api/products/route"
import { redirect } from "next/navigation"

async function callGetProducts(): Promise<Product[]> {
  const supabase = createClient()

  const {data, error} = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login");
  }

  const res = await getProducts();
  const {products} = await res.json();

  if(!products){
    console.error("No products found")
    return []
  }

  const cleanProducts = products.map((product: Product) => ({
    id: product.id,
    name: product.name,
    type: product.type,
    color: product.color,
    stock: product.stock,
    price: product.price,
    description: product.description,
    image_url: product.image_url,
  }))
  return cleanProducts
}

export default async function Page() {
  const data = await callGetProducts()

  return (
    <div className="container">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
