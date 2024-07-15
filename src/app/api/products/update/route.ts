import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  const supabase = createClient();
  const { id, ...updatedData } = await request.json();

  const { data, error } = await supabase
    .from("products")
    .update(updatedData)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }

  return NextResponse.json({ data });
}