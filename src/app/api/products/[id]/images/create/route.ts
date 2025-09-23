import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const bucketPath = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'mge-product-images'

  const productId = params.id

  const formData = await request.formData()
  const file = formData.get('image') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const filename = `product-${productId}-${Date.now()}-${file.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketPath)
    .upload(filename, file)

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucketPath)
    .getPublicUrl(filename)

  // Create a new row in the productImages table
  const { data: imageData, error: insertError } = await supabase
    .from('productImages')
    .insert({
      product_id: productId,
      url: publicUrl
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error inserting image data:', insertError)
    // Delete the uploaded image if database insertion fails
    const { error: deleteError } = await supabase.storage
      .from(bucketPath)
      .remove([filename])
    
    if (deleteError) {
      console.error('Error deleting image after database insertion failure:', deleteError)
    }
    return NextResponse.json({ error: 'Failed to save image data' }, { status: 500 })
  }

  return NextResponse.json({ data: imageData }, { status: 201 })
}