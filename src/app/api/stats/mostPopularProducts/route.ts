import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'

export async function GET() {
  const supabase = createClient();

  // Fetching data from both tables, including quantity
  const [{ data: quoteItemsData, error: quoteItemsError }, { data: finishedQuoteItemsData, error: finishedQuoteItemsError }] = await Promise.all([
    supabase
      .from('quoteItems')
      .select('product_id, quantity, products:product_id (id, name)')
      .not('product_id', 'is', null),
    supabase
      .from('finished_quoteItems')
      .select('product_id, quantity, products:product_id (id, name)')
      .not('product_id', 'is', null)
  ]);

  if (quoteItemsError || finishedQuoteItemsError) {
    console.error('Error fetching products:', quoteItemsError || finishedQuoteItemsError);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  interface QuoteItem {
    product_id: string;
    quantity: number;
    products: {
      id: string;
      name: string;
    };
  }

  // Combine both datasets
  const allItems = [...(quoteItemsData as unknown as QuoteItem[]), ...(finishedQuoteItemsData as unknown as QuoteItem[])];

  // Using a Map for efficient count and quantity aggregation
  const productStats = new Map<string, { id: string; name: string; count: number; totalQuantity: number }>();

  allItems.forEach(item => {
    if (item.products && item.products.id && item.products.name) {
      const productId = item.products.id;
      if (!productStats.has(productId)) {
        productStats.set(productId, { id: productId, name: item.products.name, count: 0, totalQuantity: 0 });
      }
      const stats = productStats.get(productId)!;
      stats.count++;
      stats.totalQuantity += item.quantity || 0;
    }
  });

  // Converting Map to array, calculating average quantity, and sorting
  const sortedProducts = Array.from(productStats.values())
    .map(({ id, name, count, totalQuantity }) => ({
      id,
      name,
      count,
      average_quantity: count > 0 ? Math.round((totalQuantity / count) * 100) / 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Revalidate cache tag
  revalidateTag('popularProducts');

  return NextResponse.json({ popularProducts: sortedProducts });
}