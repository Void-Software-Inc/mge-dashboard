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
  traiteur_price: number;
  other_expenses: number;
  created_at: string;
  last_update: string;
  description: string;
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
  is_traiteur: boolean;
  traiteur_price: number;
  other_expenses: number;
  deleted_at: string;
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
  { value: "en_attente_de_contact", name: "En attente de contact", color: "#f39c12" }, // Yellow
  { value: "client_contacte", name: "Client contacté", color: "#f39c12" }, // Yellow
  { value: "en_negociation", name: "En négociation", color: "#f39c12" }, // Yellow
  { value: "en_attente_de_reponse_client", name: "En attente de réponse client", color: "#f39c12" }, // Yellow
  { value: "modifications_requises", name: "Modifications requises", color: "#e67e22" }, // Orange
  { value: "devis_accepte", name: "Devis accepté", color: "#2ecc71" }, // Green
  { value: "en_attente_de_paiement", name: "En attente de paiement", color: "#f39c12" }, // Yellow
  { value: "acompte_recu", name: "Acompte reçu", color: "#27ae60" }, // Dark Green
  { value: "paye", name: "Payé", color: "#27ae60" }, // Dark Green
  { value: "en_cours_de_realisation", name: "En cours de réalisation", color: "#2ecc71" }, // Green
  { value: "termine", name: "Terminé", color: "#27ae60" }, // Dark Green
  { value: "annule", name: "Annulé", color: "#e74c3c" }, // Red
  { value: "refuse", name: "Refusé", color: "#c0392b" }, // Dark Red
];