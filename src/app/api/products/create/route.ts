import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { formatInTimeZone } from 'date-fns-tz'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  const formData = await request.formData()
  const file = formData.get('image') as File | null
  
  let imageUrl = ''
  let imageFilename = ''

  if (file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const filename = `product-${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('mge-product-images')
      .upload(filename, file)

    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    
    imageFilename = filename
    const { data: { publicUrl } } = supabase.storage
      .from('mge-product-images')
      .getPublicUrl(imageFilename)

    imageUrl = publicUrl
  }

  // Generate current timestamp in Paris timezone
  const parisDate = formatInTimeZone(new Date(), 'Europe/Paris', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")

  const productData = {
    name: formData.get('name'),
    type: formData.get('type'),
    color: formData.get('color'),
    stock: formData.get('stock'),
    ttc_price: formData.get('ttc_price'),
    ht_price: formData.get('ht_price'),
    description: formData.get('description'),
    image_url: imageUrl,
    category: formData.get('category'),
    created_at: parisDate,
    last_update: parisDate
  }

  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()

    if (error) {
      console.error('Error creating product:', error)
      
      // Delete the uploaded image if product creation fails
      if (imageFilename) {
        const { error: deleteError } = await supabase.storage
          .from('mge-product-images')
          .remove([imageFilename])
        
        if (deleteError) {
          console.error('Error deleting image after product creation failure:', deleteError)
        }
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

  return NextResponse.json({ data: data[0] }, { status: 201 })
}