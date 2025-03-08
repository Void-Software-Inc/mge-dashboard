import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        let createdFinishedQuote = null;
        let createdFinishedQuoteItems = [];

        try {
            // Fetch the quote data
            const { data: quote, error: quoteError } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', id)
                .single();

            if (quoteError) throw new Error('Failed to fetch quote');

            // Fetch all quoteItems for the quote
            const { data: quoteItems, error: quoteItemsError } = await supabase
                .from('quoteItems')
                .select('*')
                .eq('quote_id', id);

            if (quoteItemsError) throw new Error('Failed to fetch quote items');

            // Create a new record in finished_quotes
            const { data: finishedQuote, error: finishedQuoteError } = await supabase
                .from('finished_quotes')
                .insert({
                    id: quote.id,
                    first_name: quote.first_name,
                    last_name: quote.last_name,
                    phone_number: quote.phone_number,
                    email: quote.email,
                    event_start_date: quote.event_start_date,
                    event_end_date: quote.event_end_date,
                    status: quote.status,
                    total_cost: quote.total_cost,
                    is_paid: true,
                    is_traiteur: quote.is_traiteur,
                    traiteur_price: quote.traiteur_price,
                    other_expenses: quote.other_expenses,
                    description: quote.description,
                    is_deposit: quote.is_deposit,
                    deposit_amount: quote.deposit_amount,
                    deposit_percentage: quote.deposit_percentage,
                    address: quote.address,
                    payments: quote.payments || [],
                    finished_at: new Date().toISOString()
                })
                .select()
                .single();

            if (finishedQuoteError) throw new Error('Failed to create finished_quotes');

            createdFinishedQuote = finishedQuote;

            // Create new records in finished_quoteItems
            if (quoteItems && quoteItems.length > 0) {
                const { data: insertedFinishedQuoteItems, error: finishedQuoteItemsError } = await supabase
                    .from('finished_quoteItems')
                    .insert(quoteItems.map(item => ({
                        id: item.id,
                        product_id: item.product_id,
                        finished_quote_id: finishedQuote.id,
                        quantity: item.quantity,
                        last_update: item.last_update,
                    })))
                    .select();

                if (finishedQuoteItemsError) throw new Error('Failed to create finished_quoteItems');

                createdFinishedQuoteItems = insertedFinishedQuoteItems;
            }

            // Delete the quote (Quote items are deleted by cascade)
            const { error: deleteQuoteError } = await supabase
                .from('quotes')
                .delete()
                .eq('id', id);

            if (deleteQuoteError) throw new Error('Failed to delete quote');

        } catch (error) {
            console.error('Error in delete process:', error);

            // Rollback: Delete created finished_quoteItems
            if (createdFinishedQuoteItems.length > 0) {
                const { error: deleteFinishedQuoteItemsError } = await supabase
                    .from('quoteItems_records')
                    .delete()
                    .in('id', createdFinishedQuoteItems.map(item => item.id));

                if (deleteFinishedQuoteItemsError) {
                    console.error('Error rolling back finished_quoteItems:', deleteFinishedQuoteItemsError);
                }
            }

            // Rollback: Delete created finished_quote
            if (createdFinishedQuote) {
                const { error: deleteFinishedQuoteError } = await supabase
                    .from('finished_quotes')
                    .delete()
                    .eq('id', createdFinishedQuote.id);

                if (deleteFinishedQuoteError) {
                    console.error('Error rolling back finished_quote:', deleteFinishedQuoteError);
                }
            }

            return NextResponse.json({ error: `Failed to delete quote: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Quotes and associated items deleted successfully' });
}