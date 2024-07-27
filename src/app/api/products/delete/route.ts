import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        // Fetch all secondary images for the product
        const { data: images, error: fetchError } = await supabase
            .from('productImages')
            .select('id, url')
            .eq('product_id', id);

        if (fetchError) {
            console.error('Error fetching product images:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch product images' }, { status: 500 });
        }

        // Delete secondary images from storage
        if (images && images.length > 0) {
            const imagePaths = images.map(image => {
                const url = new URL(image.url);
                return url.pathname.split('/').slice(-1)[0];
            });

            const { error: deleteStorageError } = await supabase
                .storage
                .from('mge-product-images')
                .remove(imagePaths);

            if (deleteStorageError) {
                console.error('Error deleting secondary images from storage:', deleteStorageError);
                return NextResponse.json({ error: 'Failed to delete secondary images from storage' }, { status: 500 });
            }

            // Delete secondary image records from the database
            const { error: deleteImagesError } = await supabase
                .from('productImages')
                .delete()
                .eq('product_id', id);

            if (deleteImagesError) {
                console.error('Error deleting secondary image records:', deleteImagesError);
                return NextResponse.json({ error: 'Failed to delete secondary image records' }, { status: 500 });
            }
        }

        // Fetch the main product image
        const { data: product, error: productFetchError } = await supabase
            .from('products')
            .select('image_url')
            .eq('id', id)
            .single();

        if (productFetchError) {
            console.error('Error fetching product:', productFetchError);
            return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
        }

        // Delete the main product image from storage
        if (product && product.image_url) {
            const url = new URL(product.image_url);
            const imagePath = url.pathname.split('/').slice(-1)[0];

            const { error: deleteMainImageError } = await supabase
                .storage
                .from('mge-product-images')
                .remove([imagePath]);

            if (deleteMainImageError) {
                console.error('Error deleting main product image from storage:', deleteMainImageError);
                return NextResponse.json({ error: 'Failed to delete main product image from storage' }, { status: 500 });
            }
        }

        // Delete the product
        const { error: deleteProductError } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (deleteProductError) {
            console.error('Error deleting product:', deleteProductError);
            return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Products and associated images deleted successfully' });
}