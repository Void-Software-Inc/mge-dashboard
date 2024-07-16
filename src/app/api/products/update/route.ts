import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone } from 'date-fns-tz'

export async function PUT(request: NextRequest) {
  const supabase = createClient();
  const { id, last_update, ...updatedData } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const parisDate = formatInTimeZone(new Date(), 'Europe/Paris', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")

  const { data, error } = await supabase
    .from("products")
    .update({...updatedData, last_update: parisDate})
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