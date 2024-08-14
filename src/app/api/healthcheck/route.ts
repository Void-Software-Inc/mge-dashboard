import { NextResponse } from 'next/server';

export async function GET() {
  // You can add more complex checks here if needed
  // For example, checking database connection, external services, etc.

  try {
    // Perform any necessary checks here

    return NextResponse.json(
      { status: 'OK', message: 'Service is healthy' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'ERROR', message: 'Service is unhealthy' },
      { status: 500 }
    );
  }
}