import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GlobalRefreshButton from './components/GlobalRefreshButton'

export default async function Settings() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <div className="h-screen flex flex-col items-center justify-start p-8">
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <div className="max-w-md">
        <GlobalRefreshButton />
      </div>
    </div>
  )
}