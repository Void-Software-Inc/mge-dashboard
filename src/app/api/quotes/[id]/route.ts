import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET(request: { url: string | URL; }) {
  const supabase = createClient();

  const extractedURL = request.url;
  const pathSegments = extractedURL.toString().split('/');
  const id = pathSegments[pathSegments.length - 1] || pathSegments[pathSegments.length - 2];

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }

  if (quote) {
    return NextResponse.json(quote);
  } else {
    return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
  }
}