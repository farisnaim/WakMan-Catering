"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface CustomerDetails {
  id: number;
  customer_name: string;
  customer_phone: string;
  address1: string | null;
  address2: string | null;
  created_at: string;
}

interface CustomerOrder {
  id: number;
  event_date: string | null;
  order_details: string | null;
  status: string;
  total_price: number;
  deposit_paid: number;
  created_at: string;
}

interface CustomerInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  balance_due: number;
  status: string;
  created_at: string;
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // 1. Dapatkan Data Pelanggan
      const { data: custData, error: custError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (custError) throw custError;
      setCustomer(custData);

      // 2. Dapatkan Senarai Tempahan Pelanggan
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // 3. Dapatkan Senarai Invois Pelanggan
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);
    } catch (err: any) {
      console.error("Ralat memuatkan data pelanggan:", err.message || err);
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
      case "completed":
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "partial":
      case "deposit_paid":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Kirim Mesej WhatsApp
  const handleWhatsApp = () => {
    if (!customer?.customer_phone) return;
    let cleanPhone = customer.customer_phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "60" + cleanPhone.slice(1);
    }
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 py-20">
        Sedang memuatkan maklumat pelanggan...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-xs text-slate-500">
          Pelanggan tidak dijumpai atau telah dipadam.
        </p>
        <Link
          href="/customers"
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          ← Kembali ke Senarai Pelanggan
        </Link>
      </div>
    );
  }

  // Pengiraan Ringkasan Statistik Pelanggan
  const totalSpent = orders.reduce(
    (sum, ord) => sum + (Number(ord.total_price) || 0),
    0,
  );

  // Logik baharu bagi pengiraan Baki Belum Berbayar mengikut status invois
  const totalBalanceDue = invoices.reduce((sum, inv) => {
    const status = inv.status?.toLowerCase() || "";

    if (status === "paid") {
      return sum + 0;
    } else if (status === "partial" || status === "deposit_paid") {
      return sum + (Number(inv.balance_due) || 0);
    } else if (status === "unpaid" || status === "pending") {
      return sum + (Number(inv.total_amount) || 0);
    }

    // Default fallback jika tiada status khusus
    return sum + (Number(inv.balance_due) || 0);
  }, 0);

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header & Butang Tindakan */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/customers"
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition"
            >
              ← Pelanggan
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-2xl font-black text-slate-900">
              {customer.customer_name}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mendaftar pada{" "}
            {new Date(customer.created_at).toLocaleDateString("ms-MY")}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
          >
            💬 Hubungi WhatsApp
          </button>
          <Link
            href="/orders/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            + Tempahan Baharu
          </Link>
        </div>
      </div>

      {/* Profil Pelanggan & Statistik Ringkas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kad Maklumat Diri */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Maklumat Profil
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Nama Pelanggan
              </p>
              <p className="font-bold text-slate-800">
                {customer.customer_name}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                No. Telefon / WhatsApp
              </p>
              <p className="font-mono font-bold text-blue-600">
                {customer.customer_phone}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Alamat
              </p>
              <p className="text-slate-700 leading-relaxed">
                {customer.address1 || "Tiada alamat utama"}
                {customer.address2 ? `, ${customer.address2}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Ringkasan Nilai Tempahan & Hutang */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Jumlah Tempahan
            </p>
            <div>
              <p className="text-2xl font-black text-slate-900">
                {orders.length}
              </p>
              <p className="text-[10px] text-slate-500">
                Rekod perkhidmatan dibuat
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Nilai Komitmen
            </p>
            <div>
              <p className="text-2xl font-black text-blue-600">
                {formatRM(totalSpent)}
              </p>
              <p className="text-[10px] text-slate-500">
                Keseluruhan nilai tempahan
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Baki Belum Berbayar
            </p>
            <div>
              <p
                className={`text-2xl font-black ${
                  totalBalanceDue > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatRM(totalBalanceDue)}
              </p>
              <p className="text-[10px] text-slate-500">
                Tunggakan dari invois
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Jadual 1: Senarai Tempahan (Orders) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 text-sm">
          Sejarah Tempahan ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Pelanggan ini belum membuat sebarang tempahan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Tarikh Majlis</th>
                  <th className="pb-2">Butiran Tempahan</th>
                  <th className="pb-2 text-right">Jumlah (RM)</th>
                  <th className="pb-2 text-right">Deposit (RM)</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono text-slate-600">
                      {ord.event_date || "-"}
                    </td>
                    <td className="py-3 max-w-xs truncate text-slate-800">
                      {ord.order_details || "Tiada perincian"}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {formatRM(ord.total_price)}
                    </td>
                    <td className="py-3 text-right font-mono text-emerald-600 font-semibold">
                      {formatRM(ord.deposit_paid)}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getStatusBadge(
                          ord.status,
                        )}`}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Jadual 2: Senarai Invois (Invoices) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 text-sm">
          Sejarah Invois ({invoices.length})
        </h2>

        {invoices.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Tiada invois dikeluarkan untuk pelanggan ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">No. Invois</th>
                  <th className="pb-2">Tarikh Invois</th>
                  <th className="pb-2 text-right">Jumlah Invois</th>
                  <th className="pb-2 text-right">Baki Terhutang</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-blue-600">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 text-slate-500 font-mono">
                      {inv.invoice_date || "-"}
                    </td>
                    <td className="py-3 text-right font-mono font-bold">
                      {formatRM(inv.total_amount)}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-rose-600">
                      {formatRM(
                        inv.status?.toLowerCase() === "paid"
                          ? 0
                          : inv.status?.toLowerCase() === "unpaid" ||
                              inv.status?.toLowerCase() === "pending"
                            ? inv.total_amount
                            : inv.balance_due,
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getStatusBadge(
                          inv.status,
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
