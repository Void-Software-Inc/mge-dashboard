import { NextResponse } from "next/server"
import { getClient } from "@/services/clients"

// This is just a proxy to the quotes API since we're extracting client data from quotes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const client = await getClient(id)
    return NextResponse.json(client)
  } catch (error) {
    console.error(`Error fetching client ${id}:`, error)
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 404 }
    )
  }
} 