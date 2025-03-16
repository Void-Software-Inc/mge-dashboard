import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import QuoteCreateForm from "./QuoteCreateForm"

export default async function CreateQuotePage({ searchParams }: { searchParams: { client_id?: string } }) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  return (
    <>
      <QuoteCreateForm clientId={searchParams.client_id} />
    </>
  )
}