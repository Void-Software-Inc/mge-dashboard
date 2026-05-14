import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/client-notes/[phone_number]
 * Get client notes by phone number
 */
export async function GET(
  request: Request,
  { params }: { params: { phone_number: string } }
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('client_notes')
      .select('*')
      .eq('phone_number', params.phone_number)
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
    console.error(`Error fetching client notes for ${params.phone_number}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch client notes' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/client-notes/[phone_number]
 * Update client notes
 */
export async function PUT(
  request: Request,
  { params }: { params: { phone_number: string } }
) {
  try {
    const body = await request.json();

    if (body.notes === undefined) {
      return NextResponse.json(
        { error: 'Notes are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('client_notes')
      .update({
        notes: body.notes,
        updated_at: new Date().toISOString()
      })
      .eq('phone_number', params.phone_number)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ notes: data });
  } catch (error) {
    console.error(`Error updating client notes for ${params.phone_number}:`, error);
    return NextResponse.json(
      { error: 'Failed to update client notes' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client-notes/[phone_number]
 * Delete client notes
 */
export async function DELETE(
  request: Request,
  { params }: { params: { phone_number: string } }
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('client_notes')
      .delete()
      .eq('phone_number', params.phone_number);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting client notes for ${params.phone_number}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete client notes' },
      { status: 500 }
    );
  }
}
