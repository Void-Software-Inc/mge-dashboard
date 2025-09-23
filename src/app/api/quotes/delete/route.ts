import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    try {
        // Update all quotes quote_type to 'record' and set deleted_at timestamp
        const { error: updateError } = await supabase
            .from('quotes')
            .update({ 
                quote_type: 'record',
                deleted_at: new Date().toISOString(),
                last_update: new Date().toISOString()
            })
            .in('id', ids);

        if (updateError) {
            throw new Error('Failed to delete quotes');
        }

        return NextResponse.json({ message: 'Quotes successfully marked as records' });

    } catch (error) {
        console.error('Error in delete process:', error);
        return NextResponse.json({ 
            error: `Failed to delete quotes: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
    }
}