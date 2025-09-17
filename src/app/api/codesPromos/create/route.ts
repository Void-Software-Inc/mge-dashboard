import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { formatInTimeZone } from 'date-fns-tz'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const body = await request.json()
  const { code_promo, amount, is_active = true } = body

  // Validate required fields
  if (!code_promo || amount === undefined) {
    return NextResponse.json({ error: 'Code promo and amount are required' }, { status: 400 })
  }

  // Check if code_promo already exists
  const { data: existingCode, error: checkError } = await supabase
    .from('codesPromos')
    .select('id')
    .eq('code_promo', code_promo)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking existing code:', checkError)
    return NextResponse.json({ error: 'Failed to validate code uniqueness' }, { status: 500 })
  }

  if (existingCode) {
    return NextResponse.json({ error: 'Code promo already exists' }, { status: 409 })
  }

  // Generate current timestamp in Paris timezone
  const parisDate = formatInTimeZone(new Date(), 'Europe/Paris', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")

  const codePromoData = {
    code_promo,
    amount: parseFloat(amount),
    is_active,
    created_at: parisDate
  }

  const { data, error } = await supabase
    .from('codesPromos')
    .insert([codePromoData])
    .select()

  if (error) {
    console.error('Error creating code promo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data[0] }, { status: 201 })
}