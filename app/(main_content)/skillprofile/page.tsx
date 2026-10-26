"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/language-provider";

/* =========================================================
   TYPES
========================================================= */

type Career = {
  id: string;
  name: string;
  field: string | null;
  level: string | null;
  status: string | null;
};

type Assessment = {
  id: string;
  career_id: string;
  attempt_number: number | null;
  assessment_type: string | null;
  status: string | null;
  completed_at: string | null;
};

type Skill = {
  id: string;
  name: string;
};

type SkillResult = {
  id: number;
  assessment_id: string;
  skill_id: string;
  score: number;
  target_score: number;
  gap: number;
  status: string | null;
};

type UserSkill = {
  id: number;
  skill_id: string | null;
  skill_name: string | null;
  mapping_status: string | null;
  source: string | null;
};

type AssessmentSummary = {
  assessment: Assessment;
  averageScore: number;
  completedSkills: number;
  totalSkills: number;
};

/* =========================================================
   HELPERS
========================================================= */

function getLevel(score: number) {
  if (score >= 85) {
    return "Strong";
  }

  if (score >= 70) {
    return "Ready";
  }

  if (score >= 50) {
    return "Developing";
  }

  return "Beginner";
}

function getLevelTranslation(
  level: string,
  t: (path: string) => string
) {
  switch (level) {
    case "Strong":
      return t("skillProfile.levelStrong");

    case "Ready":
      return t("skillProfile.levelReady");

    case "Developing":
      return t("skillProfile.levelDeveloping");

    default:
      return t("skillProfile.levelBeginner");
  }
}

function getScoreBarClass(score: number) {
  if (score >= 85) {
    return "bg-black";
  }

  if (score >= 70) {
    return "bg-gray-700";
  }

  if (score >= 50) {
    return "bg-gray-400";
  }

  return "bg-gray-300";
}

