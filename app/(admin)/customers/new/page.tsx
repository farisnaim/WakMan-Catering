"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewCustomerPage() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage("Sila masukkan nama pelanggan.");
      setLoading(false);
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage("Sila masukkan nombor telefon pelanggan.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        address1: address1.trim() || null,
        address2: address2.trim() || null,
      };

      const { error } = await supabase.from("customers").insert([payload]);

      if (error) throw error;

      router.push("/customers");
    } catch (err: any) {
      console.error("Ralat mendaftar pelanggan:", err);
      setErrorMessage(
        err.message || "Gagal mendaftar pelanggan baharu. Sila cuba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Daftar Pelanggan Baharu
          </h1>
          <p className="text-xs text-slate-500">
            Tambah profil pelanggan baharu ke dalam sistem.
          </p>
        </div>
        <Link
          href="/customers"
          className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          ← Batal
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-2">
            Maklumat Profil Pelanggan
          </label>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Nama Pelanggan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Ahmad Albab"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 bg-slate-50/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Nombor Telefon <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 0123456789"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-blue-600 bg-slate-50/50"
            />
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-700 block">
              Alamat Baris 1
            </label>
            <input
              type="text"
              placeholder="Contoh: No 123, Jalan Bunga Raya"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 bg-slate-50/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Alamat Baris 2
            </label>
            <input
              type="text"
              placeholder="Contoh: Taman Merdeka, 71800 Nilai"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Link
            href="/customers"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            {loading ? "Sedang Menyimpan..." : "Simpan Pelanggan"}
          </button>
        </div>
      </form>
    </div>
  );
}
