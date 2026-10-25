"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Language = "Indonesia" | "English";
type Theme = "Light" | "Dark" | "System";

export default function SettingsPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [language, setLanguage] =
    useState<Language>("Indonesia");

  const [theme, setTheme] =
    useState<Theme>("Light");

  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* =========================
     LOAD SETTINGS
  ========================= */

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem("skillmap-language");

    const savedTheme =
      localStorage.getItem("skillmap-theme");

    if (
      savedLanguage === "Indonesia" ||
      savedLanguage === "English"
    ) {
      setLanguage(savedLanguage);
    }

    if (
      savedTheme === "Light" ||
      savedTheme === "Dark" ||
      savedTheme === "System"
    ) {
      setTheme(savedTheme);
    }
  }, []);

  /* =========================
     APPLY THEME
  ========================= */

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(isDark: boolean) {
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    if (theme === "Dark") {
      applyTheme(true);
    }

    if (theme === "Light") {
      applyTheme(false);
    }

    if (theme === "System") {
      const mediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      applyTheme(mediaQuery.matches);

      const handleChange = (
        event: MediaQueryListEvent
      ) => {
        applyTheme(event.matches);
      };

      mediaQuery.addEventListener(
        "change",
        handleChange
      );

      return () => {
        mediaQuery.removeEventListener(
          "change",
          handleChange
        );
      };
    }

    localStorage.setItem(
      "skillmap-theme",
      theme
    );
  }, [theme]);

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
          setPhotoPreview(
            profile.profile_photo_url
          );
        }
      }

      setLoading(false);
    }

    loadUser();
  }, [router]);

  /* =========================
     PHOTO PREVIEW
  ========================= */

  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setErrorMessage("");
    setSaved(false);

    // Maksimal 15 MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage(
        "Ukuran foto maksimal 15 MB."
      );

      event.target.value = "";
      return;
    }

    // Format yang diperbolehkan
    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "Format foto harus JPEG, JPG, atau PNG."
      );

      event.target.value = "";
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setSelectedPhoto(file);
    setPhotoPreview(imageUrl);
  }

  /* =========================
     SAVE SETTINGS
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

      /* =========================
         UPLOAD FOTO
      ========================= */

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
            "Foto gagal diupload. Coba lagi."
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

      /* =========================
         UPDATE USER PROFILE
      ========================= */

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
          "Profil gagal disimpan."
        );
      }

      /* =========================
         SAVE PREFERENCES
      ========================= */

      localStorage.setItem(
        "skillmap-language",
        language
      );

      localStorage.setItem(
        "skillmap-theme",
        theme
      );

      /* =========================
         UPDATE PREVIEW
      ========================= */

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
          "Terjadi kesalahan saat menyimpan pengaturan."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     LOGOUT
  ========================= */

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-sm text-gray-500">
            Memuat pengaturan...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Settings
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Kelola profil, preferensi, dan keamanan akunmu.
          </p>
        </div>

        {/* =========================
            PROFIL AKUN
        ========================= */}

        <section className="mb-6 rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

          <h2 className="text-xl font-semibold">
            Profil Akun
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atur identitas dan tampilan profilmu.
          </p>

          {/* FOTO PROFIL */}

          <div className="mt-6">

            <label className="text-sm font-medium">
              Foto Profil
            </label>

            <div className="mt-4 rounded-xl border border-dashed p-8 text-center dark:border-gray-700">

              {photoPreview ? (
                <>
                  <img
                    src={photoPreview}
                    alt="Preview foto profil"
                    className="mx-auto h-40 w-40 rounded-full object-cover"
                  />

                  <p className="mt-4 text-sm font-medium">
                    Foto profil
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Foto akan digunakan di profil dan sidebar.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl">
                    📷
                  </div>

                  <h3 className="mt-3 font-medium">
                    Upload Foto Profil
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Pilih foto dari perangkatmu.
                  </p>
                </>
              )}

              <label className="mt-5 inline-flex cursor-pointer rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">

                {photoPreview
                  ? "Ganti Foto"
                  : "Pilih Foto"}

                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

              </label>

              <p className="mt-3 text-xs text-gray-400">
                JPEG, JPG, atau PNG · Maksimal 15 MB
              </p>

            </div>

          </div>

          {/* NAMA */}

          <div className="mt-6">

            <label className="text-sm font-medium">
              Nama
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Masukkan nama"
              className="mt-2 w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500 dark:border-gray-700 dark:bg-gray-900"
            />

          </div>

          {/* EMAIL */}

          <div className="mt-5">

            <label className="text-sm font-medium">
              Email
            </label>

            <input
              value={email}
              disabled
              className="mt-2 w-full rounded-lg border bg-gray-100 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800"
            />

            <p className="mt-1 text-xs text-gray-400">
              Email digunakan sebagai identitas akun.
            </p>

          </div>

        </section>

        {/* =========================
            PREFERENSI
        ========================= */}

        <section className="mb-6 rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

          <h2 className="text-xl font-semibold">
            Preferensi
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atur pengalaman penggunaan SkillMap.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* BAHASA */}

            <div>

              <label className="text-sm font-medium">
                Bahasa
              </label>

              <select
                value={language}
                onChange={(e) =>
                  setLanguage(
                    e.target.value as Language
                  )
                }
                className="mt-2 w-full rounded-lg border bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="Indonesia">
                  Indonesia
                </option>

                <option value="English">
                  English
                </option>
              </select>

            </div>

            {/* TAMPILAN */}

            <div>

              <label className="text-sm font-medium">
                Tampilan
              </label>

              <select
                value={theme}
                onChange={(e) =>
                  setTheme(
                    e.target.value as Theme
                  )
                }
                className="mt-2 w-full rounded-lg border bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="Light">
                  Light
                </option>

                <option value="Dark">
                  Dark
                </option>

                <option value="System">
                  System
                </option>
              </select>

            </div>

          </div>

        </section>

        {/* =========================
            KEAMANAN
        ========================= */}

        <section className="mb-6 rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

          <h2 className="text-xl font-semibold">
            Keamanan
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola keamanan akunmu.
          </p>

          <button
            type="button"
            className="mt-5 rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Ubah Password
          </button>

        </section>

        {/* =========================
            AKUN
        ========================= */}

        <section className="mb-6 rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

          <h2 className="text-xl font-semibold">
            Akun
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola sesi akun SkillMap.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 rounded-lg border border-red-200 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            Logout
          </button>

        </section>

        {/* ERROR */}

        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950">
            {errorMessage}
          </div>
        )}

        {/* SAVE */}

        <div className="flex justify-end gap-4 pb-10">

          {saved && (
            <p className="self-center text-sm text-green-600">
              Pengaturan berhasil disimpan.
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {saving
              ? "Menyimpan..."
              : "Simpan Pengaturan"}
          </button>

        </div>

      </div>
    </main>
  );
}