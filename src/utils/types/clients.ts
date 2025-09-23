export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  created_at: string;
  updated_at: string;
  quote_count?: number;
  notes?: string;
}

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
