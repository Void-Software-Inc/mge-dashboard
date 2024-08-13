import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        let createdProduct = null;
        let createdProductImages = [];

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

            if (productImagesRecordsError) throw new Error('Failed to fetch product images');

            // Create a new record in products
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert({
                    id: productRecord.id,
                    name: productRecord.name,
                    type: productRecord.type,
                    color: productRecord.color,
                    stock: productRecord.stock,
                    price: productRecord.price,
                    description: productRecord.description,
                    image_url: productRecord.image_url,
                    created_at: productRecord.created_at,
                    last_updated: productRecord.last_updated
                })
                .select()
                .single();

            if (productError) throw new Error('Failed to create product');

            createdProduct = product;

            // Create new records in productImages
            if (productImagesRecords && productImagesRecords.length > 0) {
                const { data: insertedImages, error: productImagesError } = await supabase
                    .from('productImages')
                    .insert(productImagesRecords.map(img => ({
                        id: img.id,
                        product_id: product.id,
                        url: img.url
                    })))
                    .select();

                if (productImagesError) throw new Error('Failed to create productImages');

                createdProductImages = insertedImages;
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
            console.error('Error in restore process:', error);

            // Rollback: Delete created product images
            if (createdProductImages.length > 0) {
                const { error: deleteImagesError } = await supabase
                    .from('productImages')
                    .delete()
                    .in('id', createdProductImages.map(img => img.id));

                if (deleteImagesError) {
                    console.error('Error rolling back product images:', deleteImagesError);
                }
            }

            // Rollback: Delete created product
            if (createdProduct) {
                const { error: deleteProductError } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', createdProduct.id);

                if (deleteProductError) {
                    console.error('Error rolling back product:', deleteProductError);
                }
            }

            return NextResponse.json({ error: `Failed to restore product: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Products and associated images restored successfully' });
}