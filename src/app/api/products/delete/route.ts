import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    try {
        // Update all products status to 'record'
        const { error: updateError } = await supabase
            .from('products')
            .update({ 
                status: 'record',
                deleted_at: new Date().toISOString()
            })
            .in('id', ids);

        if (updateError) {
            throw new Error('Failed to update products status');
        }

        return NextResponse.json({ message: 'Products successfully marked as records' });

    } catch (error) {
        console.error('Error in delete process:', error);
        return NextResponse.json({ 
            error: `Failed to delete products: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
    }
}