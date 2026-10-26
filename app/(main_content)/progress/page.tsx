"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type Career = {
  id: string;
  name: string;
  field: string;
  level: string;
};

type SkillResult = {
  id: number;
  assessment_id: string;
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

type AssessmentSummary = {
  assessment: Assessment;
  averageScore: number;
  totalGap: number;
  completedSkills: number;
  totalSkills: number;
};

type SkillComparison = {
  skillId: string;
  skillName: string;
  previousScore: number;
  currentScore: number;
  change: number;
  currentGap: number;
};

function ProgressPageContent() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();

  const careerId = searchParams.get("career");

  const [career, setCareer] =
    useState<Career | null>(null);

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [skillResults, setSkillResults] =
    useState<SkillResult[]>([]);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    async function loadProgress() {
      setLoading(true);
      setErrorMessage("");

      try {
        /* =========================
           USER
        ========================= */

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        /* =========================
           ASSESSMENTS
        ========================= */

        let assessmentQuery =
          supabase
            .from("assessments")
            .select(
              "id, career_id, attempt_number, assessment_type, status, completed_at"
            )
            .eq("user_id", user.id)
            .eq("status", "completed")
            .order("completed_at", {
              ascending: false,
            });

        if (careerId) {
          assessmentQuery =
            assessmentQuery.eq(
              "career_id",
              careerId
            );
        }

        const {
          data: assessmentData,
          error: assessmentError,
        } = await assessmentQuery;

        if (assessmentError) {
          console.error(
            "Assessment error:",
            assessmentError
          );

          setErrorMessage(
            t("progress.assessmentLoadError")
          );

          setLoading(false);
          return;
        }

        const loadedAssessments =
          assessmentData ?? [];

        setAssessments(
          loadedAssessments
        );

        /* =========================
           NO ASSESSMENT
        ========================= */

        if (
          loadedAssessments.length ===
          0
        ) {
          setLoading(false);
          return;
        }

        const selectedCareerId =
          loadedAssessments[0]
            .career_id;

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
          .single();

        if (
          careerError ||
          !careerData
        ) {
          console.error(
            "Career error:",
            careerError
          );
        } else {
          setCareer(
            careerData
          );
        }

        /* =========================
           SKILL RESULTS
        ========================= */

        const assessmentIds =
          loadedAssessments.map(
            (assessment) =>
              assessment.id
          );

        const {
          data: resultData,
          error: resultError,
        } = await supabase
          .from("skill_results")
          .select(
            "id, assessment_id, skill_id, score, target_score, gap, status"
          )
          .eq(
            "user_id",
            user.id
          )
          .in(
            "assessment_id",
            assessmentIds
          );

        if (resultError) {
          console.error(
            "Skill result error:",
            resultError
          );

          setErrorMessage(
            t("progress.skillLoadError")
          );

          setLoading(false);
          return;
        }

        setSkillResults(
          resultData ?? []
        );

        /* =========================
           SKILLS
        ========================= */

        const skillIds = Array.from(
          new Set(
            (resultData ?? []).map(
              (item) =>
                item.skill_id
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

        setLoading(false);
      } catch (error) {
        console.error(
          "Progress error:",
          error
        );

        setErrorMessage(
          t("progress.loadError")
        );

        setLoading(false);
      }
    }

    loadProgress();
  }, [
    careerId,
    router,
    t,
  ]);

  /* =====================================================
     SKILL NAME MAP
  ===================================================== */

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

  /* =====================================================
     ASSESSMENT SUMMARIES
  ===================================================== */

  const assessmentSummaries =
    useMemo<AssessmentSummary[]>(() => {
      return assessments.map(
        (assessment) => {
          const results =
            skillResults.filter(
              (result) =>
                result.assessment_id ===
                assessment.id
            );

          const totalScore =
            results.reduce(
              (sum, result) =>
                sum + result.score,
              0
            );

          const totalGap =
            results.reduce(
              (sum, result) =>
                sum + result.gap,
              0
            );

          const averageScore =
            results.length > 0
              ? Math.round(
                  totalScore /
                    results.length
                )
              : 0;

          const completedSkills =
            results.filter(
              (result) =>
                result.score >=
                result.target_score
            ).length;

          return {
            assessment,
            averageScore,
            totalGap,
            completedSkills,
            totalSkills:
              results.length,
          };
        }
      );
    }, [
      assessments,
      skillResults,
    ]);

  /* =====================================================
     CURRENT ASSESSMENT
  ===================================================== */

  const currentSummary =
    assessmentSummaries[0] ??
    null;

  /* =====================================================
     PREVIOUS ASSESSMENT
  ===================================================== */

  const previousSummary =
    assessmentSummaries[1] ??
    null;

  /* =====================================================
     OVERALL SCORE CHANGE
  ===================================================== */

  const scoreChange =
    currentSummary &&
    previousSummary
      ? currentSummary.averageScore -
        previousSummary.averageScore
      : null;

  /* =====================================================
     GAP CHANGE
  ===================================================== */

  const gapChange =
    currentSummary &&
    previousSummary
      ? previousSummary.totalGap -
        currentSummary.totalGap
      : null;

  /* =====================================================
     SKILL COMPARISON
  ===================================================== */

  const skillComparisons =
    useMemo<SkillComparison[]>(() => {
      if (
        !currentSummary ||
        !previousSummary
      ) {
        return [];
      }

      const currentResults =
        skillResults.filter(
          (result) =>
            result.assessment_id ===
            currentSummary
              .assessment.id
        );

      const previousResults =
        skillResults.filter(
          (result) =>
            result.assessment_id ===
            previousSummary
              .assessment.id
        );

      return currentResults
        .map(
          (current) => {
            const previous =
              previousResults.find(
                (item) =>
                  item.skill_id ===
                  current.skill_id
              );

            if (!previous) {
              return null;
            }

            return {
              skillId:
                current.skill_id,

              skillName:
                skillNameMap.get(
                  current.skill_id
                ) ??
                current.skill_id,

              previousScore:
                previous.score,

              currentScore:
                current.score,

              change:
                current.score -
                previous.score,

              currentGap:
                current.gap,
            };
          }
        )
        .filter(
          (
            item
          ): item is SkillComparison =>
            item !== null
        )
        .sort(
          (a, b) =>
            b.change -
            a.change
        );
    }, [
      currentSummary,
      previousSummary,
      skillResults,
      skillNameMap,
    ]);

  /* =====================================================
     BIGGEST IMPROVEMENT
  ===================================================== */

  const biggestImprovement =
    skillComparisons.length > 0
      ? skillComparisons[0]
      : null;

  /* =====================================================
     BIGGEST DECLINE
  ===================================================== */

  const biggestDecline =
    skillComparisons
      .filter(
        (item) =>
          item.change < 0
      )
      .sort(
        (a, b) =>
          a.change -
          b.change
      )[0] ?? null;

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  function formatDate(
    date: string | null
  ) {
    if (!date) {
      return "-";
    }

    return new Intl.DateTimeFormat(
      language === "English" ? "en-US" : "id-ID",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(
      new Date(date)
    );
  }

  /* =====================================================
     ASSESSMENT LABEL
  ===================================================== */

  function getAssessmentLabel(
    type: string
  ) {
    if (type === "baseline") {
      return t("progress.baseline");
    }

    if (type === "reassessment") {
      return t("progress.reassessment");
    }

    return type;
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-gray-500">
            {t("progress.loading")}
          </p>
        </div>
      </main>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-5xl">

          <div className="rounded-xl border bg-white p-8">

            <h1 className="text-xl font-bold text-gray-900">
              {t("progress.label")}
            </h1>

            <p className="mt-3 text-sm text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/skillcheck"
                )
              }
              className="mt-6 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
            >
              {t("progress.backToSkillCheck")}
            </button>

          </div>

        </div>
      </main>
    );
  }

  /* =====================================================
     EMPTY STATE
  ===================================================== */

  if (
    !currentSummary ||
    !career
  ) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-5xl">

          <div className="rounded-xl border bg-white p-8">

            <p className="text-sm font-medium text-gray-500">
              {t("progress.label")}
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {t("progress.noMeasurementHistory")}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500">
              {t("progress.noMeasurementHistoryDescription")}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/skillcheck"
                )
              }
              className="mt-6 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
            >
              {t("progress.startSkillCheck")}
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
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div>

          <p className="text-sm font-medium text-gray-500">
            {t("progress.label")}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {t("progress.heading")}
          </h1>

          <p className="mt-2 max-w-2xl text-gray-500">
            {t("progress.subtitle")}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">

            <span className="rounded-full border bg-white px-3 py-1 text-xs text-gray-600">
              {career.name}
            </span>

            <span className="rounded-full border bg-white px-3 py-1 text-xs text-gray-600">
              {assessments.length}{" "}
              {t("progress.measurements")}
            </span>

          </div>

        </div>

        {/* =================================================
            CURRENT STATUS
        ================================================= */}

        <section className="mt-7 rounded-xl border bg-white p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("progress.latestMeasurement")}
              </p>

              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                Assessment{" "}
                #{currentSummary.assessment.attempt_number}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {getAssessmentLabel(
                  currentSummary
                    .assessment
                    .assessment_type
                )}{" "}
                ·{" "}
                {formatDate(
                  currentSummary
                    .assessment
                    .completed_at
                )}
              </p>

            </div>

            <div className="flex items-center gap-8">

              <div>

                <p className="text-xs text-gray-400">
                  {t("progress.averageScore")}
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {
                    currentSummary.averageScore
                  }
                </p>

              </div>

              <div>

                <p className="text-xs text-gray-400">
                  {t("progress.benchmarkMet")}
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {
                    currentSummary.completedSkills
                  }
                  /
                  {
                    currentSummary.totalSkills
                  }
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            COMPARISON
        ================================================= */}

        {previousSummary ? (

          <section className="mt-5">

            <div className="grid gap-4 md:grid-cols-3">

              {/* SCORE CHANGE */}

              <div className="rounded-xl border bg-white p-5">

                <p className="text-sm text-gray-500">
                  {t("progress.scoreChange")}
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {scoreChange !== null &&
                  scoreChange > 0
                    ? `+${scoreChange}`
                    : scoreChange ?? "-"}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  dibanding {t("progress.measurements")} sebelumnya
                </p>

              </div>

              {/* GAP CHANGE */}

              <div className="rounded-xl border bg-white p-5">

                <p className="text-sm text-gray-500">
                  {t("progress.totalGapChange")}
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {gapChange !== null &&
                  gapChange > 0
                    ? `-${gapChange}`
                    : gapChange === 0
                    ? "0"
                    : gapChange
                    ? `+${Math.abs(
                        gapChange
                      )}`
                    : "-"}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {t("progress.gapChangeDescription")}
                </p>

              </div>

              {/* IMPROVEMENT */}

              <div className="rounded-xl border bg-white p-5">

                <p className="text-sm text-gray-500">
                  {t("progress.bestDevelopment")}
                </p>

                {biggestImprovement &&
                biggestImprovement.change >
                  0 ? (

                  <>
                    <p className="mt-2 text-base font-semibold text-gray-900">
                      {
                        biggestImprovement.skillName
                      }
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {t("progress.increasedBy")}{" "}
                      <span className="font-semibold text-gray-900">
                        +
                        {
                          biggestImprovement.change
                        }
                      </span>{" "}
                      {t("progress.points")}
                    </p>
                  </>

                ) : (

                  <p className="mt-2 text-sm text-gray-400">
                    {t("progress.noImprovement")}
                  </p>

                )}

              </div>

            </div>

          </section>

        ) : (

          <section className="mt-5 rounded-xl border bg-white p-6">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t("progress.development")}
            </p>

            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {t("progress.developmentTitle")}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              {t("progress.developmentDescription")}
            </p>

          </section>

        )}

        {/* =================================================
            SKILL CHANGES
        ================================================= */}

        {previousSummary &&
        skillComparisons.length > 0 && (

          <section className="mt-5 rounded-xl border bg-white p-6">

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("progress.perSkillChanges")}
              </p>

              <h2 className="mt-2 text-lg font-semibold text-gray-900">
                {t("progress.whatChanged")}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {t("progress.skillComparisonDescription")}
              </p>

            </div>

            <div className="mt-5 divide-y rounded-xl border">

              {skillComparisons.map(
                (skill) => {

                  const isImproved =
                    skill.change > 0;

                  const isDeclined =
                    skill.change < 0;

                  return (
                    <div
                      key={
                        skill.skillId
                      }
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div>

                        <p className="text-sm font-medium text-gray-900">
                          {
                            skill.skillName
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {
                            skill.previousScore
                          }{" "}
                          →{" "}
                          {
                            skill.currentScore
                          }
                        </p>

                      </div>

                      <div className="flex items-center gap-5">

                        <div className="text-right">

                          <p className="text-xs text-gray-400">
                            {t("progress.currentGap")}
                          </p>

                          <p className="text-sm font-medium text-gray-700">
                            {
                              skill.currentGap
                            }
                          </p>

                        </div>

                        <div
                          className={`min-w-16 text-right text-sm font-semibold ${
                            isImproved
                              ? "text-gray-900"
                              : isDeclined
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        >

                          {isImproved
                            ? `+${skill.change}`
                            : skill.change}

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </section>

        )}

        {/* =================================================
            INSIGHT
        ================================================= */}

        <section className="mt-5 rounded-xl border bg-white p-6">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {t("progress.insightTitle")}
          </p>

          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            {previousSummary
              ? t("progress.insightContinuedTitle")
              : t("progress.insightStartedTitle")}
          </h2>

          <div className="mt-4 space-y-3">

            {previousSummary &&
            biggestImprovement &&
            biggestImprovement.change >
              0 && (

              <div className="rounded-lg bg-gray-50 p-4">

                <p className="text-sm leading-relaxed text-gray-600">

                  {t("progress.improvementInsightPrefix")} {" "}
                  <span className="font-medium text-gray-900">
                    {biggestImprovement.skillName}
                  </span>{" "}
                  {t("progress.improvementInsightText")} {" "}
                  <span className="font-medium text-gray-900">
                    +{biggestImprovement.change} {t("progress.points")}
                  </span>{" "}
                  {t("progress.comparedPreviousText")}

                </p>

              </div>
            )}

            {previousSummary &&
            gapChange !== null &&
            gapChange > 0 && (

              <div className="rounded-lg bg-gray-50 p-4">

                <p className="text-sm leading-relaxed text-gray-600">

                  {t("progress.totalGapReduced")} {" "}
                  <span className="font-medium text-gray-900">
                    {gapChange} {t("progress.points")}
                  </span>. {t("progress.closerToBenchmark")}

                </p>

              </div>
            )}

            {!previousSummary && (

              <div className="rounded-lg bg-gray-50 p-4">

                <p className="text-sm leading-relaxed text-gray-600">

                  {t("progress.baselineInsightText")}

                </p>

              </div>
            )}

            {biggestDecline && (

              <div className="rounded-lg bg-gray-50 p-4">

                <p className="text-sm leading-relaxed text-gray-600">

                  {t("progress.skill")} {" "}
                  <span className="font-medium text-gray-900">
                    {biggestDecline.skillName}
                  </span>{" "}
                  {t("progress.declineInsightText")} {" "}
                  <span className="font-medium text-gray-900">
                    {biggestDecline.change} {t("progress.points")}
                  </span>. {t("progress.declineInsightAttention")}

                </p>

              </div>
            )}

          </div>

        </section>

        {/* =================================================
            HISTORY
        ================================================= */}

        <section className="mt-5 rounded-xl border bg-white p-6">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("progress.history")}
              </p>

              <h2 className="mt-2 text-lg font-semibold text-gray-900">
                {t("progress.measurementHistory")}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {t("progress.historyCareerDescription")}
              </p>

            </div>

            <span className="text-xs text-gray-400">
              {assessmentSummaries.length}{" "}
              {t("progress.measurements")}
            </span>

          </div>

          <div className="mt-5 divide-y rounded-xl border">

            {assessmentSummaries.map(
              (summary) => {

                return (
                  <div
                    key={
                      summary.assessment.id
                    }
                    className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="text-sm font-semibold text-gray-900">
                          Assessment #
                          {
                            summary
                              .assessment
                              .attempt_number
                          }
                        </p>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-gray-600">
                          {
                            getAssessmentLabel(
                              summary
                                .assessment
                                .assessment_type
                            )
                          }
                        </span>

                      </div>

                      <p className="mt-1 text-xs text-gray-400">
                        {
                          formatDate(
                            summary
                              .assessment
                              .completed_at
                          )
                        }
                      </p>

                    </div>

                    <div className="flex items-center gap-8">

                      <div>

                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          {t("progress.score")}
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {
                            summary.averageScore
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          {t("progress.met")}
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {
                            summary.completedSkills
                          }
                          /
                          {
                            summary.totalSkills
                          }
                        </p>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* =================================================
            BOTTOM CTA
        ================================================= */}

        <section className="mt-5 rounded-xl border bg-white p-6">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {t("progress.nextStep")}
          </p>

          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            {t("progress.measureAgainCtaTitle")}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            {t("progress.measureAgainCtaDescription")}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/skillcheck?career=${career.id}`
              )
            }
            className="mt-5 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {t("progress.measureAgain")}
          </button>

        </section>

      </div>
    </main>
  );
}

function ProgressLoadingFallback() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-gray-500">
          {t("progress.loading")}
        </p>
      </div>
    </main>
  );
}

export default function ProgressPage() {
  return (
    <Suspense
      fallback={<ProgressLoadingFallback />}
    >
      <ProgressPageContent />
    </Suspense>
  );
}
