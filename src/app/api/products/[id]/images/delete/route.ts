import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();

    const bucketPath = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'mge-product-images';

    const productId = params.id;
    const { imageId } = await request.json();

    // Fetch the image details
    const { data: image, error: fetchError } = await supabase
        .from('productImages')
        .select('url')
        .eq('id', imageId)
        .eq('product_id', productId)
        .single();

    if (fetchError) {
        console.error('Error fetching image:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    if (!image) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Extract the filename from the URL
    const url = new URL(image.url);
    const imagePath = url.pathname.split('/').slice(-1)[0];

    // Delete the image from storage
    const { error: deleteStorageError } = await supabase
        .storage
        .from(bucketPath)
        .remove([imagePath]);

    if (deleteStorageError) {
        console.error('Error deleting image from storage:', deleteStorageError);
        return NextResponse.json({ error: 'Failed to delete image from storage' }, { status: 500 });
    }

    // Delete the image record from the database
    const { data, error: deleteDbError } = await supabase
        .from('productImages')
        .delete()
        .eq('id', imageId)
        .eq('product_id', productId);

    if (deleteDbError) {
        console.error('Error deleting image from database:', deleteDbError);
        return NextResponse.json({ error: 'Failed to delete image from database' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Image deleted successfully' });
}