"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export interface OrderItem {
  id: number;
  item_description: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  customer_name: string;
  phone_number: string;
  event_date: string;
  event_time?: string;
  delivery_address?: string;
  pax_quantity: number;
  total_price: number;
  deposit_paid: number;
  payment_status: string;
  order_status: string;
  notes?: string;
  order_items?: OrderItem[];
}

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: number, newStatus: string) => void;
}

export default function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [currentStatus, setCurrentStatus] = useState(
    order.order_status || "BARU",
  );
  const [updating, setUpdating] = useState(false);

  const totalPrice = Number(order.total_price) || 0;
  const depositPaid = Number(order.deposit_paid) || 0;
  const balance = totalPrice - depositPaid;

  // Format nombor telefon untuk pautan WhatsApp
  const formattedPhone = order.phone_number.replace(/[^0-9]/g, "");
  const waPhone = formattedPhone.startsWith("0")
    ? `6${formattedPhone}`
    : formattedPhone;

  // Kemaskini Status Tempahan
  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      setCurrentStatus(newStatus);
      if (onStatusChange) {
        onStatusChange(order.id, newStatus);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengemaskini status";
      alert("Ralat: " + msg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-4">
      {/* Bahagian Atas: ID & Status */}
      <div className="flex justify-between items-start gap-2 border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              #{order.id}
            </span>
            <span className="text-xs text-gray-400">
              {order.pax_quantity || 0} Pax
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-800 mt-1">
            {order.customer_name}
          </h3>
        </div>

        {/* Status Tempahan & Selector */}
        <div className="text-right">
          <select
            disabled={updating}
            value={currentStatus}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none ${
              currentStatus === "BARU"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : currentStatus === "DISAHKAN"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : currentStatus === "DISEDIAKAN"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : currentStatus === "SELESAI"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            <option value="BARU">BARU / PENDING</option>
            <option value="DISAHKAN">DISAHKAN</option>
            <option value="DISEDIAKAN">DALAM PENYEDIAAN</option>
            <option value="SELESAI">SELESAI</option>
            <option value="BATAL">BATAL</option>
          </select>
        </div>
      </div>

      {/* Maklumat Tarikh & Lokasi */}
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span className="font-semibold text-gray-800">
            {order.event_date || "Tiada Tarikh"}
          </span>
          {order.event_time && (
            <span className="text-gray-400">({order.event_time})</span>
          )}
        </div>

        <div className="flex items-start gap-2">
          <span>📍</span>
          <span className="text-gray-500 line-clamp-2">
            {order.delivery_address || "Tiada alamat penghantaran"}
          </span>
        </div>
      </div>

      {/* Senarai Item (order_items) */}
      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
          Menu & Item Tempahan
        </span>
        {order.order_items && order.order_items.length > 0 ? (
          <ul className="space-y-1">
            {order.order_items.map((item) => (
              <li
                key={item.id}
                className="text-xs text-gray-700 flex justify-between items-center"
              >
                <span>
                  • {item.item_description}{" "}
                  <span className="font-bold text-gray-400">
                    x{item.quantity}
                  </span>
                </span>
                <span className="text-[11px] font-semibold text-gray-500">
                  RM{" "}
                  {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400 italic">Tiada butiran item</p>
        )}
      </div>

      {/* Nota Tempahan */}
      {order.notes && (
        <div className="text-[11px] bg-amber-50/60 border border-amber-100 p-2 rounded-lg text-amber-900">
          <span className="font-bold">Nota:</span> {order.notes}
        </div>
      )}

      {/* Ringkasan Bayaran */}
      <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
        <div>
          <span className="text-gray-400 block text-[10px]">
            Jumlah Deposit
          </span>
          <span className="font-bold text-green-600">
            RM {depositPaid.toFixed(2)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-gray-400 block text-[10px]">
            Jumlah Keseluruhan
          </span>
          <span className="font-extrabold text-gray-800 text-sm">
            RM {totalPrice.toFixed(2)}
          </span>
          <span
            className={`block text-[10px] font-bold ${
              balance > 0 ? "text-red-500" : "text-green-600"
            }`}
          >
            {balance > 0 ? `Baki: RM ${balance.toFixed(2)}` : "LULUS / SELESAI"}
          </span>
        </div>
      </div>

      {/* Pautan Akses Pantas (WhatsApp) */}
      <div className="pt-2 flex gap-2">
        <a
          href={`https://wa.me/${waPhone}?text=Salam%20${encodeURIComponent(
            order.customer_name,
          )},%20berkenaan%20tempahan%20WakMan%20Catering%20%23${order.id}...`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-center py-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
        >
          <span>💬</span>
          <span>Hubungi WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
