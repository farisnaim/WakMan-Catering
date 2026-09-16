"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Ambil semua notifikasi dari Supabase
  const fetchAllNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllNotifications();

    // Realtime Listener untuk mengemas kini senarai sejarah secara automatik
    const channel = supabase
      .channel("realtime-notifications-history")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          fetchAllNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Tanda Notifikasi Spesifik Sebagai Dibaca
  const markAsRead = async (id: number) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  };

  // Tanda Semua Notifikasi Sebagai Dibaca
  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // Padam Notifikasi
  const deleteNotification = async (id: number) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Tapisan data mengikut filter & carian
  const filteredNotifications = notifications.filter((item) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "unread"
          ? !item.is_read
          : item.is_read;

    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header Halaman */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}
          >
            Sejarah Notifikasi
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
            Rekod penuh kesemua pemberitahuan dan aktiviti sistem
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Tanda Semua Dibaca
        </button>
      </div>

      {/* Bar Carian & Filter */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Cari notifikasi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            fontSize: "14px",
          }}
        />
        <div style={{ display: "flex", gap: "6px" }}>
          {(["all", "unread", "read"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: filter === type ? "#0f172a" : "#ffffff",
                color: filter === type ? "#ffffff" : "#475569",
                fontSize: "13px",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {type === "all"
                ? "Semua"
                : type === "unread"
                  ? "Belum Dibaca"
                  : "Sudah Dibaca"}
            </button>
          ))}
        </div>
      </div>

      {/* Senarai Sejarah Notifikasi */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          Memuatkan notifikasi...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            color: "#64748b",
          }}
        >
          Tiada rekod notifikasi dijumpai.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "16px",
                backgroundColor: item.is_read ? "#ffffff" : "#eff6ff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ flex: 1, marginRight: "12px" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#0f172a",
                    }}
                  >
                    {item.title}
                  </span>
                  {!item.is_read && (
                    <span
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "#fff",
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      Baru
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#334155",
                    marginTop: "4px",
                  }}
                >
                  {item.message}
                </p>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    marginTop: "8px",
                  }}
                >
                  {new Date(item.created_at).toLocaleString("ms-MY", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>

              {/* Butang Tindakan */}
              <div style={{ display: "flex", gap: "8px" }}>
                {!item.is_read && (
                  <button
                    onClick={() => markAsRead(item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Tanda Dibaca
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(item.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
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
