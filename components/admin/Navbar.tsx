"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

export default function AdminNavbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/orders?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    // Ditambah padding p-3 sm:p-4 di sekeliling header untuk elak bertindih
    <header
      className={`fixed top-0 left-0 right-0 z-30 p-3 sm:p-4 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-md border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Penjenamaan */}
          <div className="flex items-center gap-3 pl-12 sm:pl-0">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <img
                src="/favicon.svg"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
              <div className="hidden sm:block">
                <span className="font-extrabold text-sm text-slate-800 tracking-wide block leading-none">
                  WAKMAN
                </span>
                <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">
                  Catering Admin
                </span>
              </div>
            </Link>
          </div>

          {/* Bar Carian Global */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xs md:max-w-md">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Cari ID (#), nama, telefon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 bg-slate-100/80 border border-gray-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
            </div>
          </form>

          <NotificationBell />

          {/* Indikator Status & Profil */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Sistem Aktif
              </span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 text-xs font-black shadow-xs">
                WM
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
