import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        try {
            // Check if the quote exists and has quote_type 'record'
            const { data: quote, error: quoteError } = await supabase
                .from('quotes')
                .select('id, quote_type')
                .eq('id', id)
                .eq('quote_type', 'record')
                .single();

            if (quoteError) {
                throw new Error(`Failed to fetch quote or quote is not a record: ${quoteError.message}`);
            }

            // Delete any quoteItems that reference this quote
            const { error: deleteQuoteItemsError } = await supabase
                .from('quoteItems')
                .delete()
                .eq('quote_id', id);

            if (deleteQuoteItemsError) {
                throw new Error(`Failed to delete quoteItems references: ${deleteQuoteItemsError.message}`);
            }

            // Delete the quote
            const { error: deleteQuoteError } = await supabase
                .from('quotes')
                .delete()
                .eq('id', id);

            if (deleteQuoteError) {
                throw new Error(`Failed to delete quote: ${deleteQuoteError.message}`);
            }

        } catch (error) {
            console.error('Error in delete process:', error);
            return NextResponse.json({ 
                error: `Failed to delete quote record: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Quote records deleted successfully' });
}