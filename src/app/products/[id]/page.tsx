import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import ProductForm from "./ProductForm"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  return (
    <>
      <ProductForm productId={id} />
    </>
  )
}