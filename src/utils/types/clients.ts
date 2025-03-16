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
}
