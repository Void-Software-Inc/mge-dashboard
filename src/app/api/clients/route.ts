import { NextResponse } from 'next/server';
import { getClients } from '@/services/clients';

// This is just a proxy to the quotes API since we're extracting client data from quotes
export async function GET(request: Request) {
  try {
    const clients = await getClients();
    
    // Add quote_count to each client if not already present
    const clientsWithCounts = clients.map(client => {
      if (!client.quote_count) {
        return { ...client, quote_count: 0 };
      }
      return client;
    });
    
    return NextResponse.json({ clients: clientsWithCounts });
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