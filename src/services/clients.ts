import { Client } from "@/utils/types/clients";
import { Quote, QuoteRecord, FinishedQuote } from "@/utils/types/quotes";
import { getQuotes as originalGetQuotes, getFinishedQuotes as originalGetFinishedQuotes, getQuotesRecords as originalGetQuotesRecords, getQuoteItems, getFinishedQuoteItems } from "./quotes";
import { getAllProducts } from "./products";

// Simple cache to avoid re-fetching products repeatedly
let productsCache: { data: any[], timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedProducts() {
  const now = Date.now();
  if (productsCache && (now - productsCache.timestamp) < CACHE_DURATION) {
    return productsCache.data;
  }
  
  const products = await getAllProducts();
  productsCache = { data: products, timestamp: now };
  return products;
}

// Helper function to safely get date properties from different quote types
function getQuoteDates(quote: any): { createdAt: string, updatedAt: string } {
  return {
    createdAt: quote.created_at || quote.finished_at || quote.deleted_at || '',
    updatedAt: quote.last_update || quote.finished_at || quote.deleted_at || ''
  };
}

// Helper function to enrich quotes with their items and products (optimized)
async function enrichQuotesWithItems(quotes: any[], products: any[], filterRelevantOnly: boolean = true): Promise<any[]> {
  // Optimization 1: Filter out quotes that don't need product analysis if filterRelevantOnly is true
  let quotesToProcess = quotes;
  if (filterRelevantOnly) {
    quotesToProcess = quotes.filter(quote => {
      // Include active quotes for service filtering
      if (quote.quote_type === 'active') return true;
      
      // EXCLUDE finished quotes from service filtering (but keep them in client data)
      // EXCLUDE deleted quotes for performance (they're less relevant for service analysis)
      return false;
    });
  }
  
  // Optimization 2: Batch fetch quote items to reduce API calls
  const enrichedQuotes = await Promise.all(quotesToProcess.map(async (quote) => {
    try {
      let quoteItems: any[] = [];
      
      // Only fetch items for quotes that might need product-based filtering
      // Skip if quote already has traiteur flag (no need to check products)
      const needsProductAnalysis = !quote.is_traiteur || !quote.traiteur_price;
      
      if (needsProductAnalysis) {
        // Fetch quote items based on quote type
        if (quote.quote_type === 'finished') {
          quoteItems = await getFinishedQuoteItems(quote.id);
        } else if (quote.quote_type === 'active') {
          quoteItems = await getQuoteItems(quote.id);
        }
      }
      
      // Optimization 3: Only enrich with essential product info (category, type)
      const enrichedItems = quoteItems.map(item => {
        const product = products.find(p => p.id === item.product_id);
        return {
          ...item,
          product: product ? {
            id: product.id,
            name: product.name,
            type: product.type,
            category: product.category
          } : null
        };
      });
      
      return {
        ...quote,
        items: enrichedItems
      };
    } catch (error) {
      console.error(`Error fetching items for quote ${quote.id}:`, error);
      return {
        ...quote,
        items: []
      };
    }
  }));
  
  // Return all quotes, but only processed ones have items
  return quotes.map(quote => {
    const enriched = enrichedQuotes.find(eq => eq.id === quote.id);
    return enriched || { ...quote, items: [] };
  });
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
export async function getClients(): Promise<(Client & { quotes: any[] })[]> {
  try {
    // Fetch quotes from all sources and products (using cache)
    const [activeQuotes, finishedQuotes, deletedQuotes, products] = await Promise.all([
      getQuotes(),
      getFinishedQuotes(),
      getQuotesRecords(),
      getCachedProducts()
    ]);
    
    // Combine all quotes with type indicators
    const allQuotes = [
      ...activeQuotes.map(q => ({ ...q, quote_type: 'active' })),
      ...finishedQuotes.map(q => ({ ...q, quote_type: 'finished' })),
      ...deletedQuotes.map(q => ({ ...q, quote_type: 'deleted', is_deleted: true }))
    ];
    
    // Enrich quotes with their items and products (with optimizations)
    const enrichedQuotes = await enrichQuotesWithItems(allQuotes, products, true);
    
    // Create a map to store unique clients by phone number
    const clientMap = new Map<string, Client & { quoteCount: number, quotes: any[] }>();
    
    // Extract client information from enriched quotes
    enrichedQuotes.forEach((quote) => {
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
          quoteCount: 1,
          quotes: [quote] // Initialize quotes array with this quote
        });
      } else {
        // Update existing client
        const client = clientMap.get(phoneNumber)!;
        client.quoteCount += 1;
        client.quotes.push(quote); // Add this quote to the client's quotes array
        
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
    // Fetch quotes from all sources and products (using cache)
    const [activeQuotes, finishedQuotes, deletedQuotes, products] = await Promise.all([
      getQuotes(),
      getFinishedQuotes(),
      getQuotesRecords(),
      getCachedProducts()
    ]);
        
    // Combine all quotes with type indicators
    const allQuotes = [
      ...activeQuotes.map(q => ({ ...q, quote_type: 'active' })),
      ...finishedQuotes.map(q => ({ ...q, quote_type: 'finished', status: 'completed' })),
      ...deletedQuotes.map(q => ({ ...q, quote_type: 'deleted', is_deleted: true }))
    ];
    
    // Filter quotes for this client
    const clientQuotes = allQuotes.filter(quote => quote.phone_number === phoneNumber);
    
    // Enrich client quotes with their items and products (no filtering for single client)
    const enrichedClientQuotes = await enrichQuotesWithItems(clientQuotes, products, false);

    
    if (enrichedClientQuotes.length === 0) {
      throw new Error(`Client with phone number ${phoneNumber} not found`);
    }
    
    // Get the most recent quote for client details
    const latestQuote = enrichedClientQuotes.reduce((latest, current) => {
      const latestDates = getQuoteDates(latest);
      const currentDates = getQuoteDates(current);
      
      const latestDate = new Date(latestDates.updatedAt);
      const currentDate = new Date(currentDates.updatedAt);
      
      return currentDate > latestDate ? current : latest;
    }, enrichedClientQuotes[0]);
    
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
      quotes: enrichedClientQuotes,
      quote_count: enrichedClientQuotes.length
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