"use client";

import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  ChevronRight,
  Crown,
  Home,
  LogOut,
  Map,
  Menu,
  Settings,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { isPremiumUser } from "@/lib/subscription";

type UserProfile = {
  name: string | null;
  email: string | null;
  profile_photo_url: string | null;
};

const mainMenus = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Skill Check",
    href: "/skillcheck",
    icon: BookOpenCheck,
  },
  {
    label: "Skill Profile",
    href: "/skillprofile",
    icon: UserRound,
  },
  {
    label: "Skill Gap",
    href: "/skillgap",
    icon: BarChart3,
  },
  {
    label: "Roadmap",
    href: "/roadmap",
    icon: Map,
  },
  {
    label: "Progress & History",
    href: "/progress",
    icon: Target,
  },
  {
    label: "Portofolio & Pengalaman",
    href: "/portofolio",
    icon: BriefcaseBusiness,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] =
    useState<UserProfile | null>(null);

  const [premium, setPremium] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          return;
        }

        const { data: profile } =
          await supabase
            .from("users")
            .select(
              "name, email, profile_photo_url"
            )
            .eq("id", authUser.id)
            .maybeSingle();

        if (profile) {
          setUser(profile);
        }

        const premiumStatus =
          await isPremiumUser();

        setPremium(premiumStatus);
      } catch (error) {
        console.error(
          "Gagal memuat sidebar:",
          error
        );
      }
    }

    loadUser();
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Gagal logout:",
          error
        );
        return;
      }

      // Setelah logout, kembali ke homepage
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(
        "Terjadi kesalahan saat logout:",
        error
      );
    }
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  const displayName =
    user?.name?.trim() || "User";

  const initial =
    displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* =====================================================
          MOBILE TOP BAR
      ===================================================== */}

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() =>
            setMobileOpen(true)
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>

        <button
          type="button"
          onClick={() =>
            router.push("/dashboard")
          }
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
            S
          </div>

          <span className="text-lg font-bold tracking-tight text-slate-900">
            Skill
            <span className="text-blue-600">
              Map
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(true)
          }
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-bold text-blue-600"
          aria-label="Buka profil"
        >
          {user?.profile_photo_url ? (
            <img
              src={user.profile_photo_url}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </button>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() =>
            setMobileOpen(false)
          }
          className="fixed inset-0 z-[60] bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-[280px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:w-64 lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* ===================================================
            LOGO
        =================================================== */}

        <div className="flex h-20 shrink-0 items-center justify-between px-5">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/20">
              S
            </div>

            <span className="text-xl font-bold tracking-tight text-slate-900">
              Skill
              <span className="text-blue-600">
                Map
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(false)
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* ===================================================
            USER PROFILE
        =================================================== */}

        <div className="px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              {user?.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {displayName}
              </p>

              <div className="mt-0.5 flex items-center gap-1.5">
                {premium && (
                  <Crown
                    size={13}
                    className="text-yellow-500"
                  />
                )}

                <span
                  className={`text-xs font-medium ${
                    premium
                      ? "text-yellow-600"
                      : "text-slate-500"
                  }`}
                >
                  {premium
                    ? "Premium"
                    : "Freemium"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
          <div className="space-y-1">
            {mainMenus.map((item) => {
              const Icon = item.icon;
              const active = isActive(
                item.href
              );

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() =>
                    router.push(item.href)
                  }
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={
                      active ? 2.2 : 1.8
                    }
                    className={
                      active
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }
                  />

                  <span className="min-w-0 flex-1 truncate">
                    {item.label}
                  </span>

                  {active && (
                    <ChevronRight
                      size={15}
                      className="text-blue-400"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* =================================================
              UPGRADE
          ================================================= */}

          <div className="my-5 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() =>
                router.push("/upgrade")
              }
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                pathname === "/upgrade"
                  ? "bg-yellow-50 text-yellow-700"
                  : "text-yellow-600 hover:bg-yellow-50"
              }`}
            >
              <Crown
                size={19}
                strokeWidth={1.9}
              />

              <span className="flex-1">
                Tingkatkan Paket
              </span>

              <ChevronRight
                size={15}
                className="opacity-60"
              />
            </button>
          </div>

          {/* =================================================
              BOTTOM MENU
          ================================================= */}

          <div className="border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() =>
                router.push("/settings")
              }
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                isActive("/settings")
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Settings
                size={19}
                strokeWidth={1.8}
                className={
                  isActive("/settings")
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }
              />

              <span className="flex-1">
                Settings
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="group mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut
                size={19}
                strokeWidth={1.8}
                className="text-slate-400 group-hover:text-red-500"
              />

              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}