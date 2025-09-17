import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import CodeCreateForm from "./CodeCreateForm"

export default async function CreateCodePromoPage() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return <CodeCreateForm />
}