import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const quoteId = params.id;
    const { quoteItemId } = await request.json();

    // Delete the quote item from the database
    const { data, error: deleteDbError } = await supabase
        .from('quoteItems')
        .delete()
        .eq('id', quoteItemId)
        .eq('quote_id', quoteId);

    if (deleteDbError) {
        console.error('Error deleting quote item from database:', deleteDbError);
        return NextResponse.json({ error: 'Failed to delete quote item from database' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Quote item deleted successfully' });
}