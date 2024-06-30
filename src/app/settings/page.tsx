import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation';

export default async function Settings() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-white text-4xl">Settings page</h1>
    </main>
  );
}
