import { Quote, QuoteItem } from "@/utils/types/quotes";
import { Product } from "@/utils/types/products";

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

export async function getQuote(id: number): Promise<Quote> {
  try {
    const url = `${API_URL}/quotes/${id}`

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch quote with id ${id}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching quote with id ${id}:`, error);
    throw error;
  }
}

export async function getQuoteItems(id: number): Promise<QuoteItem[]> {
  try {
    const url = `${API_URL}/quotes/${id}/quoteItems`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch quote items for quote with id ${id}`);
    }
    const data = await response.json();
    return data.quoteItems;
  } catch (error) {
    console.error(`Error fetching quote items for quote with id ${id}:`, error);
    throw error;
  }
}

export async function updateQuote(formData: FormData): Promise<Quote> {
  try {
    const url = `${API_URL}/quotes/update`;

    const response = await fetch(url, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update quote');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating quote:', error);
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

export async function createQuoteItem(quoteId: number, productId: number, quantity: number): Promise<QuoteItem> {
  try {
    const url = `${API_URL}/quotes/${quoteId}/quoteItems/create`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      throw new Error('Failed to create quote item');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating quote item:', error);
    throw error;
  }
}

export async function updateQuoteItem(quoteId: number, quoteItemId: number, quantity: number): Promise<QuoteItem> {
  try {
    const url = `${API_URL}/quotes/${quoteId}/quoteItems/update`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quoteItemId, quantity }),
    });

    if (!response.ok) {
      throw new Error('Failed to update quote item');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating quote item:', error);
    throw error;
  }
}

export async function deleteQuoteItem(quoteId: number, quoteItemId: number): Promise<void> {
  try {
    const url = `${API_URL}/quotes/${quoteId}/quoteItems/delete`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quoteItemId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete quote item');
    }
  } catch (error) {
    console.error('Error deleting quote item:', error);
    throw error;
  }
}

export async function getAvailableProducts(quoteId: number): Promise<Product[]> {
  try {
    const url = `${API_URL}/quotes/${quoteId}/availableProducts`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch available products for quote with id ${quoteId}`);
    }
    const data = await response.json();
    return data.availableProducts;
  } catch (error) {
    console.error(`Error fetching available products for quote with id ${quoteId}:`, error);
    throw error;
  }
}
