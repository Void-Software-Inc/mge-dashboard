import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        // The deletion of quoteItems is handled directly by the supabase trigger
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