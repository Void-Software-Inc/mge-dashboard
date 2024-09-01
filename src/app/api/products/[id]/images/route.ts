import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const productId = params.id;

  const { data: images, error } = await supabase
    .from('productImages')
    .select('*')
    .eq('product_id', productId);

  if (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json({ error: 'Failed to fetch product images' }, { status: 500 });
  }

  return NextResponse.json({ productImages: images });
}