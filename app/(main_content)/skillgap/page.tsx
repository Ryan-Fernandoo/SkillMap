"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { isPremiumUser } from "@/lib/subscription";

type Career = {
  id: string;
  name: string;
  field: string;
  level: string;
};

type Assessment = {
  id: string;
  career_id: string;
  attempt_number: number;
  assessment_type: string;
  completed_at: string | null;
};

type SkillResult = {
  id: number;
  skill_id: string;
  score: number;
  target_score: number;
  gap: number;
  status: string;
};

type Skill = {
  id: string;
  name: string;
};

export default function SkillGapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const careerId = searchParams.get("career");

  const [career, setCareer] =
    useState<Career | null>(null);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [skillResults, setSkillResults] =
    useState<SkillResult[]>([]);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [isPremium, setIsPremium] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    async function loadSkillGap() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        /* =========================
           PREMIUM STATUS
        ========================= */

        const premium =
          await isPremiumUser();

        setIsPremium(premium);

        /* =========================
           LATEST COMPLETED ASSESSMENT
        ========================= */

        const {
          data: assessmentData,
          error: assessmentError,
        } = await supabase
          .from("assessments")
          .select(
            "id, career_id, attempt_number, assessment_type, completed_at"
          )
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("completed_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (assessmentError) {
          console.error(
            "Assessment error:",
            assessmentError
          );
        }

        if (!assessmentData) {
          setLoading(false);
          return;
        }

        setAssessment(
          assessmentData
        );

        /* =========================
           CAREER
        ========================= */

        const selectedCareerId =
          careerId ??
          assessmentData.career_id;

        const {
          data: careerData,
          error: careerError,
        } = await supabase
          .from("careers")
          .select(
            "id, name, field, level"
          )
          .eq(
            "id",
            selectedCareerId
          )
          .maybeSingle();

        if (careerError) {
          console.error(
            "Career error:",
            careerError
          );
        }

        if (careerData) {
          setCareer(careerData);
        }

        /* =========================
           SKILL RESULTS
        ========================= */

        const {
          data: resultData,
          error: resultError,
        } = await supabase
          .from("skill_results")
          .select(
            "id, skill_id, score, target_score, gap, status"
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "assessment_id",
            assessmentData.id
          )
          .order("gap", {
            ascending: false,
          });

        if (resultError) {
          console.error(
            "Skill result error:",
            resultError
          );

          setErrorMessage(
            "Data Skill Gap gagal dimuat."
          );

          setLoading(false);
          return;
        }

        const results =
          resultData ?? [];

        setSkillResults(
          results
        );

        /* =========================
           SKILLS
        ========================= */

        const skillIds =
          Array.from(
            new Set(
              results
                .map(
                  (result) =>
                    result.skill_id
                )
                .filter(Boolean)
            )
          );

        if (skillIds.length > 0) {
          const {
            data: skillData,
            error: skillError,
          } = await supabase
            .from("skills")
            .select(
              "id, name"
            )
            .in(
              "id",
              skillIds
            );

          if (skillError) {
            console.error(
              "Skill error:",
              skillError
            );
          } else {
            setSkills(
              skillData ?? []
            );
          }
        }

        setLoading(false);
      } catch (error) {
        console.error(
          "Skill Gap error:",
          error
        );

        setErrorMessage(
          "Terjadi kesalahan saat memuat Skill Gap."
        );

        setLoading(false);
      }
    }

    loadSkillGap();
  }, [careerId, router]);

  /* =========================================================
     SKILL NAME MAP
  ========================================================= */

  const skillNameMap = useMemo(() => {
    const map =
      new Map<string, string>();

    skills.forEach((skill) => {
      map.set(
        skill.id,
        skill.name
      );
    });

    return map;
  }, [skills]);

  /* =========================================================
     DEVELOPMENT SKILLS
  ========================================================= */

  const developmentSkills =
    useMemo(() => {
      return [...skillResults]
        .filter(
          (result) =>
            result.score <
            result.target_score
        )
        .sort(
          (a, b) =>
            b.gap - a.gap
        );
    }, [skillResults]);

  /* =========================================================
     STRONG SKILLS
  ========================================================= */

  const strongSkills =
    useMemo(() => {
      return [...skillResults]
        .filter(
          (result) =>
            result.score >=
            result.target_score
        )
        .sort(
          (a, b) =>
            b.score - a.score
        );
    }, [skillResults]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const averageGap =
    useMemo(() => {
      if (
        developmentSkills.length ===
        0
      ) {
        return 0;
      }

      const total =
        developmentSkills.reduce(
          (sum, result) =>
            sum + result.gap,
          0
        );

      return Math.round(
        total /
          developmentSkills.length
      );
    }, [developmentSkills]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">

        <div className="mx-auto max-w-6xl animate-pulse">

          <div className="h-5 w-28 rounded-full bg-blue-100" />

          <div className="mt-5 h-10 w-72 rounded-xl bg-slate-200" />

          <div className="mt-3 h-4 w-96 max-w-full rounded-full bg-slate-100" />

          <div className="mt-8 h-40 rounded-[26px] bg-white" />

          <div className="mt-5 h-72 rounded-[26px] bg-white" />

        </div>

      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">

        <div className="mx-auto max-w-6xl">

          <div className="rounded-[26px] border border-red-100 bg-white p-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <TrendingUp size={22} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Skill Gap tidak dapat dimuat
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Coba Lagi
              <ArrowRight size={16} />
            </button>

          </div>

        </div>

      </main>
    );
  }

  /* =========================================================
     EMPTY
  ========================================================= */

  if (!assessment || !career) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">

        <div className="mx-auto max-w-6xl">

          <div className="rounded-[26px] border border-slate-200 bg-white p-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Target size={22} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Belum ada hasil Skill Check
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Kerjakan Skill Check terlebih dahulu
              untuk melihat analisis Skill Gap.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/skillcheck"
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Mulai Skill Check
              <ArrowRight size={16} />
            </button>

          </div>

        </div>

      </main>
    );
  }

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f7faff] px-6 py-8">

      <div className="mx-auto max-w-6xl">

        {/* ===================================================
            HEADER
        =================================================== */}

        <section className="relative overflow-hidden rounded-[30px] border border-blue-100 bg-white p-7 shadow-[0_15px_45px_rgba(37,99,235,0.06)] sm:p-8">

          <div className="relative z-10">

            <div className="flex flex-wrap items-center gap-2">

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                <TrendingUp size={20} />
              </span>

              <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">
                Skill Gap Analysis
              </span>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                  isPremium
                    ? "bg-blue-50 text-blue-600"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {isPremium
                  ? "Premium"
                  : "Freemium"}
              </span>

            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Analisis Skill Gap
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Lihat posisi kompetensimu terhadap
              benchmark untuk{" "}
              <span className="font-semibold text-slate-700">
                {career.name}
              </span>
              .
            </p>

            <div className="mt-5 flex flex-wrap gap-2">

              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700">
                <Target size={14} />
                {career.name}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-500">
                Assessment #
                {assessment.attempt_number}
              </span>

            </div>

          </div>

          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-yellow-100/60 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-100/60 blur-3xl" />

        </section>

        {/* ===================================================
            FREE PREVIEW
        =================================================== */}

        {!isPremium && (
          <section className="mt-5 overflow-hidden rounded-[26px] border border-yellow-200 bg-white shadow-[0_10px_35px_rgba(245,158,11,0.06)]">

            <div className="border-b border-yellow-100 bg-gradient-to-r from-yellow-50/80 via-white to-white p-6 sm:p-7">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                      <Sparkles size={17} />
                    </span>

                    <p className="text-xs font-bold uppercase tracking-wider text-yellow-700">
                      Preview Skill Gap
                    </p>

                  </div>

                  <h2 className="mt-3 text-xl font-bold text-slate-950">
                    Kamu memiliki{" "}
                    <span className="text-yellow-600">
                      {developmentSkills.length}
                    </span>{" "}
                    kompetensi yang perlu dikembangkan
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    SkillMap menemukan beberapa
                    kompetensi yang masih memiliki
                    jarak dari benchmark kariermu.
                    Detail analisis dan prioritas
                    pengembangan tersedia di Premium.
                  </p>

                </div>

                <div className="shrink-0">

                  <div className="rounded-2xl border border-yellow-100 bg-white px-5 py-4 text-center shadow-sm">

                    <p className="text-2xl font-bold text-yellow-600">
                      {developmentSkills.length}
                    </p>

                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Skill Gap
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* LOCKED PREVIEW */}

            <div className="p-6 sm:p-7">

              <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">

                <div className="space-y-3 p-5">

                  {Array.from({
                    length:
                      Math.min(
                        developmentSkills.length ||
                          3,
                        3
                      ),
                  }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4"
                      >

                        <div className="space-y-2">

                          <div className="h-4 w-40 rounded-full bg-slate-200" />

                          <div className="h-3 w-28 rounded-full bg-slate-100" />

                        </div>

                        <div className="h-7 w-16 rounded-full bg-yellow-50" />

                      </div>
                    )
                  )}

                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-white/65 backdrop-blur-[2px]">

                  <div className="text-center">

                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700 shadow-sm">
                      <Lock size={18} />
                    </div>

                    <p className="mt-3 text-sm font-bold text-slate-900">
                      Detail Skill Gap terkunci
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Upgrade untuk melihat analisis lengkap.
                    </p>

                  </div>

                </div>

              </div>

              {/* UPGRADE */}

              <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-2xl border border-yellow-100 bg-yellow-50/60 p-5 sm:flex-row">

                <div>

                  <p className="text-sm font-bold text-slate-900">
                    Buka seluruh analisis Skill Gap
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Lihat skill yang paling perlu
                    dikembangkan, skor, target, dan
                    prioritas pengembangannya.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/upgrade")
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-yellow-500/20 transition hover:-translate-y-0.5 hover:bg-yellow-600"
                >
                  Tingkatkan Paket
                  <ArrowRight size={16} />
                </button>

              </div>

            </div>

          </section>
        )}

        {/* ===================================================
            PREMIUM SUMMARY
        =================================================== */}

        {isPremium && (
          <>
            <section className="mt-5 grid gap-4 md:grid-cols-3">

              <PremiumStat
                icon={
                  <TrendingUp size={19} />
                }
                label="Skill Perlu Dikembangkan"
                value={
                  developmentSkills.length
                }
              />

              <PremiumStat
                icon={
                  <Target size={19} />
                }
                label="Rata-rata Gap"
                value={
                  averageGap
                }
              />

              <PremiumStat
                icon={
                  <CheckCircle2 size={19} />
                }
                label="Skill Memenuhi Target"
                value={
                  strongSkills.length
                }
              />

            </section>

            {/* =================================================
                FULL ANALYSIS
            ================================================= */}

            <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-yellow-600">
                    Prioritas Pengembangan
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Kompetensi dengan gap terbesar
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Mulai dari kompetensi dengan gap
                    paling besar untuk mendapatkan
                    dampak pengembangan yang lebih tinggi.
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                  <BarChart3 size={20} />
                </div>

              </div>

              <div className="mt-6 space-y-3">

                {developmentSkills.length ===
                0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                      <CheckCircle2 size={18} />
                      Semua kompetensi sudah memenuhi benchmark.
                    </div>

                    <p className="mt-2 text-sm text-emerald-600">
                      Tidak ada skill gap yang perlu
                      menjadi prioritas saat ini.
                    </p>

                  </div>
                ) : (
                  developmentSkills.map(
                    (result, index) => (
                      <SkillGapRow
                        key={result.id}
                        rank={index + 1}
                        name={
                          skillNameMap.get(
                            result.skill_id
                          ) ??
                          result.skill_id
                        }
                        score={
                          result.score
                        }
                        target={
                          result.target_score
                        }
                        gap={
                          result.gap
                        }
                      />
                    )
                  )
                )}

              </div>

            </section>

            {/* =================================================
                INSIGHT
            ================================================= */}

            <section className="mt-5 rounded-[26px] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/60 p-6 sm:p-7">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                  <Sparkles size={19} />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Insight SkillMap
                  </p>

                  <h2 className="mt-2 text-lg font-bold text-slate-950">
                    Fokus pengembanganmu
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Prioritaskan kompetensi dengan
                    gap terbesar terlebih dahulu.
                    Setelah kompetensi tersebut
                    berkembang, lakukan reassessment
                    untuk melihat perubahan kesiapan
                    kariermu.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/roadmap?career=${career.id}`
                      )
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                  >
                    Lanjut ke Roadmap
                    <ArrowRight size={16} />
                  </button>

                </div>

              </div>

            </section>
          </>
        )}

        {/* ===================================================
            FOOTER NOTE
        =================================================== */}

        <div className="mt-6 px-1 pb-8 text-xs text-slate-400">
          Data berdasarkan Skill Check terakhir.
        </div>

      </div>

    </main>
  );
}

/* =========================================================
   PREMIUM STAT
========================================================= */

function PremiumStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.035)]">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
          {icon}
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

      </div>

      <p className="mt-5 text-3xl font-bold text-slate-950">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   SKILL GAP ROW
========================================================= */

function SkillGapRow({
  rank,
  name,
  score,
  target,
  gap,
}: {
  rank: number;
  name: string;
  score: number;
  target: number;
  gap: number;
}) {
  const percentage = Math.min(
    Math.max(score, 0),
    100
  );

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 transition duration-300 hover:border-yellow-200 hover:bg-yellow-50/30">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-sm font-bold text-yellow-700">
          {rank}
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>

              <p className="text-sm font-bold text-slate-900">
                {name}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Skor {score} · Target {target}
              </p>

            </div>

            <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-700">
              Gap {gap}
            </span>

          </div>

          <div className="mt-4 flex items-center gap-3">

            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">

              <div
                className="h-full rounded-full bg-yellow-400 transition-all duration-700"
                style={{
                  width: `${percentage}%`,
                }}
              />

            </div>

            <span className="w-16 text-right text-xs font-semibold text-slate-500">
              {score}/{target}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}