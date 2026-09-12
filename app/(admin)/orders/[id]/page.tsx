"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface QuotationItem {
  id: string;
  item_name: string;
  qty: number;
  unit_price: number;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState("pending");

  // State Itemize & Pricing
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [depositPaid, setDepositPaid] = useState<number>(0);
  const [notes, setNotes] = useState(
    "Terima kasih atas tempahan anda. Sebarang pertanyaan sila hubungi pihak kami. Harga dan ketetapan quotation ini hanya terpakai untuk 30 hari sahaja dari tarikh sebut harga dikeluarkan.",
  );

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    setLoading(true);

    // Fetch order & customers secara terasing untuk mengelakkan ralat Foreign Key
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!orderError && orderData) {
      let customerData = null;
      if (orderData.customer_id) {
        const { data: custRes } = await supabase
          .from("customers")
          .select("*")
          .eq("id", orderData.customer_id)
          .single();
        customerData = custRes;
      }

      const fullOrder = { ...orderData, customers: customerData };
      setOrder(fullOrder);
      setStatus(fullOrder.status || "pending");
      setDepositPaid(Number(fullOrder.deposit_paid || 0));

      // Ekstrak items daripada pelbagai keutamaan medan lajur
      const rawItems =
        fullOrder.items_data ||
        fullOrder.items ||
        fullOrder.quotation_data?.items;

      if (rawItems) {
        let parsed = rawItems;
        if (typeof rawItems === "string") {
          try {
            parsed = JSON.parse(rawItems);
          } catch (e) {
            parsed = [];
          }
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(
            parsed.map((it: any, idx: number) => ({
              id: it.id || Date.now().toString() + idx,
              item_name: it.item_name || it.name || it.description || "",
              qty: Number(it.qty || it.quantity || 1),
              unit_price: Number(it.unit_price || it.price || 0),
            })),
          );
        } else if (fullOrder.order_details) {
          autoClassifyText(fullOrder.order_details);
        }
      } else if (fullOrder.order_details) {
        autoClassifyText(fullOrder.order_details);
      }

      if (fullOrder.quotation_data?.notes) {
        setNotes(fullOrder.quotation_data.notes);
      }
    }

    setLoading(false);
  };

  const autoClassifyText = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    const autoItems: QuotationItem[] = lines.map((line, idx) => ({
      id: Date.now().toString() + idx,
      item_name: line.replace(/^[-*•]\s*/, "").trim(),
      qty: 1,
      unit_price: 0,
    }));

    if (autoItems.length > 0) {
      setItems(autoItems);
    } else {
      setItems([
        { id: "1", item_name: "Pakej Katering / Menu", qty: 1, unit_price: 0 },
      ]);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), item_name: "", qty: 1, unit_price: 0 },
    ]);
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (acc, curr) => acc + Number(curr.qty || 0) * Number(curr.unit_price || 0),
      0,
    );
  };

  const handleSaveQuotation = async () => {
    setSaving(true);
    const totalCalc = calculateSubtotal();

    const quotationPayload = {
      items,
      notes,
      total_price: totalCalc,
    };

    // Hanya guna nama lajur yang sah di Supabase: deposit_paid, total_price, items_data
    const updatePayload: any = {
      status: status,
      total_price: totalCalc,
      deposit_paid: depositPaid,
      items_data: items,
      quotation_data: quotationPayload,
    };

    const { error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    setSaving(false);
    if (!error) {
      router.push("/orders");
      router.refresh();
    } else {
      alert("Ralat menyimpan: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">
        Memuatkan perincian tempahan...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-sm font-bold text-slate-700">
          Tempahan tidak ditemui.
        </p>
        <Link
          href="/orders"
          className="text-xs font-bold text-blue-600 underline"
        >
          Kembali ke senarai tempahan
        </Link>
      </div>
    );
  }

  const custName =
    order.customers?.customer_name ||
    order.customers?.name ||
    order.customers?.full_name ||
    "Pelanggan Tanpa Nama";

  const custPhone =
    order.customers?.customer_phone ||
    order.customers?.phone ||
    order.customers?.phone_number ||
    "-";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">
              Tempahan #
              {order.order_number || order.order_no || `#ORD-${order.id}`}
            </h1>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs font-bold px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing / Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Didaftarkan pada:{" "}
            {order.created_at
              ? new Date(order.created_at).toLocaleString("ms-MY")
              : "-"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            ← Batal
          </Link>
          <button
            onClick={handleSaveQuotation}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            {saving ? "Sedang Menyimpan..." : "Simpan Quotation & Order"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Maklumat Asal Tempahan */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Maklumat Pelanggan
            </h2>
            <div className="space-y-2">
              <p className="text-base font-black text-slate-900">{custName}</p>
              <p className="text-xs font-mono text-blue-600 font-bold">
                📱 {custPhone}
              </p>
              {(order.customers?.address1 || order.customers?.address) && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  📍 {order.customers?.address1 || order.customers?.address}{" "}
                  {order.customers?.address2 || ""}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Teks Perbualan / Nota Asal
            </h2>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
              {order.order_details || order.details || "Tiada teks perincian."}
            </div>
            {(order.event_date || order.tarikh_majlis) && (
              <div className="text-xs font-medium text-slate-600">
                Tarikh Majlis:{" "}
                <span className="font-bold font-mono">
                  {order.event_date || order.tarikh_majlis}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pembina Quotation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Itemisasi & Penetapan Harga (Quotation)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Kelaskan pesanan kepada item khusus dan letakkan sebut harga
                  unit.
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
              >
                + Tambah Item
              </button>
            </div>

            {/* Senarai Item */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 border border-slate-200 rounded-xl"
                >
                  <div className="col-span-6 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      Perincian Menu / Item #{index + 1}
                    </label>
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) =>
                        updateItem(item.id, "item_name", e.target.value)
                      }
                      placeholder="Nama menu / Servis"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      Kuantiti
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) =>
                        updateItem(item.id, "qty", Number(e.target.value))
                      }
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      Harga Unit (RM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "unit_price",
                          Number(e.target.value),
                        )
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-right focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="col-span-1 text-center pt-4">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-rose-500 hover:text-rose-700 font-bold text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Deposit Paid Input */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Rekod Deposit / Bayaran Pendahuluan (RM)
              </label>
              <input
                type="number"
                step="0.01"
                value={depositPaid}
                onChange={(e) => setDepositPaid(Number(e.target.value))}
                placeholder="0.00"
                className="w-full md:w-1/2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Ringkasan Sebut Harga */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="flex justify-between items-center text-sm font-black text-slate-900 bg-slate-100 p-4 rounded-xl">
                <span>JUMLAH SEBUT HARGA (ESTIMATED TOTAL):</span>
                <span className="font-mono text-lg text-blue-700">
                  RM {calculateSubtotal().toFixed(2)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Nota / Terma Quotation
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
