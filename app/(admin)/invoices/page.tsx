"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Customer {
  customer_name: string;
  customer_phone: string;
}

interface InvoiceData {
  id: number;
  slug?: string;
  order_id: number | null;
  customer_id: number;
  invoice_number: string;
  invoice_date: string | null;
  due_date: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  customers: Customer | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // State untuk Modal Tukar Status
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(
    null,
  );
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (invoiceError) {
        console.error("Ralat memuatkan invois:", invoiceError.message);
        setInvoices([]);
        return;
      }

      if (invoiceData && invoiceData.length > 0) {
        const customerIds = Array.from(
          new Set(
            invoiceData
              .map((inv) => inv.customer_id)
              .filter((id) => id !== null && id !== undefined),
          ),
        );

        let customerMap: Record<number, Customer> = {};

        if (customerIds.length > 0) {
          const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .select("*")
            .in("id", customerIds);

          if (!customerError && customerData) {
            customerData.forEach((cust: any) => {
              customerMap[cust.id] = {
                customer_name:
                  cust.customer_name ||
                  cust.name ||
                  cust.full_name ||
                  "Pelanggan",
                customer_phone:
                  cust.customer_phone || cust.phone || cust.phone_number || "",
              };
            });
          }
        }

        const formattedInvoices: InvoiceData[] = invoiceData.map(
          (inv: any) => ({
            ...inv,
            customers: inv.customer_id
              ? customerMap[inv.customer_id] || null
              : null,
          }),
        );

        setInvoices(formattedInvoices);
      } else {
        setInvoices([]);
      }
    } catch (err: any) {
      console.error("Ralat sistem:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const formatRM = (val: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "partial":
      case "partially_paid":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "unpaid":
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "overdue":
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Fungsi Hantar Whatsapp
  const handleSendWhatsapp = (inv: InvoiceData) => {
    const rawPhone = inv.customers?.customer_phone || "";
    let cleanPhone = rawPhone.replace(/[^0-9]/g, "");

    if (cleanPhone.startsWith("0")) {
      cleanPhone = "6" + cleanPhone;
    }

    if (!cleanPhone) {
      alert("Nombor telefon pelanggan tidak sah atau tiada.");
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const invoiceUrl = `${origin}/inv/${inv.slug || inv.id}`;
    const qrUrl = `${origin}/qr-duitnow-template.png`;

    const message = `Assalamualaikum dan Salam Sejahtera \nTuan/Puan *${inv.customers?.customer_name || "Pelanggan"}*,\n\nInvois anda *#${
      inv.invoice_number || inv.id
    }* telah diterbitkan.\n\n*JUMLAH PERLU DIBAYAR:* ${formatRM(
      Number(inv.total_amount),
    )}\n\nUntuk melihat invois secara penuh, Tuan Puan boleh rujuk pautan di bawah:\n\n📄 *Lihat Invois Penuh:* ${invoiceUrl}\n\n📱 *Paparan QR DuitNow:* ${qrUrl}\n\nSila buat bayaran sebelum tarikh yang ditetapkan. Terima kasih!
    
    _*WakMan, sedap bagitahu kawan, tak sedap bagitahu kami.🤙*_
    
    *Ingat Catering, Ingat WakMan Catering*`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      message,
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  // Fungsi Kemaskini Status Bayaran
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedInvoice) return;
    setUpdatingStatus(true);

    const { error } = await supabase
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", selectedInvoice.id);

    setUpdatingStatus(false);
    if (!error) {
      setInvoices((prev) =>
        prev.map((item) =>
          item.id === selectedInvoice.id
            ? { ...item, status: newStatus }
            : item,
        ),
      );
      setIsStatusModalOpen(false);
      setSelectedInvoice(null);
    } else {
      alert("Gagal mengemaskini status: " + error.message);
    }
  };

  // Fungsi Padam Invois (Diperbaiki & Semak Ralat Database)
  const handleDeleteInvoice = async (inv: InvoiceData) => {
    const confirmed = window.confirm(
      `Adakah anda pasti mahu memadam invois #${inv.invoice_number || inv.id}? Tindakan ini tidak boleh dibatalkan.`,
    );

    if (!confirmed) return;

    try {
      // 1. Padam rekod anak dalam jadual invoice_items (jika ada)
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", inv.id);

      if (itemsError) {
        alert("Gagal memadam item invois: " + itemsError.message);
        return;
      }

      // 2. Padam invois daripada jadual invoices
      const { error: invoiceError } = await supabase
        .from("invoices")
        .delete()
        .eq("id", inv.id);

      if (invoiceError) {
        alert(
          "Gagal memadam invois daripada pangkalan data: " +
            invoiceError.message,
        );
        return;
      }

      // 3. Kemaskini state tempatan hanya selepas sah dipadam di Supabase
      setInvoices((prev) => prev.filter((item) => item.id !== inv.id));
      alert("Invois berjaya dipadamkan.");
    } catch (err: any) {
      alert("Ralat memadam invois: " + (err.message || err));
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const custName = inv.customers?.customer_name || "";
    const custPhone = inv.customers?.customer_phone || "";
    const invNum = inv.invoice_number || "";

    const matchesSearch =
      invNum.toLowerCase().includes(search.toLowerCase()) ||
      custName.toLowerCase().includes(search.toLowerCase()) ||
      custPhone.includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      inv.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Senarai Invois</h1>
          <p className="text-xs text-slate-500">
            Pengurusan penerbitan invois, rekod bayaran, dan penjejakan
            tunggakan.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/invoices/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
          >
            + Invois Baharu
          </Link>
        </div>
      </div>

      {/* Bahagian Filter & Carian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <input
          type="text"
          placeholder="Cari no. invois, nama pelanggan, atau phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl text-xs w-full sm:w-80 focus:outline-none focus:border-blue-600 bg-slate-50/50"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 shrink-0">
            Status Bayaran:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:border-blue-600 w-full sm:w-auto font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Jadual Senarai Invois */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400 animate-pulse">
          Sedang memuatkan data invois...
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-xs text-slate-400">
          Tiada rekod invois dijumpai.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">No. Invois</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Tarikh Invois</th>
                  <th className="p-4 text-right">Jumlah (RM)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono font-bold text-blue-600">
                      {inv.invoice_number || `#INV-${inv.id}`}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">
                        {inv.customers?.customer_name || "Pelanggan Tanpa Nama"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {inv.customers?.customer_phone || "-"}
                      </p>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {inv.invoice_date || "-"}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      {formatRM(Number(inv.total_amount))}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase ${getStatusBadge(
                          inv.status,
                        )}`}
                      >
                        {inv.status || "unpaid"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/inv/${inv.slug || inv.id}`}
                          target="_blank"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition"
                          title="Lihat Invois Penuh"
                        >
                          👁️ Lihat
                        </Link>

                        <button
                          onClick={() => handleSendWhatsapp(inv)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-200 rounded-lg transition cursor-pointer"
                          title="Hantar WhatsApp ke Pelanggan"
                        >
                          💬 Hantar
                        </button>

                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsStatusModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] border border-blue-200 rounded-lg transition cursor-pointer"
                          title="Kemaskini Status Bayaran"
                        >
                          ⚙️ Status
                        </button>

                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200 rounded-lg transition cursor-pointer"
                          title="Padam Invois"
                        >
                          🗑️ Padam
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Kemaskini Status */}
      {isStatusModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Kemaskini Status Invois #
              {selectedInvoice.invoice_number || selectedInvoice.id}
            </h3>
            <p className="text-xs text-slate-500">
              Pilih status pembayaran baharu untuk invois ini:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                disabled={updatingStatus}
                onClick={() => handleUpdateStatus("paid")}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs transition cursor-pointer text-center"
              >
                ✅ Paid
              </button>
              <button
                disabled={updatingStatus}
                onClick={() => handleUpdateStatus("unpaid")}
                className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-bold text-xs transition cursor-pointer text-center"
              >
                ⏳ Unpaid
              </button>
              <button
                disabled={updatingStatus}
                onClick={() => handleUpdateStatus("partial")}
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs transition cursor-pointer text-center"
              >
                🔹 Partial
              </button>
              <button
                disabled={updatingStatus}
                onClick={() => handleUpdateStatus("cancelled")}
                className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition cursor-pointer text-center"
              >
                🚫 Cancelled
              </button>
            </div>

            <button
              onClick={() => {
                setIsStatusModalOpen(false);
                setSelectedInvoice(null);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer mt-2"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
