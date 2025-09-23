import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/client-notes?phone_number=1234567890
 * Get client notes by phone number
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phone_number');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('client_notes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return NextResponse.json({ notes: null });
      }
      throw error;
    }

    return NextResponse.json({ notes: data });
  } catch (error) {
    console.error('Error fetching client notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client-notes
 * Create or update client notes
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.phone_number || body.notes === undefined) {
      return NextResponse.json(
        { error: 'Phone number and notes are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('client_notes')
      .upsert({
        phone_number: body.phone_number,
        notes: body.notes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'phone_number'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ notes: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating client notes:', error);
    return NextResponse.json(
      { error: 'Failed to save client notes' },
      { status: 500 }
    );
  }
}
