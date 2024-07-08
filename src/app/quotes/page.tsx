import { Metadata } from "next"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Quotes",
  description: "A quote tracker and generator.",
}


export default async function TaskPage() {
  return (
    <>
      <h1>Quotes</h1>
    </>
  )
}