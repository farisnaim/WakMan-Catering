"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Tarik jumlah notifikasi belum dibaca dari Supabase
  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error("Gagal menarik jumlah notifikasi:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Sediakan langganan real-time Supabase untuk jadual notifications
    const channel = supabase
      .channel("sidebar-notifications-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          fetchUnreadCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Susunan Menu Navigasi (Termasuk Menu Pemberitahuan Baru)
  const NAVIGATION_GROUPS: NavGroup[] = [
    {
      groupName: "Utama",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: "📊" },
        {
          label: "Pemberitahuan",
          href: "/notifications",
          icon: "🔔",
          badge: unreadCount,
        },
        { label: "Kalendar Majlis", href: "/calendar", icon: "📅" },
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
      groupName: "Pengurusan Krew",
      items: [
        { label: "Senarai Pramusaji", href: "/dashboard/waiters", icon: "👥" },
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

  return (
    <>
      {/* Butang Menu Burger Terapung */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-3 z-40 p-2.5 bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm rounded-xl text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition active:scale-95 cursor-pointer relative"
        title="Buka Menu"
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
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Latar Malap (Backdrop Overlay) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Container Utama Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out w-72 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex flex-col h-full justify-between overflow-y-auto">
          <div>
            {/* Header Sidebar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3"
              >
                <img
                  src="/favicon.svg"
                  alt="Logo"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h1 className="font-black text-slate-900 text-sm leading-tight">
                    WakMan Catering
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Panel Kawalan Admin
                  </p>
                </div>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition active:scale-95 cursor-pointer"
                title="Tutup Menu"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Menu Navigasi */}
            <div className="space-y-6">
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
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                            isActive
                              ? "bg-amber-50 text-amber-900 border border-amber-200/60 shadow-xs font-bold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-3 whitespace-nowrap">
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                          </div>

                          {/* Lencana Angka Notifikasi jika ada */}
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {item.badge > 99 ? "99+" : item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          {/* Info Perniagaan Bawah Sidebar */}
          <div className="pt-4 mt-6 border-t border-gray-100 shrink-0">
            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/80 text-xs space-y-0.5">
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
