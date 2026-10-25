"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Career = {
  id: string;
  name: string;
  field: string;
  level: string;
};

type Question = {
  id: string;
  skill_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  status: string;
};

type QuestionKey = {
  question_id: string;
  correct_option: string;
};

type CareerSkill = {
  skill_id: string;
  target_score: number;
};

type AnswerMap = Record<string, string>;

function normalizeOption(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

function SkillCheckAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const careerId = searchParams.get("career");

  const [career, setCareer] = useState<Career | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionKeys, setQuestionKeys] = useState<QuestionKey[]>([]);
  const [careerSkills, setCareerSkills] = useState<CareerSkill[]>([]);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* =========================
     LOAD ASSESSMENT DATA
  ========================= */

  useEffect(() => {
    async function loadAssessment() {
      if (!careerId) {
        setErrorMessage("Target career belum ditentukan.");
        setLoading(false);
        return;
      }

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
          console.error("Gagal mengambil user:", userError);
        }

        if (!user) {
          router.push("/login");
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
          .select("id, name, field, level")
          .eq("id", careerId)
          .single();

        if (careerError || !careerData) {
          console.error("Gagal mengambil career:", careerError);

          setErrorMessage("Data career tidak ditemukan.");
          setLoading(false);
          return;
        }

        setCareer(careerData);

        /* =========================
           CAREER SKILLS
        ========================= */

        const {
          data: careerSkillData,
          error: careerSkillError,
        } = await supabase
          .from("career_skills")
          .select("skill_id, target_score")
          .eq("career_id", careerId);

        if (careerSkillError) {
          console.error(
            "Gagal mengambil career skills:",
            careerSkillError
          );

          setErrorMessage("Benchmark skill belum dapat dimuat.");
          setLoading(false);
          return;
        }

        const skillRows: CareerSkill[] = careerSkillData ?? [];

        setCareerSkills(skillRows);

        const skillIds = skillRows.map((item) =>
          normalizeId(item.skill_id)
        );

        if (skillIds.length === 0) {
          setErrorMessage(
            "Belum ada skill benchmark untuk career ini."
          );
          setLoading(false);
          return;
        }

        /* =========================
           QUESTIONS
        ========================= */

        const {
          data: questionData,
          error: questionError,
        } = await supabase
          .from("questions")
          .select(
            "id, skill_id, question, option_a, option_b, option_c, option_d, status"
          )
          .in("skill_id", skillIds)
          .eq("status", "Aktif")
          .order("id", {
            ascending: true,
          });

        if (questionError) {
          console.error(
            "Gagal mengambil questions:",
            questionError
          );

          setErrorMessage("Soal assessment gagal dimuat.");
          setLoading(false);
          return;
        }

        const loadedQuestions: Question[] = questionData ?? [];

        if (loadedQuestions.length === 0) {
          setErrorMessage(
            "Belum ada soal assessment untuk career ini."
          );
          setLoading(false);
          return;
        }

        setQuestions(loadedQuestions);

        /* =========================
           QUESTION KEYS
        ========================= */

        const {
          data: keyData,
          error: keyError,
        } = await supabase
          .from("question_keys")
          .select("question_id, correct_option");

        if (keyError) {
          console.error(
            "Gagal mengambil question keys:",
            keyError
          );

          setErrorMessage(
            "Kunci jawaban assessment gagal dimuat."
          );
          setLoading(false);
          return;
        }

        const loadedKeys: QuestionKey[] = (keyData ?? []).map(
          (item) => ({
            question_id: normalizeId(item.question_id),
            correct_option: normalizeOption(item.correct_option),
          })
        );

        if (loadedKeys.length === 0) {
          console.error(
            "Tabel question_keys tidak mengembalikan data."
          );

          setErrorMessage(
            "Kunci jawaban belum tersedia di database."
          );
          setLoading(false);
          return;
        }

        /* =========================
           KEY MAP
        ========================= */

        const keyMap = new Map<string, string>();

        loadedKeys.forEach((item) => {
          const questionId = normalizeId(item.question_id);
          const correctOption = normalizeOption(
            item.correct_option
          );

          keyMap.set(questionId, correctOption);
        });

        /* =========================
           CHECK MISSING KEYS
        ========================= */

        const missingKeys = loadedQuestions.filter(
          (question) => {
            const questionId = normalizeId(question.id);

            return !keyMap.has(questionId);
          }
        );

        if (missingKeys.length > 0) {
          console.error(
            "Soal yang belum mempunyai answer key:",
            missingKeys.map((question) => question.id)
          );

          setErrorMessage(
            `Ada ${missingKeys.length} soal yang belum memiliki kunci jawaban.`
          );
          setLoading(false);
          return;
        }

        /* =========================
           CHECK INVALID KEYS
        ========================= */

        const invalidKeys = loadedKeys.filter(
          (item) =>
            !["A", "B", "C", "D"].includes(
              normalizeOption(item.correct_option)
            )
        );

        if (invalidKeys.length > 0) {
          console.error(
            "Answer key tidak valid:",
            invalidKeys
          );

          setErrorMessage(
            "Ada kunci jawaban yang tidak valid. Pastikan hanya A, B, C, atau D."
          );
          setLoading(false);
          return;
        }

        setQuestionKeys(loadedKeys);
        setLoading(false);
      } catch (error) {
        console.error("Load assessment error:", error);

        setErrorMessage(
          "Terjadi kesalahan saat memuat assessment."
        );

        setLoading(false);
      }
    }

    loadAssessment();
  }, [careerId, router]);

  /* =========================
     CURRENT QUESTION
  ========================= */

  const currentQuestion = questions[currentIndex];

  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const progress =
    questions.length > 0
      ? Math.round(
          ((currentIndex + 1) / questions.length) * 100
        )
      : 0;

  const answeredCount = Object.keys(answers).length;

  const isLastQuestion =
    currentIndex === questions.length - 1;

  const options = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    return [
      {
        key: "A",
        value: currentQuestion.option_a,
      },
      {
        key: "B",
        value: currentQuestion.option_b,
      },
      {
        key: "C",
        value: currentQuestion.option_c,
      },
      {
        key: "D",
        value: currentQuestion.option_d,
      },
    ];
  }, [currentQuestion]);

  /* =========================
     SELECT ANSWER
  ========================= */

  function handleSelectAnswer(option: string) {
    if (!currentQuestion) return;

    const normalizedOption = normalizeOption(option);

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: normalizedOption,
    }));

    setErrorMessage("");
  }

  /* =========================
     NEXT QUESTION
  ========================= */

  function handleNext() {
    if (!currentQuestion) return;

    if (!currentAnswer) {
      setErrorMessage(
        "Pilih salah satu jawaban terlebih dahulu."
      );
      return;
    }

    setErrorMessage("");

    if (!isLastQuestion) {
      setCurrentIndex((current) => current + 1);
      return;
    }

    handleSubmitAssessment();
  }

  /* =========================
     PREVIOUS QUESTION
  ========================= */

  function handlePrevious() {
    setErrorMessage("");

    if (currentIndex > 0) {
      setCurrentIndex((current) => current - 1);
    }
  }

  /* =========================
     SUBMIT ASSESSMENT
  ========================= */

  async function handleSubmitAssessment() {
    if (!careerId || !career) {
      return;
    }

    if (
      questions.length === 0 ||
      answeredCount !== questions.length
    ) {
      setErrorMessage(
        "Semua soal harus dijawab sebelum assessment dikirim."
      );
      return;
    }

    setSubmitting(true);
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
          "Gagal mengambil user:",
          userError
        );

        throw new Error(
          "Data user tidak dapat ditemukan."
        );
      }

      if (!user) {
        router.push("/login");
        return;
      }

      /* =========================
         ANSWER KEY MAP
      ========================= */

      const keyMap = new Map<string, string>();

      questionKeys.forEach((item) => {
        keyMap.set(
          normalizeId(item.question_id),
          normalizeOption(item.correct_option)
        );
      });

      /* =========================
         VALIDATE ALL KEYS
      ========================= */

      for (const question of questions) {
        const questionId = normalizeId(question.id);
        const correctOption = keyMap.get(questionId);

        if (!correctOption) {
          throw new Error(
            `Kunci jawaban untuk ${questionId} tidak ditemukan.`
          );
        }
      }

      /* =========================
         ATTEMPT NUMBER
      ========================= */

      const {
        data: previousAssessments,
        error: previousError,
      } = await supabase
        .from("assessments")
        .select("attempt_number")
        .eq("user_id", user.id)
        .eq("career_id", careerId)
        .order("attempt_number", {
          ascending: false,
        })
        .limit(1);

      if (previousError) {
        console.error(
          "Gagal mengambil riwayat assessment:",
          previousError
        );

        throw new Error(
          "Gagal mengambil riwayat assessment."
        );
      }

      const lastAttempt =
        previousAssessments?.[0]?.attempt_number ?? 0;

      const attemptNumber = lastAttempt + 1;

      /* =========================
         CREATE ASSESSMENT
      ========================= */

      const now = new Date().toISOString();

      const {
        data: assessment,
        error: assessmentError,
      } = await supabase
        .from("assessments")
        .insert({
          user_id: user.id,
          career_id: careerId,
          attempt_number: attemptNumber,
          assessment_type:
            attemptNumber === 1
              ? "baseline"
              : "reassessment",
          status: "completed",
          started_at: now,
          completed_at: now,
        })
        .select("id")
        .single();

      if (assessmentError || !assessment) {
        console.error(
          "Gagal membuat assessment:",
          assessmentError
        );

        throw new Error(
          "Assessment gagal dibuat."
        );
      }

      const assessmentId = assessment.id;

      /* =========================
         CALCULATE ANSWERS
      ========================= */

      const evaluatedAnswers = questions.map(
        (question) => {
          const questionId = normalizeId(question.id);

          const selectedOption = normalizeOption(
            answers[question.id]
          );

          const correctOption = normalizeOption(
            keyMap.get(questionId)
          );

          const isCorrect =
            selectedOption !== "" &&
            correctOption !== "" &&
            selectedOption === correctOption;

          const score = isCorrect ? 100 : 0;

          return {
            questionId,
            skillId: normalizeId(question.skill_id),
            selectedOption,
            correctOption,
            isCorrect,
            score,
          };
        }
      );

      /* =========================
         USER ANSWERS
      ========================= */

      const userAnswerRows = evaluatedAnswers.map(
        (item) => ({
          user_id: user.id,
          question_id: item.questionId,
          selected_option: item.selectedOption,
          is_correct: item.isCorrect,
          score: item.score,
          answered_at: now,
          assessment_id: assessmentId,
        })
      );

      const {
        error: answerError,
      } = await supabase
        .from("user_answers")
        .insert(userAnswerRows);

      if (answerError) {
        console.error(
          "Gagal menyimpan user answers:",
          answerError
        );

        throw new Error(
          "Jawaban gagal disimpan."
        );
      }

      /* =========================
         CALCULATE SKILL RESULTS
      ========================= */

      const skillGroups = new Map<
        string,
        {
          total: number;
          correct: number;
        }
      >();

      evaluatedAnswers.forEach((item) => {
        const current =
          skillGroups.get(item.skillId) ?? {
            total: 0,
            correct: 0,
          };

        current.total += 1;

        if (item.isCorrect) {
          current.correct += 1;
        }

        skillGroups.set(item.skillId, current);
      });

      /* =========================
         SKILL RESULT ROWS
      ========================= */

      const skillResultRows = Array.from(
        skillGroups.entries()
      ).map(([skillId, result]) => {
        const score =
          result.total > 0
            ? Math.round(
                (result.correct / result.total) * 100
              )
            : 0;

        const benchmark = careerSkills.find(
          (item) =>
            normalizeId(item.skill_id) === skillId
        );

        const targetScore =
          benchmark?.target_score ?? 70;

        const gap = Math.max(
          targetScore - score,
          0
        );

        const status =
          score >= targetScore
            ? "Terpenuhi"
            : "Perlu Dikembangkan";

        return {
          user_id: user.id,
          career_id: careerId,
          skill_id: skillId,
          score,
          target_score: targetScore,
          gap,
          status,
          assessment_id: assessmentId,
        };
      });

      if (skillResultRows.length === 0) {
        throw new Error(
          "Hasil skill tidak dapat dihitung."
        );
      }

      /* =========================
         SAVE SKILL RESULTS
      ========================= */

      const {
        error: skillResultError,
      } = await supabase
        .from("skill_results")
        .insert(skillResultRows);

      if (skillResultError) {
        console.error(
          "Gagal menyimpan skill results:",
          skillResultError
        );

        throw new Error(
          "Hasil kompetensi gagal disimpan."
        );
      }

      /* =========================
         FINISH
      ========================= */

      router.push(
        `/skillcheck-result?career=${careerId}&assessment=${assessmentId}`
      );
    } catch (error) {
      console.error(
        "Assessment error:",
        error
      );

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Terjadi kesalahan saat menyelesaikan assessment."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================
     BACK TO SETUP
  ========================= */

  function handleBack() {
    if (careerId) {
      router.push(
        `/skillcheck-setup?career=${careerId}`
      );
    } else {
      router.push("/skillcheck");
    }
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="text-sm font-medium text-slate-700">
              Memuat assessment...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Menyiapkan soal untukmu
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     ERROR / EMPTY
  ========================= */

  if (
    !currentQuestion ||
    questions.length === 0
  ) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <span>←</span>
            <span>Kembali ke Setup</span>
          </button>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              !
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Assessment Belum Tersedia
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Belum ada soal yang tersedia untuk
              career ini.
            </p>

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     MAIN
  ========================= */

  return (
    <main className="min-h-screen bg-[#f7faff] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">

        {/* HEADER */}

        <div className="mb-6 sm:mb-8">
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <span>←</span>
            <span>Kembali ke Setup</span>
          </button>

          <div>
            <div className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Skill Check
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Pemetaan Kompetensi
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Jawab setiap soal sesuai dengan
              kemampuanmu saat ini. Tidak perlu
              mencari jawaban yang paling ideal.
            </p>
          </div>
        </div>

        {/* CAREER + PROGRESS */}

        <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_1.4fr]">

          {/* CAREER CARD */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Target Karier
            </p>

            <h2 className="mt-2 text-lg font-bold text-slate-900">
              {career?.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {career?.field} · {career?.level}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                ✓
              </div>

              <p className="text-xs font-medium text-slate-500">
                Assessment disesuaikan dengan
                target kariermu
              </p>
            </div>
          </div>

          {/* PROGRESS CARD */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Progress Assessment
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  Soal {currentIndex + 1}{" "}
                  <span className="font-medium text-slate-400">
                    dari {questions.length}
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                {progress}%
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
              <span>
                {answeredCount} soal sudah dijawab
              </span>

              <span>
                {questions.length - answeredCount}{" "}
                tersisa
              </span>
            </div>
          </div>
        </div>

        {/* QUESTION CARD */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* QUESTION HEADER */}

          <div className="border-b border-slate-100 px-5 py-5 sm:px-8 sm:py-7">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                {currentIndex + 1}
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
                  Pertanyaan {currentIndex + 1}
                </p>

                <h2 className="mt-2 text-base font-semibold leading-7 text-slate-900 sm:text-lg sm:leading-8">
                  {currentQuestion.question}
                </h2>
              </div>
            </div>
          </div>

          {/* OPTIONS */}

          <div className="px-5 py-5 sm:px-8 sm:py-7">
            <p className="mb-4 text-xs font-medium text-slate-400">
              Pilih satu jawaban yang paling sesuai.
            </p>

            <div className="grid gap-3">
              {options.map((option) => {
                const selected =
                  currentAnswer === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() =>
                      handleSelectAnswer(option.key)
                    }
                    className={`group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 sm:gap-4 sm:p-5 ${
                      selected
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition sm:h-10 sm:w-10 ${
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                      }`}
                    >
                      {option.key}
                    </span>

                    <span
                      className={`pt-1 text-sm leading-6 sm:text-[15px] ${
                        selected
                          ? "font-medium text-blue-950"
                          : "text-slate-700"
                      }`}
                    >
                      {option.value}
                    </span>

                    <span
                      className={`ml-auto mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {selected && (
                        <span className="text-[11px]">
                          ✓
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ERROR */}

            {errorMessage && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-600">
                <span className="font-bold">!</span>

                <span>{errorMessage}</span>
              </div>
            )}

            {/* NAVIGATION */}

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={
                  currentIndex === 0 ||
                  submitting
                }
                className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                ← Sebelumnya
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {submitting
                  ? "Memproses..."
                  : isLastQuestion
                  ? "Selesaikan Assessment"
                  : "Soal Berikutnya →"}
              </button>
            </div>
          </div>
        </div>

        {/* INFO */}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
              01
            </div>

            <p className="text-sm font-semibold text-slate-900">
              Pemetaan Kompetensi
            </p>

            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Setiap soal terhubung dengan
              skill benchmark.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-600">
              02
            </div>

            <p className="text-sm font-semibold text-slate-900">
              Hasil per Skill
            </p>

            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Skor dihitung berdasarkan
              jawaban yang benar.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-600">
              03
            </div>

            <p className="text-sm font-semibold text-slate-900">
              Riwayat Pengukuran
            </p>

            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Hasil assessment tersimpan
              untuk dibandingkan.
            </p>
          </div>
        </div>

        {/* FOOT NOTE */}

        <p className="px-2 py-6 text-center text-xs leading-5 text-slate-400">
          Jawablah berdasarkan kemampuanmu saat ini.
          Tidak ada jawaban yang perlu dibuat-buat.
        </p>
      </div>
    </main>
  );
}

export default function SkillCheckAssessmentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7faff] px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
            <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="text-sm font-medium text-slate-700">
                Memuat assessment...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Menyiapkan soal untukmu
              </p>
            </div>
          </div>
        </main>
      }
    >
      <SkillCheckAssessmentContent />
    </Suspense>
  );
}