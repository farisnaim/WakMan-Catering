"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const whatsappNumber = "60103068294";
  const defaultGreeting = encodeURIComponent(
    "Assalammualaikum Wakman Catering, saya berminat untuk bertanyakan maklumat berkaitan pakej tempahan catering.",
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultGreeting}`;

  const navLinks = [
    { name: "Utama", href: "/" },
    { name: "Pakej Menu", href: "/menu" },
    { name: "Portal Pelanggan", href: "/portal-pelanggan" },
    { name: "Sertai Kami", href: "/sertai-kami" },
    { name: "Testimoni", href: "/testimoni" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* LOGO & BRANDING */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#FEFEFA] flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20 transition group-hover:scale-105">
            <img
              src="/favicon.svg"
              alt="logo wakman catering"
              className="w-12 h-12 object-contain"
            />
          </div>
          <div>
            <span className="font-black tracking-tight text-lg sm:text-xl text-white block leading-none">
              WAKMAN CATERING
            </span>
            <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">
              Sajian Katering Berkualiti
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS (DESKTOP) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  active
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* ACTION BUTTONS (DESKTOP) */}
        <div className="hidden lg:flex items-center gap-2 sm:gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
          >
            <span>💬</span> Hubungi Kami
          </a>
          <Link
            href="/dashboard"
            className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition"
          >
            Log Masuk Admin
          </Link>
        </div>

        {/* HAMBURGER BUTTON (MOBILE) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 text-xs font-bold rounded-xl transition ${
                    active
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center px-4 py-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <span>💬</span> Hubungi Kami (WhatsApp)
            </a>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-3 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition"
            >
              Log Masuk Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
