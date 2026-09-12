import AdminNavbar from "@/components/admin/Navbar";
import AdminSidebar from "@/components/admin/Sidebar";
import QuickActionButton from "@/components/admin/QuickActionButton";
import PinGate from "@/components/PinGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PinGate>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased">
        {/* Top Navbar Statik */}
        <AdminNavbar />

        {/* Bahagian Bawah (Sidebar + Main Content) */}
        <div className="flex-1 flex flex-col md:flex-row min-w-0 w-full">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Kawasan Utama (Main Content) - Boleh skrol dan responsif pada skrin kecil */}
          <main className="flex-1 w-full min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>

        {/* Butang Tindakan Pantas Terapung */}
        <QuickActionButton />
      </div>
    </PinGate>
  );
}
