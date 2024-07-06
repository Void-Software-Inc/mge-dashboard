import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation';

export default async function Quotes() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <main className="flex flex-col items-center justify-center h-[100vh] p-24">
      <h1 className="text-black text-4xl">Quotes page</h1>
    </main>
  );
}
