"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";

// Import komponen kalendar secara dynamic tanpa SSR
const CalendarClient = dynamic(() => import("@/components/CalendarClient"), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex flex-col items-center justify-center space-y-3 text-slate-400">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium">Memuatkan Kalendar Majlis...</span>
    </div>
  ),
});

const MAX_DAILY_ORDERS = 3;

interface OrderData {
  id: number;
  customer_id: number | null;
  event_date: string | null;
  items_data: any;
  order_number?: string | null;
  status?: string | null;
  total_price?: number | null;
  customers: {
    customer_name: string;
    customer_phone: string;
  } | null;
}

export default function CalendarPage() {
  const [ordersByDate, setOrdersByDate] = useState<{
    [date: string]: OrderData[];
  }>({});
  const [selectedDateModal, setSelectedDateModal] = useState<{
    dateStr: string;
    orders: OrderData[];
  } | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] =
    useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase.from("orders").select(`
        id,
        customer_id,
        event_date,
        items_data,
        order_number,
        status,
        total_price,
        customers!orders_customer_id_fkey (
          customer_name,
          customer_phone
        )
      `);

    if (error) {
      console.error("Ralat mengambil tempahan:", error.message, error.details);
      setLoading(false);
      return;
    }

    const grouped: { [date: string]: OrderData[] } = {};
    (data || []).forEach((order: any) => {
      if (order.event_date) {
        const dateStr = order.event_date.split("T")[0];
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(order);
      }
    });

    setOrdersByDate(grouped);
    setLoading(false);
  };

  // Fungsi susunan UI mesra pengguna untuk items_data
  const renderItemsData = (items: any) => {
    if (!items) {
      return (
        <div className="py-3 text-center text-slate-400 italic text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Tiada butiran menu direkodkan.
        </div>
      );
    }

    let parsedItems = items;

    if (typeof items === "string") {
      try {
        parsedItems = JSON.parse(items);
      } catch (e) {
        return (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium leading-relaxed">
            {items}
          </div>
        );
      }
    }

    if (Array.isArray(parsedItems)) {
      if (parsedItems.length === 0) {
        return <p className="text-xs text-slate-400 italic">Senarai kosong.</p>;
      }

      return (
        <div className="grid grid-cols-1 gap-2">
          {parsedItems.map((item: any, i: number) => {
            const isObject = typeof item === "object" && item !== null;
            const name = isObject
              ? item.name ||
                item.title ||
                item.item_name ||
                item.description ||
                "Item Makanan"
              : String(item);
            const qty = isObject
              ? item.quantity || item.qty || item.count
              : null;
            const price = isObject ? item.price || item.unit_price : null;
            const category = isObject ? item.category || item.type : null;
            const notes = isObject ? item.notes || item.remark : null;

            return (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-200 rounded-xl transition-all duration-150 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    🍗
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-slate-800 text-xs truncate">
                        {name}
                      </p>
                      {category && (
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                          {category}
                        </span>
                      )}
                    </div>
                    {notes && (
                      <p className="text-[10px] text-slate-400 truncate">
                        Nota: {notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {price && (
                    <span className="text-xs font-mono font-medium text-slate-600">
                      RM {Number(price).toFixed(2)}
                    </span>
                  )}
                  {qty && (
                    <span className="bg-amber-500 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                      x{qty}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (typeof parsedItems === "object" && parsedItems !== null) {
      return (
        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          {Object.entries(parsedItems).map(([key, value], idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-1 border-b border-slate-100 last:border-none"
            >
              <span className="font-medium text-slate-500 capitalize">
                {key.replace(/_/g, " ")}:
              </span>
              <span className="font-semibold text-slate-800 font-mono">
                {typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const renderDayCell = (dayInfo: any) => {
    const dateObj = dayInfo.date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const dayOrders = ordersByDate[dateStr] || [];
    const count = dayOrders.length;
    const isFull = count >= MAX_DAILY_ORDERS;

    return (
      <div className="flex flex-col h-full justify-between p-1.5 overflow-hidden min-h-[105px]">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 text-xs">
            {dayInfo.dayNumberText}
          </span>
          {count > 0 && (
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs ${
                isFull
                  ? "bg-rose-500 text-white"
                  : "bg-amber-100 text-amber-900 border border-amber-300"
              }`}
            >
              {isFull ? `PENUH (${count})` : `${count} Slot`}
            </span>
          )}
        </div>

        <div className="mt-1 space-y-1 overflow-y-auto max-h-[75px] scrollbar-none">
          {dayOrders.map((ord) => {
            let badgeStyle =
              "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100";
            if (ord.status === "confirmed")
              badgeStyle =
                "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100";
            if (ord.status === "completed")
              badgeStyle =
                "bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100";

            return (
              <div
                key={ord.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrderDetails(ord);
                }}
                className={`text-[10px] p-1.5 rounded-lg border leading-snug cursor-pointer transition-all duration-150 shadow-2xs ${badgeStyle}`}
              >
                <div className="font-semibold truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  {ord.customers?.customer_name || `ID: ${ord.customer_id}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleDateClick = (arg: any) => {
    const dayOrders = ordersByDate[arg.dateStr] || [];
    setSelectedDateModal({
      dateStr: arg.dateStr,
      orders: dayOrders,
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Kalendar Majlis & Kapasiti Dapur
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau tempahan slot harian dan butiran menu pelanggan.
          </p>
        </div>

        {/* Petunjuk Status */}
        <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Baru</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Disahkan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Selesai</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">
            Memuatkan Kalendar Majlis...
          </span>
        </div>
      ) : (
        <div className="calendar-container">
          <CalendarClient
            dateClick={handleDateClick}
            dayCellContent={renderDayCell}
          />
        </div>
      )}

      {/* MODAL 1: Senarai Tempahan Mengikut Tarikh */}
      {selectedDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Ringkasan Harian
                </span>
                <h3 className="font-extrabold text-xl text-slate-800">
                  {selectedDateModal.dateStr}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDateModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {selectedDateModal.orders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Tiada tempahan didaftarkan untuk tarikh ini.
                </div>
              ) : (
                selectedDateModal.orders.map((ord, idx) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 hover:border-amber-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>
                          <h4 className="font-bold text-base text-slate-800">
                            {ord.customers?.customer_name ||
                              `Pelanggan (ID: ${ord.customer_id})`}
                          </h4>
                        </div>
                        {ord.customers?.customer_phone && (
                          <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1">
                            <span>📞</span> {ord.customers.customer_phone}
                          </p>
                        )}
                      </div>
                      {ord.status && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {ord.status}
                        </span>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Menu & Pesanan
                      </p>
                      {renderItemsData(ord.items_data)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex items-center justify-end border-t border-slate-100">
              <button
                onClick={() => setSelectedDateModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Butiran Tempahan Ringkas */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Butiran Tempahan
                </span>
                <h3 className="font-extrabold text-lg text-slate-800">
                  {selectedOrderDetails.customers?.customer_name || "Pelanggan"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Tarikh Majlis
                  </span>
                  <span className="font-semibold text-slate-700">
                    {selectedOrderDetails.event_date}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    No. Telefon
                  </span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {selectedOrderDetails.customers?.customer_phone || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">
                  Senarai Pesanan (Items):
                </span>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  {renderItemsData(selectedOrderDetails.items_data)}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
