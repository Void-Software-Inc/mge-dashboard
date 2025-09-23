const API_URL = '/api';

export interface ClientNote {
  id: number;
  phone_number: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientNoteRequest {
  phone_number: string;
  notes: string;
}

export interface UpdateClientNoteRequest {
  notes: string;
}

/**
 * Get client notes by phone number
 */
export async function getClientNotes(phoneNumber: string): Promise<ClientNote | null> {
  try {
    const url = `${API_URL}/client-notes?phone_number=${encodeURIComponent(phoneNumber)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch client notes');
    }
    
    const { notes } = await response.json();
    return notes;
  } catch (error) {
    console.error('Error fetching client notes:', error);
    throw new Error('Failed to fetch client notes');
  }
}

/**
 * Create or update client notes
 */
export async function upsertClientNotes(request: CreateClientNoteRequest): Promise<ClientNote> {
  try {
    const url = `${API_URL}/client-notes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to save client notes');
    }

    const { notes } = await response.json();
    return notes;
  } catch (error) {
    console.error('Error upserting client notes:', error);
    throw new Error('Failed to save client notes');
  }
}

/**
 * Update client notes
 */
export async function updateClientNotes(phoneNumber: string, request: UpdateClientNoteRequest): Promise<ClientNote> {
  try {
    const url = `${API_URL}/client-notes/${encodeURIComponent(phoneNumber)}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to update client notes');
    }

    const { notes } = await response.json();
    return notes;
  } catch (error) {
    console.error('Error updating client notes:', error);
    throw new Error('Failed to update client notes');
  }
}

/**
 * Delete client notes
 */
export async function deleteClientNotes(phoneNumber: string): Promise<boolean> {
  try {
    const url = `${API_URL}/client-notes/${encodeURIComponent(phoneNumber)}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete client notes');
    }

    const { success } = await response.json();
    return success;
  } catch (error) {
    console.error('Error deleting client notes:', error);
    throw new Error('Failed to delete client notes');
  }
}
