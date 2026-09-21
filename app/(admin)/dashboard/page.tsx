"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PushNotificationManager from "@/components/PushNotificationManager";

interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  totalInvoices: number;
  totalRevenue: number;
  totalInvoicesAmount: number;
  pendingDeposit: number;
  unpaidInvoicesCount: number;
}

interface RecentOrder {
  id: number;
  event_date: string | null;
  status: string;
  total_price: number;
  created_at: string;
  customer_name: string;
}

interface RecentInvoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  balance_due: number;
  status: string;
  customer_name: string;
}

interface CustomerMapItem {
  id: number;
  customer_name: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalOrders: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    totalInvoicesAmount: 0,
    pendingDeposit: 0,
    unpaidInvoicesCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Langganan kemaskini masa nyata Supabase (Realtime)
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => {
          fetchDashboardData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchDashboardData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fungsi mengira baki terhutang berdasarkan status
  const calculateBalanceDue = (inv: any): number => {
    const status = (inv.status || "unpaid").toLowerCase();

    if (status === "paid") {
      return 0;
    }

    if (status === "partial") {
      return inv.balance_due !== null && inv.balance_due !== undefined
        ? Number(inv.balance_due)
        : Number(inv.total_amount) || 0;
    }

    if (status === "unpaid") {
      return inv.balance_due !== null && inv.balance_due !== undefined
        ? Number(inv.balance_due)
        : Number(inv.total_amount) || 0;
    }

    return inv.balance_due !== null && inv.balance_due !== undefined
      ? Number(inv.balance_due)
      : 0;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Dapatkan Senarai Pelanggan
      const { data: customersData, error: custError } = await supabase
        .from("customers")
        .select("id, customer_name");

      if (custError) console.error("Ralat Customers:", custError.message);

      const customerMap = new Map<number, string>();
      (customersData || []).forEach((c: CustomerMapItem) => {
        customerMap.set(c.id, c.customer_name);
      });

      // 2. Dapatkan Semua Tempahan (Orders)
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, customer_id, event_date, status, deposit_paid, total_price, created_at",
        )
        .order("created_at", { ascending: false });

      if (ordersError) console.error("Ralat Orders:", ordersError.message);

      // 3. Dapatkan Semua Invois Terkini
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(
          "id, customer_id, invoice_number, total_amount, balance_due, status, created_at",
        )
        .order("created_at", { ascending: false });

      if (invoicesError)
        console.error("Ralat Invoices:", invoicesError.message);

      // --- Pengiraan Statistik ---
      const totalCust = customersData?.length || 0;
      const totalOrd = ordersData?.length || 0;
      const totalInv = invoicesData?.length || 0;

      const revenue = (ordersData || []).reduce(
        (sum, item) => sum + (Number(item.total_price) || 0),
        0,
      );
      const deposits = (ordersData || []).reduce(
        (sum, item) => sum + (Number(item.deposit_paid) || 0),
        0,
      );

      const invTotalAmount = (invoicesData || []).reduce(
        (sum, item) => sum + (Number(item.total_amount) || 0),
        0,
      );

      const unpaidCount = (invoicesData || []).filter((inv) => {
        const st = (inv.status || "").toLowerCase();
        return st === "unpaid" || st === "partial" || st === "pending";
      }).length;

      setStats({
        totalCustomers: totalCust,
        totalOrders: totalOrd,
        totalInvoices: totalInv,
        totalRevenue: revenue,
        totalInvoicesAmount: invTotalAmount,
        pendingDeposit: deposits,
        unpaidInvoicesCount: unpaidCount,
      });

      if (ordersData) {
        const formattedOrders: RecentOrder[] = ordersData
          .slice(0, 5)
          .map((ord: any) => ({
            id: ord.id,
            event_date: ord.event_date,
            status: ord.status || "pending",
            total_price: Number(ord.total_price) || 0,
            created_at: ord.created_at,
            customer_name:
              customerMap.get(ord.customer_id) || "Pelanggan Tanpa Nama",
          }));
        setRecentOrders(formattedOrders);
      }

      if (invoicesData) {
        const formattedInvoices: RecentInvoice[] = invoicesData
          .slice(0, 5)
          .map((inv: any) => ({
            id: inv.id,
            invoice_number: inv.invoice_number || `#INV-${inv.id}`,
            total_amount: Number(inv.total_amount) || 0,
            balance_due: calculateBalanceDue(inv),
            status: inv.status || "unpaid",
            customer_name:
              customerMap.get(inv.customer_id) || "Pelanggan Tanpa Nama",
          }));
        setRecentInvoices(formattedInvoices);
      }
    } catch (err: any) {
      console.error("Ralat memuatkan data papan pemuka:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const formatRM = (val: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "partial":
      case "partially_paid":
      case "deposit_paid":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "unpaid":
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
      case "overdue":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 py-20">
        Sedang memuatkan data papan pemuka...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Tajuk Utama */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Dashboard Utama
          </h1>
          <p className="text-xs text-slate-500">
            Ringkasan prestasi perniagaan, tempahan, dan status invois.
          </p>
        </div>
        <div className="flex gap-2">
          <PushNotificationManager />
          <Link
            href="/orders/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            + Tempahan Baharu
          </Link>
        </div>
      </div>

      {/* Kad Statistik Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Jumlah Hasil Jualan (Orders) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Jumlah Tempahan
          </p>
          <p className="text-2xl font-black text-slate-900">
            {formatRM(stats.totalRevenue)}
          </p>
          <p className="text-[10px] text-slate-500">
            Nilai keseluruhan tempahan
          </p>
        </div>

        {/* Ringkasan Penjumlahan Invois */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            Jumlah Nilai Invois
          </p>
          <p className="text-2xl font-black text-blue-700">
            {formatRM(stats.totalInvoicesAmount)}
          </p>
          <p className="text-[10px] text-slate-500">
            Penjumlahan keseluruhan invois
          </p>
        </div>

        {/* Jumlah Deposit Diterima */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Jumlah Deposit
          </p>
          <p className="text-2xl font-black text-emerald-600">
            {formatRM(stats.pendingDeposit)}
          </p>
          <p className="text-[10px] text-slate-500">
            Deposit yang telah diterima
          </p>
        </div>

        {/* Bilangan Pelanggan & Tempahan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pelanggan & Tempahan
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats.totalCustomers}
            </span>
            <span className="text-xs text-slate-500">Pelanggan</span>
            <span className="text-slate-300">|</span>
            <span className="text-2xl font-black text-slate-900">
              {stats.totalOrders}
            </span>
            <span className="text-xs text-slate-500">Tempahan</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Rekod pengurusan perniagaan
          </p>
        </div>

        {/* Status Invois */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Status Invois
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">
              {stats.unpaidInvoicesCount}
            </span>
            <span className="text-xs text-slate-500">Belum Selesai</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">
              {stats.totalInvoices} Invois
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Memerlukan tindakan susulan
          </p>
        </div>
      </div>

      {/* Quick Button / Akses Cepat */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h2 className="font-bold text-slate-900 text-sm">
          Akses Pantas Modul Admin
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/dashboard/menus"
            className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl transition group"
          >
            <div>
              <p className="font-bold text-xs text-slate-800 group-hover:text-amber-700">
                Pakej Menu
              </p>
              <p className="text-[10px] text-slate-500">Pengurusan Menu</p>
            </div>
            <span className="text-slate-400 group-hover:text-amber-600 font-bold text-sm">
              →
            </span>
          </Link>

          <Link
            href="/dashboard/testimonials"
            className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl transition group"
          >
            <div>
              <p className="font-bold text-xs text-slate-800 group-hover:text-amber-700">
                Testimoni
              </p>
              <p className="text-[10px] text-slate-500">Pengurusan Ulasan</p>
            </div>
            <span className="text-slate-400 group-hover:text-amber-600 font-bold text-sm">
              →
            </span>
          </Link>

          <Link
            href="/dashboard/tetapan-pramusaji"
            className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl transition group"
          >
            <div>
              <p className="font-bold text-xs text-slate-800 group-hover:text-amber-700">
                Tetapan Pramusaji
              </p>
              <p className="text-[10px] text-slate-500">Halaman Rekrut</p>
            </div>
            <span className="text-slate-400 group-hover:text-amber-600 font-bold text-sm">
              →
            </span>
          </Link>

          <Link
            href="/dashboard/waiters"
            className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl transition group"
          >
            <div>
              <p className="font-bold text-xs text-slate-800 group-hover:text-amber-700">
                Permohonan Krew
              </p>
              <p className="text-[10px] text-slate-500">Senarai Pramusaji</p>
            </div>
            <span className="text-slate-400 group-hover:text-amber-600 font-bold text-sm">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* Jadual Aktiviti Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5 Tempahan Terkini */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-900 text-sm">
              Tempahan Terkini
            </h2>
            <Link
              href="/orders"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Tiada rekod tempahan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-2">Pelanggan</th>
                    <th className="pb-2">Tarikh Majlis</th>
                    <th className="pb-2 text-right">Jumlah</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-900">
                        {ord.customer_name}
                      </td>
                      <td className="py-3 text-slate-500">
                        {ord.event_date || "-"}
                      </td>
                      <td className="py-3 text-right font-mono font-bold">
                        {formatRM(ord.total_price)}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getStatusBadge(
                            ord.status,
                          )}`}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5 Invois Terkini */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-900 text-sm">Invois Terkini</h2>
            <Link
              href="/invoices"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Tiada rekod invois.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-2">No. Invois</th>
                    <th className="pb-2">Pelanggan</th>
                    <th className="pb-2 text-right">Baki Terhutang</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono font-bold text-blue-600">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 text-slate-900 font-medium">
                        {inv.customer_name}
                      </td>
                      <td
                        className={`py-3 text-right font-mono font-bold ${
                          inv.balance_due > 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatRM(inv.balance_due)}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getStatusBadge(
                            inv.status,
                          )}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
