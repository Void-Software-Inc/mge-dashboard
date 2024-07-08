// api/products/[id]/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET(request: { url: string | URL; }) {
  const supabase = createClient();

  // Extracting the product ID from the URL path
  const { pathname } = new URL(request.url);
  const id = pathname.split('/').pop();

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }

  if (product) {
    return NextResponse.json(product);
  } else {
    return NextResponse.json({ message: 'Product not found' }, { status: 404 });
  }
}
