"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Customer {
  id: number;
  customer_name: string;
  customer_phone: string;
  address1?: string | null;
  address2?: string | null;
}

export default function NewOrderPage() {
  const router = useRouter();

  // Data Pelanggan
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [existingCustomerId, setExistingCustomerId] = useState<number | null>(
    null,
  );

  // State Carian Live Search
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Data Tempahan
  const [eventDate, setEventDate] = useState("");
  const [orderDetails, setOrderDetails] = useState("");
  const [status, setStatus] = useState("pending");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tutup dropdown bila klik di luar borang
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carian Pelanggan Secara Masa Nyata (Live Search)
  const searchCustomers = async (query: string) => {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, customer_name, customer_phone, address1, address2")
        .or(
          `customer_name.ilike.%${cleanQuery}%,customer_phone.ilike.%${cleanQuery}%`,
        )
        .limit(6);

      if (!error && data) {
        setSearchResults(data);
        setShowDropdown(data.length > 0);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Ralat live search pelanggan:", err);
    } finally {
      setSearching(false);
    }
  };

  // Fungsi Pilih Pelanggan Dari Senarai Dropdown (Autofill)
  const handleSelectCustomer = (customer: Customer) => {
    setExistingCustomerId(customer.id);
    setCustomerName(customer.customer_name || "");
    setCustomerPhone(customer.customer_phone || "");
    setAddress1(customer.address1 || "");
    setAddress2(customer.address2 || "");
    setShowDropdown(false);
  };

  // Reset ID jika pengguna mengubah input secara manual
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomerName(val);
    setExistingCustomerId(null);
    searchCustomers(val);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomerPhone(val);
    setExistingCustomerId(null);
    searchCustomers(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerPhone.trim()) {
      setErrorMessage("Sila masukkan nombor telefon pelanggan.");
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage("Sila masukkan nama pelanggan.");
      return;
    }

    setLoading(true);

    try {
      let customerIdToUse = existingCustomerId;

      // 1. Jika pelanggan belum wujud, cipta rekod pelanggan baharu
      if (!customerIdToUse) {
        const { data: newCust, error: custErr } = await supabase
          .from("customers")
          .insert([
            {
              customer_name: customerName.trim(),
              customer_phone: customerPhone.trim(),
              address1: address1.trim() || null,
              address2: address2.trim() || null,
            },
          ])
          .select()
          .single();

        if (custErr) throw custErr;
        customerIdToUse = newCust.id;
      } else {
        // Kemaskini alamat / nama sekiranya ada perubahan pada akaun sedia ada
        await supabase
          .from("customers")
          .update({
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            address1: address1.trim() || null,
            address2: address2.trim() || null,
          })
          .eq("id", customerIdToUse);
      }

      // 2. Simpan Rekod Tempahan ke Jadual orders
      const { error: orderErr } = await supabase.from("orders").insert([
        {
          customer_id: customerIdToUse,
          event_date: eventDate || null,
          order_details: orderDetails.trim() || null,
          status: status,
        },
      ]);

      if (orderErr) throw orderErr;

      router.push("/orders");
      router.refresh();
    } catch (err: any) {
      console.error("Ralat mencipta tempahan:", err);
      setErrorMessage(
        err.message || "Gagal menyimpan tempahan baharu. Sila cuba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header & Navigasi */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Tambah Tempahan Baharu
          </h1>
          <p className="text-xs text-slate-500">
            Cari pelanggan sedia ada atau daftar baharu, kemudian masukkan
            perincian tempahan.
          </p>
        </div>
        <Link
          href="/orders"
          className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          ← Batal
        </Link>
      </div>

      {/* Amaran Ralat */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bahagian 1: Maklumat Pelanggan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              1. Maklumat Pelanggan
            </h2>
            {searching && (
              <span className="text-[11px] font-bold text-blue-600 animate-pulse">
                Mencari pelanggan...
              </span>
            )}
            {existingCustomerId && !searching && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                ✓ Pelanggan Dipilih (Autofill)
              </span>
            )}
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative"
            ref={dropdownRef}
          >
            {/* Input Nama Pelanggan dengan Live Search */}
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-slate-700 block">
                Nama Pelanggan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Taip nama untuk cari pelanggan..."
                value={customerName}
                onChange={handleNameChange}
                onFocus={() =>
                  searchResults.length > 0 && setShowDropdown(true)
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-slate-50/30 font-medium"
              />
            </div>

            {/* Input Nombor Telefon */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                No. Telefon / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Contoh: 0103068294"
                value={customerPhone}
                onChange={handlePhoneChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600 bg-slate-50/30"
              />
            </div>

            {/* Live Search Dropdown Popup */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-[70px] left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                <div className="px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Sila Pilih Pelanggan Sedia Ada:
                </div>
                {searchResults.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelectCustomer(cust)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                        {cust.customer_name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {cust.customer_phone}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 px-2 py-1 rounded-lg">
                      Pilih
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Alamat Baris 1
              </label>
              <input
                type="text"
                placeholder="Contoh: No 12, Jalan Bunga Raya"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-slate-50/30"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-slate-50/30"
              />
            </div>
          </div>
        </div>

        {/* Bahagian 2: Perincian Tempahan (Free Text Paste) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            2. Perincian Tempahan & Tarikh Majlis
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Tarikh Majlis / Acara
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-slate-50/30 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Status Tempahan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-slate-50/30 font-bold"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing / Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2 pt-2">
              <label className="text-xs font-bold text-slate-700 block">
                Keseluruhan Mesej / Butiran Tempahan (Paste Dari Mesej
                Pelanggan)
              </label>
              <textarea
                rows={6}
                placeholder="Tampal (paste) teks perbualan WhatsApp / senarai menu / sebut harga di sini...&#10;&#10;Contoh:&#10;- Pakej Ayam Panggang 100 Pax&#10;- Lokasi: Dewan Seri Mawar&#10;- Nota Tambahan: Kurangkan pedas"
                value={orderDetails}
                onChange={(e) => setOrderDetails(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-slate-50/30 leading-relaxed font-sans"
              />
            </div>
          </div>
        </div>

        {/* Butang Tindakan */}
        <div className="flex justify-end gap-3">
          <Link
            href="/orders"
            className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            {loading ? "Sedang Menyimpan..." : "Simpan Tempahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
