"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image"; // Import Image dari Next.js

export default function QuickActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu Pilihan Pantas (Pop-up Menu) */}
      {isOpen && (
        <div className="mb-3 flex flex-col gap-2 items-end animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Link
            href="/orders/new"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:bg-gray-50 transition"
          >
            <span>📝</span>
            <span>Bina Tempahan Baru</span>
          </Link>

          <Link
            href="/board"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:bg-gray-50 transition"
          >
            <span>📋</span>
            <span>Buka Papan Kanban</span>
          </Link>

          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:bg-green-100 transition"
          >
            <span>💬</span>
            <span>Buka WhatsApp Web</span>
          </a>
        </div>
      )}

      {/* Butang Utama dengan Gambar dari public */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xl flex items-center justify-center transition-transform duration-200 focus:outline-none ${
          isOpen
            ? "bg-gray-800 rotate-45"
            : "bg-amber-600 hover:scale-105 active:scale-95"
        }`}
        title="Tindakan Pantas"
      >
        {isOpen ? (
          <span className="text-xl text-white font-bold">✕</span>
        ) : (
          <Image
            src="/favicon.svg" // Gantikan 'logo.png' dengan nama fail gambar anda dalam public
            alt="Quick Action Logo"
            width={32}
            height={32}
            className="object-contain"
          />
        )}
      </button>
    </div>
  );
}
