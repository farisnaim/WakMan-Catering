"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface WaiterApplication {
  id: string;
  created_at: string;
  full_name: string;
  phone_number: string;
  age: number;
  gender: string;
  location: string;
  has_experience: boolean;
  transportation: string;
  availability: string;
  shirt_size: string;
  status: string;
}

export default function AdminWaitersPage() {
  const [applications, setApplications] = useState<WaiterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("waiter_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("Ralat mengambil senarai pemohon:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("waiter_applications")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item,
        ),
      );
    } catch (err) {
      console.error("Gagal mengemaskini status:", err);
      alert("Gagal mengemaskini status pemohon.");
    }
  };

  // Format Tarikh & Masa
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ms-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  // Format Jantina kepada L/P sahaja
  const formatGender = (gender: string) => {
    if (!gender) return "-";
    const g = gender.toLowerCase().trim();
    if (g.startsWith("l") || g.includes("lelaki") || g.includes("male"))
      return "L";
    if (g.startsWith("p") || g.includes("perempuan") || g.includes("female"))
      return "P";
    return gender.toUpperCase();
  };

  // Format Nombor Telefon untuk Pautan WhatsApp
  const formatPhoneForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "60" + cleaned.slice(1);
    }
    return cleaned;
  };

  // Tapis Senarai Pemohon
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone_number?.includes(searchTerm) ||
      app.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || app.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 space-y-6 font-sans">
      {/* HEADER NAV */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-xs text-amber-700 hover:text-amber-800 hover:underline font-bold"
            >
              ← Kembali ke Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Pengurusan Krew Pramusaji
          </h1>
          <p className="text-xs text-slate-500">
            Senarai permohonan pramusaji dan penanggah dari borang awam.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition active:scale-95 cursor-pointer"
        >
          🔄 Muat Semula Data
        </button>
      </div>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Jumlah Permohonan
          </span>
          <span className="text-2xl font-black text-slate-900">
            {applications.length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-600 block">
            Belum Diproses (Pending)
          </span>
          <span className="text-2xl font-black text-amber-600">
            {
              applications.filter((a) => a.status === "pending" || !a.status)
                .length
            }
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block">
            Menerima Tawaran (Shortlisted)
          </span>
          <span className="text-2xl font-black text-emerald-600">
            {applications.filter((a) => a.status === "shortlisted").length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-600 block">
            Ditolak (Rejected)
          </span>
          <span className="text-2xl font-black text-rose-600">
            {applications.filter((a) => a.status === "rejected").length}
          </span>
        </div>
      </div>

      {/* CARIAN & TAPISAN */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Cari nama, nombor telefon, atau kawasan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs transition"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500 shadow-xs transition"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* JADUAL SENARAI PEMOHON */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-mono">
          Sedang memuatkan senarai pemohon...
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs shadow-xs">
          Tiada rekod permohonan dijumpai.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                <th className="p-4 whitespace-nowrap">Tarikh & Masa</th>
                <th className="p-4 whitespace-nowrap">Nama Penuh & Telefon</th>
                <th className="p-4 whitespace-nowrap text-center">Umur</th>
                <th className="p-4 whitespace-nowrap text-center">Jantina</th>
                <th className="p-4 whitespace-nowrap">Kawasan</th>
                <th className="p-4 whitespace-nowrap text-center">
                  Pengalaman
                </th>
                <th className="p-4 whitespace-nowrap">Kenderaan</th>
                <th className="p-4 whitespace-nowrap">Ketersediaan</th>
                <th className="p-4 whitespace-nowrap text-center">Saiz Baju</th>
                <th className="p-4 whitespace-nowrap">Status</th>
                <th className="p-4 whitespace-nowrap text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredApplications.map((app) => {
                const formattedPhone = formatPhoneForWhatsApp(app.phone_number);
                const waMessage = encodeURIComponent(
                  `Assalamualaikum ${app.full_name}, kami dari Wak Man Catering ingin bertanya ketersediaan anda untuk tugasan pramusaji majlis.`,
                );
                const waUrl = `https://wa.me/${formattedPhone}?text=${waMessage}`;

                return (
                  <tr key={app.id} className="hover:bg-slate-50 transition">
                    {/* Masa & Tarikh */}
                    <td className="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDate(app.created_at)}
                    </td>

                    {/* Nama Penuh & Nombor Telefon */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                        {app.full_name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {app.phone_number}
                      </div>
                    </td>

                    {/* Umur */}
                    <td className="p-4 text-center font-medium text-slate-800">
                      {app.age}
                    </td>

                    {/* Jantina (L/P sahaja) */}
                    <td className="p-4 text-center font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                          formatGender(app.gender) === "L"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-pink-50 text-pink-700 border border-pink-200"
                        }`}
                      >
                        {formatGender(app.gender)}
                      </span>
                    </td>

                    {/* Kawasan tempat tinggal */}
                    <td className="p-4 text-slate-600">{app.location}</td>

                    {/* Pengalaman (Ya / Belum) */}
                    <td className="p-4 text-center">
                      {app.has_experience ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Ya
                        </span>
                      ) : (
                        <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                          Belum
                        </span>
                      )}
                    </td>

                    {/* Kenderaan */}
                    <td className="p-4 text-slate-600">
                      {app.transportation || "-"}
                    </td>

                    {/* Availability */}
                    <td className="p-4 text-slate-800 font-medium">
                      {app.availability || "-"}
                    </td>

                    {/* Saiz Baju */}
                    <td className="p-4 text-center">
                      <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                        {app.shirt_size || "-"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <select
                        value={app.status || "pending"}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border focus:outline-none focus:border-amber-500 cursor-pointer ${
                          app.status === "shortlisted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : app.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>

                    {/* Tindakan (WhatsApp) */}
                    <td className="p-4 text-center">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-bold text-[11px] rounded-xl transition shadow-xs"
                      >
                        <span>💬</span> WhatsApp
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
