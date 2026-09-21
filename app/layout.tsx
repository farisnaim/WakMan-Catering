import type { Metadata } from "next";
import "./globals.css"; // Sesuaikan path fail CSS global anda jika perlu

export const metadata: Metadata = {
  title: "Wak Man Catering",
  description: "Sajian Tempahan & Perkhidmatan Katering Terbaik",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
