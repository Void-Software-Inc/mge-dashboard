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
  is_paid: boolean;
  is_traiteur: boolean;
  traiteur_price: number;
  other_expenses: number;
  created_at: string;
  last_update: string;
  description: string;
  is_deposit: boolean;
  deposit_amount: number;
};

export type QuoteRecord = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  event_start_date: string;
  event_end_date: string;
  status: string;
  total_cost: number;
  is_paid: boolean;
  is_traiteur: boolean;
  traiteur_price: number;
  other_expenses: number;
  deleted_at: string;
  description: string;
};

export type FinishedQuote = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  event_start_date: string;
  event_end_date: string;
  status: string;
  total_cost: number;
  is_paid: boolean;
  is_traiteur: boolean;
  traiteur_price: number;
  other_expenses: number;
  finished_at: string;
  description: string;
};

export type QuoteItem = {
  id: number;
  quote_id: number;
  product_id: number;
  quantity: number;
};

export type QuoteStatus = {
  value: string;
  name: string;
  color: string;
};

export const quoteStatus: QuoteStatus[] = [
  { value: "nouveau", name: "Nouveau", color: "#3498db" }, // Blue
  { value: "en_attente_de_reponse_client", name: "En attente de réponse client", color: "#facc15" }, // Yellow
  { value: "en_attente_de_paiement", name: "En attente de paiement", color: "#f97316" }, // Orange
  { value: "en_cours_de_realisation", name: "En cours de réalisation", color: "#2ecc71" }, // Green
  { value: "termine", name: "Terminé", color: "#27ae60" }, // Dark Green
  { value: "annule", name: "Annulé", color: "#e74c3c" }, // Red
];