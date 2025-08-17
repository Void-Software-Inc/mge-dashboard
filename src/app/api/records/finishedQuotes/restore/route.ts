import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    try {
        // Update all quotes quote_type to 'active' and clear finished_at
        const { error: updateError } = await supabase
            .from('quotes')
            .update({ 
                quote_type: 'active',
                status: 'nouveau',
                finished_at: null,
                last_update: new Date().toISOString()
            })
            .in('id', ids);

        if (updateError) {
            throw new Error('Failed to restore finished quotes');
        }

        return NextResponse.json({ message: 'Finished quotes successfully restored' });

    } catch (error) {
        console.error('Error in restore process:', error);
        return NextResponse.json({ 
            error: `Failed to restore finished quotes: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
    }
}