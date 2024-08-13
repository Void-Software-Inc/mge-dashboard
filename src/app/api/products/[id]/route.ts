import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET(request: { url: string | URL; }) {
  const supabase = createClient();

  const extractedURL = request.url;
  const pathSegments = extractedURL.toString().split('/');
  const id = pathSegments[pathSegments.length - 1] || pathSegments[pathSegments.length - 2];

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
