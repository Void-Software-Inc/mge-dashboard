import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    try {
        // Update all quotes quote_type to 'finished' and set finished_at timestamp
        const { error: updateError } = await supabase
            .from('quotes')
            .update({ 
                quote_type: 'finished',
                finished_at: new Date().toISOString(),
                last_update: new Date().toISOString()
            })
            .in('id', ids);

        if (updateError) {
            throw new Error('Failed to finish quotes');
        }

        return NextResponse.json({ message: 'Quotes successfully finished' });

    } catch (error) {
        console.error('Error in finish process:', error);
        return NextResponse.json({ 
            error: `Failed to finish quotes: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
    }
}