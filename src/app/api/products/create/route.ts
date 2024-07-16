import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone } from 'date-fns-tz'

// ... existing GET method (if any) ...

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const productData = await request.json();

  // Generate current timestamp in Paris timezone
  const parisDate = formatInTimeZone(new Date(), 'Europe/Paris', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")

  // Add creation and last update timestamps
  const newProduct = {
    ...productData,
    created_at: parisDate,
    last_update: parisDate
  };

  const { data, error } = await supabase
    .from("products")
    .insert([newProduct])
    .select();

  if (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data[0] }, { status: 201 });
}