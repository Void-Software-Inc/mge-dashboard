import { Quote, QuoteItem } from "@/utils/types/quotes";

const API_URL = '/api';



export async function getQuotes(): Promise<Quote[]> {
  try {
    const url = `${API_URL}/quotes`
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch quotes');
    }
    const { quotes } = await response.json();
    const cleanQuotes = quotes.map((quote: Quote) => ({
      id: quote.id,
      first_name: quote.first_name,
      last_name: quote.last_name,
      phone_number: quote.phone_number,
      email: quote.email,
      event_start_date: quote.event_start_date,
      event_end_date: quote.event_end_date,
      status: quote.status,
      total_cost: quote.total_cost,
      is_traiteur: quote.is_traiteur,
      description: quote.description,
    }))
    return cleanQuotes;
  } catch (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }
}

export async function deleteQuote(ids: number[]): Promise<void> {
    try {
      const url = `${API_URL}/quotes/delete`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete quote(s)');
      }
    } catch (error) {
      console.error('Error deleting quote(s):', error);
      throw error;
    }
  }
