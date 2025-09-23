import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    try {
        // Update all products status to 'active' and clear deleted_at
        const { error: updateError } = await supabase
            .from('products')
            .update({ 
                status: 'active',
                deleted_at: null,
                last_update: new Date().toISOString()
            })
            .in('id', ids);

        if (updateError) {
            throw new Error('Failed to restore products');
        }

        return NextResponse.json({ message: 'Products successfully restored' });

    } catch (error) {
        console.error('Error in restore process:', error);
        return NextResponse.json({ 
            error: `Failed to restore products: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
    }
}