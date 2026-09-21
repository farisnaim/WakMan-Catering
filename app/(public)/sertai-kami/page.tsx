"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface WaiterSettings {
  banner_image: string | null;
  title: string | null;
  description: string | null;
  benefits: string[] | null;
  gallery_images: string[] | null;
}

export default function SertaiKamiPage() {
  const [settings, setSettings] = useState<WaiterSettings | null>(null);
  const [loading, setLoading] = useState(true);

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
      setSettings(data);
    } catch (err) {
      console.error("Ralat mengambil tetapan halaman pramusaji:", err);
    } finally {
      setLoading(false);
    }
  };

  const defaultBenefits = [
    "Elaun harian & pembayaran yang kompetitif",
    "Sajian makanan & minuman disediakan semasa bertugas",
    "Peluang menambah pengalaman dalam pengurusan acara & katering",
    "Waktu kerja fleksibel mengikut jadual majlis",
  ];

  const benefitsList =
    settings?.benefits && settings.benefits.length > 0
      ? settings.benefits
      : defaultBenefits;
  const galleryImages =
    settings?.gallery_images && settings.gallery_images.length > 0
      ? settings.gallery_images
      : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 space-y-12">
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Peluang Kerjaya Sambilan
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          {settings?.title || "Sertai Krew Pramusaji Wak Man Catering"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          {settings?.description ||
            "Sertai pasukan katering kami untuk menjayakan pelbagai majlis perkahwinan, acara korporat, dan kenduri kesyukuran."}
        </p>
      </div>

      {/* BANNER / IMAGE CONTAINER */}
      {settings?.banner_image && (
        <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
          <img
            src={settings.banner_image}
            alt="Pramusaji Banner"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* MANFAAT & KELEBIHAN */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🎁</span> Kelebihan & Manfaat Menyertai Kami
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefitsList.map((benefit, idx) => (
            <div
              key={idx}
              className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-start gap-3"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs">
                ✓
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {benefit}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* GALERI SUASANA KERJA */}
      {galleryImages.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white text-center">
            Suasana Kerja Krew Kami
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {galleryImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-2xl overflow-hidden border border-slate-800"
              >
                <img
                  src={imgUrl}
                  alt={`Galeri Krew ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTION BANNER TO FORM */}
      <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Bersedia Untuk Bermula?
          </h2>
          <p className="text-xs text-slate-400">
            Isi borang permohonan sekarang dan pihak kami akan menghubungi anda
            untuk tugasan majlis terdekat[cite: 7].
          </p>
        </div>
        <Link
          href="/pencarian-pramusaji"
          className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 transition"
        >
          Isi Borang Sekarang →
        </Link>
      </div>
    </div>
  );
}
