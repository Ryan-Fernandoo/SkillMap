"use client";

import {
  Check,
  Crown,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { isPremiumUser } from "@/lib/subscription";
import { supabase } from "@/lib/supabase";

export default function UpgradePage() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    async function checkPlan() {
      const premium = await isPremiumUser();

      setIsPremium(premium);
      setLoading(false);
    }

    checkPlan();
  }, []);

  async function handleUpgrade() {
    try {
      setPaymentLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        alert("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Gagal membuat transaksi pembayaran."
        );
      }

      if (!result?.token) {
        throw new Error("Token Midtrans tidak ditemukan.");
      }

      if (!window.snap) {
        throw new Error(
          "Midtrans Snap belum siap. Silakan refresh halaman dan coba lagi."
        );
      }

      window.snap.pay(result.token, {
        onSuccess: () => {
          alert(
            "Pembayaran berhasil. Premium akan aktif setelah pembayaran dikonfirmasi."
          );
        },

        onPending: () => {
          alert(
            "Pembayaran sedang menunggu penyelesaian."
          );
        },

        onError: () => {
          alert(
            "Pembayaran gagal. Silakan coba lagi."
          );
        },

        onClose: () => {
          console.log("Popup Midtrans ditutup.");
        },
      });
    } catch (error) {
      console.error("Payment error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat pembayaran."
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-5 w-32 rounded-full bg-slate-200" />

          <div className="mt-5 h-10 w-80 rounded-xl bg-slate-200" />

          <div className="mt-3 h-4 w-[480px] max-w-full rounded-full bg-slate-100" />

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="h-[520px] rounded-[28px] bg-white" />
            <div className="h-[520px] rounded-[28px] bg-white" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faff] px-6 py-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[30px] border border-blue-100 bg-white p-7 shadow-[0_15px_45px_rgba(37,99,235,0.06)] sm:p-9">
          <div className="relative z-10 max-w-3xl">

            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Sparkles size={20} />
              </span>

              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Tingkatkan Paket
              </span>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                  isPremium
                    ? "bg-blue-50 text-blue-600"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {isPremium ? "Premium" : "Freemium"}
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Kembangkan potensimu lebih jauh
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Buka analisis Skill Gap, Roadmap pengembangan,
              dan insight yang lebih lengkap untuk membantu
              kamu mencapai target karier.
            </p>
          </div>

          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-yellow-100/60 blur-3xl" />
        </section>

        {/* CURRENT STATUS */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isPremium
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {isPremium ? (
                  <Crown size={19} />
                ) : (
                  <Lock size={18} />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Paket saat ini
                </p>

                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {isPremium ? "Premium" : "Freemium"}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {isPremium
                ? "Kamu sudah memiliki akses Premium."
                : "Upgrade untuk membuka seluruh fitur pengembangan."}
            </p>
          </div>
        </section>

        {/* PRICING */}
        <section className="mt-6 grid gap-5 lg:grid-cols-2">

          <PlanCard
            type="free"
            title="Freemium"
            subtitle="Untuk mulai mengenal kemampuanmu"
            price="Rp0"
            priceSuffix="free"
            current={!isPremium}
            features={[
              "Skill Check",
              "Hasil pemetaan kompetensi",
              "Profil kompetensi dasar",
              "Target karier",
              "Preview Skill Gap",
              "Preview fitur pengembangan",
            ]}
          />

          <PlanCard
            type="premium"
            title="Premium"
            subtitle="Untuk pengembangan yang lebih terarah"
            price="Rp49.000"
            priceSuffix="/bulan"
            current={isPremium}
            recommended
            features={[
              "Semua fitur Freemium",
              "Analisis Skill Gap lengkap",
              "Prioritas kompetensi yang perlu dikembangkan",
              "Roadmap pengembangan",
              "Insight pengembangan berdasarkan hasil Skill Check",
              "Akses penuh fitur Premium",
            ]}
          />
        </section>

        {/* PREMIUM CTA */}
        {!isPremium && (
          <section className="mt-6 overflow-hidden rounded-[26px] border border-yellow-200 bg-white">
            <div className="bg-gradient-to-r from-yellow-50 via-white to-yellow-50/40 p-6 sm:p-7">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                    <Crown size={21} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-yellow-700">
                      Buka Premium
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-slate-950">
                      Siap melangkah lebih jauh?
                    </h2>

                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                      Dapatkan analisis yang lebih lengkap dan
                      gunakan hasilnya untuk menentukan langkah
                      pengembangan berikutnya.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={paymentLoading}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-yellow-500/20 transition hover:-translate-y-0.5 hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paymentLoading
                    ? "Menyiapkan pembayaran..."
                    : "Tingkatkan ke Premium"}

                  {!paymentLoading && (
                    <ArrowRight size={17} />
                  )}
                </button>

              </div>
            </div>
          </section>
        )}

        {/* PREMIUM ACTIVE */}
        {isPremium && (
          <section className="mt-6 rounded-[26px] border border-blue-100 bg-blue-50/50 p-6 sm:p-7">

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Premium
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  Semua fitur Premium sudah terbuka
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Kamu sudah dapat menggunakan Skill Gap
                  dan Roadmap secara penuh.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TRUST */}
        <section className="mt-7 pb-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-slate-400">

            <span className="flex items-center gap-2">
              <ShieldCheck
                size={14}
                className="text-emerald-500"
              />
              Pembayaran aman
            </span>

            <span className="flex items-center gap-2">
              <Zap
                size={14}
                className="text-emerald-500"
              />
              Akses Fitur Premium
            </span>

          </div>
        </section>

      </div>
    </main>
  );
}

/* =========================================================
   PLAN CARD
========================================================= */

function PlanCard({
  type,
  title,
  subtitle,
  price,
  priceSuffix,
  features,
  current,
  recommended,
}: {
  type: "free" | "premium";
  title: string;
  subtitle: string;
  price: string;
  priceSuffix: string;
  features: string[];
  current?: boolean;
  recommended?: boolean;
}) {
  const premium = type === "premium";

  return (
    <section
      className={`relative overflow-hidden rounded-[28px] border bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7 ${
        premium
          ? "border-yellow-200"
          : "border-slate-200"
      }`}
    >

      {recommended && (
        <div className="absolute right-5 top-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1.5 text-[10px] font-bold text-yellow-700">
            <Sparkles size={11} />
            REKOMENDASI
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            premium
              ? "bg-yellow-100 text-yellow-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {premium ? (
            <Crown size={21} />
          ) : (
            <Lock size={20} />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">

            <h2 className="text-xl font-bold text-slate-950">
              {title}
            </h2>

            {current && (
              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                  premium
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                Paket Saat Ini
              </span>
            )}
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-7 border-y border-slate-100 py-6">
        <div className="flex items-end gap-2">

          <span className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {price}
          </span>

          <span className="mb-1 text-xs text-slate-400">
            {priceSuffix}
          </span>

        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Yang kamu dapatkan
        </p>

        <div className="mt-4 space-y-3">

          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-3"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  premium
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Check size={12} />
              </span>

              <span className="text-sm leading-5 text-slate-600">
                {feature}
              </span>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}