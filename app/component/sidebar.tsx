"use client";

import {
  BarChart3,
  ClipboardCheck,
  FolderKanban,
  History,
  Home,
  LogOut,
  Map,
  Settings,
  UserRound,
  Crown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { isPremiumUser } from "@/lib/subscription";

type UserProfile = {
  name: string | null;
  profile_photo_url: string | null;
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [userProfile, setUserProfile] =
    useState<UserProfile>({
      name: "SkillMap User",
      profile_photo_url: null,
    });

  const [isPremium, setIsPremium] =
    useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        /* =========================
           USER PROFILE
        ========================= */

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("users")
          .select(
            "name, profile_photo_url"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Gagal mengambil profile:",
            profileError
          );
        }

        if (profile) {
          setUserProfile({
            name:
              profile.name ??
              user.email ??
              "SkillMap User",

            profile_photo_url:
              profile.profile_photo_url,
          });
        } else {
          setUserProfile({
            name:
              user.email ??
              "SkillMap User",
            profile_photo_url: null,
          });
        }

        /* =========================
           SUBSCRIPTION
        ========================= */

        const premium =
          await isPremiumUser();

        setIsPremium(premium);
      } catch (error) {
        console.error(
          "Gagal memuat data sidebar:",
          error
        );
      }
    }

    loadUserData();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: Home,
    },
    {
      label: "Skill Check",
      path: "/skillcheck",
      icon: ClipboardCheck,
    },
    {
      label: "Skill Profile",
      path: "/skillprofile",
      icon: UserRound,
    },
    {
      label: "Skill Gap",
      path: "/skillgap",
      icon: BarChart3,
    },
    {
      label: "Roadmap",
      path: "/roadmap",
      icon: Map,
    },
    {
      label: "Progress & History",
      path: "/progress",
      icon: History,
    },
    {
      label: "Portofolio & Pengalaman",
      path: "/portofolio",
      icon: FolderKanban,
    },
  ];

  const isUpgradeActive =
    pathname === "/upgrade" ||
    pathname.startsWith("/upgrade/");

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-[2px_0_18px_rgba(15,23,42,0.04)]">

      {/* =====================================================
          LOGO
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          router.push("/dashboard")
        }
        className="mb-6 flex items-center gap-2 px-2 text-left"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm">
          S
        </div>

        <span className="text-lg font-bold tracking-tight text-slate-900">
          Skill<span className="text-blue-600">
            Map
          </span>
        </span>
      </button>

      {/* =====================================================
          USER PROFILE
      ===================================================== */}

      <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-3">

        <div className="flex items-center gap-3">

          {/* FOTO / INITIAL */}

          {userProfile.profile_photo_url ? (
            <img
              src={
                userProfile.profile_photo_url
              }
              alt="Foto profil"
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {(
                userProfile.name?.charAt(
                  0
                ) ?? "U"
              ).toUpperCase()}
            </div>
          )}

          {/* USER INFO */}

          <div className="min-w-0">

            <p className="truncate text-sm font-semibold text-slate-900">
              {userProfile.name}
            </p>

            <div className="mt-0.5 flex items-center gap-1.5">

              {isPremium && (
                <Crown
                  size={11}
                  className="text-yellow-500"
                />
              )}

              <p
                className={`text-xs font-medium ${
                  isPremium
                    ? "text-yellow-600"
                    : "text-slate-500"
                }`}
              >
                {isPremium
                  ? "Premium"
                  : "Freemium"}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN NAVIGATION
      ===================================================== */}

      <nav className="space-y-1">

        {menuItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.path ||
            pathname.startsWith(
              `${item.path}/`
            );

          return (
            <button
              key={item.label}
              type="button"
              onClick={() =>
                router.push(item.path)
              }
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 font-semibold text-blue-700 shadow-sm"
                  : "text-slate-600 hover:-translate-y-[1px] hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <Icon
                size={18}
                strokeWidth={
                  isActive ? 2.3 : 1.9
                }
                className={
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400 transition-colors group-hover:text-blue-600"
                }
              />

              <span>{item.label}</span>
            </button>
          );
        })}

        {/* =================================================
            TINGKATKAN PAKET
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            router.push("/upgrade")
          }
          className={`group mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
            isUpgradeActive
              ? "bg-yellow-50 font-semibold text-yellow-700 shadow-sm"
              : "text-yellow-700 hover:-translate-y-[1px] hover:bg-yellow-50"
          }`}
        >
          <Crown
            size={18}
            strokeWidth={
              isUpgradeActive
                ? 2.3
                : 1.9
            }
            className={
              isUpgradeActive
                ? "text-yellow-600"
                : "text-yellow-500 transition-colors group-hover:text-yellow-600"
            }
          />

          <span>
            Tingkatkan Paket
          </span>
        </button>

      </nav>

      {/* =====================================================
          BOTTOM
      ===================================================== */}

      <div className="mt-auto border-t border-slate-200 pt-4">

        {/* SETTINGS */}

        <button
          type="button"
          onClick={() =>
            router.push("/settings")
          }
          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
            pathname === "/settings"
              ? "bg-blue-50 font-semibold text-blue-700"
              : "text-slate-600 hover:-translate-y-[1px] hover:bg-blue-50 hover:text-blue-700"
          }`}
        >
          <Settings
            size={18}
            strokeWidth={
              pathname === "/settings"
                ? 2.3
                : 1.9
            }
            className={
              pathname === "/settings"
                ? "text-blue-600"
                : "text-slate-400 group-hover:text-blue-600"
            }
          />

          <span>Settings</span>
        </button>

        {/* LOGOUT */}

        <button
          type="button"
          onClick={handleLogout}
          className="group mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-500 transition-all duration-200 hover:-translate-y-[1px] hover:bg-red-50 hover:text-red-600"
        >
          <LogOut
            size={18}
            strokeWidth={1.9}
            className="text-slate-400 group-hover:text-red-500"
          />

          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}