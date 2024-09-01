import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'

export async function GET() {
  const supabase = createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('last_update', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  revalidateTag('products')

  return NextResponse.json({ products });
}