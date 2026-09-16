"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Ambil notifikasi khas untuk HARI INI sahaja
  const fetchTodayNotifications = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
  };

  useEffect(() => {
    fetchTodayNotifications();

    // Setup Supabase Realtime Listener untuk Notifikasi Baharu
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new;
          const createdDate = new Date(newNotif.created_at);
          const today = new Date();

          // Semak sama ada notifikasi baharu dicipta pada hari ini
          if (createdDate.toDateString() === today.toDateString()) {
            setNotifications((prev) => [newNotif, ...prev]);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const updatedNotif = payload.new;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: number) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Butang Loceng Navbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          background: "#f1f5f9",
          border: "none",
          padding: "8px 12px",
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: "18px",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              backgroundColor: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "10px",
              fontWeight: "bold",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Notifikasi Navbar */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: "8px",
            width: "320px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 1000,
            maxHeight: "420px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header Dropdown */}
          <div
            style={{
              padding: "12px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontWeight: "bold", color: "#1e293b", fontSize: "14px" }}
            >
              Notifikasi Hari Ini
            </span>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              {new Date().toLocaleDateString("ms-MY", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>

          {/* Senarai Mesej Notifikasi */}
          <div style={{ overflowY: "auto", flex: 1, maxHeight: "300px" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  color: "#64748b",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              >
                Tiada notifikasi untuk hari ini.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #f8fafc",
                    backgroundColor: item.is_read ? "#ffffff" : "#eff6ff",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#0f172a",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#475569",
                      marginTop: "4px",
                    }}
                  >
                    {item.message}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      marginTop: "6px",
                    }}
                  >
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Dropdown ke Pautan History */}
          <div
            style={{
              padding: "10px",
              borderTop: "1px solid #f1f5f9",
              textAlign: "center",
              backgroundColor: "#f8fafc",
              borderBottomLeftRadius: "8px",
              borderBottomRightRadius: "8px",
            }}
          >
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: "12px",
                color: "#2563eb",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Lihat Semua Sejarah Notifikasi →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
