import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone } from 'date-fns-tz'

export async function PUT(request: NextRequest) {
  const supabase = createClient();
  
  const formData = await request.formData();
  const id = formData.get('id') as string;

  if (!id) {
    return NextResponse.json({ error: "Quote ID is required" }, { status: 400 });
  }

  const parisDate = formatInTimeZone(new Date(), 'Europe/Paris', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

  const quoteData = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    phone_number: formData.get('phone_number'),
    email: formData.get('email'),
    event_start_date: formData.get('event_start_date'),
    event_end_date: formData.get('event_end_date'),
    status: formData.get('status'),
    total_cost: formData.get('total_cost'),
    is_traiteur: formData.get('is_traiteur') === 'true',
    description: formData.get('description'),
    last_update: parisDate
  };

  const { data, error } = await supabase
    .from("quotes")
    .update(quoteData)
    .eq('id', id)
    .select();

  if (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.length === 0) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json({ data: data[0] });
}