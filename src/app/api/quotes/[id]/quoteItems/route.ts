import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id: quoteId } = await params;

  const { data: quoteItems, error } = await supabase
    .from('quoteItems')
    .select('*')
    .eq('quote_id', quoteId)
    .order('last_update', { ascending: false });

  if (error) {
    console.error('Error fetching quote items:', error);
    return NextResponse.json({ error: 'Failed to fetch quote items' }, { status: 500 });
  }

  return NextResponse.json({ quoteItems: quoteItems });
}