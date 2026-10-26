"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/language-provider";
import { isPremiumUser } from "@/lib/subscription";

type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
};

type Career = {
  id: string;
  name: string;
  field: string;
  level: string;
  status: string;
};

type Assessment = {
  id: string;
  career_id: string;
  attempt_number: number;
  assessment_type: string;
  status: string;
  completed_at: string | null;
};

type SkillResult = {
  id: number;
  assessment_id: string;
  career_id: string;
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

/* =========================================================
   HELPERS
========================================================= */

function getLevel(
  score: number,
  t: (path: string) => string
) {
  if (score >= 85) {
    return t("dashboard.levelStrong");
  }

  if (score >= 70) {
    return t("dashboard.levelReady");
  }

  if (score >= 50) {
    return t("dashboard.levelDeveloping");
  }

  return t("dashboard.levelBeginner");
}

function getLevelDescription(
  score: number,
  t: (path: string) => string
) {
  if (score >= 85) {
    return t("dashboard.levelDescriptionStrong");
  }

  if (score >= 70) {
    return t("dashboard.levelDescriptionReady");
  }

  if (score >= 50) {
    return t("dashboard.levelDescriptionDeveloping");
  }

  return t("dashboard.levelDescriptionBeginner");
}

function formatDate(
  date: string | null,
  language: string
) {
  if (!date) return "-";

  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(new Date(date));
}

function getAssessmentLabel(
  type: string,
  t: (path: string) => string
) {
  if (type === "baseline") {
    return t("dashboard.baseline");
  }

  if (type === "reassessment") {
    return t("dashboard.reassessment");
  }

  return type;
}

/* =========================================================
   PAGE
========================================================= */

export default function DashboardPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [user, setUser] =
    useState<UserProfile | null>(null);

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
     REFRESH SUBSCRIPTION
  ========================================================= */

  async function refreshSubscription() {
    try {
      const premium =
        await isPremiumUser();

      setIsPremium(premium);
    } catch (error) {
      console.error(
        "Gagal membaca subscription:",
        error
      );

      setIsPremium(false);
    }
  }

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setErrorMessage("");

      try {
        /* =========================
           AUTH
        ========================= */

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push("/login");
          return;
        }

        /* =========================
           SUBSCRIPTION
        ========================= */

        const premium =
          await isPremiumUser();

        setIsPremium(premium);

        /* =========================
           USER
        ========================= */

        const { data: userData } =
          await supabase
            .from("users")
            .select("id, name, email")
            .eq("id", authUser.id)
            .maybeSingle();

        setUser(
          userData ?? {
            id: authUser.id,
            name:
              authUser.user_metadata?.name ??
              null,
            email:
              authUser.email ?? null,
          }
        );

        /* =========================
           LATEST COMPLETED ASSESSMENT
        ========================= */

        const {
          data: assessmentData,
          error: assessmentError,
        } = await supabase
          .from("assessments")
          .select(
            "id, career_id, attempt_number, assessment_type, status, completed_at"
          )
          .eq("user_id", authUser.id)
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

        const {
          data: careerData,
          error: careerError,
        } = await supabase
          .from("careers")
          .select(
            "id, name, field, level, status"
          )
          .eq(
            "id",
            assessmentData.career_id
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
            "id, assessment_id, career_id, skill_id, score, target_score, gap, status"
          )
          .eq(
            "user_id",
            authUser.id
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
            t("dashboard.dataLoadError")
          );

          setLoading(false);
          return;
        }

        const loadedResults =
          resultData ?? [];

        setSkillResults(
          loadedResults
        );

        /* =========================
           SKILL MASTER
        ========================= */

        const skillIds = Array.from(
          new Set(
            loadedResults
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
            .select("id, name")
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
          "Dashboard error:",
          error
        );

        setErrorMessage(
          t("dashboard.loadError")
        );

        setLoading(false);
      }
    }

    loadDashboard();
  }, [router, t]);

  /* =========================================================
     REFRESH PREMIUM WHEN TAB BECOMES ACTIVE
  ========================================================= */

  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        refreshSubscription();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  /* =========================================================
     SKILL NAME MAP
  ========================================================= */

  const skillNameMap = useMemo(() => {
    const map = new Map<
      string,
      string
    >();

    skills.forEach((skill) => {
      map.set(
        skill.id,
        skill.name
      );
    });

    return map;
  }, [skills]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    if (skillResults.length === 0) {
      return {
        average: 0,
        completed: 0,
        total: 0,
        needsDevelopment: 0,
      };
    }

    const totalScore =
      skillResults.reduce(
        (sum, result) =>
          sum + result.score,
        0
      );

    const completed =
      skillResults.filter(
        (result) =>
          result.score >=
          result.target_score
      ).length;

    const needsDevelopment =
      skillResults.filter(
        (result) =>
          result.score <
          result.target_score
      ).length;

    return {
      average: Math.round(
        totalScore /
          skillResults.length
      ),
      completed,
      total:
        skillResults.length,
      needsDevelopment,
    };
  }, [skillResults]);

  /* =========================================================
     LEVEL
  ========================================================= */

  const level = useMemo(
    () =>
      getLevel(
        summary.average,
        t
      ),
    [summary.average, t]
  );

  /* =========================================================
     STRONG SKILLS
  ========================================================= */

  const strongSkills = useMemo(() => {
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
     DEVELOPMENT / SKILL GAP
  ========================================================= */

  const developmentSkills = useMemo(() => {
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
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">
        <div className="mx-auto max-w-6xl animate-pulse">

          <div className="h-4 w-24 rounded-full bg-blue-100" />

          <div className="mt-5 h-10 w-80 rounded-xl bg-slate-200" />

          <div className="mt-3 h-4 w-96 max-w-full rounded-full bg-slate-100" />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-[22px] bg-white"
                />
              )
            )}
          </div>

          <div className="mt-5 h-40 rounded-[26px] bg-white" />

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <div className="h-96 rounded-[26px] bg-white" />
            <div className="h-96 rounded-[26px] bg-white" />
          </div>

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

          <div className="rounded-[26px] border border-red-100 bg-white p-8 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <ClipboardCheck size={22} />
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-red-500">
              {t("dashboard.title")}
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              {t("dashboard.errorTitle")}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              {t("dashboard.retry")}
              <ArrowRight size={16} />
            </button>

          </div>

        </div>
      </main>
    );
  }

  /* =========================================================
     EMPTY DASHBOARD
  ========================================================= */

  if (!assessment || !career) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">
        <div className="mx-auto max-w-6xl">

          <section className="relative overflow-hidden rounded-[30px] border border-blue-100 bg-white p-8 shadow-[0_15px_45px_rgba(37,99,235,0.07)] sm:p-10">

            <div className="relative z-10 max-w-2xl">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Sparkles size={22} />
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-wider text-blue-600">
                {t("dashboard.title")}
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {t("dashboard.hello")},{" "}
                {user?.name ||
                  t("dashboard.defaultUser")}{" "}
                👋
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                {t(
                  "dashboard.emptyDescription"
                )}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/skillcheck"
                  )
                }
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                {t(
                  "dashboard.startSkillCheck"
                )}
                <ArrowRight size={17} />
              </button>

            </div>

            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-100 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-yellow-100/70 blur-3xl" />

          </section>

          <section className="mt-7">

            <div className="mb-4">

              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {t("dashboard.startHere")}
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                {t(
                  "dashboard.threeSteps"
                )}
              </h2>

            </div>

            <div className="grid gap-4 md:grid-cols-3">

              <EmptyStep
                number="01"
                icon={
                  <ClipboardCheck size={20} />
                }
                title={t(
                  "dashboard.stepMeasureTitle"
                )}
                description={t(
                  "dashboard.stepMeasureDescription"
                )}
              />

              <EmptyStep
                number="02"
                icon={
                  <Target size={20} />
                }
                title={t(
                  "dashboard.stepGapTitle"
                )}
                description={t(
                  "dashboard.stepGapDescription"
                )}
              />

              <EmptyStep
                number="03"
                icon={
                  <TrendingUp size={20} />
                }
                title={t(
                  "dashboard.stepRoadmapTitle"
                )}
                description={t(
                  "dashboard.stepRoadmapDescription"
                )}
              />

            </div>

          </section>

        </div>
      </main>
    );
  }

  /* =========================================================
     MAIN DASHBOARD
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f7faff] px-6 py-8">

      <div className="mx-auto max-w-6xl">

        {/* ===================================================
            HEADER
        =================================================== */}

        <section className="relative overflow-hidden rounded-[30px] border border-blue-100 bg-white p-7 shadow-[0_15px_45px_rgba(37,99,235,0.06)] sm:p-8">

          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

            <div>

              <div className="flex items-center gap-2">

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Sparkles size={17} />
                </span>

                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {t("dashboard.title")}
                </p>

              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {t("dashboard.hello")},{" "}
                {user?.name ||
                  t("dashboard.defaultUser")}{" "}
                👋
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {t(
                  "dashboard.subtitle"
                )}
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700">

                <Target size={14} />

                {t(
                  "dashboard.targetLabel"
                )}

                <span className="font-bold">
                  {career.name}
                </span>

              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600">

                <ClipboardCheck size={14} />

                {t(
                  "dashboard.assessmentLabel"
                )} #
                {assessment.attempt_number}

              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
                  isPremium
                    ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >

                {isPremium ? (
                  <Sparkles size={14} />
                ) : (
                  <Lock size={13} />
                )}

                {isPremium
                  ? t(
                      "dashboard.premium"
                    )
                  : t(
                      "dashboard.free"
                    )}

              </span>

            </div>

          </div>

          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-yellow-100/60 blur-3xl" />

        </section>

        {/* ===================================================
            SUMMARY
        ========================================================= */}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <DashboardStat
            icon={
              <BarChart3 size={20} />
            }
            label={t(
              "dashboard.competencyScore"
            )}
            value={summary.average}
            description={t(
              "dashboard.outOf100"
            )}
            tone="blue"
          />

          <DashboardStat
            icon={
              <Trophy size={20} />
            }
            label={t(
              "dashboard.level"
            )}
            value={level}
            description={getLevelDescription(
              summary.average,
              t
            )}
            tone="yellow"
          />

          <DashboardStat
            icon={
              <CheckCircle2 size={20} />
            }
            label={t(
              "dashboard.benchmark"
            )}
            value={`${summary.completed}/${summary.total}`}
            description={t(
              "dashboard.skillsMet"
            )}
            tone="green"
          />

          <DashboardStat
            icon={
              <TrendingUp size={20} />
            }
            label={t(
              "dashboard.needsDevelopment"
            )}
            value={
              summary.needsDevelopment
            }
            description={t(
              "dashboard.skillsBelowBenchmark"
            )}
            tone="orange"
          />

        </section>

        {/* ===================================================
            CAREER
        ========================================================= */}

        <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(37,99,235,0.07)] sm:p-7">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div>

              <div className="flex items-center gap-2">

                <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                  {t(
                    "dashboard.currentCareer"
                  )}
                </span>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                  {t(
                    "dashboard.active"
                  )}
                </span>

              </div>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {career.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {career.field} ·{" "}
                {career.level}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">

                <Clock3 size={13} />

                <span>
                  {t(
                    "dashboard.lastMapping"
                  )}
                </span>

                <span className="font-medium text-slate-600">
                  {formatDate(
                    assessment.completed_at,
                    language
                  )}
                </span>

                <span>·</span>

                <span>
                  {getAssessmentLabel(
                    assessment.assessment_type,
                    t
                  )}
                </span>

              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/skillcheck-result?career=${career.id}&assessment=${assessment.id}`
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {t(
                  "dashboard.viewResult"
                )}
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/skillcheck?career=${career.id}`
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                {t(
                  "dashboard.measureAgain"
                )}
                <Zap size={15} />
              </button>

            </div>

          </div>
        </section>

        {/* ===================================================
            SKILLS
        ========================================================= */}

        <section className="mt-5 grid gap-5 xl:grid-cols-2">

          {/* =================================================
              STRONG SKILLS
          ================================================= */}

          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(37,99,235,0.06)]">

            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="flex items-center gap-2">

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <CheckCircle2 size={18} />
                  </span>

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                    {t(
                      "dashboard.strongSkills"
                    )}
                  </p>

                </div>

                <h2 className="mt-3 text-lg font-bold text-slate-950">
                  {strongSkills.length}{" "}
                  {t(
                    "dashboard.skillsMetCount"
                  )}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/skillprofile?career=${career.id}`
                  )
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
              >
                {t(
                  "dashboard.viewAll"
                )}
                <ChevronRight size={14} />
              </button>

            </div>

            <div className="mt-5 space-y-2.5">

              {strongSkills.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-400">
                  {t(
                    "dashboard.noStrongSkills"
                  )}
                </div>
              ) : (
                strongSkills
                  .slice(0, 5)
                  .map((result) => (
                    <SkillStrongRow
                      key={result.id}
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
                      t={t}
                    />
                  ))
              )}

            </div>

            {strongSkills.length > 5 && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/skillprofile?career=${career.id}`
                  )
                }
                className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                +
                {" "}
                {strongSkills.length - 5}{" "}
                {t(
                  "dashboard.otherSkills"
                )}
              </button>
            )}

          </section>

          {/* =================================================
              SKILL GAP
          ================================================= */}

          <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">

            <div>

              <div className="flex items-start justify-between gap-4">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                      <TrendingUp size={18} />
                    </span>

                    <p className="text-xs font-bold uppercase tracking-wider text-yellow-600">
                      {t(
                        "dashboard.developmentPriority"
                      )}
                    </p>

                  </div>

                  <h2 className="mt-3 text-lg font-bold text-slate-950">
                    {t(
                      "dashboard.skillGapAnalysis"
                    )}
                  </h2>

                </div>

                {!isPremium && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-[10px] font-bold text-yellow-700">
                    <Lock size={11} />
                    {t(
                      "dashboard.premium"
                    )}
                  </span>
                )}

              </div>

              {isPremium ? (
                <>

                  <div className="mt-5 space-y-3">

                    {developmentSkills.length ===
                    0 ? (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                          <CheckCircle2 size={17} />

                          {t(
                            "dashboard.allSkillsMet"
                          )}
                        </div>

                        <p className="mt-2 text-xs leading-5 text-emerald-600">
                          {t(
                            "dashboard.keepImproving"
                          )}
                        </p>

                      </div>
                    ) : (
                      developmentSkills
                        .slice(0, 3)
                        .map((result) => (
                          <DevelopmentRow
                            key={result.id}
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
                            t={t}
                          />
                        ))
                    )}

                  </div>

                  {developmentSkills.length > 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/skillgap?career=${career.id}`
                        )
                      }
                      className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      {t(
                        "dashboard.viewFullSkillGap"
                      )}
                      <ChevronRight size={14} />
                    </button>
                  )}

                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-50/80 to-white p-5">

                  <div className="flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                      <Lock size={18} />
                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-bold text-slate-900">
                        {t(
                          "dashboard.findSkillGap"
                        )}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {t(
                          "dashboard.skillGapLockedDescription"
                        )}
                      </p>

                    </div>

                  </div>

                </div>
              )}

            </div>
          </section>

        </section>

        {/* ===================================================
            QUICK ACTIONS
        ========================================================= */}

        <section className="mt-5 rounded-[26px] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/60 p-6 shadow-[0_10px_30px_rgba(37,99,235,0.05)] sm:p-7">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>

              <div className="flex items-center gap-2">

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                  <Sparkles size={17} />
                </span>

                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {t(
                    "dashboard.nextStep"
                  )}
                </p>

              </div>

              <h2 className="mt-3 text-xl font-bold text-slate-950">
                {t(
                  "dashboard.continueDevelopment"
                )}
              </h2>

              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                {t(
                  "dashboard.nextStepDescription"
                )}
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              {/* SKILL GAP */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/skillgap?career=${career.id}`
                  )
                }
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isPremium
                    ? "border border-blue-200 bg-white text-blue-700 hover:-translate-y-0.5 hover:bg-blue-50"
                    : "border border-yellow-300 bg-yellow-50 text-yellow-700 hover:-translate-y-0.5 hover:bg-yellow-100"
                }`}
              >

                {isPremium ? (
                  <Target size={16} />
                ) : (
                  <Lock size={15} />
                )}

                {t(
                  "dashboard.viewSkillGap"
                )}

              </button>

              {/* ROADMAP */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/roadmap?career=${career.id}`
                  )
                }
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isPremium
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700"
                    : "border border-yellow-300 bg-yellow-50 text-yellow-700 hover:-translate-y-0.5 hover:bg-yellow-100"
                }`}
              >

                {isPremium ? (
                  <ArrowRight size={16} />
                ) : (
                  <Lock size={15} />
                )}

                {t(
                  "dashboard.viewRoadmap"
                )}

              </button>

            </div>

          </div>
        </section>

        {/* ===================================================
            FOOTER NOTE
        ========================================================= */}

        <div className="mt-6 flex items-center px-1 pb-8 text-xs text-slate-400">

          <div className="flex items-center gap-2">
            <CheckCircle2
              size={14}
              className="text-emerald-500"
            />

            {t(
              "dashboard.dataBasedOnLatest"
            )}
          </div>

        </div>

      </div>
    </main>
  );
}

/* =========================================================
   COMPONENT: DASHBOARD STAT
========================================================= */

function DashboardStat({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  description: string;
  tone:
    | "blue"
    | "yellow"
    | "green"
    | "orange";
}) {
  const toneClasses = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      label: "text-blue-500",
      glow: "group-hover:border-blue-200",
    },
    yellow: {
      icon: "bg-yellow-50 text-yellow-600",
      label: "text-yellow-600",
      glow: "group-hover:border-yellow-200",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600",
      label: "text-emerald-600",
      glow: "group-hover:border-emerald-200",
    },
    orange: {
      icon: "bg-orange-50 text-orange-600",
      label: "text-orange-500",
      glow: "group-hover:border-orange-200",
    },
  };

  const current =
    toneClasses[tone];

  return (
    <div
      className={`group rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(37,99,235,0.07)] ${current.glow}`}
    >

      <div className="flex items-start justify-between gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${current.icon}`}
        >
          {icon}
        </div>

        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${current.label}`}
        >
          {label}
        </span>

      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   COMPONENT: STRONG SKILL
========================================================= */

function SkillStrongRow({
  name,
  score,
  target,
  t,
}: {
  name: string;
  score: number;
  target: number;
  t: (path: string) => string;
}) {
  const percentage = Math.min(
    Math.max(score, 0),
    100
  );

  return (
    <div className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50/40">

      <div className="flex items-center justify-between gap-3">

        <div className="min-w-0">

          <p className="truncate text-sm font-semibold text-slate-800">
            {name}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {t(
              "dashboard.target"
            )}{" "}
            {target}
          </p>

        </div>

        <span className="shrink-0 text-sm font-bold text-blue-600">
          {score}
        </span>

      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">

        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-700"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

/* =========================================================
   COMPONENT: DEVELOPMENT
========================================================= */

function DevelopmentRow({
  name,
  score,
  target,
  gap,
  t,
}: {
  name: string;
  score: number;
  target: number;
  gap: number;
  t: (path: string) => string;
}) {
  const percentage = Math.min(
    Math.max(score, 0),
    100
  );

  return (
    <div className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-yellow-200 hover:bg-yellow-50/30">

      <div className="flex items-center justify-between gap-3">

        <div className="min-w-0">

          <p className="truncate text-sm font-semibold text-slate-800">
            {name}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {t(
              "dashboard.score"
            )}{" "}
            {score} ·{" "}
            {t(
              "dashboard.target"
            )}{" "}
            {target}
          </p>

        </div>

        <span className="shrink-0 rounded-full bg-yellow-50 px-2.5 py-1 text-[10px] font-bold text-yellow-700">
          {t(
            "dashboard.gap"
          )}{" "}
          {gap}
        </span>

      </div>

      <div className="mt-3 flex items-center gap-3">

        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">

          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-700"
            style={{
              width: `${percentage}%`,
            }}
          />

        </div>

        <span className="text-[10px] font-medium text-slate-400">
          {score}/{target}
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   COMPONENT: EMPTY STEP
========================================================= */

function EmptyStep({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.03)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_15px_35px_rgba(37,99,235,0.07)]">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition duration-300 group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>

        <span className="text-xs font-bold text-slate-300">
          {number}
        </span>

      </div>

      <h3 className="mt-5 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}