"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type InfoBadgeProps = {
  label: string;
  value: string;
  variant: "blue" | "white" | "yellow";
};

function InfoBadge({
  label,
  value,
  variant,
}: InfoBadgeProps) {
  const variantClass = {
    blue: "border-blue-100 bg-blue-50",
    white: "border-slate-200 bg-white shadow-sm",
    yellow: "border-yellow-200 bg-yellow-50",
  };

  const valueClass = {
    blue: "text-blue-700",
    white: "text-slate-800",
    yellow: "text-yellow-700",
  };

  return (
    <div
      className={`min-w-[132px] rounded-xl border px-4 py-3 ${variantClass[variant]}`}
    >
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold ${valueClass[variant]}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage(
        "Email dan password wajib diisi."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setErrorMessage(
          error.message ===
            "Invalid login credentials"
            ? "Email atau password salah."
            : error.message
        );

        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);

      setErrorMessage(
        "Terjadi kesalahan saat login. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-100/80 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-48 -right-40 h-[440px] w-[440px] rounded-full bg-yellow-100/70 blur-3xl" />

      {/* Logo */}
      <div className="absolute left-5 top-5 z-10 sm:left-8 sm:top-7 lg:left-10 lg:top-8">
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 sm:h-11 sm:w-11">
            S
          </div>

          <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Skill<span className="text-blue-600">Map</span>
          </span>
        </Link>
      </div>

      {/* Main */}
      <div className="relative flex min-h-screen items-start justify-center px-5 pb-12 pt-28 sm:px-8 sm:pt-32 lg:items-center lg:px-10 lg:py-28">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16 xl:gap-24">
          {/* LEFT INFORMATION */}
          <section className="w-full">
            <div className="mx-auto max-w-xl lg:mx-0">
              {/* Badge */}
              <div className="skillmap-badge-blue mb-5 w-fit px-3.5 py-2 text-xs font-semibold">
                <Sparkles size={14} />
                Selamat datang kembali
              </div>

              {/* Heading */}
              <h1 className="max-w-xl text-4xl font-black leading-[1.04] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-5xl xl:text-6xl">
                Lanjutkan perjalanan
                <span className="block text-blue-600">
                  pengembangan skillmu.
                </span>
              </h1>

              {/* Description */}
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                Masuk ke SkillMap untuk melihat
                profil kompetensi, skill gap,
                roadmap, dan perkembanganmu.
              </p>

              {/* Feature badges */}
              <div className="mt-7 flex flex-wrap gap-3">
                <InfoBadge
                  label="Ukur"
                  value="Kompetensi"
                  variant="blue"
                />

                <InfoBadge
                  label="Temukan"
                  value="Skill Gap"
                  variant="white"
                />

                <InfoBadge
                  label="Bangun"
                  value="Roadmap"
                  variant="yellow"
                />
              </div>
            </div>
          </section>

          {/* LOGIN CARD */}
          <section className="w-full">
            <div className="skillmap-card mx-auto w-full max-w-md p-6 sm:p-8">
              {/* Header */}
              <div className="mb-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <LockKeyhole size={22} />
                </div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Account
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Login SkillMap
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Masuk untuk melanjutkan perjalanan
                  pengembangan kompetensimu.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="nama@email.com"
                      autoComplete="email"
                      className="skillmap-input w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Masukkan password"
                      autoComplete="current-password"
                      className="skillmap-input w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Error */}
                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                    {errorMessage}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="skillmap-button flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Memproses..."
                    : "Masuk ke SkillMap"}

                  {!loading && (
                    <ArrowRight size={17} />
                  )}
                </button>
              </form>

              {/* Register */}
              <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Belum punya akun?
                </p>

                <Link
                  href="/register"
                  className="mt-2 inline-flex text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  Buat akun SkillMap →
                </Link>
              </div>

              {/* Back */}
              <div className="mt-5 text-center">
                <Link
                  href="/"
                  className="text-xs text-slate-400 transition hover:text-blue-600"
                >
                  ← Kembali ke halaman utama
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}