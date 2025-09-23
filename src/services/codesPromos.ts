import { CodePromo } from "@/utils/types/codesPromos";

const API_URL = '/api';

/********************* CODES PROMOS *********************/
  
export async function getCodesPromos(): Promise<CodePromo[]> {
  try {
    const url = `${API_URL}/codesPromos`
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch codes promos');
    }
    const { codesPromos } = await response.json();
    return codesPromos;
  } catch (error) {
    console.error('Error fetching codes promos:', error);
    throw error;
  }
}

export async function createCodePromo(data: {
  code_promo: string;
  amount: number;
  is_active?: boolean;
}): Promise<CodePromo> {
  try {
    const url = `${API_URL}/codesPromos/create`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to create code promo');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating code promo:', error);
    throw error;
  }
}

export async function updateCodePromo(data: {
  id: number;
  code_promo: string;
  amount: number;
  is_active: boolean;
}): Promise<CodePromo> {
  try {
    const url = `${API_URL}/codesPromos/update`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to update code promo');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating code promo:', error);
    throw error;
  }
}
