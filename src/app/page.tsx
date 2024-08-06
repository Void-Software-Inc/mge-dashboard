import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation';
import QuoteCreationChart from '@/components/stats/QuoteCreationChart';
import ProductTypesChart from '@/components/stats/ProductTypesChart';

export default async function Home() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }
  return (
    <main className="flex min-h-screen flex-col items-center p-1 md:p-4">
      <div className='w-full mt-2 grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='w-full px-1 md:px-0'>
          <ProductTypesChart />
        </div>
        <div className='w-full px-1 md:px-0'>
          <QuoteCreationChart />
        </div>
      </div>
    </main>
  );
}