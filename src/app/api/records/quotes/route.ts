import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'

export async function GET() {
  const supabase = createClient();

  const { data: quotes_records, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('quote_type', 'record')
    .order('deleted_at', { ascending: false });

  if (error) {
    console.error('Error fetching quotes records:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes records' }, { status: 500 });
  }

  revalidateTag('quotes_records')

  return NextResponse.json({ quotes_records });
}