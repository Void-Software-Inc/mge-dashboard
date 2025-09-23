import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const quoteId = params.id;

  const { data: items, error } = await supabase
    .from('quoteItems')
    .select('*')
    .eq('quote_id', quoteId);

  if (error) {
    console.error('Error fetching quote items:', error);
    return NextResponse.json({ error: 'Failed to fetch quote items' }, { status: 500 });
  }

  return NextResponse.json({ items });
} 