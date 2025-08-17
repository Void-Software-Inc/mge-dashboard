import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const productId = params.id;

  const { data: quoteItems, error } = await supabase
    .from('quoteItems')
    .select('*')
    .eq('quote_id', productId)
    .order('last_update', { ascending: false });

  if (error) {
    console.error('Error fetching quote items:', error);
    return NextResponse.json({ error: 'Failed to fetch quote items' }, { status: 500 });
  }

  return NextResponse.json({ quoteItems: quoteItems });
}