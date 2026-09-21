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

export default function MenuPage() {
  const [packages, setPackages] = useState<MenuPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndexes, setActiveImageIndexes] = useState<{
    [key: number]: number;
  }>({});

  const whatsappNumber = "60103068294";

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_packages")
        .select("*")
        .eq("is_active", true)
        .order("id", { ascending: true });

      if (error) throw error;

      if (data) {
        setPackages(data);
        const initialIndexes: { [key: number]: number } = {};
        data.forEach((pkg) => {
          initialIndexes[pkg.id] = 0;
        });
        setActiveImageIndexes(initialIndexes);
      }
    } catch (err) {
      console.error("Ralat mengambil pakej menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevImage = (packageId: number, maxImages: number) => {
    setActiveImageIndexes((prev) => ({
      ...prev,
      [packageId]: (prev[packageId] - 1 + maxImages) % maxImages,
    }));
  };

  const handleNextImage = (packageId: number, maxImages: number) => {
    setActiveImageIndexes((prev) => ({
      ...prev,
      [packageId]: (prev[packageId] + 1) % maxImages,
    }));
  };

  const formatRM = (val: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(val || 0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-12">
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Senarai Sajian
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Pakej Katering Wak Man
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Pilih pakej sajian yang bersesuaian dengan bilangan tetamu dan konsep
          majlis anda.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs animate-pulse">
          Memuatkan pakej menu...
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-400 text-xs">
          Tiada pakej menu dipaparkan buat masa ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => {
            const images =
              pkg.images && pkg.images.length > 0 ? pkg.images : ["/ads.MP4"];
            const currentImgIndex = activeImageIndexes[pkg.id] || 0;
            const itemsList = Array.isArray(pkg.items) ? pkg.items : [];

            const tempahanMsg = encodeURIComponent(
              `Assalammualaikum Wakman Catering, saya berminat untuk membuat tempahan ${pkg.name}.`,
            );
            const bookingUrl = `https://wa.me/${whatsappNumber}?text=${tempahanMsg}`;

            return (
              <div
                key={pkg.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-amber-500/40 transition shadow-xl"
              >
                <div>
                  {/* CAROUSEL GAMBAR */}
                  <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                    <img
                      src={images[currentImgIndex]}
                      alt={pkg.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800";
                      }}
                    />

                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => handlePrevImage(pkg.id, images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center text-xs font-bold transition opacity-0 group-hover:opacity-100"
                        >
                          ‹
                        </button>
                        <button
                          onClick={() => handleNextImage(pkg.id, images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center text-xs font-bold transition opacity-0 group-hover:opacity-100"
                        >
                          ›
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {images.map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                idx === currentImgIndex
                                  ? "bg-amber-400"
                                  : "bg-white/40"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* KANDUNGAN PAKEJ */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {pkg.name}
                      </h3>
                      {pkg.description && (
                        <p className="text-xs text-slate-400 mt-1">
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">
                          Harga
                        </span>
                        <span className="text-lg font-black text-amber-400">
                          {formatRM(pkg.price_per_pax)}
                        </span>
                        <span className="text-xs text-slate-400"> / pax</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">
                          Min. Tempahan
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {pkg.minimum_pax} Pax
                        </span>
                      </div>
                    </div>

                    {itemsList.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Menu Hidangan:
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-400">
                          {itemsList.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="text-amber-400 font-bold">
                                ✓
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* BUTTON CTA */}
                <div className="p-6 pt-0">
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition"
                  >
                    <span>💬</span> Tempah Pakej Ini
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
