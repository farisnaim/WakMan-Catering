"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Testimonial {
  id: number;
  customer_name: string;
  event_type: string | null;
  location: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export default function TestimoniPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (err) {
      console.error("Ralat mengambil testimoni:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const { error } = await supabase.from("testimonials").insert({
        customer_name: name.trim(),
        event_type: eventType.trim() || null,
        location: location.trim() || null,
        rating,
        comment: comment.trim(),
        is_approved: false, // Perlu kelulusan admin
      });

      if (error) throw error;

      setSubmitSuccess(true);
      setName("");
      setEventType("");
      setLocation("");
      setRating(5);
      setComment("");
    } catch (err: any) {
      console.error("Ralat menghantar testimoni:", err);
      setSubmitError("Gagal menghantar ulasan. Sila cuba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number) => {
    return "★".repeat(count) + "☆".repeat(5 - count);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-12">
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Ulasan & Maklum Balas
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Apa Kata Pelanggan Kami
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Pengalaman dan pendapat ikhlas daripada pelanggan yang pernah
          menggunakan perkhidmatan Wak Man Catering.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM INPUT TESTIMONI */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 h-fit shadow-2xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Kongsi Ulasan Anda</h2>
            <p className="text-xs text-slate-400">
              Pernah menggunakan khidmat kami? Tinggalkan maklum balas anda di
              sini.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-medium">
              Terima kasih! Ulasan anda telah dihantar dan akan dipaparkan
              selepas disahkan oleh admin.
            </div>
          )}

          {submitError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400 font-medium">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Nama Anda *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Puan Faridah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Rating Bintang *
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-amber-400 font-bold focus:outline-none transition"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang)</option>
                <option value={4}>⭐⭐⭐⭐ (4 Bintang)</option>
                <option value={3}>⭐⭐⭐ (3 Bintang)</option>
                <option value={2}>⭐⭐ (2 Bintang)</option>
                <option value={1}>⭐ (1 Bintang)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Jenis Majlis
              </label>
              <input
                type="text"
                placeholder="Contoh: Majlis Perkahwinan"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Lokasi Majlis
              </label>
              <input
                type="text"
                placeholder="Contoh: Nilai, Negeri Sembilan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Ulasan / Maklum Balas *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Tulis maklum balas anda di sini..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 transition"
            >
              {submitting ? "Hantar..." : "Hantar Ulasan"}
            </button>
          </form>
        </div>

        {/* SENARAI TESTIMONI AWAM */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white">
            Senarai Ulasan Pelanggan ({testimonials.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
              Memuatkan ulasan...
            </div>
          ) : testimonials.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 text-xs">
              Belum ada ulasan dipaparkan. Jadilah yang pertama memberikan
              ulasan!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl space-y-4 flex flex-col justify-between hover:border-amber-500/30 transition"
                >
                  <div className="space-y-2">
                    <div className="text-amber-400 text-xs tracking-widest font-mono">
                      {renderStars(t.rating)}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{t.comment}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60">
                    <p className="text-xs font-bold text-white">
                      {t.customer_name}
                    </p>
                    {(t.event_type || t.location) && (
                      <p className="text-[10px] text-slate-500">
                        {t.event_type}
                        {t.event_type && t.location ? `, ` : ""}
                        {t.location}
                      </p>
                    )}
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
