import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const quoteId = params.id;
    const { quoteItemId, quantity } = await request.json();

    if (!quoteItemId || quantity === undefined) {
        return NextResponse.json({ error: 'Missing quoteItemId or quantity' }, { status: 400 });
    }

    // Update the quote item in the database
    const { data, error } = await supabase
        .from('quoteItems')
        .update({ quantity })
        .eq('id', quoteItemId)
        .eq('quote_id', quoteId)
        .single();

    if (error) {
        console.error('Error updating quote item:', error);
        return NextResponse.json({ error: 'Failed to update quote item' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Quote item updated successfully', data });
}