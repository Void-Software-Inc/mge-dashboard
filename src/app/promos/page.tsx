import { columns } from "./components/columns"
import { createClient } from "@/utils/supabase/server"
import { DataTable } from "./components/data-table"
import ClientMessage from "./components/ClientMessage"
import { redirect } from "next/navigation"

export default async function Page() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }
  
  return (
    <div className="p-2 md:p-8">
      <ClientMessage />
      <DataTable columns={columns} />
    </div>
  )
}