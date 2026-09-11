"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavGroup {
  groupName: string;
  items: {
    label: string;
    href: string;
    icon: string;
  }[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    groupName: "Utama",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "📊" },
      { label: "Papan Kanban", href: "/board", icon: "📋" },
    ],
  },
  {
    groupName: "Pengurusan Tempahan",
    items: [
      { label: "Senarai Tempahan", href: "/orders", icon: "📦" },
      { label: "Tambah Tempahan", href: "/orders/new", icon: "➕" },
    ],
  },
  {
    groupName: "Pelanggan & Kewangan",
    items: [
      { label: "Senarai Pelanggan", href: "/customers", icon: "👥" },
      { label: "Daftar Pelanggan", href: "/customers/new", icon: "👤" },
      { label: "Invois & Resit", href: "/invoices", icon: "🧾" },
      { label: "Bina Invois", href: "/invoices/new", icon: "📝" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Butang Toggle Apabila Sidebar Di-Hide (Sembunyi) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-2.5 bg-white border border-gray-200 shadow-md rounded-xl text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition"
          title="Tunjukkan Sidebar"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Container Utama Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 shrink-0 h-screen sticky top-0 transition-all duration-300 z-40 ${
          isOpen ? "w-64" : "w-0 overflow-hidden border-none"
        }`}
      >
        <div className="p-4 md:p-6 flex flex-col h-full justify-between overflow-y-auto w-64">
          {/* Bahagian Atas: Logo & Butang Tutup (Hide) */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard">
              <img
                src="/favicon.svg"
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              title="Sembunyikan Sidebar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* Bahagian Menu Navigasi */}
          <div className="space-y-6 flex-1">
            {NAVIGATION_GROUPS.map((group, idx) => (
              <div key={idx}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                  {group.groupName}
                </p>
                <nav className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                          isActive
                            ? "bg-amber-50 text-amber-800 border border-amber-200/60 shadow-2xs font-bold"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Info Perniagaan di bahagian bawah Sidebar */}
          <div className="pt-4 mt-6 border-t border-gray-100 shrink-0">
            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-xs space-y-0.5">
              <p className="font-bold text-amber-900">WakMan Catering</p>
              <p className="text-[10px] text-amber-700/80">
                Sistem Pentadbiran & Operasi
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
