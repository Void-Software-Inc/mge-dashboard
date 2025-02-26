import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        let createdQuote = null;
        let createdQuoteItems = [];

        try {
            // Fetch the quote_record data
            const { data: quoteRecord, error: quoteRecordError } = await supabase
                .from('quotes_records')
                .select('*')
                .eq('id', id)
                .single();

            if (quoteRecordError) throw new Error('Failed to fetch quote_record');

            // Fetch all quoteItems_records for the quote
            const { data: quoteItemsRecords, error: quoteItemsRecordsError } = await supabase
                .from('quoteItems_records')
                .select('*')
                .eq('quote_record_id', id);

            if (quoteItemsRecordsError) throw new Error('Failed to fetch quote items');

            // Create a new record in quotes
            const { data: quote, error: quoteError } = await supabase
                .from('quotes')
                .insert({
                    id: quoteRecord.id,
                    first_name: quoteRecord.first_name,
                    last_name: quoteRecord.last_name,
                    phone_number: quoteRecord.phone_number,
                    email: quoteRecord.email,
                    event_start_date: quoteRecord.event_start_date,
                    event_end_date: quoteRecord.event_end_date,
                    status: quoteRecord.status,
                    total_cost: quoteRecord.total_cost,
                    is_paid: quoteRecord.is_paid,
                    is_traiteur: quoteRecord.is_traiteur,
                    traiteur_price: quoteRecord.traiteur_price,
                    other_expenses: quoteRecord.other_expenses,
                    description: quoteRecord.description,
                    is_deposit: quoteRecord.is_deposit,
                    deposit_amount: quoteRecord.deposit_amount,
                    address: quoteRecord.address,
                    payments: quoteRecord.payments || [],
                    created_at: new Date().toISOString(),
                    last_update: new Date().toISOString()
                })
                .select()
                .single();

            if (quoteError) throw new Error('Failed to create quote' + quoteError);

            createdQuote = quote;

            // Create new records in quoteItems
            if (quoteItemsRecords && quoteItemsRecords.length > 0) {
                const { data: insertedItems, error: quoteItemsError } = await supabase
                    .from('quoteItems')
                    .insert(quoteItemsRecords.map(item => ({
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

            // Delete the quote_record (Quote items are deleted by cascade)
            const { error: deleteQuoteRecordError } = await supabase
                .from('quotes_records')
                .delete()
                .eq('id', id);

            if (deleteQuoteRecordError) throw new Error('Failed to delete quote_record' + deleteQuoteRecordError);

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