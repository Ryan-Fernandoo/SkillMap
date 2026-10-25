"use client";

import { useEffect, useMemo, useState } from "react";
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

  // =========================
  // AI FEEDBACK
  // =========================

  const [aiFeedback, setAiFeedback] =
    useState("");

  const [aiLoading, setAiLoading] =
    useState(false);

  /* =========================
     LOAD RESULT
  ========================= */

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
          .select("id, name, field, level")
          .eq("id", careerId)
          .single();

        if (careerError || !careerData) {
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
          .eq("assessment_id", assessmentId);

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
            setSkills(skillData ?? []);
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

  /* =========================
     SKILL NAME MAP
  ========================= */

  const skillNameMap = useMemo(() => {
    const map = new Map<string, string>();

    skills.forEach((skill) => {
      map.set(skill.id, skill.name);
    });

    return map;
  }, [skills]);

  /* =========================
     OVERALL SCORE
  ========================= */

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

  /* =========================
     LEVEL
  ========================= */

  const level = useMemo(() => {
    if (userAnswers.length === 0) {
      return "-";
    }

    if (overallScore < 50) {
      return "Perlu Pengembangan";
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
  ]);

  /* =========================
     COMPLETED SKILLS
  ========================= */

  const completedSkills = useMemo(() => {
    return skillResults.filter(
      (skill) =>
        skill.score >= skill.target_score
    );
  }, [skillResults]);

  /* =========================
     DEVELOPMENT SKILLS
  ========================= */

  const developmentSkills = useMemo(() => {
    return skillResults
      .filter(
        (skill) =>
          skill.score < skill.target_score
      )
      .sort((a, b) => b.gap - a.gap);
  }, [skillResults]);

  /* =========================
     FILTERED SKILLS
  ========================= */

  const filteredSkills = useMemo(() => {
    if (activeFilter === "completed") {
      return completedSkills;
    }

    if (activeFilter === "development") {
      return developmentSkills;
    }

    return skillResults;
  }, [
    activeFilter,
    skillResults,
    completedSkills,
    developmentSkills,
  ]);

  /* =========================
     ASSESSMENT LABEL
  ========================= */

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

  /* =========================
     STRENGTH AREA
  ========================= */

  const strongSkillNames = useMemo(() => {
    return completedSkills
      .slice(0, 3)
      .map(
        (skill) =>
          skillNameMap.get(
            skill.skill_id
          ) ?? skill.skill_id
      );
  }, [
    completedSkills,
    skillNameMap,
  ]);

  /* =========================
     DEVELOPMENT NAMES
  ========================= */

  const developmentSkillNames =
    useMemo(() => {
      return developmentSkills
        .slice(0, 2)
        .map(
          (skill) =>
            skillNameMap.get(
              skill.skill_id
            ) ?? skill.skill_id
        );
    }, [
      developmentSkills,
      skillNameMap,
    ]);

  /* =========================
     PROFILE INSIGHT
  ========================= */

  const profileInsight = useMemo(() => {
    if (skillResults.length === 0) {
      return "Profil kompetensi belum dapat dianalisis.";
    }

    if (
      completedSkills.length ===
      skillResults.length
    ) {
      return `Kamu sudah memenuhi benchmark pada seluruh ${skillResults.length} kompetensi yang diukur untuk ${career?.name ?? "career ini"}.`;
    }

    return `Kamu sudah memenuhi benchmark pada ${completedSkills.length} dari ${skillResults.length} kompetensi untuk ${career?.name ?? "career ini"}.`;
  }, [
    skillResults,
    completedSkills,
    career,
  ]);

  /* =========================
     FOCUS INSIGHT
  ========================= */

  const focusInsight = useMemo(() => {
    if (developmentSkills.length === 0) {
      return "Tidak ada kompetensi yang berada di bawah benchmark. Fokus berikutnya adalah mempertahankan dan memperluas kompetensi melalui pengalaman nyata.";
    }

    if (
      developmentSkillNames.length === 1
    ) {
      return `${developmentSkillNames[0]} menjadi fokus pengembangan utama berdasarkan hasil pengukuran saat ini.`;
    }

    return `${developmentSkillNames.join(
      " dan "
    )} menjadi area yang perlu mendapat perhatian lebih lanjut karena masih memiliki gap terhadap benchmark.`;
  }, [
    developmentSkills,
    developmentSkillNames,
  ]);

  /* =========================
     AI FEEDBACK
  ========================= */

  useEffect(() => {
    if (
      !career ||
      skillResults.length === 0
    ) {
      return;
    }

    async function getAIFeedback() {
      setAiLoading(true);
      setAiFeedback("");

      try {
        const response = await fetch(
          "/api/ai-feedback",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              career: career?.name ?? "Unknown Career",
              skills: skillResults.map(
                (skill) => ({
                  name:
                    skillNameMap.get(
                      skill.skill_id
                    ) ??
                    skill.skill_id,
                  score: skill.score,
                  target:
                    skill.target_score,
                  gap: skill.gap,
                  status: skill.status,
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
              "Gagal mendapatkan AI feedback."
          );
        }

        setAiFeedback(
          data.feedback ||
            "Feedback AI belum tersedia."
        );
      } catch (error) {
        console.error(
          "AI feedback error:",
          error
        );

        setAiFeedback(
          "AI feedback belum dapat dimuat. Silakan coba lagi."
        );
      } finally {
        setAiLoading(false);
      }
    }

    getAIFeedback();
  }, [
    career,
    skillResults,
    skillNameMap,
  ]);

  /* =========================
     TOGGLE SKILL
  ========================= */

  function toggleSkill(
    skillId: string
  ) {
    setOpenSkillId((current) =>
      current === skillId
        ? null
        : skillId
    );
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-gray-500">
            Memuat hasil Skill Check...
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border bg-white p-8">
            <h1 className="text-xl font-bold text-gray-900">
              Hasil Assessment
            </h1>

            <p className="mt-3 text-sm text-red-600">
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
              className="mt-6 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Kembali ke Skill Check
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     MAIN
  ========================= */

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">
            Skill Check Result
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Hasil Pemetaan Kompetensi
          </h1>

          <p className="mt-2 text-gray-500">
            Ringkasan kompetensi berdasarkan hasil
            Skill Check kamu.
          </p>

          {career && (
            <p className="mt-2 text-sm font-medium text-gray-700">
              Target Career: {career.name}
            </p>
          )}
        </div>

        {/* SUMMARY */}

        <div className="mt-8 grid gap-4 md:grid-cols-3">

          {/* OVERALL */}

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Skor Keseluruhan
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {userAnswers.length > 0
                ? overallScore
                : "-"}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              {userAnswers.length > 0
                ? `${userAnswers.filter(
                    (answer) =>
                      answer.is_correct
                  ).length} dari ${
                    userAnswers.length
                  } jawaban benar`
                : "Belum tersedia"}
            </p>
          </div>

          {/* LEVEL */}

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Level
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {level}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Berdasarkan skor Skill Check
            </p>
          </div>

          {/* ASSESSMENT */}

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Assessment
            </p>

            <p className="mt-3 text-2xl font-bold text-gray-900">
              {assessmentLabel}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Attempt ke-
              {assessment?.attempt_number ?? "-"}
            </p>
          </div>
        </div>

        {/* PROFIL KOMPETENSI */}

        <section className="mt-6 rounded-xl border bg-white p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Profil Kompetensi
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Posisi kompetensimu terhadap benchmark
                target career.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-2xl font-bold text-gray-900">
                {completedSkills.length}
                <span className="text-sm font-normal text-gray-400">
                  {" "}
                  / {skillResults.length}
                </span>
              </p>

              <p className="text-xs text-gray-500">
                kompetensi terpenuhi
              </p>
            </div>

          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{
                width: `${
                  skillResults.length > 0
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

          <div className="mt-3 flex justify-between text-xs text-gray-500">
            <span>
              {completedSkills.length} terpenuhi
            </span>

            <span>
              {developmentSkills.length} perlu
              dikembangkan
            </span>
          </div>

        </section>

        {/* DATA + INTERPRETATION */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">

          {/* LEFT */}

          <section className="rounded-xl border bg-white p-6">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Kompetensi
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Lihat detail hasil pengukuran setiap
                kompetensi.
              </p>
            </div>

            {/* FILTER */}

            <div className="mt-5 flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  setActiveFilter("all")
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeFilter === "all"
                    ? "bg-black text-white"
                    : "border bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Semua{" "}
                <span className="ml-1 opacity-70">
                  {skillResults.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveFilter("completed")
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeFilter ===
                  "completed"
                    ? "bg-black text-white"
                    : "border bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Terpenuhi{" "}
                <span className="ml-1 opacity-70">
                  {completedSkills.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveFilter("development")
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeFilter ===
                  "development"
                    ? "bg-black text-white"
                    : "border bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Perlu Dikembangkan{" "}
                <span className="ml-1 opacity-70">
                  {developmentSkills.length}
                </span>
              </button>

            </div>

            {/* ACCORDION */}

            <div className="mt-5 space-y-2">

              {filteredSkills.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-gray-400">
                    Tidak ada kompetensi pada kategori
                    ini.
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
                        className="overflow-hidden rounded-lg border"
                      >

                        {/* ACCORDION HEADER */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleSkill(
                              result.skill_id
                            )
                          }
                          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-gray-50"
                        >

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="truncate text-sm font-medium text-gray-900">
                                {skillName}
                              </p>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  isCompleted
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-orange-50 text-orange-600"
                                }`}
                              >
                                {isCompleted
                                  ? "Terpenuhi"
                                  : "Perlu Dikembangkan"}
                              </span>

                            </div>

                            <p className="mt-1 text-xs text-gray-400">
                              Target{" "}
                              {result.target_score}
                            </p>

                          </div>

                          <div className="flex shrink-0 items-center gap-3">

                            <span className="text-lg font-bold text-gray-900">
                              {result.score}
                            </span>

                            <span className="text-sm text-gray-400">
                              {isOpen
                                ? "−"
                                : "+"}
                            </span>

                          </div>

                        </button>

                        {/* ACCORDION DETAIL */}

                        {isOpen && (
                          <div className="border-t bg-gray-50 px-4 py-4">

                            <div className="grid grid-cols-3 gap-3">

                              <div className="rounded-lg border bg-white p-3">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                  Skor
                                </p>

                                <p className="mt-1 text-lg font-semibold text-gray-900">
                                  {result.score}
                                </p>
                              </div>

                              <div className="rounded-lg border bg-white p-3">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                  Target
                                </p>

                                <p className="mt-1 text-lg font-semibold text-gray-900">
                                  {result.target_score}
                                </p>
                              </div>

                              <div className="rounded-lg border bg-white p-3">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                  Gap
                                </p>

                                <p className="mt-1 text-lg font-semibold text-gray-900">
                                  {result.gap}
                                </p>
                              </div>

                            </div>

                            <div className="mt-4">

                              <div className="flex justify-between text-xs text-gray-500">
                                <span>
                                  Pencapaian
                                </span>

                                <span>
                                  {result.score} /{" "}
                                  {result.target_score}
                                </span>
                              </div>

                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="h-full rounded-full bg-black"
                                  style={{
                                    width: `${Math.min(
                                      result.score,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>

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

          {/* RIGHT: INTERPRETATION */}

          <section className="rounded-xl border bg-white p-6">

            <h2 className="text-lg font-semibold text-gray-900">
              Insight SkillMap
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Apa arti hasil pemetaanmu?
            </p>

            <div className="mt-6 space-y-6">

              {/* PROFILE */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Profilmu Saat Ini
                </p>

                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {level}
                </p>

                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {profileInsight}
                </p>

              </div>

              <div className="border-t" />

              {/* STRENGTH */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Area Kekuatan
                </p>

                {strongSkillNames.length >
                0 ? (
                  <>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      Kekuatan kompetensimu paling terlihat
                      pada beberapa area utama berikut:
                    </p>

                    <div className="mt-3 space-y-2">

                      {strongSkillNames.map(
                        (name) => (
                          <div
                            key={name}
                            className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800"
                          >
                            {name}
                          </div>
                        )
                      )}

                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">
                    Belum ada kompetensi yang memenuhi
                    benchmark.
                  </p>
                )}

              </div>

              <div className="border-t" />

              {/* FOCUS */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Fokus Berikutnya
                </p>

                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {focusInsight}
                </p>

              </div>

            </div>

          </section>

        </div>

        {/* AI FEEDBACK */}

        <section className="mt-6 rounded-xl border bg-white p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="rounded-md bg-gray-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  AI
                </span>

                <h2 className="text-lg font-semibold text-gray-900">
                  Feedback Personal
                </h2>

              </div>

              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                Interpretasi hasil untuk membantu kamu
                menentukan langkah pengembangan berikutnya.
              </p>

            </div>

            <span className="text-xs text-gray-400">
              Berdasarkan hasil Skill Check
            </span>

          </div>

          <div className="mt-5 rounded-xl bg-gray-50 p-5">

            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">

              {aiLoading
                ? "AI sedang menganalisis hasil Skill Check kamu..."
                : aiFeedback ||
                  "Feedback belum tersedia."}

            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              <div className="rounded-lg border bg-white p-4">

                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Yang sudah kuat
                </p>

                <p className="mt-2 text-sm font-medium text-gray-800">
                  {completedSkills.length}{" "}
                  kompetensi memenuhi benchmark.
                </p>

              </div>

              <div className="rounded-lg border bg-white p-4">

                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Yang perlu dikembangkan
                </p>

                <p className="mt-2 text-sm font-medium text-gray-800">
                  {developmentSkills.length}{" "}
                  kompetensi masih memiliki gap.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* SINGLE NEXT STEP CTA */}

        <section className="mt-6 rounded-xl border bg-white p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold text-gray-900">
                Lanjutkan ke Skill Gap
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Lihat kompetensi yang masih perlu
                dikembangkan dan tentukan fokus berikutnya.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  careerId
                    ? `/skillgap?career=${careerId}&assessment=${assessmentId}`
                    : "/skillgap"
                )
              }
              className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Lihat Skill Gap →
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}