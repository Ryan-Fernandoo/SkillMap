"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  ChevronDown,
  Globe2,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/language-provider";

type Language = "Indonesia" | "English";

export default function SettingsPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showPasswordForm, setShowPasswordForm] =
    useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [changingPassword, setChangingPassword] =
    useState(false);
  const [passwordMessage, setPasswordMessage] =
    useState("");

  /* =========================
     LOAD USER PROFILE
  ========================= */

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("users")
        .select("name, profile_photo_url")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "Gagal mengambil profil:",
          profileError
        );
      }

      if (profile) {
        setName(profile.name ?? "");

        if (profile.profile_photo_url) {
          setPhotoPreview(profile.profile_photo_url);
        }
      }

      setLoading(false);
    }

    loadUser();
  }, [router]);

  /* =========================
     PHOTO CHANGE
  ========================= */

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setErrorMessage("");
    setSaved(false);

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage(
        t("settings.errors.photoSize")
      );

      event.target.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        t("settings.errors.photoType")
      );

      event.target.value = "";
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setSelectedPhoto(file);
    setPhotoPreview(imageUrl);
  }

  /* =========================
     SAVE PROFILE
  ========================= */

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setErrorMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      let profilePhotoUrl: string | null =
        photoPreview;

      if (selectedPhoto) {
        const fileExtension =
          selectedPhoto.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const filePath =
          `${user.id}/${Date.now()}.${fileExtension}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("profil-photos")
          .upload(
            filePath,
            selectedPhoto,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: selectedPhoto.type,
            }
          );

        if (uploadError) {
          console.error(
            "Gagal upload foto:",
            uploadError
          );

          throw new Error(
            t("settings.errors.photoUpload")
          );
        }

        const {
          data: publicUrlData,
        } = supabase.storage
          .from("profil-photos")
          .getPublicUrl(filePath);

        profilePhotoUrl =
          publicUrlData.publicUrl;
      }

      const {
        error: updateError,
      } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          profile_photo_url:
            profilePhotoUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(
          "Gagal menyimpan profil:",
          updateError
        );

        throw new Error(
          t("settings.errors.profileSave")
        );
      }

      localStorage.setItem(
        "skillmap-language",
        language
      );

      window.dispatchEvent(
        new Event("skillmap-language-updated")
      );

      if (profilePhotoUrl) {
        setPhotoPreview(profilePhotoUrl);
      }

      setSelectedPhoto(null);

      window.dispatchEvent(
        new Event("skillmap-profile-updated")
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          t("settings.errors.general")
        );
      }
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     CHANGE PASSWORD
  ========================= */

  async function handleChangePassword() {
    setPasswordMessage("");

    if (!newPassword || !confirmPassword) {
      setPasswordMessage(
        language === "English"
          ? "Please fill in both password fields."
          : "Silakan isi kedua kolom password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage(
        language === "English"
          ? "Password must be at least 6 characters."
          : "Password minimal 6 karakter."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        language === "English"
          ? "Passwords do not match."
          : "Password tidak cocok."
      );
      return;
    }

    setChangingPassword(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { error } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (error) {
        console.error(
          "Gagal mengubah password:",
          error
        );

        setPasswordMessage(
          error.message ||
            (language === "English"
              ? "Failed to change password."
              : "Gagal mengubah password.")
        );

        return;
      }

      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        language === "English"
          ? "Password changed successfully."
          : "Password berhasil diubah."
      );

      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordMessage("");
      }, 2500);
    } catch (error) {
      console.error(error);

      setPasswordMessage(
        language === "English"
          ? "Something went wrong. Please try again."
          : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-8 w-40 rounded-lg bg-slate-200" />

          <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-100" />

          <div className="mt-8 h-80 rounded-[26px] bg-white" />

          <div className="mt-6 h-40 rounded-[26px] bg-white" />

          <div className="mt-6 h-32 rounded-[26px] bg-white" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UserRound size={21} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {t("settings.label")}
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                {t("settings.title")}
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            {t("settings.subtitle")}
          </p>
        </header>

        {/* PROFILE */}

        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-7">

          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {t("settings.profile.title")}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {t("settings.profile.description")}
            </p>
          </div>

          {/* FOTO */}

          <div className="mt-7">
            <label className="text-sm font-semibold text-slate-800">
              {t("settings.profile.photo")}
            </label>

            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 sm:p-7">
              <div className="flex flex-col items-center text-center">

                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={t(
                      "settings.profile.photoPreview"
                    )}
                    className="h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-md"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Camera size={30} />
                  </div>
                )}

                <h3 className="mt-4 text-sm font-bold text-slate-900">
                  {photoPreview
                    ? t(
                        "settings.profile.photoReady"
                      )
                    : t(
                        "settings.profile.uploadTitle"
                      )}
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  {t(
                    "settings.profile.uploadDescription"
                  )}
                </p>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                  <Camera size={16} />

                  {photoPreview
                    ? t(
                        "settings.profile.changePhoto"
                      )
                    : t(
                        "settings.profile.choosePhoto"
                      )}

                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-3 text-[11px] text-slate-400">
                  {t(
                    "settings.profile.photoHint"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* NAME */}

          <div className="mt-6">
            <label
              htmlFor="settings-name"
              className="text-sm font-semibold text-slate-800"
            >
              {t("settings.profile.name")}
            </label>

            <input
              id="settings-name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder={t(
                "settings.profile.namePlaceholder"
              )}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          {/* EMAIL */}

          <div className="mt-5">
            <label
              htmlFor="settings-email"
              className="text-sm font-semibold text-slate-800"
            >
              {t("settings.profile.email")}
            </label>

            <input
              id="settings-email"
              value={email}
              disabled
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
            />

            <p className="mt-2 text-xs text-slate-400">
              {t("settings.profile.emailHint")}
            </p>
          </div>

          {/* ERROR */}

          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {/* SAVE */}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-h-5">
              {saved && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <Check size={16} />
                  {t("settings.saved")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />

              {saving
                ? t("settings.saving")
                : t("settings.save")}
            </button>
          </div>
        </section>

        {/* PREFERENCES */}

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-7">

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Globe2 size={19} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {t("settings.preferences.title")}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t(
                  "settings.preferences.description"
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 max-w-xl">
            <label
              htmlFor="language"
              className="text-sm font-semibold text-slate-800"
            >
              {t("settings.preferences.language")}
            </label>

            <div className="relative mt-2">
              <select
                id="language"
                value={language}
                onChange={(event) =>
                  setLanguage(
                    event.target.value as Language
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                <option value="Indonesia">
                  🇮🇩 Indonesia
                </option>

                <option value="English">
                  🇬🇧 English
                </option>
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              {t(
                "settings.preferences.languageHint"
              )}
            </p>
          </div>
        </section>

        {/* SECURITY */}

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-7">

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ShieldCheck size={19} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {t("settings.security.title")}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t(
                  "settings.security.description"
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                  <LockKeyhole size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {t(
                      "settings.security.password"
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {t(
                      "settings.security.passwordDescription"
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(
                    (current) => !current
                  );
                  setPasswordMessage("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {showPasswordForm
                  ? language === "English"
                    ? "Cancel"
                    : "Batal"
                  : t(
                      "settings.security.changePassword"
                    )}
              </button>
            </div>

            {showPasswordForm && (
              <div className="mt-5 border-t border-slate-200 pt-5">

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <label
                      htmlFor="new-password"
                      className="text-sm font-semibold text-slate-800"
                    >
                      {language === "English"
                        ? "New Password"
                        : "Password Baru"}
                    </label>

                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      placeholder={
                        language === "English"
                          ? "Enter new password"
                          : "Masukkan password baru"
                      }
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="text-sm font-semibold text-slate-800"
                    >
                      {language === "English"
                        ? "Confirm Password"
                        : "Konfirmasi Password"}
                    </label>

                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      placeholder={
                        language === "English"
                          ? "Repeat new password"
                          : "Ulangi password baru"
                      }
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  {language === "English"
                    ? "Password must contain at least 6 characters."
                    : "Password harus memiliki minimal 6 karakter."}
                </p>

                {passwordMessage && (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                      passwordMessage
                        .toLowerCase()
                        .includes("success") ||
                      passwordMessage
                        .toLowerCase()
                        .includes("berhasil")
                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                        : "border-red-100 bg-red-50 text-red-600"
                    }`}
                  >
                    {passwordMessage}
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {changingPassword ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        {language === "English"
                          ? "Updating..."
                          : "Mengubah..."}
                      </>
                    ) : (
                      <>
                        <Check size={16} />

                        {language === "English"
                          ? "Update Password"
                          : "Ubah Password"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <p className="py-8 text-center text-xs text-slate-400">
          SkillMap
        </p>
      </div>
    </main>
  );
}