"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isPremiumUser } from "@/lib/subscription";

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

  const [premium, setPremium] =
    useState(false);

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
           PREMIUM STATUS
        ========================= */

        const premiumStatus =
          await isPremiumUser();

        setPremium(premiumStatus);

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
        skill.score >=
        skill.target_score
    );
  }, [skillResults]);

  /* =========================
     DEVELOPMENT SKILLS
  ========================= */

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

  /* =========================
     FILTERED SKILLS
  ========================= */

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
          ) ??
          skill.skill_id
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
            ) ??
            skill.skill_id
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
      return `Kamu sudah memenuhi benchmark pada seluruh ${skillResults.length} kompetensi yang diukur untuk ${
        career?.name ??
        "career ini"
      }.`;
    }

    return `Kamu sudah memenuhi benchmark pada ${completedSkills.length} dari ${skillResults.length} kompetensi untuk ${
      career?.name ??
      "career ini"
    }.`;
  }, [
    skillResults,
    completedSkills,
    career,
  ]);

  /* =========================
     FOCUS INSIGHT
  ========================= */

  const focusInsight = useMemo(() => {
    if (
      developmentSkills.length ===
      0
    ) {
      return "Tidak ada kompetensi yang berada di bawah benchmark. Fokus berikutnya adalah mempertahankan dan memperluas kompetensi melalui pengalaman nyata.";
    }

    if (
      developmentSkillNames.length ===
      1
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
      !premium ||
      !career ||
      skillResults.length ===
        0
    ) {
      return;
    }

    async function getAIFeedback() {
      setAiLoading(true);
      setAiFeedback("");

      try {
        const response =
          await fetch(
            "/api/ai-feedback",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                career:
                  career?.name ??
                  "Unknown Career",
                skills:
                  skillResults.map(
                    (skill) => ({
                      name:
                        skillNameMap.get(
                          skill.skill_id
                        ) ??
                        skill.skill_id,
                      score:
                        skill.score,
                      target:
                        skill.target_score,
                      gap: skill.gap,
                      status:
                        skill.status,
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
    premium,
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
      <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="text-sm font-medium text-slate-700">
              Memuat hasil Skill Check...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Menyiapkan hasil pemetaanmu
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 font-bold text-red-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Hasil Assessment
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
              className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
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
    <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="text-center">
          <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            Skill Check Result
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Hasil Pemetaan Kompetensi
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Ringkasan kompetensi berdasarkan
            hasil Skill Check kamu.
          </p>

          {career && (
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Target Karier:{" "}
              {career.name}
            </p>
          )}
        </div>

        {/* SUMMARY */}

        <div className="mt-7 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Skor Keseluruhan
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
                  } dari ${
                    userAnswers.length
                  } jawaban benar`
                : "Belum tersedia"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Level
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {level}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Berdasarkan skor Skill Check
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Assessment
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {assessmentLabel}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Attempt ke-
              {assessment?.attempt_number ??
                "-"}
            </p>
          </div>
        </div>

        {/* PROFIL KOMPETENSI */}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Profil Kompetensi
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Posisi kompetensimu terhadap
                benchmark target karier.
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
                kompetensi terpenuhi
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
              terpenuhi
            </span>

            <span>
              {developmentSkills.length}{" "}
              perlu dikembangkan
            </span>
          </div>
        </section>

        {/* DATA + INSIGHT */}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">

          {/* COMPETENCIES */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Kompetensi
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Lihat detail hasil pengukuran
                setiap kompetensi.
              </p>
            </div>

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
                Semua{" "}
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
                Terpenuhi{" "}
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
                Perlu Dikembangkan{" "}
                <span className="ml-1 opacity-60">
                  {developmentSkills.length}
                </span>
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {filteredSkills.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-400">
                    Tidak ada kompetensi pada
                    kategori ini.
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
                                  ? "Terpenuhi"
                                  : "Perlu Dikembangkan"}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              Target{" "}
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

                        {isOpen && (
                          <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                              <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  Skor
                                </p>

                                <p className="mt-1 text-lg font-bold text-slate-900">
                                  {
                                    result.score
                                  }
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  Target
                                </p>

                                <p className="mt-1 text-lg font-bold text-slate-900">
                                  {
                                    result.target_score
                                  }
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  Gap
                                </p>

                                <p className="mt-1 text-lg font-bold text-slate-900">
                                  {result.gap}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-slate-500">
                                <span>
                                  Pencapaian
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

                            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-xs font-semibold text-slate-700">
                                Interpretasi
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {isCompleted
                                  ? "Skor kompetensimu sudah mencapai benchmark untuk target karier ini."
                                  : `Masih terdapat gap sebesar ${result.gap} poin dari benchmark. Kompetensi ini dapat menjadi salah satu fokus pengembangan berikutnya.`}
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

          {/* INSIGHT */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Insight SkillMap
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Apa arti hasil pemetaanmu?
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Profilmu Saat Ini
                </p>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {level}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {profileInsight}
                </p>
              </div>

              <div className="border-t border-slate-100" />

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Area Kekuatan
                </p>

                {strongSkillNames.length >
                0 ? (
                  <>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Kekuatan kompetensimu paling
                      terlihat pada beberapa area
                      utama berikut:
                    </p>

                    <div className="mt-3 space-y-2">
                      {strongSkillNames.map(
                        (name) => (
                          <div
                            key={name}
                            className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700"
                          >
                            {name}
                          </div>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Belum ada kompetensi yang
                    memenuhi benchmark.
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100" />

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Fokus Berikutnya
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {focusInsight}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* =========================
            AI FEEDBACK PREMIUM
        ========================= */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* HEADER */}

          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    AI
                  </span>

                  <h2 className="text-lg font-bold text-slate-900">
                    Feedback Personal
                  </h2>

                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                    Premium
                  </span>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Interpretasi personal berdasarkan
                  hasil kompetensi untuk membantu
                  menentukan langkah pengembangan
                  berikutnya.
                </p>
              </div>

              <span className="text-xs text-slate-400">
                Personal AI Analysis
              </span>
            </div>
          </div>

          {/* FREE */}

          {!premium && (
            <div className="bg-slate-50 p-5 sm:p-6">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center sm:px-8 sm:py-12">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-600">
                  ✦
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Buka AI Feedback Personal
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Dapatkan analisis AI yang
                  disesuaikan dengan hasil
                  pemetaanmu, termasuk kekuatan,
                  gap kompetensi, prioritas
                  pengembangan, dan langkah
                  berikutnya.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/upgrade"
                    )
                  }
                  className="mt-6 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-amber-500"
                >
                  Tingkatkan ke Premium →
                </button>

                <p className="mt-3 text-xs text-slate-400">
                  AI Feedback Personal tersedia
                  untuk pengguna Premium.
                </p>
              </div>
            </div>
          )}

          {/* PREMIUM */}

          {premium && (
            <div className="bg-slate-50 p-5 sm:p-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    ✦
                  </span>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Analisis AI Personal
                    </p>

                    <p className="text-xs text-amber-600">
                      Premium
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  {aiLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                      <p className="text-sm text-slate-500">
                        AI sedang menganalisis
                        hasil Skill Check kamu...
                      </p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                      {aiFeedback ||
                        "Feedback AI belum tersedia."}
                    </p>
                  )}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Yang sudah kuat
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {completedSkills.length}{" "}
                      kompetensi memenuhi
                      benchmark.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Yang perlu dikembangkan
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {developmentSkills.length}{" "}
                      kompetensi masih memiliki
                      gap.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* NEXT STEP */}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-bold text-slate-900">
                Lanjutkan ke Skill Gap
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Lihat kompetensi yang masih perlu
                dikembangkan dan tentukan fokus
                berikutnya.
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
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
            >
              Lihat Skill Gap →
            </button>
          </div>
        </section>

        <p className="px-2 py-6 text-center text-xs text-slate-400">
          Hasil ini membantu kamu memahami posisi
          kompetensimu terhadap target karier.
        </p>
      </div>
    </main>
  );
}