import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Mengelakkan caching static semasa build
export const revalidate = 0;

interface DashboardOrder {
  id: number;
  order_number?: string | null;
  event_date: string | null;
  status?: string | null;
  total_price?: number | null;
  customers: {
    customer_name: string;
    customer_phone: string;
  } | null;
}

async function getDashboardData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      event_date,
      status,
      total_price,
      customers!orders_customer_id_fkey (
        customer_name,
        customer_phone
      )
    `,
    )
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Ralat mengambil data dashboard:", error.message);
    return { orders: [], totalOrders: 0, pendingOrders: 0, totalRevenue: 0 };
  }

  const allOrders = (orders as unknown as DashboardOrder[]) || [];
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(
    (o) => o.status === "pending" || !o.status,
  ).length;
  const totalRevenue = allOrders.reduce(
    (acc, curr) => acc + (curr.total_price || 0),
    0,
  );

  return {
    orders: allOrders.slice(0, 5), // Ambil 5 tempahan terawal untuk paparan ringkas
    totalOrders,
    pendingOrders,
    totalRevenue,
  };
}

export default async function AdminDashboardPage() {
  const { orders, totalOrders, pendingOrders, totalRevenue } =
    await getDashboardData();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Utama */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Dashboard Utama Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan operasi katering, tempahan majlis, dan status semasa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            <span>📅</span>
            <span>Buka Kalendar Majlis</span>
          </Link>
        </div>
      </div>

      {/* Kad Stats / KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Jumlah Tempahan
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-800">
              {totalOrders}
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
              Keseluruhan
            </span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Menunggu Pengesahan
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-600">
              {pendingOrders}
            </span>
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium border border-amber-200">
              Perlu Tindakan
            </span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Anggaran Hasil
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800 font-mono">
              RM {totalRevenue.toFixed(2)}
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
              Terkumpul
            </span>
          </div>
        </div>
      </div>

      {/* Jadual / Senarai Tempahan Terkini */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-extrabold text-base text-slate-800">
            Tempahan Akan Datang!
          </h2>
          <Link
            href="/calendar"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 transition"
          >
            Lihat Semua di Kalendar →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Tiada rekod tempahan dijumpai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Pelanggan</th>
                  <th className="py-3 px-2">No. Telefon</th>
                  <th className="py-3 px-2">Tarikh Event</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {orders.map((ord) => {
                  let statusBadge =
                    "bg-amber-50 text-amber-800 border-amber-200";
                  if (ord.status === "confirmed")
                    statusBadge =
                      "bg-emerald-50 text-emerald-800 border-emerald-200";
                  if (ord.status === "completed")
                    statusBadge = "bg-sky-50 text-sky-800 border-sky-200";

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-3 px-2 font-bold text-slate-800">
                        {ord.customers?.customer_name || `ID: ${ord.id}`}
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-500">
                        {ord.customers?.customer_phone || "-"}
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {ord.event_date ? ord.event_date.split("T")[0] : "-"}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${statusBadge}`}
                        >
                          {ord.status || "baru"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-800">
                        {ord.total_price
                          ? `RM ${Number(ord.total_price).toFixed(2)}`
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
