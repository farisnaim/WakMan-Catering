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
  issue_date: string | null;
  status: string;
  total_amount: number;
}

export default function PublicLandingPage() {
  const [phoneSearch, setPhoneSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [invoices, setInvoices] = useState<UserInvoice[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // No WhatsApp Rasmi Wakman Catering
  const whatsappNumber = "60103068294";
  const defaultGreeting = encodeURIComponent(
    "Assalammualaikum Wakman Catering, saya berminat untuk bertanyakan maklumat berkaitan pakej tempahan catering.",
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultGreeting}`;

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSearch.trim()) return;

    setSearching(true);
    setSearchError(null);
    setCustomer(null);
    setInvoices([]);
    setHasSearched(true);

    try {
      // Clean phone input
      const cleanedPhone = phoneSearch.trim();

      // 1. Cari pelanggan berdasarkan nombor telefon
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

      // 2. Ambil senarai invois pelanggan ini
      const { data: invoiceData, error: invError } = await supabase
        .from("invoices")
        .select("id, invoice_number, issue_date, status, total_amount")
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-900 font-sans">
      {/* HEADER / NAVIGATION */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
              W
            </div>
            <div>
              <span className="font-black tracking-tight text-lg sm:text-xl text-white block leading-none">
                WAKMAN CATERING
              </span>
              <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">
                Sajian Katering Berkualiti
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <span>💬</span> Hubungi Kami
            </a>
            <Link
              href="/dashboard"
              className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition"
            >
              Log Masuk Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-20 pb-20">
        {/* HERO SECTION */}
        <section className="max-w-5xl mx-auto px-6 pt-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            ✨ Pakar Sajian Majlis & Kenduri Kahwin
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Citarasa Tradisi & <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              Perkhidmatan Katering Terbaik
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Menyediakan hidangan enak dan segar untuk sebarang majlis
            kesyukuran, perkahwinan, korporat, dan acara peribadi anda.
          </p>

          <div className="pt-2 flex justify-center">
            <a
              href="#semak-invois"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition"
            >
              Semak Invois Anda
            </a>
          </div>
        </section>

        {/* SECTION SEMAKAN INVOIS AWAM */}
        <section
          id="semak-invois"
          className="max-w-4xl mx-auto px-4 sm:px-6 scroll-mt-24"
        >
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Portal Pelanggan
              </span>
              <h2 className="text-2xl font-black text-white">
                Semakan Invois & Rekod Tempahan
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Masukkan nombor telefon yang didaftarkan semasa membuat tempahan
                untuk melihat senarai invois anda.
              </p>
            </div>

            {/* Borang Carian Nombor Telefon */}
            <form
              onSubmit={handleSearchInvoice}
              className="max-w-md mx-auto space-y-3"
            >
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

            {/* Mesej Ralat */}
            {searchError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400 text-center font-medium">
                {searchError}
              </div>
            )}

            {/* Keputusan Carian */}
            {customer && (
              <div className="space-y-6 pt-4 border-t border-slate-800/80">
                {/* Maklumat Profil Pelanggan */}
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

                {/* Jadual Invois */}
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
                                {inv.issue_date || "-"}
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
                                  href={`/inv/${inv.invoice_number}`}
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
        </section>

        {/* VIDEO & GALERI MAJLIS */}
        <section className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Galeri & Video
            </span>
            <h2 className="text-2xl font-black text-white">
              Suasana & Persediaan Majlis
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-video bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative flex items-center justify-center">
              <span className="text-xs text-slate-500 font-mono">
                [ Ruang Video Highlights Katering / YouTube Embed ]
              </span>
            </div>

            <div className="aspect-video bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative flex items-center justify-center">
              <span className="text-xs text-slate-500 font-mono">
                [ Ruang Video Dokumentasi Majlis / TikTok Embed ]
              </span>
            </div>
          </div>
        </section>

        {/* FEEDBACK & TESTIMONI PELANGGAN */}
        <section className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Maklum Balas
            </span>
            <h2 className="text-2xl font-black text-white">
              Apa Kata Pelanggan Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl space-y-4">
              <div className="flex text-amber-400 text-sm">★★★★★</div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "Lauk pauk semua sedap, gulai kawah memang padu! Tetamu majlis
                perkahwinan semua puji. Service Wakman Catering sangat cekap."
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <p className="text-xs font-bold text-white">Puan Faridah</p>
                <p className="text-[10px] text-slate-500">
                  Majlis Perkahwinan, Bandar Enstek
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl space-y-4">
              <div className="flex text-amber-400 text-sm">★★★★★</div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "Pilihan menu pelbagai dan tepat masa. Penghantaran siap set up
                perhiasan meja buffet yang kemas."
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <p className="text-xs font-bold text-white">Encik Hafiz</p>
                <p className="text-[10px] text-slate-500">
                  Majlis Akikah & Kesyukuran, Nilai
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl space-y-4">
              <div className="flex text-amber-400 text-sm">★★★★★</div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "Senang nak urus hal bayaran dan tengok invois secara online.
                Harga pun berpatutan dengan kualiti makanan."
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <p className="text-xs font-bold text-white">Datin Azlina</p>
                <p className="text-[10px] text-slate-500">
                  Acara Korporat, Sepang
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>
            © {new Date().getFullYear()} Wakman Catering. Hak Cipta Terpelihara.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              WhatsApp: 010-3068294
            </a>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-slate-300 transition">
              Portal Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
