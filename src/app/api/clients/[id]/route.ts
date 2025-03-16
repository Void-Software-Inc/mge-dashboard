import { NextResponse } from "next/server"
import { getClient } from "@/services/clients"

// This is just a proxy to the quotes API since we're extracting client data from quotes
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await getClient(params.id)
    return NextResponse.json(client)
  } catch (error) {
    console.error(`Error fetching client ${params.id}:`, error)
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 404 }
    )
  }
} 