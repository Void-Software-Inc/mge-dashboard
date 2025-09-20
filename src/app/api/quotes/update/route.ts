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

  // Parse payments from form data
  const payments = [];
  const paymentModes = formData.getAll('payment_modes[]');
  const paymentAmounts = formData.getAll('payment_amounts[]');

  for (let i = 0; i < paymentModes.length; i++) {
    if (paymentModes[i] && paymentAmounts[i]) {
      const amount = parseFloat(paymentAmounts[i] as string);
      payments.push({
        mode: paymentModes[i] as string,
        amount: !isNaN(amount) ? amount : null
      });
    }
  }

  // Create a TypeScript interface for QuoteData to include fees and raison_sociale
  interface QuoteData {
    first_name: FormDataEntryValue | null;
    last_name: FormDataEntryValue | null;
    raison_sociale: FormDataEntryValue | null;
    phone_number: FormDataEntryValue | null;
    email: FormDataEntryValue | null;
    event_start_date: FormDataEntryValue | null;
    event_end_date: FormDataEntryValue | null;
    status: FormDataEntryValue | null;
    total_cost: FormDataEntryValue | null;
    is_paid: boolean;
    is_traiteur: boolean;
    traiteur_price: FormDataEntryValue | null;
    other_expenses: FormDataEntryValue | null;
    description: FormDataEntryValue | null;
    payments: Array<{ mode: string; amount: number | null }>;
    last_update: string;
    is_deposit: boolean;
    deposit_amount: FormDataEntryValue | null;
    deposit_percentage: FormDataEntryValue | null;
    address: {
      voie: FormDataEntryValue | null;
      compl: FormDataEntryValue | null;
      cp: FormDataEntryValue | null;
      ville: FormDataEntryValue | null;
      depart: FormDataEntryValue | null;
      pays: FormDataEntryValue | null;
    };
    fees?: any[]; // Add this to allow the fees property
    code_promo?: FormDataEntryValue | null; // Optional promo code field
  }

  const quoteData: QuoteData = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    raison_sociale: formData.get('raison_sociale'),
    phone_number: formData.get('phone_number'),
    email: formData.get('email'),
    event_start_date: formData.get('event_start_date'),
    event_end_date: formData.get('event_end_date'),
    status: formData.get('status'),
    total_cost: formData.get('total_cost'),
    is_paid: formData.get('is_paid') === 'true',
    is_traiteur: formData.get('is_traiteur') === 'true',
    traiteur_price: formData.get('traiteur_price'),
    other_expenses: formData.get('other_expenses'),
    description: formData.get('description'),
    payments: payments,
    last_update: parisDate,
    is_deposit: formData.get('is_deposit') === 'true',
    deposit_amount: formData.get('deposit_amount'),
    deposit_percentage: formData.get('deposit_percentage'),
    address: {
      voie: formData.get('address.voie'),
      compl: formData.get('address.compl'),
      cp: formData.get('address.cp'),
      ville: formData.get('address.ville'),
      depart: formData.get('address.depart'),
      pays: formData.get('address.pays')
    },
    code_promo: formData.get('code_promo') || null,
  };
  
  // Handle fees specifically
  const feesStr = formData.get('fees');
  if (feesStr) {
    try {
      quoteData.fees = JSON.parse(feesStr as string);
    } catch (error) {
      console.error('Error parsing fees JSON:', error);
      return NextResponse.json({ error: 'Invalid fees format' }, { status: 400 });
    }
  }

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