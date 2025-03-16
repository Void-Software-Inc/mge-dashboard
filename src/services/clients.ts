import { Client } from "@/utils/types/clients";
import { Quote, QuoteRecord, FinishedQuote } from "@/utils/types/quotes";
import { getQuotes as originalGetQuotes, getFinishedQuotes as originalGetFinishedQuotes, getQuotesRecords as originalGetQuotesRecords } from "./quotes";

// Helper function to safely get date properties from different quote types
function getQuoteDates(quote: any): { createdAt: string, updatedAt: string } {
  return {
    createdAt: quote.created_at || quote.finished_at || quote.deleted_at || '',
    updatedAt: quote.last_update || quote.finished_at || quote.deleted_at || ''
  };
}

// Wrapper functions for debugging
async function getQuotes(): Promise<Quote[]> {
  const quotes = await originalGetQuotes();
  return quotes;
}

async function getFinishedQuotes(): Promise<FinishedQuote[]> {
  const quotes = await originalGetFinishedQuotes();
  return quotes;
}

async function getQuotesRecords(): Promise<QuoteRecord[]> {
  const quotes = await originalGetQuotesRecords();
  return quotes;
}

// Get all clients from quotes
export async function getClients(): Promise<Client[]> {
  try {
    // Fetch quotes from all sources
    const [activeQuotes, finishedQuotes, deletedQuotes] = await Promise.all([
      getQuotes(),
      getFinishedQuotes(),
      getQuotesRecords()
    ]);
    
    // Combine all quotes with type indicators
    const allQuotes = [
      ...activeQuotes.map(q => ({ ...q, quote_type: 'active' })),
      ...finishedQuotes.map(q => ({ ...q, quote_type: 'finished' })),
      ...deletedQuotes.map(q => ({ ...q, quote_type: 'deleted', is_deleted: true }))
    ];
    
    // Create a map to store unique clients by phone number
    const clientMap = new Map<string, Client & { quoteCount: number }>();
    
    // Extract client information from quotes
    allQuotes.forEach((quote) => {
      const phoneNumber = quote.phone_number;
      
      if (!phoneNumber) return; // Skip quotes without phone number
      
      const dates = getQuoteDates(quote);
      
      if (!clientMap.has(phoneNumber)) {
        // Create new client object
        clientMap.set(phoneNumber, {
          id: phoneNumber,
          name: `${quote.first_name || ''} ${quote.last_name || ''}`.trim(),
          email: quote.email || '',
          phone: phoneNumber,
          company: '',
          address: quote.address?.voie || '',
          city: quote.address?.ville || '',
          postal_code: quote.address?.cp || '',
          country: 'fr',
          created_at: dates.createdAt,
          updated_at: dates.updatedAt,
          quoteCount: 1
        });
      } else {
        // Update existing client
        const client = clientMap.get(phoneNumber)!;
        client.quoteCount += 1;
        
        // Update client info if this quote is newer
        const dates = getQuoteDates(quote);
        const quoteDate = new Date(dates.updatedAt);
        const clientDate = new Date(client.updated_at);
        
        if (quoteDate > clientDate) {
          client.name = `${quote.first_name || ''} ${quote.last_name || ''}`.trim();
          client.email = quote.email || '';
          client.address = quote.address?.voie || '';
          client.city = quote.address?.ville || '';
          client.postal_code = quote.address?.cp || '';
          client.updated_at = dates.updatedAt;
        }
      }
    });
    
    // Convert map to array and add quote_count property
    return Array.from(clientMap.values()).map(({ quoteCount, ...client }) => ({
      ...client,
      quote_count: quoteCount
    }));
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

// Get a single client by phone number
export async function getClient(phoneNumber: string): Promise<Client & { quotes: Quote[] }> {
  try {    
    // Fetch quotes from all sources
    const [activeQuotes, finishedQuotes, deletedQuotes] = await Promise.all([
      getQuotes(),
      getFinishedQuotes(),
      getQuotesRecords()
    ]);
        
    // Combine all quotes with type indicators
    const allQuotes = [
      ...activeQuotes.map(q => ({ ...q, quote_type: 'active' })),
      ...finishedQuotes.map(q => ({ ...q, quote_type: 'finished', status: 'completed' })),
      ...deletedQuotes.map(q => ({ ...q, quote_type: 'deleted', is_deleted: true }))
    ];
    
    // Filter quotes for this client
    const clientQuotes = allQuotes.filter(quote => quote.phone_number === phoneNumber);

    
    if (clientQuotes.length === 0) {
      throw new Error(`Client with phone number ${phoneNumber} not found`);
    }
    
    // Get the most recent quote for client details
    const latestQuote = clientQuotes.reduce((latest, current) => {
      const latestDates = getQuoteDates(latest);
      const currentDates = getQuoteDates(current);
      
      const latestDate = new Date(latestDates.updatedAt);
      const currentDate = new Date(currentDates.updatedAt);
      
      return currentDate > latestDate ? current : latest;
    }, clientQuotes[0]);
    
    const dates = getQuoteDates(latestQuote);
    
    // Create client object from the latest quote
    const client: Client & { quotes: any[], quote_count: number } = {
      id: phoneNumber,
      name: `${latestQuote.first_name || ''} ${latestQuote.last_name || ''}`.trim(),
      email: latestQuote.email || '',
      phone: phoneNumber,
      company: '',
      address: latestQuote.address?.voie || '',
      city: latestQuote.address?.ville || '',
      postal_code: latestQuote.address?.cp || '',
      country: 'fr',
      created_at: dates.createdAt,
      updated_at: dates.updatedAt,
      quotes: clientQuotes,
      quote_count: clientQuotes.length
    };
        
    return client as Client & { quotes: Quote[] };
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