"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface MenuPackage {
  id: number;
  name: string;
  description: string | null;
  price_per_pax: number;
  minimum_pax: number;
  items: string[] | null;
  images: string[] | null;
  is_active: boolean;
}

export default function AdminMenuPage() {
  const [packages, setPackages] = useState<MenuPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerPax, setPricePerPax] = useState<number | "">("");
  const [minimumPax, setMinimumPax] = useState<number | "">(100);
  const [itemsText, setItemsText] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_packages")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      console.error("Ralat mengambil menu packages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg: MenuPackage) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setDescription(pkg.description || "");
    setPricePerPax(pkg.price_per_pax);
    setMinimumPax(pkg.minimum_pax);
    setItemsText(pkg.items ? pkg.items.join("\n") : "");
    setImagesText(pkg.images ? pkg.images.join("\n") : "");
    setIsActive(pkg.is_active);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPricePerPax("");
    setMinimumPax(100);
    setItemsText("");
    setImagesText("");
    setIsActive(true);
  };

  // Fungsi muat naik gambar terus ke bucket Supabase 'gambar-pakej'
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `pakej/${fileName}`;

        // Upload ke bucket gambar-pakej
        const { error: uploadError } = await supabase.storage
          .from("gambar-pakej")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Ralat muat naik gambar:", uploadError);
          alert(`Gagal muat naik gambar ${file.name}`);
          continue;
        }

        // Ambil URL awam
        const { data: publicUrlData } = supabase.storage
          .from("gambar-pakej")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          newUrls.push(publicUrlData.publicUrl);
        }
      }

      if (newUrls.length > 0) {
        const currentUrls = imagesText
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean);
        const combined = [...currentUrls, ...newUrls].join("\n");
        setImagesText(combined);
      }
    } catch (err) {
      console.error("Ralat pemprosesan muat naik:", err);
      alert("Berlaku ralat semasa muat naik gambar.");
    } finally {
      setUploading(false);
      // Reset input fail supaya fail yang sama boleh dipilih semula jika perlu
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || pricePerPax === "") return;

    setSaving(true);

    const itemsArray = itemsText
      .split("\n")
      .map((i) => i.trim())
      .filter(Boolean);

    const imagesArray = imagesText
      .split("\n")
      .map((i) => i.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price_per_pax: Number(pricePerPax),
      minimum_pax: Number(minimumPax) || 1,
      items: itemsArray.length > 0 ? itemsArray : null,
      images: imagesArray.length > 0 ? imagesArray : null,
      is_active: isActive,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("menu_packages")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_packages").insert(payload);
        if (error) throw error;
      }

      resetForm();
      fetchPackages();
    } catch (err) {
      console.error("Ralat menyimpan pakej menu:", err);
      alert("Gagal menyimpan pakej menu.");
    } finally {
      setSaving(false);
    }
  };

  // Fungsi padam pakej beserta gambar dalam Supabase Storage
  const handleDelete = async (pkg: MenuPackage) => {
    if (
      !confirm(
        `Adakah anda pasti mahu memadam pakej "${pkg.name}" beserta gambar-gambarnya?`,
      )
    )
      return;

    try {
      // 1. Padam fail gambar dari Supabase Storage jika wujud
      if (pkg.images && pkg.images.length > 0) {
        const pathsToDelete: string[] = [];

        pkg.images.forEach((url) => {
          if (url.includes("gambar-pakej")) {
            const parts = url.split("gambar-pakej/");
            if (parts.length > 1) {
              const filePath = parts[1].split("?")[0];
              pathsToDelete.push(filePath);
            }
          }
        });

        if (pathsToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("gambar-pakej")
            .remove(pathsToDelete);

          if (storageError) {
            console.error("Ralat memadam gambar dari Storage:", storageError);
          }
        }
      }

      // 2. Padam rekod pakej dari jadual pangkalan data
      const { error: dbError } = await supabase
        .from("menu_packages")
        .delete()
        .eq("id", pkg.id);

      if (dbError) throw dbError;

      if (editingId === pkg.id) {
        resetForm();
      }
      fetchPackages();
    } catch (err) {
      console.error("Ralat memadam pakej menu:", err);
      alert("Gagal memadam pakej menu.");
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Pengurusan Pakej Menu
        </h1>
        <p className="text-xs text-slate-500">
          Tambah, edit, atau nyahaktifkan pakej menu yang dipaparkan kepada
          pelanggan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM TAMBAH / EDIT */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl space-y-5 h-fit shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              {editingId ? "Edit Pakej Menu" : "Tambah Pakej Baru"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[10px] font-bold text-amber-600 hover:underline cursor-pointer"
              >
                + Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Nama Pakej *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pakej A (Lengkap)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Keterangan Ringkas
              </label>
              <input
                type="text"
                placeholder="Contoh: Sesuai untuk majlis kesyukuran & perkahwinan"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Harga / Pax (RM) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="15.00"
                  value={pricePerPax}
                  onChange={(e) =>
                    setPricePerPax(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono font-bold transition"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Min. Pax *
                </label>
                <input
                  type="number"
                  required
                  placeholder="100"
                  value={minimumPax}
                  onChange={(e) =>
                    setMinimumPax(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono font-bold transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Senarai Menu (1 item setiap baris)
              </label>
              <textarea
                rows={5}
                placeholder="Nasi Briyani&#10;Ayam Masak Merah&#10;Daging Masak Hitam&#10;Acar Buah"
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-xs transition"
              />
            </div>

            {/* SEKSYEN MUAT NAIK GAMBAR */}
            <div className="space-y-2">
              <label className="block text-slate-700 font-bold">
                Gambar Pakej
              </label>

              {/* Input Fail / Muat Naik Direktori */}
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold transition text-xs">
                  <span>
                    {uploading
                      ? "Sedia Memuat Naik..."
                      : "📁 Pilih Gambar dari Peranti"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {uploading && (
                <p className="text-[11px] text-amber-600 font-semibold animate-pulse">
                  ⏳ Gambar sedang dimuat naik ke Supabase Storage...
                </p>
              )}

              {/* Textarea Simpan URL */}
              <textarea
                rows={3}
                placeholder="URL gambar yang dimuat naik akan muncul di sini automatik..."
                value={imagesText}
                onChange={(e) => setImagesText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-[11px] transition"
              />
              <p className="text-[10px] text-slate-400">
                Anda boleh memuat naik beberapa gambar serentak atau memasukkan
                URL manual (1 URL setiap baris).
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label
                htmlFor="isActive"
                className="text-slate-700 font-bold cursor-pointer text-xs"
              >
                Paparkan Pakej Ini di Halaman Awam
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {saving
                ? "Menyimpan..."
                : editingId
                  ? "Kemaskini Pakej"
                  : "Simpan Pakej"}
            </button>
          </form>
        </div>

        {/* SENARAI PAKEJ */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Senarai Pakej Semasa ({packages.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Memuatkan pakej...
            </div>
          ) : packages.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-400 text-xs shadow-xs">
              Tiada pakej dijumpai. Sila tambah pakej baru di borang sebelah.
            </div>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {pkg.name}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                          pkg.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {pkg.is_active ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 font-mono font-bold">
                      RM {pkg.price_per_pax.toFixed(2)} / pax (Min.{" "}
                      {pkg.minimum_pax} pax)
                    </p>
                    {pkg.description && (
                      <p className="text-xs text-slate-500">
                        {pkg.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pkg)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Padam
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
