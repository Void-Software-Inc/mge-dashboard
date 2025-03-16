import { Client } from "@/utils/types/clients";
import { Quote } from "@/utils/types/quotes";
import { getQuotes } from "./quotes";

// Get all clients from quotes
export async function getClients(): Promise<Client[]> {
  try {
    // Fetch all quotes
    const quotes = await getQuotes();
    
    // Create a map to store unique clients by phone number
    const clientMap = new Map<string, Client>();
    
    // Extract client information from quotes
    quotes.forEach((quote) => {
      const phoneNumber = quote.phone_number;
      
      if (!phoneNumber) return; // Skip quotes without phone number
      
      // Create client object from quote
      const client: Client = {
        id: phoneNumber,
        name: `${quote.first_name || ''} ${quote.last_name || ''}`.trim(),
        email: quote.email || '',
        phone: phoneNumber,
        company: '',
        address: quote.address?.voie || '',
        city: quote.address?.ville || '',
        postal_code: quote.address?.cp || '',
        country: 'fr',
        created_at: quote.created_at,
        updated_at: quote.last_update || quote.created_at,
      };
      
      // If this client already exists, update only if this quote is newer
      const existingClient = clientMap.get(phoneNumber);
      if (!existingClient || new Date(quote.created_at) > new Date(existingClient.created_at)) {
        clientMap.set(phoneNumber, client);
      }
    });
    
    // Convert map to array
    return Array.from(clientMap.values());
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

// Get a single client by phone number
export async function getClient(phoneNumber: string): Promise<Client & { quotes: Quote[] }> {
  try {
    // Fetch all quotes
    const quotes = await getQuotes();
    
    // Filter quotes for this client
    const clientQuotes = quotes.filter(quote => quote.phone_number === phoneNumber);
    
    if (clientQuotes.length === 0) {
      throw new Error(`Client with phone number ${phoneNumber} not found`);
    }
    
    // Get the most recent quote for client details
    const latestQuote = clientQuotes.reduce((latest, current) => {
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
    }, clientQuotes[0]);
    
    // Create client object from the latest quote
    const client: Client & { quotes: Quote[] } = {
      id: phoneNumber,
      name: `${latestQuote.first_name || ''} ${latestQuote.last_name || ''}`.trim(),
      email: latestQuote.email || '',
      phone: phoneNumber,
      company: '',
      address: latestQuote.address?.voie || '',
      city: latestQuote.address?.ville || '',
      postal_code: latestQuote.address?.cp || '',
      country: 'fr',
      created_at: latestQuote.created_at,
      updated_at: latestQuote.last_update || latestQuote.created_at,
      quotes: clientQuotes,
    };
    
    return client;
  } catch (error) {
    console.error(`Error fetching client ${phoneNumber}:`, error);
    throw error;
  }
}

// Delete client is not implemented since clients are derived from quotes
export async function deleteClient(phoneNumber: string): Promise<boolean> {
  console.warn("deleteClient is not implemented. Clients are derived from quotes.");
  return false;
} 