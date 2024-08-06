import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation';
import { DataTable } from './components/productComponents/data-table';
import { columns } from './components/productComponents/columns';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default async function Settings() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <Tabs defaultValue="produits" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="produits">Produits</TabsTrigger>
        <TabsTrigger value="devis">Devis</TabsTrigger>
      </TabsList>
      <TabsContent className="p-2 md:p-8" value="produits">
        <DataTable columns={columns} />
      </TabsContent>
      <TabsContent className="w-full flex justify-center items-center" value="devis">
        <h1>Devis</h1>
      </TabsContent>
    </Tabs>
  )
}
