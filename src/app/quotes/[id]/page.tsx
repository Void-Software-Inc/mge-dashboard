import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import QuoteForm from "./QuoteForm"

export default async function QuotePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  return (
    <>
      <QuoteForm quoteId={params.id} />
    </>
  )
}