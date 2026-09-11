"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import KanbanBoard from "@/components/KanbanBoard";
import { Order } from "@/components/KanbanCard";

interface Customer {
  id: number;
  customer_name: string;
  customer_phone: string;
  address1?: string;
}

export default function KanbanBoardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 1. Tarik senarai pelanggan secara berasingan
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("id, customer_name, customer_phone, address1");

      if (customersError) {
        console.error("Ralat mengambil customers:", customersError.message);
      }

      // 2. Tarik senarai orders tanpa kueri join
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, customer_id, event_date, order_details, status, total_price, quotation_data, created_at",
        )
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Ralat mengambil orders:", ordersError.message);
        setLoading(false);
        return;
      }

      // 3. Gabungkan data pelanggan ke dalam order secara manual
      if (ordersData) {
        const customerMap = new Map<number, Customer>();
        (customersData || []).forEach((c) => customerMap.set(c.id, c));

        const mergedOrders: Order[] = ordersData.map((order) => ({
          ...order,
          customers: customerMap.get(order.customer_id) || null,
        })) as unknown as Order[];

        setOrders(mergedOrders);
      }
    } catch (err: any) {
      console.error("Ralat tidak dijangka:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert("Gagal mengemaskini status: " + error.message);
      fetchOrders(); // Revert jika ralat
    }
    setUpdatingId(null);
  };

  const handleSendWhatsApp = (order: Order) => {
    if (!order.customers?.customer_phone) return;

    let phone = order.customers.customer_phone.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "6" + phone;

    const items = order.quotation_data?.items || [];
    const totalPrice = (
      order.total_price ||
      order.quotation_data?.total_price ||
      0
    ).toFixed(2);

    let itemListText = "";
    if (items.length > 0) {
      itemListText = items
        .map(
          (i) =>
            `• *${i.item_name}* (x${i.qty}) - RM ${(i.qty * i.unit_price).toFixed(2)}`,
        )
        .join("\n");
    } else {
      itemListText = order.order_details || "Sila rujuk pihak kami.";
    }

    const message = `Salam *${order.customers.customer_name}*,\n\nBerikut adalah kemaskini status tempahan *#ORD-${order.id.toString().padStart(4, "0")}* [Status: *${order.status.toUpperCase()}*]:\n\n*Ringkasan Tempahan:*\n${itemListText}\n\n*Jumlah:* RM ${totalPrice}\n\nTerima kasih!`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Interactive Kanban Board
          </h1>
          <p className="text-xs text-slate-500">
            Tarik dan lepas (*Drag & Drop*) kad untuk kemaskini status tempahan
            secara terus.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
        >
          🔄 Refresh Board
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs font-bold text-slate-400 animate-pulse">
          Memuatkan Kanban Board...
        </div>
      ) : (
        <KanbanBoard
          initialOrders={orders}
          onStatusChange={handleStatusChange}
          onSendWhatsApp={handleSendWhatsApp}
          updatingId={updatingId}
        />
      )}
    </div>
  );
}
