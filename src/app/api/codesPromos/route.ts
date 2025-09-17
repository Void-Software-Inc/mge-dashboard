import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'

export async function GET() {
  const supabase = createClient();

  const { data: codesPromos, error } = await supabase
    .from('codesPromos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching codes promos:', error);
    return NextResponse.json({ error: 'Failed to fetch codes promos' }, { status: 500 });
  }

  revalidateTag('codesPromos')

  return NextResponse.json({ codesPromos });
}