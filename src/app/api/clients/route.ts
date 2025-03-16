import { NextResponse } from 'next/server';
import { getClients } from '@/services/clients';

// This is just a proxy to the quotes API since we're extracting client data from quotes
export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // In a real application, you would validate the data and save it to a database
    // For now, we'll just return a success response
    
    return NextResponse.json({ success: true, message: 'Client created successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create client' }, { status: 500 });
  }
} 