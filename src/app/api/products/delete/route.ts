import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { ids } = await request.json();

    for (const id of ids) {
        let createdProductRecord = null;
        let createdProductImagesRecords = [];

        try {
            // Fetch the product data
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (productError) throw new Error('Failed to fetch product');

            // Fetch all productImages for the product
            const { data: productImages, error: productImagesError } = await supabase
                .from('productImages')
                .select('*')
                .eq('product_id', id);

            if (productImagesError) throw new Error('Failed to fetch product images');

            // Create a new record in products_records
            const { data: productsRecord, error: productsRecordError } = await supabase
                .from('products_records')
                .insert({
                    id: product.id,
                    name: product.name,
                    type: product.type,
                    color: product.color,
                    stock: product.stock,
                    price: product.price,
                    description: product.description,
                    image_url: product.image_url,
                    deleted_at: new Date().toISOString()
                })
                .select()
                .single();

            if (productsRecordError) throw new Error('Failed to create products_records');

            createdProductRecord = productsRecord;

            // Create new records in productImages_records
            if (productImages && productImages.length > 0) {
                const { data: insertedImagesRecords, error: productImagesRecordError } = await supabase
                    .from('productImages_records')
                    .insert(productImages.map(img => ({
                        id: img.id,
                        product_record_id: productsRecord.id,
                        url: img.url
                    })))
                    .select();

                if (productImagesRecordError) throw new Error('Failed to create productImages_records');

                createdProductImagesRecords = insertedImagesRecords;
            }

            // Delete productImages
            const { error: deleteProductImagesError } = await supabase
                .from('productImages')
                .delete()
                .eq('product_id', id);

            if (deleteProductImagesError) throw new Error('Failed to delete productImages');

            // Delete the product
            const { error: deleteProductError } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (deleteProductError) throw new Error('Failed to delete product');

        } catch (error) {
            console.error('Error in delete process:', error);

            // Rollback: Delete created productImages_records
            if (createdProductImagesRecords.length > 0) {
                const { error: deleteImagesRecordsError } = await supabase
                    .from('productImages_records')
                    .delete()
                    .in('id', createdProductImagesRecords.map(img => img.id));

                if (deleteImagesRecordsError) {
                    console.error('Error rolling back productImages_records:', deleteImagesRecordsError);
                }
            }

            // Rollback: Delete created product_record
            if (createdProductRecord) {
                const { error: deleteProductRecordError } = await supabase
                    .from('products_records')
                    .delete()
                    .eq('id', createdProductRecord.id);

                if (deleteProductRecordError) {
                    console.error('Error rolling back product_record:', deleteProductRecordError);
                }
            }

            return NextResponse.json({ error: `Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Products and associated images deleted successfully' });
}