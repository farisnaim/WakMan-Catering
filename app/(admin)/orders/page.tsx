"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface QuotationItem {
  id: string;
  item_name: string;
  qty: number;
  unit_price: number;
}

interface Customer {
  id: number;
  customer_name: string;
  customer_phone: string;
  address1?: string;
  address2?: string;
}

interface Order {
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
  customers?: Customer | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("id, customer_name, customer_phone, address1, address2");

      if (customersError) {
        console.error("Ralat mengambil customers:", customersError.message);
      }

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

      if (ordersData) {
        const customerMap = new Map<number, Customer>();
        (customersData || []).forEach((c) => customerMap.set(c.id, c));

        const mergedOrders: Order[] = ordersData.map((order) => ({
          ...order,
          customers: customerMap.get(order.customer_id) || null,
        }));

        setOrders(mergedOrders);
      }
    } catch (err: any) {
      console.error("Ralat tidak dijangka:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Hantar Pautan Quotation Awam via WhatsApp
  const handleSendWhatsAppLink = (order: Order) => {
    if (!order.customers?.customer_phone) {
      alert("Nombor telefon pelanggan tidak ditemui!");
      return;
    }

    let phone = order.customers.customer_phone.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) {
      phone = "6" + phone;
    }

    const orderNo = `#ORD-${order.id.toString().padStart(4, "0")}`;
    const customerName = order.customers.customer_name || "Pelanggan";
    const totalPrice = Number(
      order.total_price || order.quotation_data?.total_price || 0,
    ).toFixed(2);

    // Binaan URL Awam untuk Quotation
    const quoteUrl = `${window.location.origin}/quote/${order.id}`;

    const message = `Salam & Salam Sejahtera *${customerName}*,

Berikut disediakan pautan rasmi *SEBUT HARGA / QUOTATION* bagi tempahan anda (${orderNo}):

💰 *Anggaran Jumlah: RM ${totalPrice}*
🔗 *Pautan Sebut Harga:* ${quoteUrl}

Anda boleh menekan pautan di atas untuk melihat maklumat terperinci serta memuat turun / mencetak dokumen sebut harga dalam bentuk PDF.

Terima kasih! 🙏🏼`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg uppercase">
            Completed
          </span>
        );
      case "processing":
        return (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-lg uppercase">
            Processing
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg uppercase">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg uppercase">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Senarai Tempahan
          </h1>
          <p className="text-xs text-slate-500">
            Urus tempahan pelanggan dan bina sebut harga.
          </p>
        </div>
        <Link
          href="/orders/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          + Tempahan Baharu
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs font-bold text-slate-400 animate-pulse">
          Memuatkan tempahan...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">
            Tiada tempahan ditemui
          </p>
          <p className="text-xs text-slate-400">
            Mulakan dengan menambah tempahan baharu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => {
            const hasQuotation =
              order.quotation_data?.items &&
              order.quotation_data.items.length > 0;

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 hover:border-blue-400 transition rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      #ORD-{order.id.toString().padStart(4, "0")}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <div>
                    <h2 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                      {order.customers?.customer_name || "Pelanggan Tanpa Nama"}
                    </h2>
                    <p className="text-xs font-mono text-slate-500">
                      📱 {order.customers?.customer_phone || "-"}
                    </p>
                  </div>

                  {order.event_date && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-[11px] font-medium text-slate-600 border border-slate-100">
                      <span className="text-slate-400">Tarikh Majlis:</span>
                      <span className="font-bold font-mono text-slate-800">
                        {order.event_date}
                      </span>
                    </div>
                  )}

                  {/* Paparan Senarai Itemized vs Teks Asal */}
                  {hasQuotation ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 flex justify-between">
                        <span>Item Terklasifikasi</span>
                        <span>Jumlah</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {order.quotation_data?.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-start text-xs text-slate-700"
                          >
                            <span className="line-clamp-1 pr-2 font-medium">
                              • {item.item_name}{" "}
                              <span className="text-[10px] text-slate-400 font-mono">
                                (x{item.qty})
                              </span>
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900 shrink-0">
                              RM {(item.qty * item.unit_price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
                        <span>JUMLAH:</span>
                        <span className="font-mono text-blue-700 text-sm">
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
                    <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans">
                      {order.order_details || "Tiada perincian dimasukkan."}
                    </div>
                  )}
                </div>

                {/* Butang Tindakan */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSendWhatsAppLink(order)}
                    title="Hantar Pautan Quotation via WhatsApp"
                    className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>💬</span>
                    <span>Hantar Link</span>
                  </button>

                  <Link
                    href={`/quote/${order.id}`}
                    target="_blank"
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition text-center"
                    title="Lihat Paparan Quotation"
                  >
                    👁️
                  </Link>

                  <Link
                    href={`/orders/${order.id}`}
                    className="py-1.5 px-3 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition text-center"
                  >
                    {hasQuotation ? "Edit →" : "Itemize →"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
