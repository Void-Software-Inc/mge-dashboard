import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        try {
            // Delete the quote_record
            const { error: deleteQuoteRecordError } = await supabase
                .from('quotes_records')
                .delete()
                .eq('id', id);

            if (deleteQuoteRecordError) {
                throw new Error(`Failed to delete quote_record: ${deleteQuoteRecordError.message}`);
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