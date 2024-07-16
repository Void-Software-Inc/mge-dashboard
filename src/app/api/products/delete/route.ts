import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('image_url')
        .in('id', ids);

    if (fetchError) {
        console.error('Error fetching products:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const imagePaths = products
        .filter(product => product.image_url)
        .map((product) => {
            const url = new URL(product.image_url);
            return url.pathname.split('/').slice(-1)[0];
        });

    if (imagePaths.length > 0) {
        const { error: deleteImagesError } = await supabase
            .storage
            .from('mge-product-images')
            .remove(imagePaths);

        if (deleteImagesError) {
            console.error('Error deleting images:', deleteImagesError);
        }
    }

    const { data, error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', ids);

    if (deleteError) {
        console.error('Error deleting products:', deleteError);
        return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
    }
    
    return NextResponse.json({ data });
}