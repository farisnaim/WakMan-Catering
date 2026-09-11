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

interface QuotationItem {
  id?: string | number;
  item_name?: string;
  qty?: number;
  quantity?: number;
  unit_price?: number;
  price?: number;
}

interface PublicQuotationData {
  id: number;
  customer_id: number;
  event_date: string | null;
  order_details: string | null;
  status: string;
  total_price: number | null;
  created_at: string;
  quotation_data?: {
    items?: QuotationItem[];
    notes?: string;
    total_price?: number;
  } | null;
  customers: CustomerData | null;
}

export default function PublicQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [quotation, setQuotation] = useState<PublicQuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchPublicQuotation();
    }
  }, [orderId]);

  const fetchPublicQuotation = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Ambil data order berasaskan ID
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !orderData) throw orderError;

      // 2. Ambil data pelanggan secara berasingan
      let customerData: CustomerData | null = null;
      if (orderData.customer_id) {
        const { data: custData } = await supabase
          .from("customers")
          .select("customer_name, customer_phone, address1, address2")
          .eq("id", orderData.customer_id)
          .single();

        if (custData) {
          customerData = custData as CustomerData;
        }
      }

      setQuotation({
        ...orderData,
        customers: customerData,
      } as PublicQuotationData);
    } catch (err: any) {
      console.error("Ralat carian sebut harga:", err?.message || err);
      setErrorMessage(
        "Sebut harga tidak dijumpai atau pautan ini tidak lagi sah.",
      );
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-xs text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p>Sedang memuatkan sebut harga...</p>
      </div>
    );
  }

  if (errorMessage || !quotation) {
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

  const itemsList = quotation.quotation_data?.items || [];
  const totalPrice = Number(
    quotation.total_price || quotation.quotation_data?.total_price || 0,
  );
  const formattedDate = new Date(quotation.created_at).toLocaleDateString(
    "ms-MY",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* BAR TINDAKAN */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <div>
            <span className="text-xs font-bold text-slate-600">
              Dokumen Sebut Harga Awam
            </span>
            <p className="text-[11px] text-slate-400">
              Anda boleh mencetak atau memuat turun dokumen ini sebagai PDF.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🖨️</span> Cetak / Simpan PDF
          </button>
        </div>

        {/* KAD DOKUMEN SEBUT HARGA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0 print:rounded-none">
          {/* Header Utama */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                AYAM PANGGANG CATERING
              </h2>
              <p className="text-xs text-slate-500">
                Perkhidmatan Katering & Tempahan Acara
              </p>
              <p className="text-xs font-mono text-slate-500">
                Hubungi: +60 12-345 6789
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <h1 className="text-2xl font-black uppercase text-blue-600 tracking-wider">
                SEBUT HARGA
              </h1>
              <p className="text-xs font-mono font-bold text-slate-800">
                #ORD-{quotation.id.toString().padStart(4, "0")}
              </p>
              <div className="text-[11px] text-slate-500 pt-1 space-y-0.5">
                <p>
                  <strong className="text-slate-700">Tarikh Dokumen:</strong>{" "}
                  {formattedDate}
                </p>
                <p>
                  <strong className="text-slate-700">Tarikh Majlis:</strong>{" "}
                  {quotation.event_date || "Akan Dimaklumkan"}
                </p>
              </div>
            </div>
          </div>

          {/* Maklumat Pelanggan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100 print:bg-transparent print:p-0 print:border-none">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Disediakan Untuk:
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {quotation.customers?.customer_name || "Pelanggan Tanpa Nama"}
              </p>
              <p className="font-mono text-slate-600">
                No. Tel: {quotation.customers?.customer_phone || "-"}
              </p>
              {(quotation.customers?.address1 ||
                quotation.customers?.address2) && (
                <p className="text-slate-500 pt-0.5">
                  {quotation.customers?.address1}
                  {quotation.customers?.address2 &&
                    `, ${quotation.customers?.address2}`}
                </p>
              )}
            </div>
          </div>

          {/* Senarai Itemized / Details */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Perincian Sebut Harga
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
                      const qty = Number(item.qty || item.quantity || 1);
                      const unitPrice = Number(
                        item.unit_price || item.price || 0,
                      );
                      const itemTotal = qty * unitPrice;

                      return (
                        <tr key={idx}>
                          <td className="py-3 px-3 font-mono text-center text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {item.item_name || "Menu / Perkhidmatan"}
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
                        className="py-4 px-3 text-slate-600 leading-relaxed whitespace-pre-line"
                      >
                        {quotation.order_details ||
                          "Perincian tempahan seperti yang dibincangkan."}
                      </td>
                      <td className="py-4 px-3 text-right font-mono font-bold text-slate-900 align-top">
                        {formatRM(totalPrice)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ringkasan Anggaran Jumlah */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <div className="space-y-2 text-xs text-right w-full sm:w-1/2">
              <div className="flex justify-between gap-6 pt-2 text-base font-black text-slate-900">
                <span>ANGGARAN JUMLAH:</span>
                <span className="font-mono text-blue-600">
                  {formatRM(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Nota Sebut Harga */}
          {quotation.quotation_data?.notes && (
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <p className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                Terma & Nota Sebut Harga:
              </p>
              <p className="whitespace-pre-line leading-relaxed text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100 print:bg-transparent print:p-0 print:border-none">
                {quotation.quotation_data.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
            <p className="font-medium">
              Sebut harga ini adalah anggaran dan tertakluk kepada pengesahan
              tempahan.
            </p>
            <p>Sila hubungi pihak kami untuk mengesahkan tempahan anda.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
