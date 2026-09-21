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
  is_approved: boolean;
  created_at: string;
}

export default function AdminTestimoniPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (err) {
      console.error("Ralat mengambil testimoni:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApprove = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_approved: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      fetchTestimonials();
    } catch (err) {
      console.error("Ralat mengemaskini status testimoni:", err);
      alert("Gagal mengemaskini status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Adakah anda pasti mahu memadam ulasan ini?")) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);
      if (error) throw error;
      fetchTestimonials();
    } catch (err) {
      console.error("Ralat memadam testimoni:", err);
      alert("Gagal memadam ulasan.");
    }
  };

  const renderStars = (count: number) => {
    return "★".repeat(count) + "☆".repeat(5 - count);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Pengurusan Ulasan & Testimoni
        </h1>
        <p className="text-xs text-slate-500">
          Semak, luluskan untuk paparan awam, atau padam maklum balas daripada
          pelanggan.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
          Memuatkan senarai ulasan...
        </div>
      ) : testimonials.length === 0 ? (
        <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center text-slate-400 text-xs shadow-xs">
          Tiada sebarang ulasan dijumpai.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-500 text-xs font-mono tracking-widest">
                    {renderStars(t.rating)}
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                      t.is_approved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {t.is_approved ? "Diluluskan" : "Menunggu Kelulusan"}
                  </span>
                </div>

                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{t.comment}"
                </p>

                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-900">
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

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleToggleApprove(t.id, t.is_approved)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    t.is_approved
                      ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {t.is_approved ? "Nyah-lulus" : "Luluskan ✓"}
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
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
  );
}
