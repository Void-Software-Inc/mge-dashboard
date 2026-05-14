import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone_number } = await request.json();
    
    if (!phone_number) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Query all quotes tables to find the first quote date for this phone number
    const [activeQuotes, finishedQuotes, deletedQuotes] = await Promise.all([
      supabase
        .from('quotes')
        .select('created_at')
        .eq('phone_number', phone_number)
        .eq('quote_type', 'active')
        .order('created_at', { ascending: true })
        .limit(1),
      
      supabase
        .from('quotes')
        .select('created_at')
        .eq('phone_number', phone_number)
        .eq('quote_type', 'finished')
        .order('created_at', { ascending: true })
        .limit(1),
      
      supabase
        .from('quotes')
        .select('created_at')
        .eq('phone_number', phone_number)
        .eq('quote_type', 'deleted')
        .order('created_at', { ascending: true })
        .limit(1)
    ]);

    // Collect all first quote dates
    const firstDates = [
      activeQuotes.data?.[0]?.created_at,
      finishedQuotes.data?.[0]?.created_at,
      deletedQuotes.data?.[0]?.created_at
    ].filter(Boolean);

    if (firstDates.length === 0) {
      return NextResponse.json({ first_quote_date: null });
    }

    // Find the earliest date
    const firstQuoteDate = firstDates.reduce((earliest, current) => {
      return new Date(current) < new Date(earliest) ? current : earliest;
    });

    return NextResponse.json({ first_quote_date: firstQuoteDate });
  } catch (error) {
    console.error('Error fetching first quote date:', error);
    return NextResponse.json({ error: 'Failed to fetch first quote date' }, { status: 500 });
  }
}
