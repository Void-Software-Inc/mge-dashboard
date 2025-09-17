import { ClientMessage } from "@/utils/types/clientMessage";

const API_URL = '/api';

/********************* CLIENT MESSAGES *********************/
  
export async function getClientMessages(): Promise<ClientMessage[]> {
  try {
    const url = `${API_URL}/clientMessage`
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch client messages');
    }
    const { clientMessages } = await response.json();
    return clientMessages;
  } catch (error) {
    console.error('Error fetching client messages:', error);
    throw error;
  }
}

export async function updateClientMessage(data: {
  id: number;
  message: string;
  is_active: boolean;
}): Promise<ClientMessage> {
  try {
    const url = `${API_URL}/clientMessage/update`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to update client message');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating client message:', error);
    throw error;
  }
}
