import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  const supabase = createClient();

  const body = await request.json();
  const { id, message, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: "Client message ID is required" }, { status: 400 });
  }

  // Validate required fields
  if (!message || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const clientMessageData = {
    message: message.trim(),
    is_active: is_active !== undefined ? is_active : true
  };

  const { data, error } = await supabase
    .from("clientMessage")
    .update(clientMessageData)
    .match({ id })
    .select();

  if (error) {
    console.error("Error updating client message:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.length === 0) {
    return NextResponse.json({ error: "Client message not found" }, { status: 404 });
  }

  return NextResponse.json({ data: data[0] });
}
