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

  // State untuk Modal Edit Pelanggan
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form State untuk Edit
  const [editForm, setEditForm] = useState({
    customer_name: "",
    customer_phone: "",
    address1: "",
    address2: "",
  });

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

  // 1. Buka Modal Sunting
  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setEditForm({
      customer_name: c.customer_name || "",
      customer_phone: c.customer_phone || "",
      address1: c.address1 || "",
      address2: c.address2 || "",
    });
    setIsEditModalOpen(true);
  };

  // 2. Simpan Kemaskini Pelanggan
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          customer_name: editForm.customer_name,
          customer_phone: editForm.customer_phone,
          address1: editForm.address1 || null,
          address2: editForm.address2 || null,
        })
        .eq("id", editingCustomer.id);

      if (error) {
        alert("Gagal mengemas kini pelanggan: " + error.message);
      } else {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? {
                  ...c,
                  customer_name: editForm.customer_name,
                  customer_phone: editForm.customer_phone,
                  address1: editForm.address1 || null,
                  address2: editForm.address2 || null,
                }
              : c,
          ),
        );
        setIsEditModalOpen(false);
        setEditingCustomer(null);
        alert("Maklumat pelanggan berjaya dikemas kini.");
      }
    } catch (err: any) {
      alert("Ralat mengemas kini: " + (err.message || err));
    } finally {
      setUpdating(false);
    }
  };

  // 3. Padam Pelanggan
  const handleDeleteCustomer = async (c: Customer) => {
    const confirmed = window.confirm(
      `Adakah anda pasti mahu memadam pelanggan "${c.customer_name}"? Tindakan ini tidak boleh dibatalkan.`,
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", c.id);

      if (error) {
        alert("Gagal memadam pelanggan: " + error.message);
        return;
      }

      setCustomers((prev) => prev.filter((item) => item.id !== c.id));
      alert("Pelanggan berjaya dipadamkan.");
    } catch (err: any) {
      alert("Ralat memadam pelanggan: " + (err.message || err));
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
                  <th className="p-4 text-center">Tindakan</th>
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

                    {/* Tindakan: Sunting & Padam */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] border border-blue-200 rounded-lg transition cursor-pointer"
                          title="Sunting Pelanggan"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200 rounded-lg transition cursor-pointer"
                          title="Padam Pelanggan"
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

      {/* Modal Sunting Pelanggan */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Sunting Pelanggan #{editingCustomer.id}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.customer_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, customer_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nombor Telefon *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.customer_phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, customer_phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Alamat Baris 1
                </label>
                <input
                  type="text"
                  value={editForm.address1}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address1: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Alamat Baris 2
                </label>
                <input
                  type="text"
                  value={editForm.address2}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address2: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-slate-50/50"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {updating ? "Menyimpan..." : "Simpan Kemaskini"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
