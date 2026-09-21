"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface WaiterSettings {
  id?: number;
  banner_image: string | null;
  title: string | null;
  description: string | null;
  benefits: string[] | null;
  gallery_images: string[] | null;
}

export default function AdminTetapanPramusajiPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [galleryText, setGalleryText] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("waiter_page_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRecordId(data.id);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setBannerImage(data.banner_image || "");
        setBenefitsText(data.benefits ? data.benefits.join("\n") : "");
        setGalleryText(
          data.gallery_images ? data.gallery_images.join("\n") : "",
        );
      }
    } catch (err) {
      console.error("Ralat mengambil tetapan pramusaji:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi pembantu mengekstrak file path dari URL Supabase Storage
  const extractFilePath = (url: string) => {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split("/gambar-pramusaji/");
      if (parts.length > 1) {
        return decodeURIComponent(parts[1]);
      }
    } catch {
      // Jika format URL tidak baku
    }
    return null;
  };

  // Fungsi hapus file dari Supabase Storage
  const deleteStorageFile = async (url: string) => {
    const filePath = extractFilePath(url);
    if (!filePath) return;

    setDeletingPath(filePath);
    try {
      const { error } = await supabase.storage
        .from("gambar-pramusaji")
        .remove([filePath]);

      if (error) {
        console.error("Ralat memadam fail dari storage:", error);
      }
    } catch (err) {
      console.error("Ralat memadam fail:", err);
    } finally {
      setDeletingPath(null);
    }
  };

  // Hapus Gambar Banner
  const handleRemoveBanner = async () => {
    if (!confirm("Adakah anda pasti mahu memadam gambar banner ini?")) return;
    if (bannerImage) {
      await deleteStorageFile(bannerImage);
      setBannerImage("");
    }
  };

  // Hapus Gambar Galeri tertentu
  const handleRemoveGalleryImage = async (urlToRemove: string) => {
    if (!confirm("Adakah anda pasti mahu memadam gambar ini dari galeri?"))
      return;
    await deleteStorageFile(urlToRemove);

    const urls = galleryText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u && u !== urlToRemove);
    setGalleryText(urls.join("\n"));
  };

  // Unggah gambar banner dari peranti tempatan ke bucket gambar-pramusaji
  const handleBannerFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingBanner(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}.${fileExt}`;
      const filePath = `banner/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("gambar-pramusaji")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Ralat muat naik banner:", uploadError);
        alert("Gagal muat naik gambar banner.");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("gambar-pramusaji")
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setBannerImage(publicUrlData.publicUrl);
      }
    } catch (err) {
      console.error("Ralat pemprosesan muat naik banner:", err);
      alert("Berlaku ralat semasa muat naik gambar banner.");
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  // Unggah beberapa gambar galeri dari peranti tempatan ke bucket gambar-pramusaji
  const handleGalleryFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `galeri-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}.${fileExt}`;
        const filePath = `galeri/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("gambar-pramusaji")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Ralat muat naik gambar galeri:", uploadError);
          alert(`Gagal muat naik gambar ${file.name}`);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("gambar-pramusaji")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          newUrls.push(publicUrlData.publicUrl);
        }
      }

      if (newUrls.length > 0) {
        const currentUrls = galleryText
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean);
        const combined = [...currentUrls, ...newUrls].join("\n");
        setGalleryText(combined);
      }
    } catch (err) {
      console.error("Ralat pemprosesan muat naik galeri:", err);
      alert("Berlaku ralat semasa muat naik gambar galeri.");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const benefitsArray = benefitsText
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    const galleryArray = galleryText
      .split("\n")
      .map((g) => g.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim() || null,
      description: description.trim() || null,
      banner_image: bannerImage.trim() || null,
      benefits: benefitsArray.length > 0 ? benefitsArray : null,
      gallery_images: galleryArray.length > 0 ? galleryArray : null,
    };

    try {
      if (recordId) {
        const { error } = await supabase
          .from("waiter_page_settings")
          .update(payload)
          .eq("id", recordId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("waiter_page_settings")
          .insert(payload);
        if (error) throw error;
      }

      alert("Tetapan halaman pramusaji berjaya dikemaskini!");
      fetchSettings();
    } catch (err) {
      console.error("Ralat mengemaskini tetapan pramusaji:", err);
      alert("Gagal menyimpan tetapan.");
    } finally {
      setSaving(false);
    }
  };

  const galleryList = galleryText
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Tetapan Halaman Pramusaji
        </h1>
        <p className="text-xs text-slate-500">
          Kemaskini tajuk, deskripsi, senarai manfaat, dan gambar galeri untuk
          halaman rekrut (/sertai-kami).
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
          Memuatkan tetapan...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6 text-xs shadow-xs"
        >
          {/* Tajuk Utama */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Tajuk Utama Utk Halaman
            </label>
            <input
              type="text"
              placeholder="Contoh: Sertai Krew Pramusaji Wak Man Catering"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Penerangan Ringkas */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Penerangan Ringkas
            </label>
            <textarea
              rows={3}
              placeholder="Sertai pasukan katering kami untuk menjayakan pelbagai majlis..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Gambar Banner Utama */}
          <div className="space-y-3">
            <label className="block text-slate-700 font-bold">
              Gambar Banner Utama
            </label>

            {/* Preview Banner jika wujud */}
            {bannerImage && (
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100 flex items-center justify-center">
                <img
                  src={bannerImage}
                  alt="Banner Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveBanner}
                  className="absolute top-3 right-3 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-md transition text-xs cursor-pointer"
                >
                  🗑 Hapus Banner
                </button>
              </div>
            )}

            {/* Butang Muat Naik dari Peranti */}
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold transition text-xs">
                <span>
                  {uploadingBanner
                    ? "Sedang Memuat Naik..."
                    : "📁 Muat Naik / Tukar Gambar Banner"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingBanner}
                  onChange={handleBannerFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadingBanner && (
              <p className="text-[11px] text-amber-600 font-semibold animate-pulse">
                ⏳ Gambar banner sedang dimuat naik ke Supabase Storage...
              </p>
            )}

            {/* Input URL Manual / Auto-filled */}
            <input
              type="text"
              placeholder="https://.../banner-pramusaji.jpg"
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-[11px] transition"
            />
          </div>

          {/* Senarai Manfaat */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Senarai Manfaat / Kelebihan (1 item setiap baris)
            </label>
            <textarea
              rows={5}
              placeholder="Elaun harian & pembayaran yang kompetitif&#10;Sajian makanan & minuman disediakan semasa bertugas&#10;Waktu kerja fleksibel mengikut jadual majlis"
              value={benefitsText}
              onChange={(e) => setBenefitsText(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono transition"
            />
          </div>

          {/* Galeri Gambar Suasana */}
          <div className="space-y-3">
            <label className="block text-slate-700 font-bold">
              Galeri Gambar Suasana
            </label>

            {/* Grid Pratinjau Galeri Gambar */}
            {galleryList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                {galleryList.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-200"
                  >
                    <img
                      src={url}
                      alt={`Galeri ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(url)}
                      className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-xs transition text-[10px] cursor-pointer"
                      title="Hapus gambar ini"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Butang Muat Naik Banyak Gambar dari Peranti */}
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold transition text-xs">
                <span>
                  {uploadingGallery
                    ? "Sedang Memuat Naik..."
                    : "📁 Muat Naik Tambahan Gambar Galeri"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingGallery}
                  onChange={handleGalleryFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadingGallery && (
              <p className="text-[11px] text-amber-600 font-semibold animate-pulse">
                ⏳ Gambar galeri sedang dimuat naik ke Supabase Storage...
              </p>
            )}

            {/* Textarea URL Manual / Auto-filled */}
            <textarea
              rows={4}
              placeholder="URL gambar yang dimuat naik akan muncul di sini secara automatik (1 URL setiap baris)..."
              value={galleryText}
              onChange={(e) => setGalleryText(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-[11px] transition"
            />
          </div>

          <button
            type="submit"
            disabled={saving || uploadingBanner || uploadingGallery}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            {saving ? "Menyimpan..." : "Simpan Tetapan"}
          </button>
        </form>
      )}
    </div>
  );
}
