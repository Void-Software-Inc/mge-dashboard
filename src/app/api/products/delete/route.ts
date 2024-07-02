import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    // Fetch the products to be deleted
    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('image_url')
        .in('id', ids);

    if (fetchError) {
        console.error('Error fetching products:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Extract the image paths from the URLs
    const imagePaths = products.map((product) => {
        const url = new URL(product.image_url);
        const modifiedPath = url.pathname.split('/').slice(-1)[0];
        console.log(modifiedPath);
        return modifiedPath;
    });

    // Delete the images from the storage bucket
    const { error: deleteImagesError } = await supabase
        .storage
        .from('mge-product-images')
        .remove(imagePaths);

    if (deleteImagesError) {
        console.error('Error deleting images:', deleteImagesError);
        return NextResponse.json({ error: 'Failed to delete images' }, { status: 500 });
    }

    // Delete the products from the database
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