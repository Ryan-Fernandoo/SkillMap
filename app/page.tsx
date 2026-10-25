"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  LockKeyhole,
  Menu,
  Palette,
  Play,
  Route,
  Sparkles,
  Target,
  Users,
  X,
  ClipboardCheck,
} from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8fbff] text-slate-950">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/70 bg-white">
        <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-5 sm:h-[70px] sm:px-8 lg:px-10">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="group flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition duration-300 group-hover:-translate-y-0.5 sm:h-10 sm:w-10">
              S
            </span>

            <span className="text-lg font-bold tracking-tight text-slate-950">
              Skill<span className="text-blue-600">Map</span>
            </span>
          </Link>

          {/* DESKTOP NAV */}

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#beranda"
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Beranda
            </a>

            <a
              href="#fitur"
              className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >
              Fitur
            </a>

            <a
              href="#tentang"
              className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >
              Tentang
            </a>
          </div>

          {/* DESKTOP ACTION */}

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
            >
              Masuk
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Daftar
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 md:hidden"
            aria-label="Buka menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={23} />
          </button>
        </div>
      </nav>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden">
          <div className="flex h-[64px] items-center justify-between border-b border-slate-200 px-5">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20">
                S
              </span>

              <span className="text-lg font-bold tracking-tight text-slate-950">
                Skill<span className="text-blue-600">Map</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
              aria-label="Tutup menu"
            >
              <X size={23} />
            </button>
          </div>

          <div className="px-5 py-6">
            <nav className="space-y-2">
              <a
                href="#beranda"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center rounded-xl bg-blue-50 px-4 py-3.5 text-sm font-semibold text-blue-600"
              >
                Beranda
              </a>

              <a
                href="#fitur"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center rounded-xl px-4 py-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Fitur
              </a>

              <a
                href="#tentang"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center rounded-xl px-4 py-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Tentang
              </a>
            </nav>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Masuk
              </Link>

              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20"
              >
                Daftar
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        id="beranda"
        className="relative overflow-hidden border-b border-slate-200/70 pt-[64px] sm:pt-[70px]"
      >
        <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />

        <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-yellow-100/60 blur-3xl" />

        <div className="mx-auto max-w-7xl px-5 pb-10 pt-10 sm:px-8 sm:pb-14 sm:pt-14 lg:px-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            {/* HERO LEFT */}

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-semibold text-blue-600 shadow-sm sm:px-3.5 sm:py-2 sm:text-xs">
                <Sparkles size={13} />
                Pemetaan Kompetensi Berbasis Benchmark Industri
              </div>

              <h1 className="mt-5 max-w-3xl text-[43px] font-black leading-[0.98] tracking-[-0.045em] text-slate-950 sm:mt-6 sm:text-6xl lg:text-[66px]">
                Pahami
                <br />
                Potensimu,
                <br />
                <span className="text-blue-600">
                  Rancang Masa
                  <br />
                  Depanmu.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-[14px] leading-6 text-slate-600 sm:text-base sm:leading-7 lg:text-lg">
                Ukur kompetensimu berdasarkan benchmark industri, temukan
                skill gap, dan bangun roadmap pengembangan yang lebih terarah
                untuk mencapai target kariermu.
              </p>

              <div className="mt-7">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition duration-300 hover:-translate-y-1 hover:bg-blue-700 sm:w-auto"
                >
                  Mulai Pemetaan Skill
                  <ArrowRight size={17} />
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-200 pt-6 sm:flex sm:flex-wrap sm:gap-x-10 sm:gap-y-4">
                <MiniStat
                  value="5"
                  label="Jalur Karier"
                  icon={<BriefcaseBusiness size={14} />}
                />

                <MiniStat
                  value="AI"
                  label="Analisis & Rekomendasi"
                  icon={<Sparkles size={14} />}
                />

                <MiniStat
                  value="4"
                  label="Tahap Pengembangan"
                  icon={<Route size={14} />}
                />
              </div>
            </div>

            {/* =================================================
                CAREER COMPASS
            ================================================= */}

            <div className="relative mx-auto mt-4 h-[330px] w-full max-w-[360px] sm:mt-8 sm:h-[370px] sm:max-w-[430px] lg:mt-0 lg:h-[410px] lg:max-w-[500px]">
              <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/60 blur-3xl sm:h-[280px] sm:w-[280px] lg:h-[300px] lg:w-[300px]" />

              <div className="absolute right-7 top-6 h-2.5 w-2.5 rounded-full bg-blue-400 sm:right-10 sm:top-8 sm:h-3 sm:w-3" />

              <div className="absolute bottom-7 left-7 h-2.5 w-2.5 rounded-full bg-yellow-400 sm:bottom-8 sm:left-10 sm:h-3 sm:w-3" />

              <div className="absolute bottom-20 right-8 h-2 w-2 rounded-full bg-violet-400 sm:bottom-24 sm:right-12 sm:h-2.5 sm:w-2.5" />

              <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 sm:h-[270px] sm:w-[270px] lg:h-[300px] lg:w-[300px]">
                <div className="absolute inset-0 rounded-full border border-blue-100 bg-white/30" />

                <div className="absolute inset-5 rounded-full border border-blue-100/90 sm:inset-7" />

                <div className="absolute inset-10 rounded-full border border-dashed border-slate-200 sm:inset-14" />

                <span className="absolute left-1/2 top-[-3px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-blue-500 sm:h-3 sm:w-3" />

                <span className="absolute bottom-[-3px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-300 sm:h-3 sm:w-3" />

                <span className="absolute left-[-3px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-yellow-400 sm:h-3 sm:w-3" />

                <span className="absolute right-[-3px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-violet-400 sm:h-3 sm:w-3" />

                <div className="absolute left-1/2 top-1/2 h-[125px] w-[2px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-gradient-to-b from-blue-500 via-blue-300 to-transparent opacity-80 sm:h-[150px] lg:h-[170px]" />

                <div className="absolute left-1/2 top-1/2 h-[125px] w-[2px] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-gradient-to-b from-yellow-400 via-yellow-200 to-transparent opacity-60 sm:h-[150px] lg:h-[170px]" />

                <div className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-200 bg-white shadow-[0_18px_45px_rgba(37,99,235,0.15)] sm:h-[84px] sm:w-[84px] lg:h-[96px] lg:w-[96px]">
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 sm:h-[60px] sm:w-[60px] lg:h-[68px] lg:w-[68px]">
                    <Compass
                      size={24}
                      className="animate-[compassFloat_4s_ease-in-out_infinite] sm:h-[28px] sm:w-[28px] lg:h-[31px] lg:w-[31px]"
                    />
                  </div>
                </div>

                <CompassLabel
                  position="left-1/2 top-[-42px] -translate-x-1/2 sm:top-[-50px] lg:top-[-58px]"
                  icon={<Target size={15} />}
                  title="Target Karier"
                  subtitle="Tentukan arah"
                  tone="blue"
                />

                <CompassLabel
                  position="right-[-4px] top-1/2 -translate-y-1/2 sm:right-[-30px] lg:right-[-110px]"
                  icon={<BarChart3 size={15} />}
                  title="Kompetensi"
                  subtitle="Kenali potensimu"
                  tone="purple"
                />

                <CompassLabel
                  position="bottom-[-42px] left-1/2 -translate-x-1/2 sm:bottom-[-50px] lg:bottom-[-58px]"
                  icon={<Route size={15} />}
                  title="Pengembangan"
                  subtitle="Bangun langkahmu"
                  tone="green"
                />

                <CompassLabel
                  position="left-[-4px] top-1/2 -translate-y-1/2 sm:left-[-30px] lg:left-[-110px]"
                  icon={<Sparkles size={15} />}
                  title="Skill Gap"
                  subtitle="Temukan yang perlu dikembangkan"
                  tone="yellow"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CAREER PATHS
      ===================================================== */}

      <section className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600">
                <BriefcaseBusiness size={14} />
                Jalur Karier
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Pilih arah kariermu.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                SkillMap dikembangkan untuk membantu memetakan kompetensi pada
                berbagai jalur karier yang relevan.
              </p>
            </div>

            <div className="w-fit rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Jalur karier
              </p>

              <p className="mt-0.5 text-2xl font-black text-blue-600">5</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <CareerCard
              title="Business Analyst"
              description="Analisis kebutuhan bisnis dan pengambilan keputusan berbasis data."
              icon={<BarChart3 size={19} />}
              status="soon"
            />

            <CareerCard
              title="Data Analyst"
              description="Analisis data untuk menghasilkan insight dan keputusan yang lebih tepat."
              icon={<BarChart3 size={19} />}
              status="active"
            />

            <CareerCard
              title="Full Stack Web Developer"
              description="Pengembangan aplikasi web dari sisi frontend hingga backend."
              icon={<Route size={19} />}
              status="soon"
            />

            <CareerCard
              title="Product Management"
              description="Perencanaan dan pengembangan produk berdasarkan kebutuhan pengguna."
              icon={<Target size={19} />}
              status="soon"
            />

            <CareerCard
              title="UI/UX Designer"
              description="Perancangan pengalaman dan antarmuka produk yang berpusat pada pengguna."
              icon={<Palette size={19} />}
              status="soon"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          FITUR + VIDEO
      ===================================================== */}

      <section
        id="fitur"
        className="border-b border-slate-200/70 bg-[#f8fbff]"
      >
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600">
              <Sparkles size={14} />
              Cara Kerja SkillMap
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Bukan sekadar tes.
              <span className="block text-blue-600">
                Ini perjalanan pengembanganmu.
              </span>
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              Mulai dari memahami kompetensi, menemukan gap, hingga menentukan
              langkah pengembangan yang lebih terarah.
            </p>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.04)] sm:p-6">
              <div className="space-y-2">
                <JourneyCard
                  number="01"
                  icon={<ClipboardCheck size={19} />}
                  title="Skill Check"
                  description="Ukur kompetensi berdasarkan skill yang relevan dengan target kariermu."
                  tone="blue"
                />

                <JourneyCard
                  number="02"
                  icon={<BarChart3 size={19} />}
                  title="Skill Profile"
                  description="Lihat posisi kompetensimu dan pahami skill yang sudah kamu kuasai."
                  tone="purple"
                />

                <JourneyCard
                  number="03"
                  icon={<Target size={19} />}
                  title="Skill Gap"
                  description="Temukan kompetensi yang masih memiliki jarak terhadap benchmark."
                  tone="yellow"
                />

                <JourneyCard
                  number="04"
                  icon={<Route size={19} />}
                  title="Roadmap"
                  description="Dapatkan fokus pengembangan yang lebih terarah berdasarkan gap."
                  tone="green"
                />
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.04)] sm:p-5">
              <div className="flex items-center justify-between px-1 pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-500">
                    Tutorial
                  </p>

                  <h3 className="mt-1 text-lg font-black text-slate-950">
                    Cara menggunakan SkillMap
                  </h3>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500">
                  Video
                </span>
              </div>

              <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-slate-950 to-slate-900" />

                <div className="relative flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-600 shadow-xl transition duration-300 group-hover:scale-105">
                    <Play size={24} fill="currentColor" className="ml-1" />
                  </div>

                  <p className="mt-4 text-sm font-bold text-white">
                    Video tutorial SkillMap
                  </p>

                  <p className="mt-1 max-w-xs text-[10px] leading-5 text-slate-400">
                    Video Coming Soon
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                  <Play size={14} />
                </span>

                <p className="text-[11px] leading-5 text-blue-700">
                  Video tutorial SkillMap akan segera hadir. Nantikan pembaruan
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TENTANG
      ===================================================== */}

      <section id="tentang" className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600">
                <Users size={14} />
                Tentang SkillMap
              </span>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                Bangun kompetensi
                <span className="block text-blue-600">
                  dengan arah yang jelas.
                </span>
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                SkillMap dirancang untuk membantu mahasiswa, fresh graduate,
                dan talenta muda memahami kesiapan kompetensi mereka secara
                lebih terukur.
              </p>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Bukan sekadar mengetahui skor, tetapi memahami apa yang sudah
                kuat, apa yang masih kurang, dan apa yang sebaiknya
                dikembangkan selanjutnya.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard
                icon={<ClipboardCheck size={18} />}
                title="Terukur"
                description="Kompetensi dipetakan secara sistematis."
              />

              <InfoCard
                icon={<Target size={18} />}
                title="Terarah"
                description="Skill gap membantu menentukan fokus."
              />

              <InfoCard
                icon={<Sparkles size={18} />}
                title="Berbasis AI"
                description="Analisis membantu menghasilkan rekomendasi."
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-blue-100 bg-[#EAF2FF]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-7 sm:px-8 md:flex-row lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20">
              S
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                <span className="text-lg font-bold tracking-tight text-slate-950">
                  Skill<span className="text-blue-600">Map</span>
                </span>
              </p>

              <p className="mt-0.5 text-[11px] text-blue-500">
                Pemetaan kompetensi untuk masa depan.
              </p>
            </div>
          </div>

          <span className="text-[12px] font-bold text-blue-400">
            © 2026 SkillMap
          </span>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-lg font-black leading-none text-slate-950">
          {value}
        </p>

        <p className="mt-1 text-[9px] font-medium leading-3 text-slate-400 sm:text-[10px]">
          {label}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   COMPASS LABEL
========================================================= */

function CompassLabel({
  position,
  icon,
  title,
  subtitle,
  tone,
}: {
  position: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone: "blue" | "purple" | "yellow" | "green";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-violet-50 text-violet-600 border-violet-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div
      className={`absolute ${position} w-[108px] sm:w-[145px] lg:w-[170px]`}
    >
      <div
        className={`rounded-xl border bg-white/95 px-2 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 sm:rounded-2xl sm:px-3 sm:py-3 ${styles[tone]}`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${styles[tone]}`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-black leading-3 text-slate-900 sm:text-[11px] sm:leading-4 lg:text-[12px]">
              {title}
            </p>

            <p className="mt-0.5 text-[7px] leading-3 text-slate-400 sm:mt-1 sm:text-[8px] sm:leading-3.5 lg:text-[9px]">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CAREER CARD
========================================================= */

function CareerCard({
  title,
  description,
  icon,
  status,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  status: "active" | "soon";
}) {
  const isActive = status === "active";

  return (
    <div
      className={`group relative overflow-hidden rounded-[22px] border bg-white p-5 transition duration-300 ${
        isActive
          ? "border-blue-200 shadow-[0_12px_35px_rgba(37,99,235,0.08)] hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(37,99,235,0.12)]"
          : "border-slate-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_15px_35px_rgba(15,23,42,0.06)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isActive
              ? "bg-blue-50 text-blue-600"
              : "bg-slate-50 text-slate-400"
          }`}
        >
          {icon}
        </div>

        {isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[9px] font-bold text-emerald-600">
            <CheckCircle2 size={10} />
            Tersedia
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold text-slate-400">
            <LockKeyhole size={10} />
            Segera Hadir
          </span>
        )}
      </div>

      <h3
        className={`mt-5 text-sm font-black leading-5 ${
          isActive ? "text-slate-950" : "text-slate-700"
        }`}
      >
        {title}
      </h3>

      <p className="mt-2 text-[10px] leading-5 text-slate-400">
        {description}
      </p>

      <div className="mt-5 text-[10px] font-semibold text-slate-300">
        {isActive ? "Siap digunakan" : "Sedang dikembangkan"}
      </div>
    </div>
  );
}

/* =========================================================
   JOURNEY CARD
========================================================= */

function JourneyCard({
  number,
  icon,
  title,
  description,
  tone,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
  tone: "blue" | "purple" | "yellow" | "green";
}) {
  const styles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      number: "text-blue-500",
    },
    purple: {
      icon: "bg-violet-50 text-violet-600",
      number: "text-violet-500",
    },
    yellow: {
      icon: "bg-yellow-50 text-yellow-600",
      number: "text-yellow-600",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600",
      number: "text-emerald-500",
    },
  };

  const current = styles[tone];

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition duration-300 hover:border-blue-100 hover:bg-white">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${current.icon}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black ${current.number}`}>
            {number}
          </span>

          <h3 className="text-sm font-black text-slate-950">{title}</h3>
        </div>

        <p className="mt-1 text-[10px] leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <ArrowRight
        size={15}
        className="shrink-0 text-slate-300 transition duration-300 group-hover:translate-x-1 group-hover:text-blue-500"
      />
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_15px_35px_rgba(15,23,42,0.06)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3>

      <p className="mt-1.5 text-[10px] leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}