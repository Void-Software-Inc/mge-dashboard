export interface Address {
  voie: string;
  compl: string | null;
  cp: string;
  ville: string;
  depart: string;
  pays: string;
}

export type Fee = {
  name: string;
  price: number;
  enabled: boolean;
  description: string | null;
  isCustom?: boolean;
};

export type FeeType = {
  name: string;
  displayName: string;
  description: string;
  isCustom?: boolean;
};

export const FEE_TYPES: FeeType[] = [
  { name: 'delivery', displayName: 'Livraison', description: '' },
  { name: 'pickup', displayName: 'Récupération', description: '' },
  { name: 'table_service', displayName: 'Service en salle', description: '' },
  { name: 'marquee_setup', displayName: 'Montage chapiteau', description: '' },
  { name: 'marquee_dismantling', displayName: 'Frais de déconstruction', description: '' },
  { name: 'decoration', displayName: 'Décoration', description: '' },
  { name: 'custom', displayName: 'Personnalisé', description: '', isCustom: true }
];

export type Quote = {
  id: number;
  first_name: string;
  last_name: string;
  raison_sociale?: string | null; // Company name (nullable for individual clients)
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
  deposit_percentage: number;
  address: Address | null;
  payments?: QuotePayment[];
  fees: Fee[];
  code_promo?: number | null; // Optional promo code field foreign key to codesPromos table
  code_promo_code?: string; // Promo code string (e.g., "REDUCTION20")
  code_promo_discount?: number; // Promo code discount percentage
};

export type QuoteRecord = {
  id: number;
  first_name: string;
  last_name: string;
  raison_sociale?: string | null; // Company name (nullable for individual clients)
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
  address: Address | null;
  payments?: QuotePayment[];
  is_deposit: boolean;
  deposit_amount: number;
  deposit_percentage: number;
  fees: Fee[];
  code_promo?: number | null; // Optional promo code field foreign key to codesPromos table
};

export type FinishedQuote = {
  id: number;
  first_name: string;
  last_name: string;
  raison_sociale?: string | null; // Company name (nullable for individual clients)
  phone_number: string;
  email: string;
  event_start_date: string;
  event_end_date: string;
  status: string;
  total_cost: number;
  is_paid: boolean;
  is_traiteur: boolean;
  is_deposit: boolean;
  traiteur_price: number;
  other_expenses: number;
  deposit_amount: number;
  deposit_percentage: number;
  created_at: string;
  last_update: string;
  finished_at: string;
  description: string;
  address: Address | null;
  payments?: QuotePayment[];
  fees: Fee[];
  code_promo?: number | null; // Optional promo code field foreign key to codesPromos table
  code_promo_code?: string; // Promo code string (e.g., "REDUCTION20")
  code_promo_discount?: number; // Promo code discount percentage
};

export type QuoteItem = {
  id: number;
  quote_id: number;
  product_id: number;
  quantity: number;
  product: {
    name: string;
    price: number;
  };
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

export type PaymentMode = {
  value: string;
  name: string;
};

export interface QuotePayment {
  mode: string;
  amount: number | null;
}

export const paymentModes: PaymentMode[] = [
  { value: "especes", name: "Espèces" },
  { value: "cheque", name: "Chèque" },
  { value: "virement", name: "Virement" },
  { value: "cb", name: "Carte bancaire" },
  { value: "paypal", name: "PayPal" }
];