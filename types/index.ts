// ==========================================
// DEFINISI JENIS DATA PANGKALAN DATA (SUPABASE)
// ==========================================

// 1. Status Tempahan
export type OrderStatus =
  | "pending"
  | "approved"
  | "cancelled"
  | "quotated"
  | "invoiced";

// 2. Status Bayaran Invois
export type PaymentStatus = "unpaid" | "partially_paid" | "paid";

// ==========================================
// INTERFACE JADUAL 1: ORDERS (TEMPAHAN)
// ==========================================
export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  event_date: string;
  address1: string;
  address2?: string | null;
  order_details: string; // Free text senarai menu & kuantiti
  notes?: string | null;
  status: OrderStatus;
  created_at: string;
}

// Type untuk membuat tempahan baharu (tanpa id & created_at)
export type CreateOrderInput = Omit<Order, "id" | "created_at">;

// ==========================================
// INTERFACE JADUAL 2: INVOICES (INVOIS)
// ==========================================
export interface Invoice {
  id: string;
  order_id: string | null; // Hubungan Foreign Key ke Order
  invoice_number: string;
  total_amount: number;
  deposit_amount: number;
  payment_status: PaymentStatus;
  created_at: string;

  // Perhubungan Data (Joins / Relations)
  order?: Order | null;
}

// Type untuk menjana invois baharu
export type CreateInvoiceInput = Omit<Invoice, "id" | "created_at" | "order">;

// ==========================================
// RINGKASAN DATA PELANGGAN (UNTUK AUTOFILL/DIRECTORY)
// ==========================================
export interface CustomerSummary {
  customer_name: string;
  customer_phone: string;
  address1: string;
  address2?: string | null;
  total_orders?: number;
  last_event_date?: string;
}
