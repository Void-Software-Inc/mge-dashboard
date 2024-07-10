import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  return NextResponse.json({ products });
}