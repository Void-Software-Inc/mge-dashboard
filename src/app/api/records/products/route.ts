import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'

export async function GET() {
  const supabase = createClient();

  const { data: products_records, error } = await supabase
    .from('products_records')
    .select('*')
    .order('deleted_at', { ascending: false });

  if (error) {
    console.error('Error fetching products records:', error);
    return NextResponse.json({ error: 'Failed to fetch products records' }, { status: 500 });
  }

  revalidateTag('products_records')

  return NextResponse.json({ products_records });
}