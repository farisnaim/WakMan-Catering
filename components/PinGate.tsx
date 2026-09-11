"use client";

import { useState, useEffect } from "react";

interface PinGateProps {
  children: React.ReactNode;
}

// Tukar PIN keselamatan anda di sini (atau guna environment variable)
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "1234";

export default function PinGate({ children }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Semak status pengesahan daripada sessionStorage semasa halaman dimuatkan
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("admin_authenticated");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("admin_authenticated", "true");
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setIsAuthenticated(false);
  };

  // Paparan sementara semasa menyemak sesi
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xs text-gray-400 animate-pulse">
          Menyemak akses keselamatan...
        </p>
      </div>
    );
  }

  // Jika PIN betul, paparkan kandungan asal sistem
  if (isAuthenticated) {
    return (
      <div className="relative">
        {/* Butang Log Keluar Khas (Pilihan tambahan) */}
        <button
          onClick={handleLogout}
          className="fixed top-3 right-3 z-50 text-[10px] bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-lg border border-red-200 transition"
          title="Kunci Semula Admin"
        >
          🔒 Kunci Sistem
        </button>
        {children}
      </div>
    );
  }

  // Jika belum disahkan, paparkan skrin kunci PIN
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-md max-w-sm w-full text-center space-y-5">
        <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-xl">
          🔐
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Akses Pentadbir WakMan
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Masukkan PIN 4-digit keselamatan untuk meneruskan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value);
              }}
              placeholder="****"
              className="w-full text-center text-2xl font-mono tracking-widest py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500 font-semibold mt-2">
                ⚠️ PIN tidak sah. Sila cuba lagi.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            Luluskan Akses
          </button>
        </form>

        <p className="text-[10px] text-gray-400">
          Sistem Kawalan Dalaman WakMan Catering
        </p>
      </div>
    </div>
  );
}
