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
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Top Navbar Statik */}
        <AdminNavbar />

        {/* Bahagian Bawah (Sidebar + Main Content) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Statik */}
          <AdminSidebar />

          {/* Hanya kawasan kandungan ini yang akan diskrol */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
        </div>

        {/* Butang Tindakan Pantas Terapung */}
        <QuickActionButton />
      </div>
    </PinGate>
  );
}
