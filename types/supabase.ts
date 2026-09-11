export interface Invoice {
  id: number;
  order_id?: number;
  customer_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal?: number;
  deposit_paid: number;
  balanced_due: number;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  event_date?: string;
  payment_terms?: string;
  items_data: any[]; // JSONB
  delivery_fee?: number;
  slug: string;
}
