"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function WaiterApplicationPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    age: "",
    gender: "Lelaki",
    location: "",
    has_experience: "false",
    transportation: "Motosikal",
    availability: "Hujung Minggu Sahaja",
    shirt_size: "M",
  });

  const adminPhone = "60103068294";
  const whatsappMsg = encodeURIComponent(
    "Assalamualaikum Admin Wak Man catering, saya dah isi borang untuk pramusaji / penanggah. Saya berminat untuk join Team Wak Man",
  );
  const contactAdminUrl = `https://wa.me/${adminPhone}?text=${whatsappMsg}`;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.from("waiter_applications").insert([
        {
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          age: parseInt(formData.age, 10),
          gender: formData.gender,
          location: formData.location,
          has_experience: formData.has_experience === "true",
          transportation: formData.transportation,
          availability: formData.availability,
          shirt_size: formData.shirt_size,
        },
      ]);

      if (error) throw error;

      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Ralat semasa menghantar borang. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-900 font-sans">
      {/* HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-base">
              W
            </div>
            <span className="font-black tracking-tight text-sm text-white">
              WAKMAN CATERING
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-amber-400 font-bold transition flex items-center gap-1"
          >
            ← Halaman Utama
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 py-12 px-4 max-w-2xl mx-auto w-full flex items-center">
        {submitted ? (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-3xl mx-auto">
              🎉
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                Permohonan Berjaya Dihantar!
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                Terima kasih kerana berminat menyertai pasukan pramusaji Wak Man
                Catering. Sila hubungi admin melalui WhatsApp untuk pengesahan
                segera.
              </p>
            </div>

            {/* DUA BUTANG TINDAKAN */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={contactAdminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <span>💬</span> Contact Admin
              </a>

              <Link
                href="/"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition text-center"
              >
                Halaman Utama
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 text-center sm:text-left space-y-1">
              <span className="inline-block bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                Peluang Kerjaya Sambilan / Tetap
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Permohonan Krew Pramusaji / Penanggah
              </h1>
              <p className="text-xs text-slate-400">
                Sila isi maklumat anda di bawah untuk menyertai pasukan kami.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Nama Penuh */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Nama Penuh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Contoh: Muhammad Ali bin Ahmad"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* No WhatsApp & Umur */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    No. WhatsApp / Telefon{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    required
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Contoh: 0123456789"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Umur <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="16"
                    max="60"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Contoh: 21"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Jantina & Kawasan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Jantina <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="Lelaki">Lelaki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Kawasan Tempat Tinggal{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Contoh: Bandar Baru Nilai"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Pengalaman & Kenderaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Pengalaman Pramusaji / Katering?
                  </label>
                  <select
                    name="has_experience"
                    value={formData.has_experience}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="false">
                      Tiada Pengalaman (Boleh Belajar)
                    </option>
                    <option value="true">Ada Pengalaman</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Pengangkutan Ke Lokasi Majlis
                  </label>
                  <select
                    name="transportation"
                    value={formData.transportation}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="Motosikal">Motosikal Sendiri</option>
                    <option value="Kereta">Kereta Sendiri</option>
                    <option value="Menumpang">Menumpang Kawan / Awam</option>
                  </select>
                </div>
              </div>

              {/* Ketersediaan & Saiz Baju */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Ketersediaan Masa Bekerja
                  </label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="Hujung Minggu Sahaja">
                      Hujung Minggu Sahaja (Sabtu/Ahad)
                    </option>
                    <option value="Hari Biasa Sahaja">
                      Hari Biasa (Isnin - Jumaat)
                    </option>
                    <option value="Bila-bila Masa">
                      Bila-bila Masa (Fleksibel)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Saiz Baju (Uniform)
                  </label>
                  <select
                    name="shirt_size"
                    value={formData.shirt_size}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL / Ke atas</option>
                  </select>
                </div>
              </div>

              {/* Butang Hantar */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/10 transition disabled:opacity-50"
                >
                  {loading
                    ? "Sedang Menghantar..."
                    : "Hantar Permohonan Sekarang"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} Wakman Catering. Hak Cipta Terpelihara.
        </p>
      </footer>
    </div>
  );
}
