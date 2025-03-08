import { Quote, QuoteItem, QuoteRecord, FinishedQuote } from "@/utils/types/quotes";
import { Product } from "@/utils/types/products";

const API_URL = '/api';


/***************************** Quotes *****************************/

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
      is_paid: quote.is_paid,
      is_traiteur: quote.is_traiteur,
      description: quote.description,
      created_at: quote.created_at,
      last_update: quote.last_update,
      is_deposit: quote.is_deposit,
      deposit_amount: quote.deposit_amount,
      address: quote.address,
      payments: quote.payments || [],
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

export async function createQuote(quoteData: Partial<Quote>, quoteItems?: QuoteItem[]): Promise<{ quote: Quote; quoteItems?: QuoteItem[] }> {
  try {
    const url = `${API_URL}/quotes/create`;
    const cleanedQuoteItems = quoteItems?.map(({ id, ...item }) => item);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quoteData, quoteItems: cleanedQuoteItems }),
    });

    if (!response.ok) {
      throw new Error('Failed to create quote');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating quote:', error);
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

export async function finishQuote(ids: number[]): Promise<void> {
  try {
    const url = `${API_URL}/quotes/finish`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to finish quote(s)');
    }
  } catch (error) {
    console.error('Error finishing quote(s):', error);
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

/***************************** QuoteItems *****************************/

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

/***************************** QuoteRecords *****************************/

export async function getQuotesRecords(): Promise<QuoteRecord[]> {
  try {
    const url = `${API_URL}/records/quotes`
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch quotes records');
    }
    const { quotes_records } = await response.json();
    const cleanQuotesRecords = quotes_records.map((quotes: QuoteRecord) => ({
      id: quotes.id,
      first_name: quotes.first_name,
      last_name: quotes.last_name,
      phone_number: quotes.phone_number,
      email: quotes.email,
      event_start_date: quotes.event_start_date,
      event_end_date: quotes.event_end_date,
      status: quotes.status,
      total_cost: quotes.total_cost,
      is_paid: quotes.is_paid,
      is_traiteur: quotes.is_traiteur,
      description: quotes.description,
      deleted_at: quotes.deleted_at,
      deposit_percentage: quotes.deposit_percentage,
    }))
    return cleanQuotesRecords;
  } catch (error) {
    console.error('Error fetching quotes records:', error);
    throw error;
  }
}

export async function restoreQuoteRecord(ids: number[]): Promise<void> {
  try {
    const url = `${API_URL}/records/quotes/restore`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to restore quote(s)');
    }
  } catch (error) {
    console.error('Error restoring quote(s):', error);
    throw error;
  }
}

export async function deleteQuoteRecord(ids: number[]): Promise<void> {
  try {
    const url = `${API_URL}/records/quotes/delete`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete quote(s) from records');
    }
  } catch (error) {
    console.error('Error deleting quote(s) from records:', error);
    throw error;
  }
}

/***************************** FinishedQuotes *****************************/

export async function getFinishedQuotes(): Promise<FinishedQuote[]> {
  try {
    const url = `${API_URL}/records/finishedQuotes`
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch finished quotes');
    }
    const { finished_quotes } = await response.json();
    const cleanFinishedQuotes = finished_quotes.map((quotes: FinishedQuote) => ({
      id: quotes.id,
      first_name: quotes.first_name,
      last_name: quotes.last_name,
      phone_number: quotes.phone_number,
      email: quotes.email,
      event_start_date: quotes.event_start_date,
      event_end_date: quotes.event_end_date,
      status: quotes.status,
      total_cost: quotes.total_cost,
      is_paid: quotes.is_paid,
      is_traiteur: quotes.is_traiteur,
      is_deposit: quotes.is_deposit,
      traiteur_price: quotes.traiteur_price,
      other_expenses: quotes.other_expenses,
      deposit_amount: quotes.deposit_amount,
      deposit_percentage: quotes.deposit_percentage,
      created_at: quotes.created_at,
      last_update: quotes.last_update,
      description: quotes.description,
      finished_at: quotes.finished_at,
      payments: quotes.payments || [],
      address: quotes.address,
    }))
    return cleanFinishedQuotes;
  } catch (error) {
    console.error('Error fetching finished quotes:', error);
    throw error;
  }
}

export async function restoreFinishedQuote(ids: number[]): Promise<void> {
  try {
    const url = `${API_URL}/records/finishedQuotes/restore`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to restore finished quote(s)');
    }
  } catch (error) {
    console.error('Error restoring finished quote(s):', error);
    throw error;
  }
}

export async function getFinishedQuoteItems(quoteId: number): Promise<QuoteItem[]> {
  try {
    const url = `${API_URL}/records/finishedQuotes/${quoteId}/items`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch finished quote items for quote with id ${quoteId}`);
    }
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error(`Error fetching finished quote items for quote with id ${quoteId}:`, error);
    throw error;
  }
}