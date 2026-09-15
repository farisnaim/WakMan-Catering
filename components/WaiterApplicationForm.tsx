"use client";

import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase Client (Public Anon Key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function WaiterApplicationForm() {
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

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-3">
        <div className="text-4xl">🎉</div>
        <h3 className="text-xl font-bold text-emerald-900">
          Permohonan Berjaya Dihantar!
        </h3>
        <p className="text-sm text-emerald-700">
          Terima kasih kerana berminat menyertai pasukan pramusaji kami. Pihak
          kami akan menghubungi anda menerusi WhatsApp sekiranya terdapat
          kekosongan slot majlis.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({
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
          }}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
        >
          Hantar Permohonan Lain
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-sm">
      <div className="mb-6 text-center sm:text-left">
        <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase px-3 py-1 rounded-full">
          Peluang Kerjaya Sambilan / Tetap
        </span>
        <h2 className="text-2xl font-black text-slate-800 mt-2">
          Permohonan Pasukan Pramusaji (Crew Katering)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Isi maklumat di bawah untuk mendaftar sebagai kru pramusaji majlis
          kami.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Nama Penuh */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Nama Penuh <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="full_name"
            required
            value={formData.full_name}
            onChange={handleChange}
            placeholder="cth: Muhammad Ali bin Ahmad"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
          />
        </div>

        {/* No Telefon & Umur */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              No. WhatsApp / Telefon <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              name="phone_number"
              required
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="cth: 0123456789"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
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
              placeholder="cth: 21"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>
        </div>

        {/* Jantina & Tempat Tinggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Jantina <span className="text-rose-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 transition bg-white"
            >
              <option value="Lelaki">Lelaki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Kawasan / Bandar Tempat Tinggal{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="cth: Bandar Baru Nilai"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Pengalaman & Kenderaan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Pengalaman Pramusaji / Katering?
            </label>
            <select
              name="has_experience"
              value={formData.has_experience}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 transition bg-white"
            >
              <option value="false">Tiada Pengalaman (Boleh Belajar)</option>
              <option value="true">Ada Pengalaman</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Pengangkutan Ke Lokasi Majlis
            </label>
            <select
              name="transportation"
              value={formData.transportation}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 transition bg-white"
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
            <label className="block font-bold text-slate-700 mb-1">
              Ketersediaan Masa Bekerja
            </label>
            <select
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 transition bg-white"
            >
              <option value="Hujung Minggu Sahaja">
                Hujung Minggu Sahaja (Sabtu/Ahad)
              </option>
              <option value="Hari Biasa Sahaja">
                Hari Biasa (Isnin - Jumaat)
              </option>
              <option value="Bila-bila Masa">Bila-bila Masa (Fleksibel)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Saiz Baju (Penyediaan Uniform)
            </label>
            <select
              name="shirt_size"
              value={formData.shirt_size}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 transition bg-white"
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
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold text-sm rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {loading ? "Sedang Menghantar..." : "Hantar Permohonan Sekarang"}
          </button>
        </div>
      </form>
    </div>
  );
}
