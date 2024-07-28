export type Quote = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  event_start_date: string;
  event_end_date: string;
  status: string;
  total_cost: number;
  is_traiteur: boolean;
  created_at: string;
  updated_at: string;
  description: string;
};

export type QuoteItem = {
  id: number;
  quote_id: number;
  product_id: number;
  quantity: number;
};