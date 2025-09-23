import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'

export async function GET() {
  const supabase = createClient();

  const { data: clientMessages, error } = await supabase
    .from('clientMessage')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client messages:', error);
    return NextResponse.json({ error: 'Failed to fetch client messages' }, { status: 500 });
  }

  revalidateTag('clientMessages')

  return NextResponse.json({ clientMessages });
}
