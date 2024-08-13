import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import ProductForm from "./ProductForm"

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  return (
    <>
      <ProductForm productId={params.id} />
    </>
  )
}