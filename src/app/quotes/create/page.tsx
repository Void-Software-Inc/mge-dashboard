import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import QuoteCreateForm from "./QuoteCreateForm"

export default async function CreateQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string | string[] }>
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  const { client_id: clientIdParam } = await searchParams
  const clientId = Array.isArray(clientIdParam) ? clientIdParam[0] : clientIdParam

  return (
    <>
      <QuoteCreateForm clientId={clientId} />
    </>
  )
}