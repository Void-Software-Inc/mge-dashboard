import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const supabase = createClient();

    // Query all quotes with non-null raison_sociale from all quote types
    const [activeQuotes, finishedQuotes, deletedQuotes] = await Promise.all([
      supabase
        .from('quotes')
        .select('*')
        .eq('quote_type', 'active')
        .not('raison_sociale', 'is', null)
        .neq('raison_sociale', '')
        .order('last_update', { ascending: false }),
      
      supabase
        .from('quotes')
        .select('*')
        .eq('quote_type', 'finished')
        .not('raison_sociale', 'is', null)
        .neq('raison_sociale', '')
        .order('finished_at', { ascending: false }),
      
      supabase
        .from('quotes')
        .select('*')
        .eq('quote_type', 'record')
        .not('raison_sociale', 'is', null)
        .neq('raison_sociale', '')
        .order('deleted_at', { ascending: false })
    ]);

    // Check for errors
    if (activeQuotes.error) {
      console.error('Error fetching active company quotes:', activeQuotes.error);
      return NextResponse.json({ error: 'Failed to fetch active company quotes' }, { status: 500 });
    }

    if (finishedQuotes.error) {
      console.error('Error fetching finished company quotes:', finishedQuotes.error);
      return NextResponse.json({ error: 'Failed to fetch finished company quotes' }, { status: 500 });
    }

    if (deletedQuotes.error) {
      console.error('Error fetching deleted company quotes:', deletedQuotes.error);
      return NextResponse.json({ error: 'Failed to fetch deleted company quotes' }, { status: 500 });
    }

    // Combine all quotes with type indicators
    const allCompanyQuotes = [
      ...(activeQuotes.data || []).map(q => ({ ...q, quote_type: 'active' })),
      ...(finishedQuotes.data || []).map(q => ({ ...q, quote_type: 'finished' })),
      ...(deletedQuotes.data || []).map(q => ({ ...q, quote_type: 'deleted', is_deleted: true }))
    ];

    revalidateTag('company_clients');

    return NextResponse.json({ company_quotes: allCompanyQuotes });
  } catch (error) {
    console.error('Error fetching company clients:', error);
    return NextResponse.json({ error: 'Failed to fetch company clients' }, { status: 500 });
  }
}
