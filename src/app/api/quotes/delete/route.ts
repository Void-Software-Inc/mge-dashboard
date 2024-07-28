import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        // Delete the quote items first
        const { error: deleteQuoteItemsError } = await supabase
            .from('quote_items')
            .delete()
            .eq('quote_id', id);

        if (deleteQuoteItemsError) {
            console.error('Error deleting quote items:', deleteQuoteItemsError);
            return NextResponse.json({ error: 'Failed to delete quote items' }, { status: 500 });
        }

        // Delete the quote
        const { error: deleteQuoteError } = await supabase
            .from('quotes')
            .delete()
            .eq('id', id);

        if (deleteQuoteError) {
            console.error('Error deleting quote:', deleteQuoteError);
            return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Quotes and associated items deleted successfully' });
}