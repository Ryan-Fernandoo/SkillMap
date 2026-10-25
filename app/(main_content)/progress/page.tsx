"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
            "Riwayat assessment gagal dimuat."
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
            "Data perkembangan skill gagal dimuat."
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
          "Terjadi kesalahan saat memuat Progress."
        );

        setLoading(false);
      }
    }

    loadProgress();
  }, [
    careerId,
    router,
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
      "id-ID",
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
    if (
      type === "baseline"
    ) {
      return "Baseline";
    }

    if (
      type === "reassessment"
    ) {
      return "Reassessment";
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
            Memuat Progress...
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
              Progress & History
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
              Kembali ke Skill Check
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
              Progress & History
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Belum Ada Riwayat Pengukuran
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500">
              Setelah menyelesaikan Skill Check,
              perkembangan kompetensimu akan
              tercatat di halaman ini.
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
              Mulai Skill Check
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
            Progress & History
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Perkembangan Kompetensimu
          </h1>

          <p className="mt-2 max-w-2xl text-gray-500">
            Lihat perubahan kompetensimu dari
            satu pengukuran ke pengukuran berikutnya.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">

            <span className="rounded-full border bg-white px-3 py-1 text-xs text-gray-600">
              {career.name}
            </span>

            <span className="rounded-full border bg-white px-3 py-1 text-xs text-gray-600">
              {assessments.length}{" "}
              pengukuran
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
                Pengukuran Terbaru
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
                  Skor rata-rata
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {
                    currentSummary.averageScore
                  }
                </p>

              </div>

              <div>

                <p className="text-xs text-gray-400">
                  Benchmark terpenuhi
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
                  Perubahan skor
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {scoreChange !== null &&
                  scoreChange > 0
                    ? `+${scoreChange}`
                    : scoreChange ?? "-"}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  dibanding pengukuran sebelumnya
                </p>

              </div>

              {/* GAP CHANGE */}

              <div className="rounded-xl border bg-white p-5">

                <p className="text-sm text-gray-500">
                  Perubahan total gap
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
                  semakin kecil semakin dekat
                  dengan benchmark
                </p>

              </div>

              {/* IMPROVEMENT */}

              <div className="rounded-xl border bg-white p-5">

                <p className="text-sm text-gray-500">
                  Perkembangan terbaik
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
                      Naik{" "}
                      <span className="font-semibold text-gray-900">
                        +
                        {
                          biggestImprovement.change
                        }
                      </span>{" "}
                      poin
                    </p>
                  </>

                ) : (

                  <p className="mt-2 text-sm text-gray-400">
                    Belum ada peningkatan
                    skor.
                  </p>

                )}

              </div>

            </div>

          </section>

        ) : (

          <section className="mt-5 rounded-xl border bg-white p-6">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Perkembangan
            </p>

            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              Pengukuran pertama berhasil tercatat
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Lakukan Skill Check kembali setelah
              mengembangkan kompetensi untuk melihat
              perubahan skor dan skill gap dari waktu
              ke waktu.
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
                Perubahan per Skill
              </p>

              <h2 className="mt-2 text-lg font-semibold text-gray-900">
                Apa yang berubah?
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Perbandingan skor antara pengukuran
                terbaru dan sebelumnya.
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
                            Gap saat ini
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
            Insight Progress
          </p>

          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            {previousSummary
              ? "Perkembanganmu terus tercatat"
              : "Perjalanan kompetensimu dimulai dari sini"}
          </h2>

          <div className="mt-4 space-y-3">

            {previousSummary &&
            biggestImprovement &&
            biggestImprovement.change >
              0 && (

              <div className="rounded-lg bg-gray-50 p-4">

                <p className="text-sm leading-relaxed text-gray-600">

                  Kompetensi{" "}

                  <span className="font-medium text-gray-900">
                    {
                      biggestImprovement.skillName
                    }
                  </span>{" "}

                  mengalami peningkatan sebesar{" "}

                  <span className="font-medium text-gray-900">
                    +
                    {
                      biggestImprovement.change
                    }{" "}
                    poin
                  </span>{" "}

                  dibanding pengukuran sebelumnya.

                </p>

              </div>
            )}

            {previousSummary &&
            gapChange !== null &&
            gapChange > 0 && (

              <div className="rounded-lg bg-gray-50 p-4">

                <p className="text-sm leading-relaxed text-gray-600">

                  Total gap kompetensimu berkurang
                  sebesar{" "}

                  <span className="font-medium text-gray-900">
                    {gapChange} poin
                  </span>
                  . Artinya, posisi kompetensimu
                  semakin dekat dengan benchmark.

                </p>

              </div>
            )}

            {!previousSummary && (

              <div className="rounded-lg bg-gray-50 p-4">

                <p className="text-sm leading-relaxed text-gray-600">

                  Hasil ini menjadi baseline untuk
                  mengukur perkembangan kompetensimu
                  pada pengukuran berikutnya.

                </p>

              </div>
            )}

            {biggestDecline && (

              <div className="rounded-lg bg-gray-50 p-4">

                <p className="text-sm leading-relaxed text-gray-600">

                  Kompetensi{" "}

                  <span className="font-medium text-gray-900">
                    {
                      biggestDecline.skillName
                    }
                  </span>{" "}

                  mengalami perubahan skor sebesar{" "}

                  <span className="font-medium text-gray-900">
                    {
                      biggestDecline.change
                    }{" "}
                    poin
                  </span>
                  . Kompetensi ini dapat menjadi
                  perhatian pada pengembangan berikutnya.

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
                Riwayat
              </p>

              <h2 className="mt-2 text-lg font-semibold text-gray-900">
                Riwayat Pengukuran
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Semua hasil Skill Check untuk career ini.
              </p>

            </div>

            <span className="text-xs text-gray-400">
              {assessmentSummaries.length}{" "}
              pengukuran
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
                          Skor
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {
                            summary.averageScore
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          Terpenuhi
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
            Langkah berikutnya
          </p>

          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            Sudah berkembang? Ukur kembali.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            Lakukan Skill Check kembali setelah
            mengembangkan kompetensi untuk memperbarui
            profil, skill gap, roadmap, dan progress-mu.
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
            Ukur Kompetensi Lagi
          </button>

        </section>

      </div>
    </main>
  );
}

export default function ProgressPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 px-6 py-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm text-gray-500">
              Memuat Progress...
            </p>
          </div>
        </main>
      }
    >
      <ProgressPageContent />
    </Suspense>
  );
}
