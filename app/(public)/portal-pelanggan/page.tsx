"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface CustomerProfile {
  id: number;
  customer_name: string;
  customer_phone: string;
  address1: string | null;
  address2: string | null;
}

interface UserInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string | null;
  status: string;
  total_amount: number;
  slug?: string;
}

export default function CustomerPortalPage() {
  const [phoneSearch, setPhoneSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [invoices, setInvoices] = useState<UserInvoice[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSearch.trim()) return;

    setSearching(true);
    setSearchError(null);
    setCustomer(null);
    setInvoices([]);
    setHasSearched(true);

    try {
      const cleanedPhone = phoneSearch.trim();

      const { data: customerData, error: custError } = await supabase
        .from("customers")
        .select("id, customer_name, customer_phone, address1, address2")
        .ilike("customer_phone", `%${cleanedPhone}%`)
        .maybeSingle();

      if (custError) throw custError;

      if (!customerData) {
        setSearchError(
          "Tiada rekod tempahan dijumpai untuk nombor telefon ini. Sila pastikan nombor telefon adalah betul.",
        );
        return;
      }

      setCustomer(customerData);

      const { data: invoiceData, error: invError } = await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date, status, total_amount, slug")
        .eq("customer_id", customerData.id)
        .order("created_at", { ascending: false });

      if (invError) throw invError;

      setInvoices(invoiceData || []);
    } catch (err: any) {
      console.error("Ralat carian invois:", err);
      setSearchError("Gagal membuat carian. Sila cuba sekali lagi.");
    } finally {
      setSearching(false);
    }
  };

  const formatRM = (val: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(val || 0);
  };

  const getStatusBadge = (st: string) => {
    switch (st?.toLowerCase()) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "partial":
      case "partially_paid":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Portal Pelanggan
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Semakan Invois & Rekod Tempahan
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Masukkan nombor telefon yang didaftarkan semasa membuat tempahan untuk
          melihat senarai invois dan status bayaran anda.
        </p>
      </div>

      {/* SEARCH CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        <form
          onSubmit={handleSearchInvoice}
          className="max-w-md mx-auto space-y-3"
        >
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Nombor Telefon Pelanggan
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Contoh: 0103068294"
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl text-xs font-mono font-bold text-white focus:outline-none placeholder:text-slate-600 transition"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-950 font-bold text-xs rounded-2xl shadow-md shadow-amber-500/10 shrink-0 transition"
            >
              {searching ? "Cari..." : "Cari Invois"}
            </button>
          </div>
        </form>

        {searchError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400 text-center font-medium">
            {searchError}
          </div>
        )}

        {customer && (
          <div className="space-y-6 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Profil Pelanggan
              </span>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {customer.customer_name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    {customer.customer_phone}
                  </p>
                </div>
                {(customer.address1 || customer.address2) && (
                  <p className="text-xs text-slate-400 max-w-xs sm:text-right">
                    {customer.address1}
                    {customer.address2 ? `, ${customer.address2}` : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Senarai Invois ({invoices.length})
              </h4>

              {invoices.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 bg-slate-950 rounded-2xl border border-slate-800/50">
                  Tiada invois dijumpai untuk akaun ini.
                </p>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="p-4">No. Invois</th>
                        <th className="p-4">Tarikh</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Jumlah</th>
                        <th className="p-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {invoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-900/50 transition"
                        >
                          <td className="p-4 font-mono font-bold text-amber-400">
                            {inv.invoice_number}
                          </td>
                          <td className="p-4 text-slate-400">
                            {inv.invoice_date || "-"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getStatusBadge(
                                inv.status,
                              )}`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-white">
                            {formatRM(Number(inv.total_amount))}
                          </td>
                          <td className="p-4 text-center">
                            <Link
                              href={`/inv/${inv.slug || inv.invoice_number}`}
                              className="inline-block px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/20 font-bold text-[11px] rounded-xl transition"
                            >
                              Lihat →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
