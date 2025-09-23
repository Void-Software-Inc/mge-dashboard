import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();

    const bucketPath = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'mge-product-images';

    const { ids } = await request.json();

    for (const id of ids) {
        try {
            // Fetch the product data (must have status 'record')
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .eq('status', 'record')
                .single();

            if (productError) throw new Error('Failed to fetch product or product is not a record');

            // Fetch all productImages for the product
            const { data: productImages, error: productImagesError } = await supabase
                .from('productImages')
                .select('*')
                .eq('product_id', id);

            if (productImagesError) throw new Error('Failed to fetch product images');

            // Delete images from storage
            if (productImages && productImages.length > 0) {
                const imagePaths = productImages.map(img => {
                    const url = new URL(img.url);
                    return url.pathname.split('/').slice(-1)[0];
                });

                const { error: deleteStorageError } = await supabase
                    .storage
                    .from(bucketPath)
                    .remove(imagePaths);

                if (deleteStorageError) throw new Error('Failed to delete images from storage');
            }

            // Delete the main product image if it exists
            if (product.image_url) {
                const mainImageUrl = new URL(product.image_url);
                const mainImagePath = mainImageUrl.pathname.split('/').slice(-1)[0];

                const { error: deleteMainImageError } = await supabase
                    .storage
                    .from(bucketPath)
                    .remove([mainImagePath]);

                if (deleteMainImageError) throw new Error('Failed to delete main product image from storage');
            }

            // Delete productImages
            const { error: deleteProductImagesError } = await supabase
                .from('productImages')
                .delete()
                .eq('product_id', id);

            if (deleteProductImagesError) throw new Error('Failed to delete productImages');

            // Delete any quoteItems that reference this product
            const { error: deleteQuoteItemsError } = await supabase
                .from('quoteItems')
                .delete()
                .eq('product_id', id);

            if (deleteQuoteItemsError) throw new Error('Failed to delete quoteItems references');

            // Delete the product
            const { error: deleteProductError } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (deleteProductError) throw new Error('Failed to delete product');

        } catch (error) {
            console.error('Error in delete process:', error);
            return NextResponse.json({ error: `Failed to delete product record: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Product records and associated images deleted successfully' });
}