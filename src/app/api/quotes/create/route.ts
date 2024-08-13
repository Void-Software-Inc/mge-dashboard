import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone } from 'date-fns-tz'
import { QuoteItem } from "@/utils/types/quotes";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const body = await request.json();
    const { quoteData, quoteItems } = body;

    // Generate current timestamp in Paris timezone
    const parisDate = formatInTimeZone(new Date(), 'Europe/Paris', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    // Add timestamps to quoteData
    const quoteWithTimestamps = {
        ...quoteData,
        created_at: parisDate,
        last_update: parisDate
    };

    // Create the quote
    const { data: createdQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert([quoteWithTimestamps])
        .select()
        .single();

    if (quoteError) {
        console.error('Error creating quote:', quoteError);
        return NextResponse.json({ error: quoteError.message }, { status: 500 });
    }

    // If there are quote items, create them
    if (quoteItems && quoteItems.length > 0) {
        const quoteItemsWithQuoteId = quoteItems.map((item: QuoteItem) => ({
            ...item,
            quote_id: createdQuote.id,
            last_update: parisDate
        }));

        const { data: createdItems, error: itemsError } = await supabase
            .from('quoteItems')
            .insert(quoteItemsWithQuoteId)
            .select();

        if (itemsError) {
            console.error('Error creating quote items:', itemsError);
            // If quote items creation fails, we might want to delete the created quote
            await supabase.from('quotes').delete().eq('id', createdQuote.id);
            return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }

        return NextResponse.json({ quote: createdQuote, quoteItems: createdItems }, { status: 201 });
    }

    return NextResponse.json({ quote: createdQuote }, { status: 201 });
}