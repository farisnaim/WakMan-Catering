"use client";

import Link from "next/link";

export interface QuotationItem {
  id: string;
  item_name: string;
  qty: number;
  unit_price: number;
}

export interface Order {
  id: number;
  customer_id: number;
  event_date: string | null;
  order_details: string | null;
  status: string;
  total_price?: number | null;
  quotation_data?: {
    items?: QuotationItem[];
    notes?: string;
    total_price?: number;
  } | null;
  created_at: string;
  customers: {
    customer_name: string;
    customer_phone: string;
    address1?: string;
  } | null;
}

interface KanbanCardProps {
  order: Order;
  isUpdating: boolean;
  onStatusChange: (orderId: number, newStatus: string) => void;
  onSendWhatsApp: (order: Order) => void;
}

export default function KanbanCard({
  order,
  isUpdating,
  onStatusChange,
  onSendWhatsApp,
}: KanbanCardProps) {
  const hasQuotation =
    order.quotation_data?.items && order.quotation_data.items.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:shadow-md transition relative">
      {/* ID Tempahan & Tarikh Majlis */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
          #ORD-{order.id.toString().padStart(4, "0")}
        </span>
        {order.event_date && (
          <span className="font-mono text-slate-500 font-medium">
            📅 {order.event_date}
          </span>
        )}
      </div>

      {/* Maklumat Pelanggan */}
      <div>
        <h3 className="text-sm font-black text-slate-900 leading-snug">
          {order.customers?.customer_name || "Pelanggan Tanpa Nama"}
        </h3>
        <p className="text-[11px] font-mono text-slate-500">
          📱 {order.customers?.customer_phone || "-"}
        </p>
      </div>

      {/* Itemized Menu / Quotation */}
      {hasQuotation ? (
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 space-y-1.5 text-[11px]">
          <div className="text-[9px] font-bold uppercase text-slate-400 border-b border-slate-200 pb-0.5">
            Menu / Items
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {order.quotation_data?.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between text-slate-700">
                <span className="truncate pr-1">• {item.item_name}</span>
                <span className="font-mono font-bold shrink-0">
                  x{item.qty}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-1 border-t border-slate-200 flex justify-between font-black text-slate-900 text-xs">
            <span>Total:</span>
            <span className="font-mono text-blue-700">
              RM{" "}
              {(
                order.total_price ||
                order.quotation_data?.total_price ||
                0
              ).toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-sans">
          {order.order_details || "Tiada perincian."}
        </div>
      )}

      {/* Pengurusan Tukar Status & Tindakan */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <select
          value={order.status}
          disabled={isUpdating}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
          className="text-[10px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none flex-1 cursor-pointer disabled:opacity-50"
        >
          <option value="pending">Tempahan Baharu</option>
          <option value="processing">on-going</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Batal</option>
        </select>

        <button
          onClick={() => onSendWhatsApp(order)}
          title="Hantar WhatsApp"
          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs transition cursor-pointer"
        >
          💭
        </button>

        <Link
          href={`/orders/${order.id}`}
          className="p-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs transition"
          title="Edit Tempahan"
        >
          ✏️
        </Link>
      </div>
    </div>
  );
}
