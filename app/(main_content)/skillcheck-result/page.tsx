"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/language-provider";

type Assessment = {
  id: string;
  career_id: string;
  attempt_number: number;
  assessment_type: string;
  status: string;
  completed_at: string | null;
};

type UserAnswer = {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  score: number;
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

type Career = {
  id: string;
  name: string;
  field: string;
  level: string;
};

type FilterType =
  | "all"
  | "completed"
  | "development";

export default function SkillCheckResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const careerId = searchParams.get("career");
  const assessmentId = searchParams.get("assessment");

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [career, setCareer] =
    useState<Career | null>(null);

  const [skillResults, setSkillResults] =
    useState<SkillResult[]>([]);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [userAnswers, setUserAnswers] =
    useState<UserAnswer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState<FilterType>("all");

  const [openSkillId, setOpenSkillId] =
    useState<string | null>(null);

  /* =====================================================
     LOAD RESULT
  ===================================================== */

  useEffect(() => {
    async function loadResult() {
      setLoading(true);
      setErrorMessage("");

      try {
        if (!careerId || !assessmentId) {
          setErrorMessage(
            "Data hasil assessment tidak lengkap."
          );
          setLoading(false);
          return;
        }

        /* =========================
           USER
        ========================= */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Gagal mengambil user:",
            userError
          );
        }

        if (!user) {
          router.push("/login");
          return;
        }

        /* =========================
           ASSESSMENT
        ========================= */

        const {
          data: assessmentData,
          error: assessmentError,
        } = await supabase
          .from("assessments")
          .select(
            "id, career_id, attempt_number, assessment_type, status, completed_at"
          )
          .eq("id", assessmentId)
          .eq("user_id", user.id)
          .single();

        if (
          assessmentError ||
          !assessmentData
        ) {
          console.error(
            "Gagal mengambil assessment:",
            assessmentError
          );

          setErrorMessage(
            "Data assessment tidak ditemukan."
          );

          setLoading(false);
          return;
        }

        setAssessment(assessmentData);

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
          .eq("id", careerId)
          .single();

        if (
          careerError ||
          !careerData
        ) {
          console.error(
            "Gagal mengambil career:",
            careerError
          );

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
          data: skillResultData,
          error: skillResultError,
        } = await supabase
          .from("skill_results")
          .select(
            "id, skill_id, score, target_score, gap, status"
          )
          .eq("user_id", user.id)
          .eq("career_id", careerId)
          .eq("assessment_id", assessmentId)
          .order("skill_id", {
            ascending: true,
          });

        if (skillResultError) {
          console.error(
            "Gagal mengambil skill results:",
            skillResultError
          );

          setErrorMessage(
            "Hasil kompetensi gagal dimuat."
          );

          setLoading(false);
          return;
        }

        const loadedSkillResults =
          skillResultData ?? [];

        setSkillResults(
          loadedSkillResults
        );

        /* =========================
           USER ANSWERS
        ========================= */

        const {
          data: answerData,
          error: answerError,
        } = await supabase
          .from("user_answers")
          .select(
            "question_id, selected_option, is_correct, score"
          )
          .eq("user_id", user.id)
          .eq(
            "assessment_id",
            assessmentId
          );

        if (answerError) {
          console.error(
            "Gagal mengambil user answers:",
            answerError
          );

          setErrorMessage(
            "Jawaban assessment gagal dimuat."
          );

          setLoading(false);
          return;
        }

        setUserAnswers(
          answerData ?? []
        );

        /* =========================
           SKILLS
        ========================= */

        const skillIds =
          loadedSkillResults.map(
            (item) => item.skill_id
          );

        if (skillIds.length > 0) {
          const {
            data: skillData,
            error: skillError,
          } = await supabase
            .from("skills")
            .select("id, name")
            .in("id", skillIds);

          if (skillError) {
            console.error(
              "Gagal mengambil skills:",
              skillError
            );

            setSkills([]);
          } else {
            setSkills(
              skillData ?? []
            );
          }
        }

        setLoading(false);
      } catch (error) {
        console.error(
          "Result page error:",
          error
        );

        setErrorMessage(
          "Terjadi kesalahan saat memuat hasil assessment."
        );

        setLoading(false);
      }
    }

    loadResult();
  }, [
    careerId,
    assessmentId,
    router,
  ]);

  /* =====================================================
     SKILL NAME MAP
  ===================================================== */

  const skillNameMap = useMemo(() => {
    const map = new Map<string, string>();

    skills.forEach((skill) => {
      map.set(skill.id, skill.name);
    });

    return map;
  }, [skills]);

  /* =====================================================
     OVERALL SCORE
  ===================================================== */

  const overallScore = useMemo(() => {
    if (userAnswers.length === 0) {
      return 0;
    }

    const correctAnswers =
      userAnswers.filter(
        (answer) => answer.is_correct
      ).length;

    return Math.round(
      (correctAnswers /
        userAnswers.length) *
        100
    );
  }, [userAnswers]);

  /* =====================================================
     STATUS
  ===================================================== */

  const level = useMemo(() => {
    if (userAnswers.length === 0) {
      return "-";
    }

    if (overallScore < 50) {
      return t("skillProfile.needsDevelopment");
    }

    if (overallScore < 70) {
      return "Developing";
    }

    if (overallScore < 85) {
      return "Ready";
    }

    return "Strong";
  }, [
    overallScore,
    userAnswers.length,
    t,
  ]);

  /* =====================================================
     COMPLETED SKILLS
  ===================================================== */

  const completedSkills = useMemo(() => {
    return skillResults.filter(
      (skill) =>
        skill.score >=
        skill.target_score
    );
  }, [skillResults]);

  /* =====================================================
     DEVELOPMENT SKILLS
  ===================================================== */

  const developmentSkills = useMemo(() => {
    return skillResults
      .filter(
        (skill) =>
          skill.score <
          skill.target_score
      )
      .sort(
        (a, b) => b.gap - a.gap
      );
  }, [skillResults]);

  /* =====================================================
     FILTERED SKILLS
  ===================================================== */

  const filteredSkills = useMemo(() => {
    if (
      activeFilter ===
      "completed"
    ) {
      return completedSkills;
    }

    if (
      activeFilter ===
      "development"
    ) {
      return developmentSkills;
    }

    return skillResults;
  }, [
    activeFilter,
    skillResults,
    completedSkills,
    developmentSkills,
  ]);

  /* =====================================================
     ASSESSMENT LABEL
  ===================================================== */

  const assessmentLabel = useMemo(() => {
    if (!assessment) {
      return "-";
    }

    if (
      assessment.assessment_type ===
      "baseline"
    ) {
      return "Baseline";
    }

    if (
      assessment.assessment_type ===
      "reassessment"
    ) {
      return "Reassessment";
    }

    return assessment.assessment_type;
  }, [assessment]);

  /* =====================================================
     TOGGLE SKILL
  ===================================================== */

  function toggleSkill(
    skillId: string
  ) {
    setOpenSkillId((current) =>
      current === skillId
        ? null
        : skillId
    );
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="text-sm font-medium text-slate-700">
              {t("skillCheck.loading")}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {t("skillCheck.currentMappingDescription")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 font-bold text-red-600">
              !
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-red-500">
              {t("skillCheck.label")}
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {t("skillCheck.errorTitle")}
            </h1>

            <p className="mt-3 text-sm leading-6 text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  careerId
                    ? `/skillcheck?career=${careerId}`
                    : "/skillcheck"
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t("common.back")}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     MAIN
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="text-center">
          <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {t("skillCheck.label")}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("skillCheck.successTitle")}
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            {t("skillCheck.successDescription")}
          </p>

          {career && (
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {t("skillProfile.targetCareer")}:{" "}
              {career.name}
            </p>
          )}
        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="mt-7 grid gap-4 md:grid-cols-3">

          {/* SCORE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              {t("skillProfile.overallScore")}
            </p>

            <p className="mt-3 text-4xl font-bold text-slate-900">
              {userAnswers.length > 0
                ? overallScore
                : "-"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {userAnswers.length > 0
                ? `${
                    userAnswers.filter(
                      (answer) =>
                        answer.is_correct
                    ).length
                  } / ${
                    userAnswers.length
                  } ${t(
                    "skillCheck.answeredQuestions"
                  )}`
                : t("common.noData")}
            </p>
          </div>

          {/* STATUS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              {t("skillProfile.status")}
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {level}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              {t("skillCheck.currentMapping")}
            </p>
          </div>

          {/* ASSESSMENT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              {t("skillCheck.assessment")}
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {assessmentLabel}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {t("skillProfile.measurements")} #
              {assessment?.attempt_number ?? "-"}
            </p>
          </div>
        </div>

        {/* =================================================
            SUMMARY PROGRESS
        ================================================= */}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t("skillCheck.summary")}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {t("skillCheck.currentMappingDescription")}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-2xl font-bold text-slate-900">
                {completedSkills.length}
                <span className="text-sm font-normal text-slate-400">
                  {" "}
                  / {skillResults.length}
                </span>
              </p>

              <p className="text-xs text-slate-500">
                {t("skillProfile.benchmarkMet")}
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${
                  skillResults.length >
                  0
                    ? Math.round(
                        (completedSkills.length /
                          skillResults.length) *
                          100
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs text-slate-400">
            <span>
              {completedSkills.length}{" "}
              {t("skillProfile.good")}
            </span>

            <span>
              {developmentSkills.length}{" "}
              {t(
                "skillProfile.needsDevelopment"
              )}
            </span>
          </div>
        </section>

        {/* =================================================
            DETAIL KOMPETENSI
        ================================================= */}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Detail Kompetensi
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {t("skillCheck.currentMappingDescription")}
            </p>
          </div>

          {/* FILTER */}

          <div className="mt-5 flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                setActiveFilter("all")
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("common.view")}{" "}
              <span className="ml-1 opacity-60">
                {skillResults.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveFilter(
                  "completed"
                )
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeFilter ===
                "completed"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("skillProfile.good")}{" "}
              <span className="ml-1 opacity-60">
                {completedSkills.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveFilter(
                  "development"
                )
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeFilter ===
                "development"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t(
                "skillProfile.needsDevelopment"
              )}{" "}
              <span className="ml-1 opacity-60">
                {developmentSkills.length}
              </span>
            </button>

          </div>

          {/* SKILL LIST */}

          <div className="mt-5 space-y-3">

            {filteredSkills.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm text-slate-400">
                  {t("common.noData")}
                </p>
              </div>
            ) : (
              filteredSkills.map(
                (result) => {
                  const skillName =
                    skillNameMap.get(
                      result.skill_id
                    ) ??
                    result.skill_id;

                  const isOpen =
                    openSkillId ===
                    result.skill_id;

                  const isCompleted =
                    result.score >=
                    result.target_score;

                  return (
                    <div
                      key={result.id}
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >

                      {/* SKILL ROW */}

                      <button
                        type="button"
                        onClick={() =>
                          toggleSkill(
                            result.skill_id
                          )
                        }
                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
                      >
                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="truncate text-sm font-semibold text-slate-900">
                              {skillName}
                            </p>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-orange-50 text-orange-600"
                              }`}
                            >
                              {isCompleted
                                ? t(
                                    "skillProfile.good"
                                  )
                                : t(
                                    "skillProfile.needsDevelopment"
                                  )}
                            </span>

                          </div>

                          <p className="mt-1 text-xs text-slate-400">
                            {t(
                              "skillProfile.benchmark"
                            )}{" "}
                            {
                              result.target_score
                            }
                          </p>

                        </div>

                        <div className="flex shrink-0 items-center gap-3">

                          <span className="text-lg font-bold text-slate-900">
                            {result.score}
                          </span>

                          <span className="text-lg text-slate-400">
                            {isOpen
                              ? "−"
                              : "+"}
                          </span>

                        </div>
                      </button>

                      {/* DETAIL */}

                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">

                          <div className="grid grid-cols-3 gap-2 sm:gap-3">

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                {t(
                                  "skillProfile.score"
                                )}
                              </p>

                              <p className="mt-1 text-lg font-bold text-slate-900">
                                {
                                  result.score
                                }
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                {t(
                                  "skillProfile.benchmark"
                                )}
                              </p>

                              <p className="mt-1 text-lg font-bold text-slate-900">
                                {
                                  result.target_score
                                }
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                {t(
                                  "skillProfile.gap"
                                )}
                              </p>

                              <p className="mt-1 text-lg font-bold text-slate-900">
                                {result.gap}
                              </p>
                            </div>

                          </div>

                          {/* SCORE BAR */}

                          <div className="mt-4">

                            <div className="flex justify-between text-xs text-slate-500">
                              <span>
                                {t(
                                  "skillProfile.score"
                                )}
                              </span>

                              <span>
                                {
                                  result.score
                                }{" "}
                                /{" "}
                                {
                                  result.target_score
                                }
                              </span>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{
                                  width: `${Math.min(
                                    result.score,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>

                          </div>

                          {/* STATUS */}

                          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">

                            <div className="flex items-center gap-2">

                              <CheckCircle2
                                size={15}
                                className={
                                  isCompleted
                                    ? "text-emerald-500"
                                    : "text-orange-500"
                                }
                              />

                              <p className="text-xs font-semibold text-slate-700">
                                {t(
                                  "skillProfile.status"
                                )}
                              </p>

                            </div>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {isCompleted
                                ? t(
                                    "skillProfile.good"
                                  )
                                : t(
                                    "skillProfile.needsDevelopment"
                                  )}
                            </p>

                          </div>

                        </div>
                      )}

                    </div>
                  );
                }
              )
            )}

          </div>
        </section>

        {/* =================================================
            NEXT STEP
        ================================================= */}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-base font-bold text-slate-900">
                {t(
                  "skillProfile.nextStepTitle"
                )}
              </p>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                {t(
                  "skillProfile.nextStepDescription"
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  careerId
                    ? `/skillprofile?career=${careerId}&assessment=${assessmentId}`
                    : "/skillprofile"
                )
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
            >
              {t("skillProfile.title")}
              <ArrowRight size={16} />
            </button>

          </div>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="mt-6 flex items-center justify-center gap-2 px-2 pb-6 text-xs text-slate-400">

          <ClipboardCheck
            size={14}
            className="text-blue-400"
          />

          <span>
            {t(
              "skillCheck.successDescription"
            )}
          </span>

        </div>

      </div>
    </main>
  );
}