"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Semua field wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Password minimal terdiri dari 6 karakter."
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      /*
       * Jika Supabase langsung memberikan session,
       * user bisa langsung masuk dashboard.
       *
       * Jika email confirmation aktif,
       * session biasanya belum tersedia sehingga
       * user diarahkan ke login.
       */
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      router.push("/login");
    } catch (error) {
      console.error("Register error:", error);

      setErrorMessage(
        "Terjadi kesalahan saat membuat akun. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-100 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-yellow-100/70 blur-3xl" />

      {/* Logo */}
      <div className="absolute left-6 top-6 z-10 sm:left-8 sm:top-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20">
            S
          </div>

          <span className="text-lg font-bold tracking-tight text-slate-900">
            Skill<span className="text-blue-600">Map</span>
          </span>
        </Link>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-24">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Register card */}
          <div className="order-2 mx-auto w-full max-w-md lg:order-1">
            <div className="skillmap-card p-7 sm:p-8">
              <div className="mb-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <UserRound size={22} />
                </div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Get Started
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Daftar SkillMap
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Buat akun untuk mulai memetakan dan
                  mengembangkan kompetensimu.
                </p>
              </div>

              <form
                onSubmit={handleRegister}
                className="space-y-5"
              >
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Nama
                  </label>

                  <div className="relative">
                    <UserRound
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder="Nama lengkap"
                      autoComplete="name"
                      className="skillmap-input w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

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
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      className="skillmap-input w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Error */}
                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="skillmap-button flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Membuat akun..." : "Buat Akun"}

                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>

              {/* Login */}
              <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Sudah punya akun?
                </p>

                <Link
                  href="/login"
                  className="mt-2 inline-flex text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  Masuk ke SkillMap →
                </Link>
              </div>

              <div className="mt-5 text-center">
                <Link
                  href="/"
                  className="text-xs text-slate-400 transition hover:text-blue-600"
                >
                  ← Kembali ke halaman utama
                </Link>
              </div>
            </div>
          </div>

          {/* Right information */}
          <div className="order-1 hidden lg:block lg:order-2">
            <div className="skillmap-badge-blue mb-5 w-fit px-3 py-1.5 text-xs font-semibold">
              <Sparkles size={14} />
              Mulai perjalananmu
            </div>

            <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-slate-950">
              Kenali skillmu.
              <span className="block text-blue-600">
                Bangun masa depanmu.
              </span>
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">
              Dengan SkillMap, kamu bisa mengetahui posisi
              kompetensi saat ini dan menentukan fokus
              pengembangan berdasarkan target karier.
            </p>

            <div className="mt-8 space-y-3">
              <RegisterBenefit
                number="01"
                title="Ukur Kompetensi"
                description="Mulai dengan Skill Check berbasis kompetensi."
              />

              <RegisterBenefit
                number="02"
                title="Temukan Skill Gap"
                description="Ketahui skill yang sudah kuat dan yang masih perlu dikembangkan."
              />

              <RegisterBenefit
                number="03"
                title="Bangun Roadmap"
                description="Dapatkan fokus pengembangan yang lebih terarah."
              />
            </div>

            <div className="mt-7 inline-flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs font-medium text-yellow-700">
              <Sparkles size={15} />
              Mulai dari fitur inti secara gratis
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function RegisterBenefit({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="skillmap-card flex max-w-md items-start gap-4 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}