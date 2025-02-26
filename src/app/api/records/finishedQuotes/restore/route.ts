import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        let createdQuote = null;
        let createdQuoteItems = [];

        try {
            // Fetch the finished_quote data
            const { data: finishedQuote, error: finishedQuoteError } = await supabase
                .from('finished_quotes')
                .select('*')
                .eq('id', id)
                .single();

            if (finishedQuoteError) throw new Error('Failed to fetch finished_quote');

            // Fetch all finished_quoteItems for the quote
            const { data: finishedQuoteItems, error: finishedQuoteItemsError } = await supabase
                .from('finished_quoteItems')
                .select('*')
                .eq('finished_quote_id', id);

            if (finishedQuoteItemsError) throw new Error('Failed to fetch finished_quote items');

            // Create a new record in quotes
            const { data: quote, error: quoteError } = await supabase
                .from('quotes')
                .insert({
                    id: finishedQuote.id,
                    first_name: finishedQuote.first_name,
                    last_name: finishedQuote.last_name,
                    phone_number: finishedQuote.phone_number,
                    email: finishedQuote.email,
                    event_start_date: finishedQuote.event_start_date,
                    event_end_date: finishedQuote.event_end_date,
                    status: 'nouveau', // restoring a finished quote sets the status to "nouveau"
                    total_cost: finishedQuote.total_cost,
                    is_paid: finishedQuote.is_paid,
                    is_traiteur: finishedQuote.is_traiteur,
                    traiteur_price: finishedQuote.traiteur_price,
                    other_expenses: finishedQuote.other_expenses,
                    description: finishedQuote.description,
                    is_deposit: finishedQuote.is_deposit,
                    deposit_amount: finishedQuote.deposit_amount,
                    address: finishedQuote.address,
                    payments: finishedQuote.payments || [],
                    created_at: new Date().toISOString(),
                    last_update: new Date().toISOString()
                })
                .select()
                .single();

            if (quoteError) throw new Error('Failed to create quote' + quoteError);

            createdQuote = quote;

            // Create new records in quoteItems
            if (finishedQuoteItems && finishedQuoteItems.length > 0) {
                const { data: insertedItems, error: quoteItemsError } = await supabase
                    .from('quoteItems')
                    .insert(finishedQuoteItems.map(item => ({
                        id: item.id,
                        product_id: item.product_id,
                        quote_id: quote.id,
                        quantity: item.quantity,
                        last_update: new Date().toISOString()
                    })))
                    .select();

                if (quoteItemsError) throw new Error('Failed to create quoteItems' + quoteItemsError);

                createdQuoteItems = insertedItems;
            }

            // Delete the finished_quote (Quote items are deleted by cascade)
            const { error: deleteFinishedQuoteError } = await supabase
                .from('finished_quotes')
                .delete()
                .eq('id', id);

            if (deleteFinishedQuoteError) throw new Error('Failed to delete finished_quote' + deleteFinishedQuoteError);

        } catch (error) {
            console.error('Error in restore process:', error);

            // Rollback: Delete created quote items
            if (createdQuoteItems.length > 0) {
                const { error: deleteItemsError } = await supabase
                    .from('quoteItems')
                    .delete()
                    .in('id', createdQuoteItems.map(item => item.id));

                if (deleteItemsError) {
                    console.error('Error rolling back quote items:', deleteItemsError);
                }
            }

            // Rollback: Delete created quote
            if (createdQuote) {
                const { error: deleteQuoteError } = await supabase
                    .from('quotes')
                    .delete()
                    .eq('id', createdQuote.id);

                if (deleteQuoteError) {
                    console.error('Error rolling back quote:', deleteQuoteError);
                }
            }

            return NextResponse.json({ error: `Failed to restore quote: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Quotes and associated items restored successfully' });
}