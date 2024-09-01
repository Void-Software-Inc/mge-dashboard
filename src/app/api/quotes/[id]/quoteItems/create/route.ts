import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const quoteId = params.id;
    const { productId, quantity } = await request.json();

    if (!productId || quantity === undefined) {
        return NextResponse.json({ error: 'Missing productId or quantity' }, { status: 400 });
    }

    // Create the quote item in the database
    const { data, error } = await supabase
        .from('quoteItems')
        .insert({
            quote_id: quoteId,
            product_id: productId,
            quantity,
            last_update: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating quote item:', error);
        return NextResponse.json({ error: 'Failed to create quote item' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Quote item created successfully', data }, { status: 201 });
}