"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminNavbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Menghantar kata kunci ke halaman senarai tempahan
    router.push(`/orders?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Penjenamaan */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img
                src="/favicon.svg"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
              <div className="hidden sm:block">
                <span className="font-extrabold text-sm text-gray-800 tracking-wide block leading-none">
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
                placeholder="Cari ID tempahan (#), pelanggan, atau telefon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
            </div>
          </form>

          {/* Indikator Status & Profil */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                Sistem Aktif
              </span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 text-xs font-bold">
                WM
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
