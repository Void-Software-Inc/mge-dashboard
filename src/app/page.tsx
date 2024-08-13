import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation';
import StatsRegroupment from '@/components/stats/StatsRegroupment';

export default async function Home() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }
  return (
    <StatsRegroupment />
  );
}