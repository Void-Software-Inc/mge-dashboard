import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'

export async function GET() {
  const supabase = createClient();

  // Fetching only necessary fields from the database
  const { data, error } = await supabase
    .from('quoteItems')
    .select('product_id, products:product_id (id, name)')
    .not('product_id', 'is', null);

  if (error) {
    console.error('Error fetching popular products:', error);
    return NextResponse.json({ error: 'Failed to fetch popular products' }, { status: 500 });
  }

  interface QuoteItem {
    product_id: string;
    products: {
      id: string;
      name: string;
    };
  }

  // Using a Map for efficient count aggregation
  const productCounts = new Map<string, { id: string; name: string; count: number }>();

  (data as unknown as QuoteItem[]).forEach(item => {
    if (item.products && item.products.id && item.products.name) {
      const productId = item.products.id;
      if (!productCounts.has(productId)) {
        productCounts.set(productId, { id: productId, name: item.products.name, count: 0 });
      }
      productCounts.get(productId)!.count++;
    }
  });

  // Converting Map to array and sorting
  const sortedProducts = Array.from(productCounts.values())
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

  // Revalidate cache tag
  revalidateTag('popularProducts');

  return NextResponse.json({ popularProducts: sortedProducts });
}
