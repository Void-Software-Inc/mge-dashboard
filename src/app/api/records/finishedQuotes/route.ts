import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'

export async function GET() {
  const supabase = createClient();

  const { data: finished_quotes, error } = await supabase
    .from('finished_quotes')
    .select('*')
    .order('finished_at', { ascending: false });

  if (error) {
    console.error('Error fetching finished quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch finished quotes' }, { status: 500 });
  }

  revalidateTag('finished_quotes')

  return NextResponse.json({ finished_quotes });
}