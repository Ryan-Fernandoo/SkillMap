"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { isPremiumUser } from "@/lib/subscription";
import { useLanguage } from "@/components/language-provider";

/* =========================================================
   TYPES
========================================================= */

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

type CareerSkill = {
  skill_id: string;
  target_score: number;
  importance: number;
};

type PriorityLevel =
  | "critical"
  | "high"
  | "medium";

type PriorityItem = {
  result: SkillResult;
  skillName: string;
  importance: number;
  priorityScore: number;
  priorityLevel: PriorityLevel;
};

/* =========================================================
   PRIORITY HELPERS
========================================================= */

/*
 * Priority Score:
 *
 * Gap × (Importance / 5)
 *
 * Contoh:
 *
 * Gap 70 + Importance 5
 * = 70 × 1
 * = 70
 *
 * Gap 70 + Importance 4
 * = 70 × 0.8
 * = 56
 *
 * Gap 70 + Importance 3
 * = 70 × 0.6
 * = 42
 */

function calculatePriorityScore(
  gap: number,
  importance: number
) {
  const safeGap = Math.max(
    0,
    Math.min(gap, 100)
  );

  const safeImportance =
    Math.max(
      1,
      Math.min(importance, 5)
    );

  return safeGap * (safeImportance / 5);
}

/*
 * Priority score maksimal mengikuti gap.
 *
 * Critical:
 * 60+
 *
 * High:
 * 35–59
 *
 * Medium:
 * <35
 */

function getPriorityLevel(
  priorityScore: number
): PriorityLevel {
  if (priorityScore >= 60) {
    return "critical";
  }

  if (priorityScore >= 35) {
    return "high";
  }

  return "medium";
}

/* =========================================================
   PAGE
========================================================= */

