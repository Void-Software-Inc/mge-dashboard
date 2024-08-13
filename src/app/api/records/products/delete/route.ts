import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        try {
            // Fetch the product_record data
            const { data: productRecord, error: productRecordError } = await supabase
                .from('products_records')
                .select('*')
                .eq('id', id)
                .single();

            if (productRecordError) throw new Error('Failed to fetch product_record');

            // Fetch all productImages_records for the product
            const { data: productImagesRecords, error: productImagesRecordsError } = await supabase
                .from('productImages_records')
                .select('*')
                .eq('product_record_id', id);

            if (productImagesRecordsError) throw new Error('Failed to fetch product images records');

            // Delete images from storage
            if (productImagesRecords && productImagesRecords.length > 0) {
                const imagePaths = productImagesRecords.map(img => {
                    const url = new URL(img.url);
                    return url.pathname.split('/').slice(-1)[0];
                });

                const { error: deleteStorageError } = await supabase
                    .storage
                    .from('mge-product-images')
                    .remove(imagePaths);

                if (deleteStorageError) throw new Error('Failed to delete images from storage');
            }

            // Delete the main product image if it exists
            if (productRecord.image_url) {
                const mainImageUrl = new URL(productRecord.image_url);
                const mainImagePath = mainImageUrl.pathname.split('/').slice(-1)[0];

                const { error: deleteMainImageError } = await supabase
                    .storage
                    .from('mge-product-images')
                    .remove([mainImagePath]);

                if (deleteMainImageError) throw new Error('Failed to delete main product image from storage');
            }

            // Delete productImages_records
            const { error: deleteProductImagesRecordError } = await supabase
                .from('productImages_records')
                .delete()
                .eq('product_record_id', id);

            if (deleteProductImagesRecordError) throw new Error('Failed to delete productImages_records');

            // Delete the product_record
            const { error: deleteProductRecordError } = await supabase
                .from('products_records')
                .delete()
                .eq('id', id);

            if (deleteProductRecordError) throw new Error('Failed to delete product_record');

        } catch (error) {
            console.error('Error in delete process:', error);
            return NextResponse.json({ error: `Failed to delete product record: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Product records and associated images deleted successfully' });
}