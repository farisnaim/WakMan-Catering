"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Customer {
  id: number;
  customer_name: string;
  customer_phone: string;
  address1: string | null;
  address2: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select(
          `
          id,
          customer_name,
          customer_phone,
          address1,
          address2,
          created_at
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ralat memuatkan pelanggan:", error.message);
        setCustomers([]);
      } else if (data) {
        setCustomers(data as Customer[]);
      }
    } catch (err: any) {
      console.error("Ralat sistem:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const nameMatch = c.customer_name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const phoneMatch = c.customer_phone?.includes(search);
    return nameMatch || phoneMatch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header Utama & Navigasi */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Senarai Pelanggan
          </h1>
          <p className="text-xs text-slate-500">
            Pengurusan direktori pelanggan, nombor telefon, dan alamat
            penghantaran.
          </p>
        </div>

        <Link
          href="/customers/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
        >
          + Tambah Pelanggan
        </Link>
      </div>

      {/* Carian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <input
          type="text"
          placeholder="Cari nama pelanggan atau nombor telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl text-xs w-full sm:w-80 focus:outline-none focus:border-blue-600 bg-slate-50/50"
        />
      </div>

      {/* Jadual Pelanggan */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">
          Sedang memuatkan data pelanggan...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-xs text-slate-400">
          Tiada rekod pelanggan dijumpai.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">ID</th>
                  <th className="p-4">Nama Pelanggan</th>
                  <th className="p-4">No. Telefon</th>
                  <th className="p-4">Alamat</th>
                  <th className="p-4">Tarikh Didaftarkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono font-bold text-slate-400">
                      #{c.id}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {c.customer_name}
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {c.customer_phone || "-"}
                    </td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">
                      {c.address1}
                      {c.address2 ? `, ${c.address2}` : ""}
                      {!c.address1 && !c.address2 && "-"}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {new Date(c.created_at).toLocaleDateString("ms-MY")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
