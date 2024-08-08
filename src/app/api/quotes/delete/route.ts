import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        let createdQuoteRecord = null;
        let createdQuoteItemsRecords = [];

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

            // Create a new record in quotes_records
            const { data: quotesRecord, error: quotesRecordError } = await supabase
                .from('quotes_records')
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
                    is_paid: quote.is_paid,
                    is_traiteur: quote.is_traiteur,
                    traiteur_price: quote.traiteur_price,
                    other_expenses: quote.other_expenses,
                    description: quote.description,
                    deleted_at: new Date().toISOString()
                })
                .select()
                .single();

            if (quotesRecordError) throw new Error('Failed to create quotes_records');

            createdQuoteRecord = quotesRecord;

            // Create new records in quoteItems_records
            if (quoteItems && quoteItems.length > 0) {
                const { data: insertedItemsRecords, error: quoteItemsRecordError } = await supabase
                    .from('quoteItems_records')
                    .insert(quoteItems.map(item => ({
                        id: item.id,
                        product_id: item.product_id,
                        quote_record_id: quotesRecord.id,
                        quantity: item.quantity,
                        last_update: item.last_update,
                    })))
                    .select();

                if (quoteItemsRecordError) throw new Error('Failed to create quoteItems_records');

                createdQuoteItemsRecords = insertedItemsRecords;
            }

            // Delete the quote (Quote items are deleted by cascade)
            const { error: deleteQuoteError } = await supabase
                .from('quotes')
                .delete()
                .eq('id', id);

            if (deleteQuoteError) throw new Error('Failed to delete quote');

        } catch (error) {
            console.error('Error in delete process:', error);

            // Rollback: Delete created quoteItems_records
            if (createdQuoteItemsRecords.length > 0) {
                const { error: deleteItemsRecordsError } = await supabase
                    .from('quoteItems_records')
                    .delete()
                    .in('id', createdQuoteItemsRecords.map(item => item.id));

                if (deleteItemsRecordsError) {
                    console.error('Error rolling back quoteItems_records:', deleteItemsRecordsError);
                }
            }

            // Rollback: Delete created quote_record
            if (createdQuoteRecord) {
                const { error: deleteQuoteRecordError } = await supabase
                    .from('quotes_records')
                    .delete()
                    .eq('id', createdQuoteRecord.id);

                if (deleteQuoteRecordError) {
                    console.error('Error rolling back quote_record:', deleteQuoteRecordError);
                }
            }

            return NextResponse.json({ error: `Failed to delete quote: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Quotes and associated items deleted successfully' });
}