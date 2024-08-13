import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'

export async function GET() {
  const supabase = createClient();

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .order('last_update', { ascending: false });

  if (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }

  revalidateTag('quotes')

  return NextResponse.json({ quotes });
}