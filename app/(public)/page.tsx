"use client";

import Link from "next/link";

export default function PublicLandingPage() {
  const whatsappNumber = "60103068294";
  const defaultGreeting = encodeURIComponent(
    "Assalammualaikum Wakman Catering, saya berminat untuk bertanyakan maklumat berkaitan pakej tempahan catering.",
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultGreeting}`;

  return (
    <div className="space-y-20 pt-10">
      {/* HERO SECTION */}
      <section className="max-w-5xl mx-auto px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          ✨ Pakar Sajian Majlis & Kenduri Kahwin
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Citarasa Tempatan & <br />
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
            Perkhidmatan Katering Terbaik
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
          Menyediakan hidangan yang sedap dan segar untuk sebarang majlis
          kesyukuran, perkahwinan, korporat, dan acara peribadi anda.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/menu"
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition"
          >
            Lihat Pakej Menu →
          </Link>
          <Link
            href="/portal-pelanggan"
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition"
          >
            Semak Invois Pelanggan
          </Link>
        </div>
      </section>

      {/* QUICK ACCESS CARDS */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/menu"
            className="group bg-slate-900/60 border border-slate-800 p-6 rounded-3xl hover:border-amber-500/40 transition space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition">
              🍱
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition">
              Pakej Menu Complete
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pilihan Pakej A, B, dan C berserta paparan gambar sajian makanan &
              minuman.
            </p>
          </Link>

          <Link
            href="/sertai-kami"
            className="group bg-slate-900/60 border border-slate-800 p-6 rounded-3xl hover:border-amber-500/40 transition space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition">
              🤝
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition">
              Sertai Sebagai Pramusaji
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Peluang kerjaya sambilan/krew majlis dengan pelbagai kelebihan
              disediakan.
            </p>
          </Link>

          <Link
            href="/testimoni"
            className="group bg-slate-900/60 border border-slate-800 p-6 rounded-3xl hover:border-amber-500/40 transition space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition">
              ⭐
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition">
              Ulasan & Feedback
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lihat apa kata pelanggan yang pernah menggunakan khidmat Wakman
              Catering.
            </p>
          </Link>
        </div>
      </section>

      {/* VIDEO & GALERI MAJLIS */}
      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Galeri & Video
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Suasana & Persediaan Majlis
          </h2>
        </div>

        <div className="w-full max-w-sm mx-auto aspect-[9/16] overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl">
          <video
            className="w-full h-full object-contain"
            autoPlay
            muted
            loop
            controls
            playsInline
            preload="metadata"
          >
            <source src="/ads.MP4" type="video/mp4" />
            Browser anda tidak menyokong elemen video.
          </video>
        </div>
      </section>

      {/* BANNER KHAS REKRUT PRAMUSAJI */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Peluang Kerjaya Sambilan
            </span>
            <h3 className="text-2xl font-black text-white">
              Berminat Sertai Krew Pramusaji / Penanggah?
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Sertai pasukan katering kami untuk menjayakan pelbagai majlis. Jom
              daftar sekarang.
            </p>
          </div>
          <Link
            href="/sertai-kami"
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 shrink-0 transition"
          >
            Maklumat Lanjut →
          </Link>
        </div>
      </section>
    </div>
  );
}
