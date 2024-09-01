import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone } from 'date-fns-tz'

export async function PUT(request: NextRequest) {
  const supabase = createClient();
  
  const formData = await request.formData();
  const id = formData.get('id') as string;
  const file = formData.get('image') as File | null;
  console.log('file', file)

  if (!id) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  let imageUrl = formData.get('image_url') as string;
  console.log('imageUrl', imageUrl)

  if (file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
  
    // Extract the filename from the existing image_url
    const existingFilename = imageUrl.split('/').pop();
    console.log('existingFilename', existingFilename)
  
    if (!existingFilename) {
      return NextResponse.json({ error: 'Invalid existing image URL' }, { status: 400 });
    }
  
    // Delete the existing file
    const { error: deleteError } = await supabase
      .storage
      .from('mge-product-images')
      .remove([existingFilename]);
  
    if (deleteError) {
      console.error('Error deleting existing file:', deleteError);
      return NextResponse.json({ error: 'Failed to delete existing image' }, { status: 500 });
    }
  
    // Upload the new file
    const newFilename = `product-${id}-${Date.now()}-${file.name}`;
    const { data, error: uploadError } = await supabase
      .storage
      .from('mge-product-images')
      .upload(newFilename, file);
  
    if (uploadError) {
      console.error('Error uploading new file:', uploadError);
      return NextResponse.json({ error: 'Failed to upload new image' }, { status: 500 });
    }
  
    // Get the public URL of the new file
    const { data: { publicUrl } } = supabase.storage
      .from('mge-product-images')
      .getPublicUrl(newFilename);
  
    imageUrl = publicUrl;
  }

  const parisDate = formatInTimeZone(new Date(), 'Europe/Paris', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

  const productData = {
    name: formData.get('name'),
    type: formData.get('type'),
    color: formData.get('color'),
    stock: formData.get('stock'),
    price: formData.get('price'),
    description: formData.get('description'),
    image_url: imageUrl,
    last_update: parisDate
  };

  const { data, error } = await supabase
    .from("products")
    .update(productData)
    .match({ id })
    .select();

  if (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.length === 0) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ data: data[0] });
}