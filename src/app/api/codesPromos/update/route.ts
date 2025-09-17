import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  const supabase = createClient();

  const body = await request.json();
  const { id, code_promo, amount, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: "Code promo ID is required" }, { status: 400 });
  }

  // Validate required fields
  if (!code_promo || amount === undefined) {
    return NextResponse.json({ error: 'Code promo and amount are required' }, { status: 400 })
  }

  // Check if code_promo already exists (excluding current record)
  const { data: existingCode, error: checkError } = await supabase
    .from('codesPromos')
    .select('id')
    .eq('code_promo', code_promo)
    .neq('id', id)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking existing code:', checkError)
    return NextResponse.json({ error: 'Failed to validate code uniqueness' }, { status: 500 })
  }

  if (existingCode) {
    return NextResponse.json({ error: 'Code promo already exists' }, { status: 409 })
  }

  const codePromoData = {
    code_promo,
    amount: parseFloat(amount),
    is_active: is_active !== undefined ? is_active : true
  };

  const { data, error } = await supabase
    .from("codesPromos")
    .update(codePromoData)
    .match({ id })
    .select();

  if (error) {
    console.error("Error updating code promo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.length === 0) {
    return NextResponse.json({ error: "Code promo not found" }, { status: 404 });
  }

  return NextResponse.json({ data: data[0] });
}