"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
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
  const [password, setPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [forgotLoading, setForgotLoading] =
    useState(false);

  const [resetLoading, setResetLoading] =
    useState(false);

  const [forgotMode, setForgotMode] =
    useState(false);

  const [resetMode, setResetMode] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /* =====================================================
     DETECT PASSWORD RECOVERY SESSION
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      /*
       * Supabase recovery link creates a temporary
       * authenticated session.
       */
      if (
        session?.user &&
        window.location.hash.includes(
          "type=recovery"
        )
      ) {
        setResetMode(true);
        setForgotMode(false);
        setErrorMessage("");
        setSuccessMessage("");
      }
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (
          event === "PASSWORD_RECOVERY" &&
          session?.user
        ) {
          setResetMode(true);
          setForgotMode(false);
          setErrorMessage("");
          setSuccessMessage("");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =====================================================
     LOGIN
  ===================================================== */

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

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
      console.error(
        "Login error:",
        error
      );

      setErrorMessage(
        "Terjadi kesalahan saat login. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  async function handleForgotPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage(
        "Masukkan email terlebih dahulu."
      );
      return;
    }

    setForgotLoading(true);

    try {
      const redirectUrl =
        `${window.location.origin}/login`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: redirectUrl,
          }
        );

      if (error) {
        console.error(
          "Forgot password error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Gagal mengirim email reset password."
        );

        return;
      }

      setSuccessMessage(
        "Link reset password sudah dikirim ke email kamu. Silakan cek inbox atau folder spam."
      );
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setErrorMessage(
        "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setForgotLoading(false);
    }
  }

  /* =====================================================
     RESET PASSWORD
  ===================================================== */

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (
      !newPassword ||
      !confirmPassword
    ) {
      setErrorMessage(
        "Password baru dan konfirmasi password wajib diisi."
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        "Password baru minimal 6 karakter."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "Konfirmasi password tidak cocok."
      );
      return;
    }

    setResetLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (error) {
        console.error(
          "Reset password error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Gagal memperbarui password."
        );

        return;
      }

      setNewPassword("");
      setConfirmPassword("");

      setSuccessMessage(
        "Password berhasil diperbarui. Silakan login menggunakan password baru."
      );

      /*
       * Keluar dari recovery session supaya
       * user kembali ke alur login normal.
       */
      await supabase.auth.signOut();

      setTimeout(() => {
        setResetMode(false);
        setForgotMode(false);
        setSuccessMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      setErrorMessage(
        "Terjadi kesalahan saat memperbarui password."
      );
    } finally {
      setResetLoading(false);
    }
  }

  /* =====================================================
     SWITCH TO FORGOT PASSWORD
  ===================================================== */

  function openForgotPassword() {
    setForgotMode(true);
    setResetMode(false);
    setErrorMessage("");
    setSuccessMessage("");
    setPassword("");
  }

  /* =====================================================
     BACK TO LOGIN
  ===================================================== */

  function backToLogin() {
    setForgotMode(false);
    setResetMode(false);
    setErrorMessage("");
    setSuccessMessage("");
    setNewPassword("");
    setConfirmPassword("");
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
            Skill
            <span className="text-blue-600">
              Map
            </span>
          </span>
        </Link>
      </div>

      {/* Main */}

      <div className="relative flex min-h-screen items-start justify-center px-5 pb-12 pt-28 sm:px-8 sm:pt-32 lg:items-center lg:px-10 lg:py-28">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16 xl:gap-24">

          {/* LEFT INFORMATION */}

          <section className="w-full">
            <div className="mx-auto max-w-xl lg:mx-0">

              <div className="skillmap-badge-blue mb-5 w-fit px-3.5 py-2 text-xs font-semibold">
                <Sparkles size={14} />
                Selamat datang kembali
              </div>

              <h1 className="max-w-xl text-4xl font-black leading-[1.04] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-5xl xl:text-6xl">
                Lanjutkan perjalanan
                <span className="block text-blue-600">
                  pengembangan skillmu.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                Masuk ke SkillMap untuk melihat
                profil kompetensi, skill gap,
                roadmap, dan perkembanganmu.
              </p>

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

          {/* LOGIN / RESET CARD */}

          <section className="w-full">
            <div className="skillmap-card mx-auto w-full max-w-md p-6 sm:p-8">

              {/* =================================================
                  RESET PASSWORD MODE
              ================================================= */}

              {resetMode ? (
                <>
                  <div className="mb-7">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <LockKeyhole size={22} />
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      Account
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      Buat Password Baru
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Masukkan password baru untuk
                      mengamankan kembali akun
                      SkillMap kamu.
                    </p>
                  </div>

                  <form
                    onSubmit={
                      handleResetPassword
                    }
                    className="space-y-5"
                  >
                    {/* New password */}

                    <div>
                      <label
                        htmlFor="new-password"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Password Baru
                      </label>

                      <div className="relative">
                        <LockKeyhole
                          size={17}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(
                              event.target.value
                            )
                          }
                          placeholder="Masukkan password baru"
                          autoComplete="new-password"
                          className="skillmap-input w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Confirm password */}

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Konfirmasi Password
                      </label>

                      <div className="relative">
                        <LockKeyhole
                          size={17}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="confirm-password"
                          type="password"
                          value={
                            confirmPassword
                          }
                          onChange={(event) =>
                            setConfirmPassword(
                              event.target.value
                            )
                          }
                          placeholder="Ulangi password baru"
                          autoComplete="new-password"
                          className="skillmap-input w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                        {errorMessage}
                      </div>
                    )}

                    {successMessage && (
                      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-700">
                        <CheckCircle2
                          size={18}
                          className="mt-0.5 shrink-0"
                        />

                        <span>
                          {successMessage}
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        resetLoading
                      }
                      className="skillmap-button flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resetLoading
                        ? "Menyimpan..."
                        : "Simpan Password Baru"}

                      {!resetLoading && (
                        <CheckCircle2
                          size={17}
                        />
                      )}
                    </button>
                  </form>

                  <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                    <button
                      type="button"
                      onClick={
                        backToLogin
                      }
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-blue-600"
                    >
                      <ArrowLeft size={14} />
                      Kembali ke login
                    </button>
                  </div>
                </>
              ) : forgotMode ? (
                /* =================================================
                   FORGOT PASSWORD MODE
                ================================================= */

                <>
                  <div className="mb-7">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Mail size={22} />
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      Account
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      Lupa Password?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Masukkan email akunmu. Kami akan
                      mengirimkan link untuk membuat
                      password baru.
                    </p>
                  </div>

                  <form
                    onSubmit={
                      handleForgotPassword
                    }
                    className="space-y-5"
                  >
                    <div>
                      <label
                        htmlFor="forgot-email"
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
                          id="forgot-email"
                          type="email"
                          value={email}
                          onChange={(event) =>
                            setEmail(
                              event.target.value
                            )
                          }
                          placeholder="nama@email.com"
                          autoComplete="email"
                          className="skillmap-input w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                        {errorMessage}
                      </div>
                    )}

                    {successMessage && (
                      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-700">
                        <CheckCircle2
                          size={18}
                          className="mt-0.5 shrink-0"
                        />

                        <span>
                          {successMessage}
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        forgotLoading
                      }
                      className="skillmap-button flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {forgotLoading
                        ? "Mengirim..."
                        : "Kirim Link Reset"}

                      {!forgotLoading && (
                        <ArrowRight
                          size={17}
                        />
                      )}
                    </button>
                  </form>

                  <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                    <button
                      type="button"
                      onClick={
                        backToLogin
                      }
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-blue-600"
                    >
                      <ArrowLeft size={14} />
                      Kembali ke login
                    </button>
                  </div>
                </>
              ) : (
                /* =================================================
                   NORMAL LOGIN MODE
                ================================================= */

                <>
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
                      Masuk untuk melanjutkan
                      perjalanan pengembangan
                      kompetensimu.
                    </p>
                  </div>

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
                            setEmail(
                              event.target.value
                            )
                          }
                          placeholder="nama@email.com"
                          autoComplete="email"
                          className="skillmap-input w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Password */}

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="text-sm font-medium text-slate-700"
                        >
                          Password
                        </label>

                        <button
                          type="button"
                          onClick={
                            openForgotPassword
                          }
                          className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                        >
                          Lupa password?
                        </button>
                      </div>

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
                            setPassword(
                              event.target.value
                            )
                          }
                          placeholder="Masukkan password"
                          autoComplete="current-password"
                          className="skillmap-input w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                        {errorMessage}
                      </div>
                    )}

                    {successMessage && (
                      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-700">
                        <CheckCircle2
                          size={18}
                          className="mt-0.5 shrink-0"
                        />

                        <span>
                          {successMessage}
                        </span>
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
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}