function formatDate(
  date: string | null,
  language: string
) {
  if (!date) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(
      language === "English"
        ? "en-US"
        : "id-ID",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(new Date(date));
  } catch {
    return "-";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function SkillProfilePage() {
  const searchParams = useSearchParams();

  const { t, language } = useLanguage();

  const careerParam =
    searchParams.get("career");

  const assessmentParam =
    searchParams.get("assessment");

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [career, setCareer] =
    useState<Career | null>(null);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [skillResults, setSkillResults] =
    useState<SkillResult[]>([]);

  const [userSkills, setUserSkills] =
    useState<UserSkill[]>([]);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [assessmentSummaries, setAssessmentSummaries] =
    useState<AssessmentSummary[]>([]);

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  useEffect(() => {
    loadProfile();
  }, [
    careerParam,
    assessmentParam,
  ]);

  async function loadProfile() {
    setLoading(true);
    setErrorMessage("");

    try {
      /* =================================================
         USER
      ================================================= */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          userError.message
        );
      }

      if (!user) {
        throw new Error(
          "User belum login."
        );
      }

      /* =================================================
         LOAD SKILLS MASTER
      ================================================= */

      const {
        data: skillData,
        error: skillError,
      } = await supabase
        .from("skills")
        .select("id, name")
        .order("name", {
          ascending: true,
        });

      if (skillError) {
        console.error(
          "Gagal mengambil skills:",
          skillError
        );

        setSkills([]);
      } else {
        setSkills(
          (skillData || []) as Skill[]
        );
      }

      /* =================================================
         LOAD USER SKILLS
      ================================================= */

      const {
        data: userSkillData,
        error: userSkillError,
      } = await supabase
        .from("user_skills")
        .select(
          `
            id,
            skill_id,
            skill_name,
            mapping_status,
            source
          `
        )
        .eq(
          "user_id",
          user.id
        )
        .order("id", {
          ascending: false,
        });

      if (userSkillError) {
        console.error(
          "Gagal mengambil user skills:",
          userSkillError
        );

        setUserSkills([]);
      } else {
        setUserSkills(
          (userSkillData || []) as UserSkill[]
        );
      }

      /* =================================================
         LOAD COMPLETED ASSESSMENTS

         Kita mengambil semua assessment selesai
         supaya Skill Profile dapat menunjukkan
         perkembangan dari assessment ke assessment.
      ================================================= */

      const {
        data: assessmentData,
        error: assessmentError,
      } = await supabase
        .from("assessments")
        .select(
          `
            id,
            career_id,
            attempt_number,
            assessment_type,
            status,
            completed_at
          `
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
        );

      if (assessmentError) {
        throw new Error(
          assessmentError.message
        );
      }

      let completedAssessments =
        (assessmentData || []) as Assessment[];

      /* =================================================
         FILTER CAREER

         Kalau career diberikan melalui URL,
         gunakan assessment untuk career tersebut.
      ================================================= */

      if (careerParam) {
        completedAssessments =
          completedAssessments.filter(
            (item) =>
              item.career_id === careerParam
          );
      }

      /* =================================================
         SELECT CURRENT ASSESSMENT
      ================================================= */

      let latestAssessment:
        Assessment | null = null;

      if (assessmentParam) {
        latestAssessment =
          completedAssessments.find(
            (item) =>
              item.id === assessmentParam
          ) || null;
      }

      if (!latestAssessment) {
        latestAssessment =
          completedAssessments[0] || null;
      }

      setAssessment(
        latestAssessment
      );

      /* =================================================
         NO ASSESSMENT
      ================================================= */

      if (!latestAssessment) {
        setCareer(null);
        setSkillResults([]);
        setAssessmentSummaries([]);
        setLoading(false);
        return;
      }

      /* =================================================
         LOAD CAREER
      ================================================= */

      const {
        data: careerData,
        error: careerError,
      } = await supabase
        .from("careers")
        .select(
          `
            id,
            name,
            field,
            level,
            status
          `
        )
        .eq(
          "id",
          latestAssessment.career_id
        )
        .single();

      if (careerError) {
        throw new Error(
          careerError.message
        );
      }

      setCareer(
        careerData as Career
      );

      /* =================================================
         LOAD CURRENT SKILL RESULTS
      ================================================= */

      const {
        data: resultData,
        error: resultError,
      } = await supabase
        .from("skill_results")
        .select(
          `
            id,
            assessment_id,
            skill_id,
            score,
            target_score,
            gap,
            status
          `
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "assessment_id",
          latestAssessment.id
        )
        .order(
          "score",
          {
            ascending: false,
          }
        );

      if (resultError) {
        throw new Error(
          resultError.message
        );
      }

      setSkillResults(
        (resultData || []) as SkillResult[]
      );

      /* =================================================
         LOAD ASSESSMENT HISTORY

         Hanya assessment yang mempunyai hasil
         skill yang valid.
      ================================================= */

      const historySummaries: AssessmentSummary[] =
        [];

      for (
        const item of completedAssessments
      ) {
        const {
          data: historyResults,
          error: historyError,
        } = await supabase
          .from("skill_results")
          .select(
            `
              score,
              target_score
            `
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "assessment_id",
            item.id
          );

        if (historyError) {
          console.error(
            "Gagal mengambil history assessment:",
            historyError
          );

          continue;
        }

        const results =
          historyResults || [];

        if (results.length === 0) {
          continue;
        }

        const totalScore =
          results.reduce(
            (
              sum,
              result
            ) =>
              sum +
              Number(
                result.score || 0
              ),
            0
          );

        const completedSkills =
          results.filter(
            (result) =>
              Number(
                result.score || 0
              ) >=
              Number(
                result.target_score || 0
              )
          ).length;

        historySummaries.push({
          assessment: item,
          averageScore:
            Math.round(
              totalScore /
                results.length
            ),
          completedSkills,
          totalSkills:
            results.length,
        });
      }

      setAssessmentSummaries(
        historySummaries
      );
    } catch (error) {
      console.error(
        "Skill Profile error:",
        error
      );

      if (
        error instanceof Error
      ) {
        setErrorMessage(
          error.message
        );
      } else {
        setErrorMessage(
          "Profil kompetensi gagal dimuat."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     CURRENT SCORE
  ======================================================= */

  const overallScore =
    useMemo(() => {
      if (
        skillResults.length === 0
      ) {
        return 0;
      }

      const total =
        skillResults.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.score || 0
            ),
          0
        );

      return Math.round(
        total /
          skillResults.length
      );
    }, [skillResults]);

  /* =======================================================
     LEVEL
  ======================================================= */

  const level =
    useMemo(() => {
      return getLevel(
        overallScore
      );
    }, [overallScore]);

  /* =======================================================
     STRENGTH SIGNATURE
     
     Hanya mengambil beberapa kompetensi
     dengan skor tertinggi.

     Ini bukan daftar seluruh skill.
  ======================================================= */

  const strengthSignature =
    useMemo(() => {
      return [...skillResults]
        .filter(
          (item) =>
            item.score >=
            item.target_score
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        )
        .slice(0, 4)
        .map((item) => {
          const skill =
            skills.find(
              (skillItem) =>
                skillItem.id ===
                item.skill_id
            );

          return {
            id: item.skill_id,
            name:
              skill?.name ||
              item.skill_id,
            score: item.score,
          };
        });
    }, [
      skillResults,
      skills,
    ]);

  /* =======================================================
     DEVELOPMENT PATTERN

     Tidak menampilkan semua gap.
     Hanya mengambil pola umum:
     - jumlah skill development
     - rata-rata gap
     - beberapa area dengan gap terbesar
  ======================================================= */

  const developmentPattern =
    useMemo(() => {
      const development =
        skillResults.filter(
          (item) =>
            item.score <
            item.target_score
        );

      if (
        development.length === 0
      ) {
        return {
          count: 0,
          averageGap: 0,
          focusSkills: [],
        };
      }

      const totalGap =
        development.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Math.max(
              Number(
                item.gap || 0
              ),
              0
            ),
          0
        );

      const focusSkills =
        [...development]
          .sort(
            (a, b) =>
              Math.max(
                Number(
                  b.gap || 0
                ),
                0
              ) -
              Math.max(
                Number(
                  a.gap || 0
                ),
                0
              )
          )
          .slice(0, 3)
          .map((item) => {
            const skill =
              skills.find(
                (skillItem) =>
                  skillItem.id ===
                  item.skill_id
              );

            return (
              skill?.name ||
              item.skill_id
            );
          });

      return {
        count:
          development.length,
        averageGap:
          Math.round(
            totalGap /
              development.length
          ),
        focusSkills,
      };
    }, [
      skillResults,
      skills,
    ]);

  /* =======================================================
     COMPETENCY CHARACTER
  ======================================================= */

  const competencyCharacter =
    useMemo(() => {
      if (
        skillResults.length === 0
      ) {
        return "";
      }

      const strongCount =
        skillResults.filter(
          (item) =>
            item.score >=
            item.target_score
        ).length;

      const developmentCount =
        skillResults.length -
        strongCount;

      if (
        strongCount ===
        skillResults.length
      ) {
        return t(
          "skillProfile.characterAllReady"
        );
      }

      if (
        strongCount >
        developmentCount
      ) {
        return t(
          "skillProfile.characterStrength"
        );
      }

      if (
        strongCount ===
        developmentCount
      ) {
        return t(
          "skillProfile.characterBalanced"
        );
      }

      return t(
        "skillProfile.characterDeveloping"
      );
    }, [
      skillResults,
      t,
    ]);

  /* =======================================================
     PROFILE SUMMARY
  ======================================================= */

  const profileSummary =
    useMemo(() => {
      if (
        skillResults.length === 0
      ) {
        return "";
      }

      if (
        developmentPattern.count ===
        0
      ) {
        return t(
          "skillProfile.summaryAllReady"
        );
      }

      if (
        strengthSignature.length ===
        0
      ) {
        return t(
          "skillProfile.summaryNeedsFoundation"
        );
      }

      if (
        overallScore >= 70
      ) {
        return t(
          "skillProfile.summaryReadyDevelop"
        );
      }

      return t(
        "skillProfile.summaryBuilding"
      );
    }, [
      skillResults,
      developmentPattern,
      strengthSignature,
      overallScore,
      t,
    ]);

  /* =======================================================
     CLAIMED / SELF INPUT SKILLS
  ======================================================= */

  const claimedSkills =
    useMemo(() => {
      return userSkills
        .filter(
          (item) =>
            item.source ===
              "self_input" &&
            item.skill_name &&
            item.skill_name.trim()
        )
        .map((item) => ({
          id: item.id,
          name:
            item.skill_name!.trim(),
        }))
        .filter(
          (
            item,
            index,
            array
          ) =>
            array.findIndex(
              (other) =>
                other.name.toLowerCase() ===
                item.name.toLowerCase()
            ) === index
        );
    }, [userSkills]);

  /* =======================================================
     HISTORY IMPROVEMENT
  ======================================================= */

  const historyTrend =
    useMemo(() => {
      if (
        assessmentSummaries.length <
        2
      ) {
        return null;
      }

      const newest =
        assessmentSummaries[0];

      const previous =
        assessmentSummaries[1];

      const difference =
        newest.averageScore -
        previous.averageScore;

      return {
        difference,
        improved:
          difference > 0,
        decreased:
          difference < 0,
        same:
          difference === 0,
      };
    }, [
      assessmentSummaries,
    ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-gray-500">
            {t(
              "skillProfile.loading"
            )}
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-gray-500">
            {t(
              "skillProfile.label"
            )}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            {t(
              "skillProfile.title"
            )}
          </h1>

          <div className="mt-6 rounded-xl border border-red-200 bg-white px-5 py-4 text-sm text-red-600">
            {errorMessage}
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if (
    !assessment ||
    skillResults.length === 0
  ) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">

          <p className="text-sm text-gray-500">
            {t(
              "skillProfile.label"
            )}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            {t(
              "skillProfile.title"
            )}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            {t(
              "skillProfile.subtitle"
            )}
          </p>

          <div className="mt-8 rounded-2xl border bg-white p-8 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg">
              —
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              {t(
                "skillProfile.noProfile"
              )}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              {t(
                "skillProfile.noProfileDescription"
              )}
            </p>

            <Link
              href="/skillcheck"
              className="mt-6 inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {t(
                "skillCheck.startSkillCheck"
              )}
            </Link>

          </div>

          {claimedSkills.length >
            0 && (
            <section className="mt-8">

              <p className="text-xs uppercase tracking-wide text-gray-400">
                {t(
                  "skillProfile.userInput"
                )}
              </p>

              <h2 className="mt-1 text-base font-semibold text-gray-950">
                {t(
                  "skillProfile.userSkills"
                )}
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {claimedSkills.map(
                  (skill) => (
                    <span
                      key={skill.id}
                      className="rounded-full border bg-white px-3 py-1.5 text-sm text-gray-700"
                    >
                      {skill.name}
                    </span>
                  )
                )}
              </div>

            </section>
          )}

        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN PROFILE
  ======================================================= */

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <header>
          <p className="text-sm font-medium text-gray-500">
            {t(
              "skillProfile.label"
            )}
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {t(
              "skillProfile.title"
            )}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            {t(
              "skillProfile.subtitle"
            )}
          </p>
        </header>

        {/* =================================================
            CAREER CONTEXT
        ================================================= */}

        <section className="mt-6 rounded-2xl border bg-white p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t(
                  "skillProfile.targetCareer"
                )}
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-950">
                {career?.name ||
                  "-"}
              </h2>

              {career?.field && (
                <p className="mt-1 text-sm text-gray-500">
                  {career.field}

                  {career.level
                    ? ` • ${career.level}`
                    : ""}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-3 sm:min-w-[150px] sm:text-right">
              <p className="text-xs text-gray-400">
                {t(
                  "skillProfile.assessment"
                )}
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                #
                {assessment.attempt_number ||
                  1}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {formatDate(
                  assessment.completed_at,
                  language
                )}
              </p>
            </div>

          </div>

        </section>

        {/* =================================================
            COMPETENCY SCORE
        ================================================= */}

        <section className="mt-5 rounded-2xl border bg-white p-6">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t(
                  "skillProfile.overallScore"
                )}
              </p>

              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-black tracking-tight text-gray-950">
                  {overallScore}
                </span>

                <span className="pb-1 text-sm text-gray-400">
                  / 100
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-gray-700">
                {getLevelTranslation(
                  level,
                  t
                )}
              </p>
            </div>

            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {t(
                    "skillProfile.competencyLevel"
                  )}
                </span>

                <span>
                  {overallScore}/100
                </span>
              </div>

              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${getScoreBarClass(
                    overallScore
                  )}`}
                  style={{
                    width: `${Math.min(
                      Math.max(
                        overallScore,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

          </div>

        </section>

        {/* =================================================
            COMPETENCY SIGNATURE
        ================================================= */}

        <section className="mt-5 rounded-2xl border bg-white p-6">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t(
                "skillProfile.competencySignature"
              )}
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-950">
              {t(
                "skillProfile.strengthSignature"
              )}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              {t(
                "skillProfile.strengthSignatureDescription"
              )}
            </p>
          </div>

          {strengthSignature.length >
          0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {strengthSignature.map(
                (skill) => (
                  <div
                    key={skill.id}
                    className="rounded-xl border bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">

                      <p className="font-semibold text-gray-950">
                        {skill.name}
                      </p>

                      <span className="text-sm font-bold text-gray-700">
                        {skill.score}
                      </span>

                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${getScoreBarClass(
                          skill.score
                        )}`}
                        style={{
                          width: `${Math.min(
                            Math.max(
                              skill.score,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />
                    </div>

                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed bg-gray-50 p-5 text-sm leading-6 text-gray-500">
              {t(
                "skillProfile.noStrengthSignature"
              )}
            </div>
          )}

        </section>

        {/* =================================================
            DEVELOPMENT PATTERN
        ================================================= */}

        <section className="mt-5 rounded-2xl border bg-white p-6">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t(
                "skillProfile.developmentPattern"
              )}
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-950">
              {t(
                "skillProfile.developmentPatternTitle"
              )}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              {t(
                "skillProfile.developmentPatternDescription"
              )}
            </p>
          </div>

          {developmentPattern.count >
          0 ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl border bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">
                    {t(
                      "skillProfile.developmentAreas"
                    )}
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-950">
                    {
                      developmentPattern.count
                    }
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {t(
                      "skillProfile.developmentAreasDescription"
                    )}
                  </p>
                </div>

                <div className="rounded-xl border bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">
                    {t(
                      "skillProfile.averageGap"
                    )}
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-950">
                    {
                      developmentPattern.averageGap
                    }
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {t(
                      "skillProfile.averageGapDescription"
                    )}
                  </p>
                </div>

              </div>

              {developmentPattern.focusSkills.length >
                0 && (
                <div className="mt-5">

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {t(
                      "skillProfile.currentFocus"
                    )}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {developmentPattern.focusSkills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-full border bg-white px-3 py-1.5 text-sm font-medium text-gray-700"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-gray-400">
                    {t(
                      "skillProfile.currentFocusNote"
                    )}
                  </p>

                </div>
              )}

            </>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed bg-gray-50 p-5 text-sm leading-6 text-gray-500">
              {t(
                "skillProfile.noDevelopment"
              )}
            </div>
          )}

        </section>

        {/* =================================================
            COMPETENCY CHARACTER
        ================================================= */}

        <section className="mt-5 rounded-2xl border bg-white p-6">

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t(
              "skillProfile.competencyCharacter"
            )}
          </p>

          <h2 className="mt-1 text-xl font-bold text-gray-950">
            {t(
              "skillProfile.characterTitle"
            )}
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600">
            {competencyCharacter}
          </p>

          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t(
                "skillProfile.profileSummaryLabel"
              )}
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-700">
              {profileSummary}
            </p>
          </div>

        </section>

        {/* =================================================
            ASSESSMENT HISTORY
        ================================================= */}

        {assessmentSummaries.length >
          0 && (
          <section className="mt-5 rounded-2xl border bg-white p-6">

            <div className="flex items-end justify-between gap-4">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t(
                    "skillProfile.progress"
                  )}
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-950">
                  {t(
                    "skillProfile.assessmentHistory"
                  )}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  {t(
                    "skillProfile.assessmentHistoryDescription"
                  )}
                </p>
              </div>

              <span className="shrink-0 text-xs text-gray-400">
                {
                  assessmentSummaries.length
                }{" "}
                {t(
                  "skillProfile.measurements"
                )}
              </span>

            </div>

            {historyTrend && (
              <div className="mt-5 rounded-xl border bg-gray-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t(
                    "skillProfile.latestChange"
                  )}
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-700">

                  {historyTrend.improved
                    ? `${t(
                        "skillProfile.scoreImproved"
                      )} +${historyTrend.difference} ${t(
                        "skillProfile.points"
                      )}.`
                    : historyTrend.decreased
                    ? `${t(
                        "skillProfile.scoreDecreased"
                      )} ${historyTrend.difference} ${t(
                        "skillProfile.points"
                      )}.`
                    : t(
                        "skillProfile.scoreSame"
                      )}

                </p>

              </div>
            )}

            <div className="mt-5 divide-y rounded-xl border">

              {assessmentSummaries.map(
                (
                  summary,
                  index
                ) => {
                  const isCurrent =
                    summary.assessment.id ===
                    assessment.id;

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
                            {t(
                              "skillProfile.assessment"
                            )}{" "}
                            #
                            {
                              summary
                                .assessment
                                .attempt_number
                            }
                          </p>

                          {isCurrent && (
                            <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-medium text-white">
                              {t(
                                "skillProfile.current"
                              )}
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(
                            summary
                              .assessment
                              .completed_at,
                            language
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-8">

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400">
                            {t(
                              "skillProfile.score"
                            )}
                          </p>

                          <p className="mt-1 text-lg font-bold text-gray-900">
                            {
                              summary.averageScore
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400">
                            {t(
                              "skillProfile.benchmarkMet"
                            )}
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
        )}

        {/* =================================================
            USER INPUT
        ================================================= */}

        {claimedSkills.length >
          0 && (
          <section className="mt-5 rounded-2xl border bg-white p-6">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t(
                "skillProfile.userInput"
              )}
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-950">
              {t(
                "skillProfile.userSkills"
              )}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {t(
                "skillProfile.userSkillsDescription"
              )}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">

              {claimedSkills.map(
                (skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full border bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                  >
                    {skill.name}
                  </span>
                )
              )}

            </div>

          </section>
        )}

        {/* =================================================
            NEXT STEP
        ================================================= */}

        <section className="mt-5 rounded-2xl border bg-white p-6">

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t(
              "skillProfile.nextStep"
            )}
          </p>

          <h2 className="mt-1 text-xl font-bold text-gray-950">
            {t(
              "skillProfile.nextStepTitle"
            )}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            {t(
              "skillProfile.nextStepDescription"
            )}
          </p>

          <Link
            href={
              career
                ? `/skillcheck?career=${career.id}`
                : "/skillcheck"
            }
            className="mt-5 inline-flex rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {t(
              "skillProfile.measureAgain"
            )}
          </Link>

        </section>

        <div className="h-8" />

      </div>
    </main>
  );
}