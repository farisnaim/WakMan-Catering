"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface CustomerData {
  customer_name: string;
  customer_phone: string;
  address1: string | null;
  address2: string | null;
}

interface InvoiceItem {
  id?: number | string;
  item_name?: string;
  name?: string;
  description?: string | null;
  quantity?: number;
  qty?: number;
  unit_price?: number;
  price?: number;
  total_price?: number;
  amount?: number;
}

interface PublicInvoiceData {
  id: number;
  invoice_number: string;
  slug: string | null;
  invoice_date: string | null;
  due_date: string | null;
  total_amount: number;
  deposit_paid: number;
  balance_due?: number;
  balanced_due?: number;
  status: string;
  notes: string | null;
  items_data: InvoiceItem[] | null;
  customer_id?: number | null;
  customers: CustomerData | null;
}

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slugParam = resolvedParams.slug;

  const [invoice, setInvoice] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (slugParam) {
      fetchPublicInvoice();
    }
  }, [slugParam]);

  const fetchPublicInvoice = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Ambil data invois sahaja dahulu untuk mengelakkan ralat 'embed/relationship' Supabase
      let query = supabase.from("invoices").select("*");

      const isNumeric = /^\d+$/.test(slugParam);
      if (isNumeric) {
        query = query.or(
          `id.eq.${slugParam},invoice_number.eq.${slugParam},slug.eq.${slugParam}`,
        );
      } else {
        query = query.or(`slug.eq.${slugParam},invoice_number.eq.${slugParam}`);
      }

      const { data: invData, error: invError } = await query.single();
      if (invError || !invData) throw invError;

      // 2. Ambil data pelanggan secara berasingan sekiranya customer_id wujud
      let customerData: CustomerData | null = null;
      if (invData.customer_id) {
        const { data: custData } = await supabase
          .from("customers")
          .select("customer_name, customer_phone, address1, address2")
          .eq("id", invData.customer_id)
          .single();

        if (custData) {
          customerData = custData as CustomerData;
        }
      }

      // 3. Gabungkan maklumat invois bersama data pelanggan
      setInvoice({
        ...invData,
        customers: customerData,
      } as PublicInvoiceData);
    } catch (err: any) {
      console.error(
        "Ralat carian invois awam:",
        err?.message || err?.details || JSON.stringify(err),
      );
      setErrorMessage("Invois tidak dijumpai atau pautan ini tidak lagi sah.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatRM = (val: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(val || 0);
  };

  const getStatusBadge = (st: string) => {
    switch (st?.toLowerCase()) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "partial":
      case "partially_paid":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "unpaid":
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "overdue":
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-xs text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p>Sedang memuatkan paparan invois...</p>
      </div>
    );
  }

  if (errorMessage || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
            !
          </div>
          <h1 className="text-base font-bold text-slate-900">
            Dokumen Tidak Dijumpai
          </h1>
          <p className="text-xs text-slate-500">{errorMessage}</p>
        </div>
      </div>
    );
  }

  const totalAmount = Number(invoice.total_amount) || 0;
  const paidAmount = Number(invoice.deposit_paid) || 0;
  const balanceDue =
    Number(invoice.balance_due ?? invoice.balanced_due) ??
    Math.max(0, totalAmount - paidAmount);

  // Normalisasi items_data (JSONB)
  const itemsList = Array.isArray(invoice.items_data) ? invoice.items_data : [];

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* BAR TINDAKAN (Disorokkan semasa cetak) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">
              Status Bayaran:
            </span>
            <span
              className={`px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                invoice.status,
              )}`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🖨️</span> Cetak / Simpan PDF
            </button>
          </div>
        </div>

        {/* KAD DOKUMEN INVOIS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0 print:rounded-none">
          {/* Header Utama */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 border-b border-slate-100 pb-6">
            <div>
              <img
                src="/favicon.svg"
                alt="logo wakman"
                className="w-24 h-24 object-contain"
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                KAMARUZAMAN ZAINUDDIN
              </h2>
              <p className="text-xs text-slate-500">Perkhidmatan Catering &</p>
              <p className="text-xs text-slate-500">
                Tempahan Makanan Secara Korporat
              </p>
              <p className="text-xs font-mono font-bold text-slate-500">
                202103208150 (CT0091538-M)
              </p>
              <p className="text-xs font-mono text-slate-500">
                ☎️ Admin: 010 306 8294
              </p>
              <p className="text-xs font-mono text-slate-500">
                📞 WakMan: 019 645 6542
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <h1 className="text-2xl font-black uppercase text-blue-600 tracking-wider">
                INVOIS
              </h1>
              <p className="text-xs font-mono font-bold text-slate-800">
                #{invoice.invoice_number}
              </p>
              <div className="text-[11px] text-slate-500 pt-1 space-y-0.5">
                <p>
                  <strong className="text-slate-700">Tarikh Invois:</strong>{" "}
                  {invoice.invoice_date || "-"}
                </p>
                <p>
                  <strong className="text-slate-700"> Bayar Sebelum :</strong>{" "}
                  {invoice.due_date || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Maklumat Pelanggan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100 print:bg-transparent print:p-0 print:border-none">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Ditujukan Kepada:
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {invoice.customers?.customer_name || "Pelanggan Tanpa Nama"}
              </p>
              <p className="font-mono text-slate-600">
                No. Tel: {invoice.customers?.customer_phone || "-"}
              </p>
              {(invoice.customers?.address1 || invoice.customers?.address2) && (
                <p className="text-slate-500 pt-0.5">
                  {invoice.customers?.address1}
                  {invoice.customers?.address2 &&
                    `, ${invoice.customers?.address2}`}
                </p>
              )}
            </div>
          </div>

          {/* Senarai Perkhidmatan */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pecahan Perkhidmatan & Caj
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-y border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Keterangan Item</th>
                    <th className="py-2.5 px-3 text-center w-20">Kuantiti</th>
                    <th className="py-2.5 px-3 text-right w-28">Harga Unit</th>
                    <th className="py-2.5 px-3 text-right w-28">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {itemsList.length > 0 ? (
                    itemsList.map((item, idx) => {
                      const name =
                        item.item_name || item.name || "Perkhidmatan Katering";
                      const qty = Number(item.quantity || item.qty || 1);
                      const unitPrice = Number(
                        item.unit_price || item.price || 0,
                      );
                      const itemTotal = Number(
                        item.total_price || item.amount || qty * unitPrice,
                      );

                      return (
                        <tr key={item.id || idx}>
                          <td className="py-3 px-3 font-mono text-center text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900">{name}</p>
                            {item.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            {qty}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {formatRM(unitPrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRM(itemTotal)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-3 px-3 italic text-slate-500"
                      >
                        Perkhidmatan / Tempahan Invois
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRM(totalAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ringkasan Bayaran & QR */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-4 print:border-slate-300">
              <div className="relative w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                <Image
                  src="/qr-duitnow.png"
                  alt="DuitNow QR Payment"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900">Imbas Untuk Bayar</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Gunakan aplikasi Perbankan Dalam Talian atau E-Wallet untuk
                  imbas QR DuitNow ini.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-right">
              <div className="flex justify-between sm:justify-end gap-6 text-slate-600">
                <span>Jumlah Keseluruhan:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatRM(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-6 text-emerald-600">
                <span>Bayaran Diterima:</span>
                <span className="font-mono font-bold">
                  {formatRM(paidAmount)}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-6 pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>Baki Perlu Dibayar:</span>
                <span className="font-mono text-blue-600">
                  {formatRM(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Nota & Terma Bayaran */}
          {invoice.notes && (
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <p className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                Nota & Terma Bayaran:
              </p>
              <p className="whitespace-pre-line leading-relaxed text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100 print:bg-transparent print:p-0 print:border-none">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
            <p className="font-medium">
              Terima kasih kerana berurus niaga dengan kami!
            </p>
            <p>
              Dokumen ini dijana secara automatik dan sah tanpa tandatangan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
