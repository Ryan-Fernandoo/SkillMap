"use client";

import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";
import { isPremiumUser } from "@/lib/subscription";
import { useLanguage } from "@/components/language-provider";

/* =========================================================
   TYPES
========================================================= */

type Assessment = {
  id: string;
  career_id: string;
  attempt_number: number;
  assessment_type: string;
  status: string;
  completed_at: string | null;
};

type Career = {
  id: string;
  name: string;
  field: string;
  level: string;
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
  skillId: string;
  skillName: string;
  score: number;
  target: number;
  gap: number;
  importance: number;
  priorityScore: number;
  priorityLevel: PriorityLevel;
};

/* =========================================================
   HELPERS
========================================================= */

function calculatePriorityScore(
  gap: number,
  importance: number
) {
  const safeGap = Math.max(
    0,
    Math.min(gap, 100)
  );

  const safeImportance = Math.max(
    1,
    Math.min(importance, 5)
  );

  return safeGap * (safeImportance / 5);
}

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
   PAGE CONTENT
========================================================= */

function RoadmapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

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

  const [aiRoadmap, setAiRoadmap] =
    useState("");

  const [aiRoadmapLoading, setAiRoadmapLoading] =
    useState(false);

  const [aiRoadmapError, setAiRoadmapError] =
    useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    async function loadRoadmap() {
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

        const premium =
          await isPremiumUser();

        setIsPremium(premium);

        /* =========================
           ASSESSMENT
        ========================= */

        let selectedAssessmentId =
          assessmentId;

        let selectedCareerId =
          careerId;

        if (!selectedAssessmentId) {
          let query =
            supabase
              .from("assessments")
              .select(
                "id, career_id, attempt_number, assessment_type, status, completed_at"
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

          if (selectedCareerId) {
            query = query.eq(
              "career_id",
              selectedCareerId
            );
          }

          const {
            data,
            error,
          } = await query;

          if (error) {
            throw error;
          }

          const latest =
            data?.[0];

          if (latest) {
            selectedAssessmentId =
              latest.id;

            selectedCareerId =
              latest.career_id;

            setAssessment(
              latest
            );
          }
        } else {
          const {
            data,
            error,
          } = await supabase
            .from("assessments")
            .select(
              "id, career_id, attempt_number, assessment_type, status, completed_at"
            )
            .eq(
              "id",
              selectedAssessmentId
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "status",
              "completed"
            )
            .maybeSingle();

          if (error) {
            throw error;
          }

          if (!data) {
            setErrorMessage(
              "Data assessment tidak ditemukan."
            );

            setLoading(false);
            return;
          }

          setAssessment(data);

          selectedCareerId =
            selectedCareerId ??
            data.career_id;
        }

        if (
          !selectedAssessmentId ||
          !selectedCareerId
        ) {
          setLoading(false);
          return;
        }

        /* =========================
           CAREER
        ========================= */

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

        if (
          careerError ||
          !careerData
        ) {
          setErrorMessage(
            "Data career tidak ditemukan."
          );

          setLoading(false);
          return;
        }

        setCareer(careerData);

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
            selectedAssessmentId
          );

        if (resultError) {
          throw resultError;
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
          results.map(
            (item) =>
              item.skill_id
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
            throw skillError;
          }

          setSkills(
            skillData ?? []
          );
        }

        /* =========================
           CAREER SKILLS
           IMPORTANCE
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
          throw careerSkillError;
        }

        setCareerSkills(
          (careerSkillData ??
            []) as CareerSkill[]
        );

        /* =========================
           LOAD SAVED AI ROADMAP
        ========================= */

        const storageKey =
          `skillmap-ai-roadmap-${selectedAssessmentId}`;

        const savedRoadmap =
          localStorage.getItem(
            storageKey
          );

        if (savedRoadmap) {
          setAiRoadmap(
            savedRoadmap
          );
        }

        setLoading(false);
      } catch (error) {
        console.error(
          "Roadmap error:",
          error
        );

        setErrorMessage(
          "Terjadi kesalahan saat memuat roadmap."
        );

        setLoading(false);
      }
    }

    loadRoadmap();
  }, [
    careerId,
    assessmentId,
    router,
  ]);

  /* =======================================================
     MAPS
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
     PRIORITY ITEMS
  ======================================================= */

  const priorityItems =
    useMemo<PriorityItem[]>(() => {
      return skillResults
        .filter(
          (result) =>
            result.score <
            result.target_score
        )
        .map((result) => {
          const careerSkill =
            careerSkillMap.get(
              result.skill_id
            );

          const importance =
            careerSkill?.importance ??
            3;

          const priorityScore =
            calculatePriorityScore(
              result.gap,
              importance
            );

          return {
            skillId:
              result.skill_id,

            skillName:
              skillNameMap.get(
                result.skill_id
              ) ??
              result.skill_id,

            score:
              result.score,

            target:
              result.target_score,

            gap:
              result.gap,

            importance,

            priorityScore,

            priorityLevel:
              getPriorityLevel(
                priorityScore
              ),
          };
        })
        .sort(
          (a, b) =>
            b.priorityScore -
            a.priorityScore
        );
    }, [
      skillResults,
      careerSkillMap,
      skillNameMap,
    ]);

  const criticalItems =
    priorityItems.filter(
      (item) =>
        item.priorityLevel ===
        "critical"
    );

  const topPriorityItems =
    priorityItems.slice(0, 5);

  /* =======================================================
     AI ROADMAP
  ======================================================= */

  async function generateAiRoadmap() {
    if (
      !career ||
      !assessment ||
      priorityItems.length === 0
    ) {
      return;
    }

    if (aiRoadmap) {
      return;
    }

    setAiRoadmapLoading(
      true
    );

    setAiRoadmapError("");

    try {
      const response =
        await fetch(
          "/api/ai-roadmap",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              career:
                career.name,

              priorities:
                priorityItems.map(
                  (item) => ({
                    name:
                      item.skillName,

                    score:
                      item.score,

                    target:
                      item.target,

                    gap:
                      item.gap,

                    importance:
                      item.importance,

                    priorityScore:
                      item.priorityScore,

                    priorityLevel:
                      item.priorityLevel,
                  })
                ),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Gagal membuat personalized roadmap."
        );
      }

      const roadmap =
        data.roadmap || "";

      if (!roadmap) {
        throw new Error(
          "AI tidak memberikan roadmap."
        );
      }

      localStorage.setItem(
        `skillmap-ai-roadmap-${assessment.id}`,
        roadmap
      );

      setAiRoadmap(
        roadmap
      );
    } catch (error) {
      console.error(
        "AI roadmap error:",
        error
      );

      setAiRoadmapError(
        error instanceof Error
          ? error.message
          : "Personalized roadmap belum dapat dibuat."
      );
    } finally {
      setAiRoadmapLoading(
        false
      );
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">
        <div className="mx-auto max-w-6xl animate-pulse">

          <div className="h-5 w-32 rounded-full bg-slate-200" />

          <div className="mt-5 h-10 w-80 rounded-xl bg-slate-200" />

          <div className="mt-3 h-4 w-[520px] max-w-full rounded-full bg-slate-100" />

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
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">
        <div className="mx-auto max-w-6xl">

          <div className="rounded-[26px] border border-red-100 bg-white p-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Target size={22} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              {t(
                "roadmap.errorTitle"
              )}
            </h1>

            <p className="mt-3 text-sm text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/skillgap"
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              {t(
                "roadmap.backToSkillGap"
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
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">
        <div className="mx-auto max-w-6xl">

          <div className="rounded-[26px] border border-slate-200 bg-white p-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Target size={22} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              {t(
                "roadmap.noAssessment"
              )}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              {t(
                "roadmap.noAssessmentDescription"
              )}
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
    <main className="min-h-screen bg-[#f7faff] px-6 py-8">

      <div className="mx-auto max-w-6xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-[30px] border border-blue-100 bg-white p-7 shadow-[0_15px_45px_rgba(37,99,235,0.05)] sm:p-8">

          <div className="relative z-10">

            <div className="flex flex-wrap items-center gap-2">

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp size={19} />
              </span>

              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {t(
                  "roadmap.label"
                )}
              </span>

              <span className="rounded-full bg-yellow-50 px-3 py-1 text-[10px] font-bold text-yellow-700">
                {t(
                  "roadmap.premium"
                )}
              </span>

            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {t(
                "roadmap.title"
              )}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              {t(
                "roadmap.subtitle"
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

              <span className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-500">
                {assessment.assessment_type ===
                "reassessment"
                  ? t(
                      "roadmap.reassessment"
                    )
                  : t(
                      "roadmap.baseline"
                    )}{" "}
                #{assessment.attempt_number}
              </span>

            </div>

          </div>

          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-yellow-100/50 blur-3xl" />

        </section>

        {/* =================================================
            FREE
        ================================================= */}

        {!isPremium && (
          <section className="mt-5 overflow-hidden rounded-[26px] border border-yellow-200 bg-white">

            <div className="border-b border-yellow-100 bg-yellow-50/60 p-6 sm:p-7">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                  <Lock size={18} />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-yellow-700">
                    {t(
                      "roadmap.locked"
                    )}
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    {t(
                      "roadmap.lockedTitle"
                    )}
                  </h2>

                </div>

              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
                {t(
                  "roadmap.lockedDescription"
                )}
              </p>

            </div>

            <div className="p-6 sm:p-7">

              <div className="space-y-3">

                {topPriorityItems
                  .slice(0, 3)
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          item.skillId
                        }
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
                      >

                        <div className="flex items-center gap-4">

                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-sm font-bold text-yellow-700">
                            {index + 1}
                          </span>

                          <div className="min-w-0">

                            <p className="text-sm font-bold text-slate-900">
                              {item.skillName}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {t(
                                "roadmap.priorityGap"
                              )}{" "}
                              {item.gap}
                            </p>

                          </div>

                        </div>

                      </div>
                    )
                  )}

              </div>

              <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-2xl border border-yellow-100 bg-yellow-50/60 p-5 sm:flex-row">

                <div>

                  <p className="text-sm font-bold text-slate-900">
                    {t(
                      "roadmap.upgradeTitle"
                    )}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {t(
                      "roadmap.upgradeDescription"
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
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-yellow-500/20 transition hover:bg-yellow-600"
                >
                  {t(
                    "roadmap.upgrade"
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
                OVERVIEW
            ============================================= */}

            <section className="mt-5 grid gap-4 md:grid-cols-3">

              <RoadmapStat
                label={t(
                  "roadmap.prioritySkills"
                )}
                value={
                  priorityItems.length
                }
                icon={
                  <TrendingUp size={19} />
                }
              />

              <RoadmapStat
                label={t(
                  "roadmap.criticalSkills"
                )}
                value={
                  criticalItems.length
                }
                icon={
                  <Target size={19} />
                }
              />

              <RoadmapStat
                label={t(
                  "roadmap.topFocus"
                )}
                value={
                  topPriorityItems[0]
                    ?.skillName ??
                  "-"
                }
                icon={
                  <Sparkles size={19} />
                }
                textValue
              />

            </section>

            {/* =============================================
                PRIORITY FOUNDATION
            ============================================= */}

            <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-7">

              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {t(
                  "roadmap.priorityFoundation"
                )}
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {t(
                  "roadmap.priorityFoundationTitle"
                )}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {t(
                  "roadmap.priorityFoundationDescription"
                )}
              </p>

              <div className="mt-6 space-y-3">

                {topPriorityItems.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item.skillId
                      }
                      className={`rounded-2xl border p-5 ${
                        index === 0
                          ? "border-blue-200 bg-blue-50/40"
                          : "border-slate-100 bg-slate-50/50"
                      }`}
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                        <div className="flex items-center gap-4">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-blue-600 shadow-sm">
                            {index + 1}
                          </div>

                          <div>

                            <p className="text-sm font-bold text-slate-900">
                              {item.skillName}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {t(
                                "roadmap.gap"
                              )}{" "}
                              {item.gap}
                              {" · "}
                              {t(
                                "roadmap.priorityScore"
                              )}{" "}
                              {Math.round(
                                item.priorityScore
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="ml-auto flex items-center gap-2">

                          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-blue-600 shadow-sm">
                            {item.priorityLevel ===
                            "critical"
                              ? t(
                                  "roadmap.critical"
                                )
                              : item.priorityLevel ===
                                  "high"
                                ? t(
                                    "roadmap.high"
                                  )
                                : t(
                                    "roadmap.medium"
                                  )}
                          </span>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>

            </section>

            {/* =============================================
                AI ROADMAP
            ============================================= */}

            <section className="mt-5 rounded-[26px] border border-blue-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-7">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                      <Sparkles size={18} />
                    </span>

                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      {t(
                        "roadmap.aiLabel"
                      )}
                    </p>

                  </div>

                  <h2 className="mt-4 text-2xl font-bold text-slate-950">
                    {t(
                      "roadmap.aiTitle"
                    )}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                    {t(
                      "roadmap.aiDescription"
                    )}
                  </p>

                </div>

                {aiRoadmap && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={14} />
                    {t(
                      "roadmap.generated"
                    )}
                  </span>
                )}

              </div>

              {!aiRoadmap &&
                !aiRoadmapLoading && (
                  <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-6">

                    <p className="text-sm font-bold text-slate-900">
                      {t(
                        "roadmap.readyTitle"
                      )}
                    </p>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      {t(
                        "roadmap.readyDescription"
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={
                        generateAiRoadmap
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                    >
                      {t(
                        "roadmap.generate"
                      )}
                      <Sparkles size={16} />
                    </button>

                  </div>
                )}

              {aiRoadmapLoading && (
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">

                  <div className="flex items-center gap-3">

                    <div className="h-9 w-9 animate-pulse rounded-xl bg-blue-200" />

                    <div>

                      <p className="text-sm font-bold text-slate-900">
                        {t(
                          "roadmap.generating"
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {t(
                          "roadmap.generatingDescription"
                        )}
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {aiRoadmapError && (
                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">

                  <p className="text-sm font-semibold text-red-600">
                    {aiRoadmapError}
                  </p>

                  <button
                    type="button"
                    onClick={
                      generateAiRoadmap
                    }
                    className="mt-3 text-xs font-semibold text-red-700 underline"
                  >
                    {t(
                      "roadmap.tryAgain"
                    )}
                  </button>

                </div>
              )}

              {aiRoadmap &&
                !aiRoadmapLoading && (
                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-6">

                    <div className="mb-5 flex items-center gap-3">

                      <span className="rounded-md bg-yellow-500 px-2 py-1 text-[10px] font-bold text-white">
                        AI
                      </span>

                      <div>

                        <p className="text-sm font-bold text-slate-900">
                          {t(
                            "roadmap.personalRoadmap"
                          )}
                        </p>

                        <p className="text-xs text-slate-400">
                          {t(
                            "roadmap.basedOnPriority"
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
                      {aiRoadmap
                        .replace(
                          /\*\*/g,
                          ""
                        )
                        .replace(
                          /^#+\s*/gm,
                          ""
                        )
                        .replace(
                          /^\-\s+/gm,
                          "• "
                        )}
                    </div>

                  </div>
                )}

            </section>

            {/* =============================================
                REASSESSMENT
            ============================================= */}

            <section className="mt-5 rounded-[26px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-6 sm:p-7">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    {t(
                      "roadmap.nextStep"
                    )}
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    {t(
                      "roadmap.nextStepTitle"
                    )}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    {t(
                      "roadmap.nextStepDescription"
                    )}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/skillcheck?career=${career.id}`
                    )
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  {t(
                    "roadmap.reassess"
                  )}
                  <ArrowRight size={16} />
                </button>

              </div>

            </section>

          </>
        )}

        <div className="mt-6 pb-8 text-xs text-slate-400">
          {t(
            "roadmap.footer"
          )}
        </div>

      </div>

    </main>
  );
}

/* =========================================================
   STAT
========================================================= */

function RoadmapStat({
  label,
  value,
  icon,
  textValue = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  textValue?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.035)]">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

      </div>

      <p
        className={`mt-5 font-bold text-slate-950 ${
          textValue
            ? "text-lg"
            : "text-3xl"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   EXPORT
========================================================= */

export default function RoadmapPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7faff] px-6 py-8">
          <div className="mx-auto max-w-6xl animate-pulse">

            <div className="h-5 w-32 rounded-full bg-slate-200" />

            <div className="mt-5 h-10 w-80 rounded-xl bg-slate-200" />

            <div className="mt-3 h-4 w-[520px] max-w-full rounded-full bg-slate-100" />

            <div className="mt-8 h-40 rounded-[26px] bg-white" />

          </div>
        </main>
      }
    >
      <RoadmapPageContent />
    </Suspense>
  );
}