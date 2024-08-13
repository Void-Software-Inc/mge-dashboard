import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation';

import { DataTable as ProductDataTable } from './components/productComponents/data-table';
import { columns as productColumns } from './components/productComponents/columns';

import { DataTable as QuoteDataTable } from './components/quoteComponents/data-table';
import { columns as quoteColumns } from './components/quoteComponents/columns';

import { DataTable as FinishedQuoteDataTable } from './components/finishedQuoteComponents/data-table';
import { columns as finishedQuoteColumns } from './components/finishedQuoteComponents/columns';

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
    <Tabs defaultValue="devis" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="devis">Devis</TabsTrigger>
        <TabsTrigger value="produits">Produits</TabsTrigger>
      </TabsList>
      <TabsContent className="p-2 md:p-8" value="produits">
        <ProductDataTable columns={productColumns} />
      </TabsContent>
      <TabsContent className="p-2 md:p-8" value="devis">
        <Tabs defaultValue="finished">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="finished">Terminés</TabsTrigger>
              <TabsTrigger value="deleted">Supprimés</TabsTrigger>
          </TabsList>
          <TabsContent value="finished"> 
            <FinishedQuoteDataTable columns={finishedQuoteColumns} />
          </TabsContent>
          <TabsContent value="deleted">
            <QuoteDataTable columns={quoteColumns} /> 
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  )
}