export default function SkillGapPage() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const { t } =
    useLanguage();

  const careerId =
    searchParams.get("career");

  const assessmentId =
    searchParams.get("assessment");

  const [career, setCareer] =
    useState<Career | null>(null);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [skillResults, setSkillResults] =
    useState<SkillResult[]>([]);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [careerSkills, setCareerSkills] =
    useState<CareerSkill[]>([]);

  const [isPremium, setIsPremium] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    async function loadSkillGap() {
      setLoading(true);
      setErrorMessage("");

      try {
        /* =========================
           USER
        ========================= */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "User error:",
            userError
          );
        }

        if (!user) {
          router.push("/login");
          return;
        }

        /* =========================
           PREMIUM
        ========================= */

        const premium =
          await isPremiumUser();

        setIsPremium(premium);

        /* =========================
           ASSESSMENT
        ========================= */

        let assessmentQuery =
          supabase
            .from("assessments")
            .select(
              "id, career_id, attempt_number, assessment_type, completed_at"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "status",
              "completed"
            )
            .order(
              "completed_at",
              {
                ascending: false,
              }
            )
            .limit(1);

        if (assessmentId) {
          assessmentQuery =
            supabase
              .from("assessments")
              .select(
                "id, career_id, attempt_number, assessment_type, completed_at"
              )
              .eq(
                "id",
                assessmentId
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "status",
                "completed"
              )
              .limit(1);
        } else if (careerId) {
          assessmentQuery =
            supabase
              .from("assessments")
              .select(
                "id, career_id, attempt_number, assessment_type, completed_at"
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "career_id",
                careerId
              )
              .eq(
                "status",
                "completed"
              )
              .order(
                "completed_at",
                {
                  ascending: false,
                }
              )
              .limit(1);
        }

        const {
          data: assessmentRows,
          error: assessmentError,
        } = await assessmentQuery;

        if (assessmentError) {
          console.error(
            "Assessment error:",
            assessmentError
          );

          setErrorMessage(
            "Data assessment gagal dimuat."
          );

          setLoading(false);
          return;
        }

        const assessmentData =
          assessmentRows?.[0] ??
          null;

        if (!assessmentData) {
          setLoading(false);
          return;
        }

        setAssessment(
          assessmentData
        );

        /* =========================
           SELECTED CAREER
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

        if (!careerData) {
          setErrorMessage(
            "Data career tidak ditemukan."
          );

          setLoading(false);
          return;
        }

        setCareer(
          careerData
        );

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
          );

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
              results.map(
                (result) =>
                  result.skill_id
              )
            )
          );

        if (
          skillIds.length > 0
        ) {
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

        /* =========================
           CAREER SKILLS
           + IMPORTANCE
        ========================= */

        const {
          data: careerSkillData,
          error: careerSkillError,
        } = await supabase
          .from("career_skills")
          .select(
            "skill_id, target_score, importance"
          )
          .eq(
            "career_id",
            selectedCareerId
          );

        if (careerSkillError) {
          console.error(
            "Career skill error:",
            careerSkillError
          );

          setErrorMessage(
            "Bobot kompetensi career gagal dimuat."
          );

          setLoading(false);
          return;
        }

        setCareerSkills(
          (careerSkillData ??
            []) as CareerSkill[]
        );

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
  }, [
    careerId,
    assessmentId,
    router,
  ]);

  /* =======================================================
     SKILL NAME MAP
  ======================================================= */

  const skillNameMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          string
        >();

      skills.forEach(
        (skill) => {
          map.set(
            skill.id,
            skill.name
          );
        }
      );

      return map;
    }, [skills]);

  /* =======================================================
     CAREER SKILL MAP
  ======================================================= */

  const careerSkillMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          CareerSkill
        >();

      careerSkills.forEach(
        (item) => {
          map.set(
            item.skill_id,
            item
          );
        }
      );

      return map;
    }, [careerSkills]);

  /* =======================================================
     DEVELOPMENT SKILLS
  ======================================================= */

  const developmentSkills =
    useMemo(() => {
      return skillResults.filter(
        (result) =>
          result.score <
          result.target_score
      );
    }, [skillResults]);

  /* =======================================================
     STRONG SKILLS
  ======================================================= */

  const strongSkills =
    useMemo(() => {
      return skillResults.filter(
        (result) =>
          result.score >=
          result.target_score
      );
    }, [skillResults]);

  /* =======================================================
     PRIORITY ITEMS
  ======================================================= */

  const priorityItems =
    useMemo<PriorityItem[]>(() => {
      return developmentSkills
        .map((result) => {
          const careerSkill =
            careerSkillMap.get(
              result.skill_id
            );

          /*
           * Database sekarang sudah memiliki
           * importance.
           *
           * Fallback 3 hanya sebagai pengaman
           * apabila ada data lama yang null.
           */
          const importance =
            careerSkill?.importance ??
            3;

          const priorityScore =
            calculatePriorityScore(
              result.gap,
              importance
            );

          const priorityLevel =
            getPriorityLevel(
              priorityScore
            );

          return {
            result,
            skillName:
              skillNameMap.get(
                result.skill_id
              ) ??
              result.skill_id,
            importance,
            priorityScore,
            priorityLevel,
          };
        })
        .sort(
          (a, b) =>
            b.priorityScore -
            a.priorityScore
        );
    }, [
      developmentSkills,
      careerSkillMap,
      skillNameMap,
    ]);

  /* =======================================================
     CRITICAL COMPETENCIES
  ======================================================= */

  const criticalCompetencies =
    useMemo(() => {
      return priorityItems.filter(
        (item) =>
          item.priorityLevel ===
          "critical"
      );
    }, [priorityItems]);

  /* =======================================================
     AVERAGE GAP
  ======================================================= */

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
          (sum, item) =>
            sum + item.gap,
          0
        );

      return Math.round(
        total /
          developmentSkills.length
      );
    }, [
      developmentSkills,
    ]);

  /* =======================================================
     HIGHEST PRIORITY
  ======================================================= */

  const highestPriority =
    priorityItems[0] ??
    null;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-8">
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

  /* =======================================================
     ERROR
  ======================================================= */

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">

          <div className="rounded-[26px] border border-red-100 bg-white p-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <TrendingUp size={22} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              {t(
                "skillGap.errorTitle"
              )}
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t(
                "skillGap.tryAgain"
              )}
              <ArrowRight size={16} />
            </button>

          </div>

        </div>
      </main>
    );
  }

  /* =======================================================
     EMPTY
  ======================================================= */

  if (
    !assessment ||
    !career
  ) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">

          <div className="rounded-[26px] border border-slate-200 bg-white p-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Target size={22} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              {t(
                "skillGap.noAssessment"
              )}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              {t(
                "skillGap.noAssessmentDescription"
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/skillcheck"
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t(
                "skillCheck.startSkillCheck"
              )}
              <ArrowRight size={16} />
            </button>

          </div>

        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-8">

      <div className="mx-auto max-w-6xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_15px_45px_rgba(37,99,235,0.06)] sm:p-8">

          <div className="relative z-10">

            <div className="flex flex-wrap items-center gap-2">

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                <TrendingUp size={20} />
              </span>

              <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">
                {t(
                  "skillGap.label"
                )}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                  isPremium
                    ? "bg-blue-50 text-blue-600"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {isPremium
                  ? t(
                      "skillGap.premium"
                    )
                  : t(
                      "skillGap.free"
                    )}
              </span>

            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {t(
                "skillGap.title"
              )}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              {t(
                "skillGap.subtitle"
              )}{" "}
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
                {t(
                  "skillGap.assessment"
                )}{" "}
                #{assessment.attempt_number}
              </span>

            </div>

          </div>

          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-yellow-100/60 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-100/60 blur-3xl" />

        </section>

        {/* =================================================
            FREE USER
        ================================================= */}

        {!isPremium && (
          <section className="mt-5 overflow-hidden rounded-[26px] border border-yellow-200 bg-white shadow-[0_10px_35px_rgba(245,158,11,0.06)]">

            <div className="border-b border-yellow-100 bg-gradient-to-r from-yellow-50/80 via-white to-white p-6 sm:p-7">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                      <Lock size={17} />
                    </span>

                    <p className="text-xs font-bold uppercase tracking-wider text-yellow-700">
                      {t(
                        "skillGap.preview"
                      )}
                    </p>

                  </div>

                  <h2 className="mt-3 text-xl font-bold text-slate-950">
                    {t(
                      "skillGap.previewTitle"
                    )}{" "}
                    <span className="text-yellow-600">
                      {
                        developmentSkills.length
                      }
                    </span>{" "}
                    {t(
                      "skillGap.previewTitleSuffix"
                    )}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    {t(
                      "skillGap.previewDescription"
                    )}
                  </p>

                </div>

                <div className="shrink-0">

                  <div className="rounded-2xl border border-yellow-100 bg-white px-5 py-4 text-center shadow-sm">

                    <p className="text-2xl font-bold text-yellow-600">
                      {
                        developmentSkills.length
                      }
                    </p>

                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {t(
                        "skillGap.gap"
                      )}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            <div className="p-6 sm:p-7">

              <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">

                <div className="space-y-3 p-5">

                  {Array.from({
                    length: Math.min(
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
                      {t(
                        "skillGap.lockedTitle"
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t(
                        "skillGap.lockedDescription"
                      )}
                    </p>

                  </div>

                </div>

              </div>

              <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-2xl border border-yellow-100 bg-yellow-50/60 p-5 sm:flex-row">

                <div>

                  <p className="text-sm font-bold text-slate-900">
                    {t(
                      "skillGap.upgradeTitle"
                    )}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {t(
                      "skillGap.upgradeDescription"
                    )}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/upgrade"
                    )
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-yellow-500/20 transition hover:-translate-y-0.5 hover:bg-yellow-600"
                >
                  {t(
                    "skillGap.upgrade"
                  )}
                  <ArrowRight size={16} />
                </button>

              </div>

            </div>

          </section>
        )}

        {/* =================================================
            PREMIUM
        ================================================= */}

        {isPremium && (
          <>
            {/* =============================================
                SUMMARY
            ============================================= */}

            <section className="mt-5 grid gap-4 md:grid-cols-3">

              <PremiumStat
                icon={
                  <TrendingUp size={19} />
                }
                label={t(
                  "skillGap.skillsToDevelop"
                )}
                value={
                  developmentSkills.length
                }
              />

              <PremiumStat
                icon={
                  <Target size={19} />
                }
                label={t(
                  "skillGap.averageGap"
                )}
                value={
                  averageGap
                }
              />

              <PremiumStat
                icon={
                  <CheckCircle2 size={19} />
                }
                label={t(
                  "skillGap.skillsMeetingTarget"
                )}
                value={
                  strongSkills.length
                }
              />

            </section>

            {/* =============================================
                PRIORITY ANALYSIS
            ============================================= */}

            <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-yellow-600">
                    {t(
                      "skillGap.priority"
                    )}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    {t(
                      "skillGap.priorityAnalysis"
                    )}
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    {t(
                      "skillGap.priorityAnalysisDescription"
                    )}
                  </p>

                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                  <BarChart3 size={20} />
                </div>

              </div>

              {/* EXPLANATION */}

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Target size={17} />
                  </div>

                  <div>

                    <p className="text-sm font-bold text-slate-900">
                      {t(
                        "skillGap.whyPriority"
                      )}
                    </p>

                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      {t(
                        "skillGap.whyPriorityDescription"
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* PRIORITY LIST */}

              <div className="mt-6 space-y-3">

                {priorityItems.length ===
                0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                      <CheckCircle2 size={18} />
                      {t(
                        "skillGap.allReady"
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-emerald-600">
                      {t(
                        "skillGap.allReadyDescription"
                      )}
                    </p>

                  </div>
                ) : (
                  priorityItems.map(
                    (item, index) => (
                      <PriorityRow
                        key={
                          item.result.id
                        }
                        rank={
                          index + 1
                        }
                        item={item}
                        t={t}
                      />
                    )
                  )
                )}

              </div>

            </section>

            {/* =============================================
                CRITICAL COMPETENCIES
            ============================================= */}

            {criticalCompetencies.length >
              0 && (
              <section className="mt-5 rounded-[26px] border border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/50 p-6 sm:p-7">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <TrendingUp size={19} />
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                      {t(
                        "skillGap.criticalCompetencies"
                      )}
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                      {criticalCompetencies.length}{" "}
                      {t(
                        "skillGap.criticalCompetenciesTitle"
                      )}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      {t(
                        "skillGap.criticalCompetenciesDescription"
                      )}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">

                      {criticalCompetencies
                        .slice(
                          0,
                          5
                        )
                        .map(
                          (item) => (
                            <span
                              key={
                                item.result.id
                              }
                              className="rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700"
                            >
                              {
                                item.skillName
                              }
                            </span>
                          )
                        )}

                    </div>

                  </div>

                </div>

              </section>
            )}

            {/* =============================================
                DEVELOPMENT PRIORITY
            ============================================= */}

            {highestPriority && (
              <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  <div className="min-w-0">

                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      {t(
                        "skillGap.developmentPriority"
                      )}
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                      {
                        highestPriority.skillName
                      }
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      {t(
                        "skillGap.developmentPriorityDescription"
                      )}
                    </p>

                  </div>

                  <div className="grid shrink-0 grid-cols-3 gap-3">

                    <MiniMetric
                      label={t(
                        "skillGap.score"
                      )}
                      value={`${highestPriority.result.score}`}
                    />

                    <MiniMetric
                      label={t(
                        "skillGap.gap"
                      )}
                      value={`${highestPriority.result.gap}`}
                    />

                    <MiniMetric
                      label={t(
                        "skillGap.priorityScore"
                      )}
                      value={`${Math.round(
                        highestPriority.priorityScore
                      )}`}
                    />

                  </div>

                </div>

              </section>
            )}

            {/* =============================================
                WHY IT MATTERS
            ============================================= */}

            <section className="mt-5 rounded-[26px] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/60 p-6 sm:p-7">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                  <Sparkles size={19} />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    {t(
                      "skillGap.whyItMatters"
                    )}
                  </p>

                  <h2 className="mt-2 text-lg font-bold text-slate-950">
                    {t(
                      "skillGap.whyItMattersTitle"
                    )}
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">

                    {highestPriority
                      ? `${highestPriority.skillName} memiliki gap ${highestPriority.result.gap} poin dari benchmark ${highestPriority.result.target_score}. ${t(
                          "skillGap.whyItMattersDescription"
                        )}`
                      : t(
                          "skillGap.allReadyDescription"
                        )}

                  </p>

                </div>

              </div>

            </section>

            {/* =============================================
                NEXT STEP
            ============================================= */}

            <section className="mt-5 rounded-[26px] border border-blue-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    {t(
                      "skillGap.nextStep"
                    )}
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    {t(
                      "skillGap.nextStepTitle"
                    )}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    {t(
                      "skillGap.nextStepDescription"
                    )}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/roadmap?career=${career.id}&assessment=${assessment.id}`
                    )
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  {t(
                    "skillGap.viewRoadmap"
                  )}
                  <ArrowRight size={16} />
                </button>

              </div>

            </section>
          </>
        )}

        <div className="mt-6 px-1 pb-8 text-xs text-slate-400">
          {t(
            "skillGap.footer"
          )}
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
  icon: ReactNode;
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
   MINI METRIC
========================================================= */

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[80px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   PRIORITY ROW
========================================================= */

function PriorityRow({
  rank,
  item,
  t,
}: {
  rank: number;
  item: PriorityItem;
  t: (path: string) => string;
}) {
  const {
    result,
    skillName,
    importance,
    priorityScore,
    priorityLevel,
  } = item;

  const scorePercentage =
    Math.min(
      Math.max(
        result.score,
        0
      ),
      100
    );

  const priorityLabel =
    priorityLevel ===
    "critical"
      ? t(
          "skillGap.priorityCritical"
        )
      : priorityLevel ===
          "high"
        ? t(
            "skillGap.priorityHigh"
          )
        : t(
            "skillGap.priorityMedium"
          );

  const priorityClass =
    priorityLevel ===
    "critical"
      ? "bg-blue-600 text-white"
      : priorityLevel ===
          "high"
        ? "bg-blue-50 text-blue-700"
        : "bg-slate-100 text-slate-600";

  const importanceLabel =
    importance === 5
      ? t(
          "skillGap.importanceVeryHigh"
        )
      : importance === 4
        ? t(
            "skillGap.importanceHigh"
          )
        : importance === 3
          ? t(
              "skillGap.importanceMedium"
            )
          : importance === 2
            ? t(
                "skillGap.importanceLow"
              )
            : t(
                "skillGap.importanceVeryLow"
              );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm">

      <div className="flex flex-col gap-4">

        {/* HEADER */}

        <div className="flex items-start gap-4">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-sm font-bold text-yellow-700">
            {rank}
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <p className="text-sm font-bold text-slate-900">
                  {skillName}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {t(
                    "skillGap.score"
                  )}{" "}
                  {result.score}
                  {" · "}
                  {t(
                    "skillGap.target"
                  )}{" "}
                  {result.target_score}
                </p>

              </div>

              <span
                className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-bold ${priorityClass}`}
              >
                {priorityLabel}
              </span>

            </div>

          </div>

        </div>

        {/* METRICS */}

        <div className="grid gap-2 sm:grid-cols-4">

          <div className="rounded-xl bg-slate-50 px-3 py-3">

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {t(
                "skillGap.gap"
              )}
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {result.gap}
            </p>

          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-3">

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {t(
                "skillGap.importance"
              )}
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {importanceLabel}
            </p>

          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-3">

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {t(
                "skillGap.priorityScore"
              )}
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {Math.round(
                priorityScore
              )}
            </p>

          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-3">

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {t(
                "skillGap.status"
              )}
            </p>

            <p className="mt-1 text-sm font-bold text-orange-600">
              {t(
                "skillGap.needsDevelopment"
              )}
            </p>

          </div>

        </div>

        {/* SCORE BAR */}

        <div>

          <div className="flex items-center justify-between text-xs text-slate-500">

            <span>
              {t(
                "skillGap.currentCompetency"
              )}
            </span>

            <span>
              {result.score} /{" "}
              {result.target_score}
            </span>

          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-700"
              style={{
                width: `${scorePercentage}%`,
              }}
            />

          </div>

        </div>

        {/* WHY */}

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">

          <p className="text-xs font-semibold text-slate-700">
            {t(
              "skillGap.whyItMatters"
            )}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">

            {skillName}{" "}
            {t(
              "skillGap.gapReason"
            )}{" "}
            {result.gap}{" "}
            {t(
              "skillGap.gapReasonSuffix"
            )}{" "}
            {t(
              "skillGap.importanceReason"
            )}{" "}
            {importanceLabel}.

          </p>

        </div>

      </div>

    </div>
  );
}