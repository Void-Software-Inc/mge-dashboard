import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import ProductCreateForm from "./ProductCreateForm"

export default async function CreateProductPage() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  return (
    <>
      <ProductCreateForm />
    </>
  )
}