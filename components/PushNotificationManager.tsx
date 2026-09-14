"use client";

import { useEffect, useState } from "react";

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      setSubscription(sub);

      // Hantar subscription ke backend
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      alert("Notifikasi skrin berjaya diaktifkan!");
    } catch (error) {
      console.error("Gagal mendaftar push notification:", error);
    }
  }

  if (!isSupported) return null;

  return (
    <div style={{ padding: "8px 0" }}>
      {!subscription ? (
        <button
          onClick={subscribeToPush}
          style={{
            backgroundColor: "#2563eb",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "bold",
          }}
        >
          📲 Aktifkan Notifikasi Skrin Telefon
        </button>
      ) : (
        <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>
          ✅ Notifikasi Skrin Aktif
        </span>
      )}
    </div>
  );
}

// Utility function
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
