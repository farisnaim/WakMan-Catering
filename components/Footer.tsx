"use client";

import Link from "next/link";

export default function Footer() {
  const whatsappNumber = "60103068294";
  const defaultGreeting = encodeURIComponent(
    "Assalammualaikum Wakman Catering, saya berminat untuk bertanyakan maklumat berkaitan pakej tempahan catering.",
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultGreeting}`;

  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-10 text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* PERIHAL */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FEFEFA] flex items-center justify-center font-black text-slate-950 text-sm">
                <img
                  src="/favicon.svg"
                  alt="logo wakman catering"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="font-black text-white text-base">
                WAKMAN CATERING
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Pakar perkhidmatan katering & sajian makanan terbaik untuk majlis
              perkahwinan, kesyukuran, akikah, dan acara korporat.
            </p>
          </div>

          {/* PAUTAN PANTAS */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Pautan Pantas
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/menu" className="hover:text-amber-400 transition">
                  Pakej Menu Katering
                </Link>
              </li>
              <li>
                <Link
                  href="/portal-pelanggan"
                  className="hover:text-amber-400 transition"
                >
                  Semakan Invois Pelanggan
                </Link>
              </li>
              <li>
                <Link
                  href="/sertai-kami"
                  className="hover:text-amber-400 transition"
                >
                  Sertai Kami (Pramusaji)
                </Link>
              </li>
              <li>
                <Link
                  href="/testimoni"
                  className="hover:text-amber-400 transition"
                >
                  Maklum Balas & Testimoni
                </Link>
              </li>
            </ul>
          </div>

          {/* HUBUNGI KAMI */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Hubungi Kami
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Sebarang pertanyaan atau tempahan terus, sila hubungi kami melalui
              WhatsApp rasmi.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition font-medium"
            >
              <span>💬</span> 010-3068294
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} Wakman Catering. Hak Cipta Terpelihara.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-slate-200 transition"
            >
              Portal Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
