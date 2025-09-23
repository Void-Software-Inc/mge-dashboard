import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const quoteId = params.id;

  // Fetch existing quote items
  const { data: quoteItems, error: quoteItemsError } = await supabase
    .from('quoteItems')
    .select('product_id')
    .eq('quote_id', quoteId);

  if (quoteItemsError) {
    console.error('Error fetching quote items:', quoteItemsError);
    return NextResponse.json({ error: 'Failed to fetch quote items' }, { status: 500 });
  }

  // Extract product IDs from quote items
  const existingProductIds = quoteItems?.map(item => item.product_id) || [];

  // Fetch all products except those already in the quote
  const { data: availableProducts, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .not('id', 'in', `(${existingProductIds.join(',')})`)
    .order('last_update', { ascending: false });

  if (productsError) {
    console.error('Error fetching available products:', productsError);
    return NextResponse.json({ error: 'Failed to fetch available products' }, { status: 500 });
  }

  return NextResponse.json({ availableProducts });
}