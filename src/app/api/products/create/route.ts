import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { formatInTimeZone } from 'date-fns-tz'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  const formData = await request.formData()
  const file = formData.get('image') as File | null
  
  let imageUrl = ''

  if (file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const { data, error } = await supabase.storage
      .from('mge-product-images')
      .upload(`product-${Date.now()}-${file.name}`, file)

    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('mge-product-images')
      .getPublicUrl(data.path)

    imageUrl = publicUrl
  }

  // Generate current timestamp in Paris timezone
  const parisDate = formatInTimeZone(new Date(), 'Europe/Paris', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")

  const productData = {
    name: formData.get('name'),
    type: formData.get('type'),
    color: formData.get('color'),
    stock: formData.get('stock'),
    price: formData.get('price'),
    description: formData.get('description'),
    image_url: imageUrl,
    created_at: parisDate,
    last_update: parisDate
  }

  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()

  if (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data[0] }, { status: 201 })
}