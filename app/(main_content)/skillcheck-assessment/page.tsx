"use client";

import { useEffect, useMemo, useState } from "react";
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

/**
 * Normalisasi pilihan jawaban.
 *
 * Contoh:
 * "C"      -> "C"
 * " C "    -> "C"
 * "c"      -> "C"
 * "C   "   -> "C"
 * " C \n"  -> "C"
 */
function normalizeOption(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

/**
 * Normalisasi ID.
 */
function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

export default function SkillCheckAssessmentPage() {
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
           
           PENTING:
           Ambil SEMUA question_keys.
           Jangan gunakan .in(question_id, ...)
           karena sebelumnya bagian ini menyebabkan
           frontend menganggap semua key tidak ada.
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

        console.log(
          "QUESTION KEYS DARI DATABASE:",
          keyData
        );

        /* =========================
           NORMALIZE QUESTION KEYS
        ========================= */

        const loadedKeys: QuestionKey[] = (keyData ?? []).map(
          (item) => ({
            question_id: normalizeId(item.question_id),
            correct_option: normalizeOption(item.correct_option),
          })
        );

        console.log(
          "LOADED QUESTION KEYS:",
          loadedKeys
        );

        /* =========================
           VALIDASI QUESTION KEYS
        ========================= */

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
           
           Contoh:
           Q001 -> C
           Q002 -> A
           Q003 -> B
        ========================= */

        const keyMap = new Map<string, string>();

        loadedKeys.forEach((item) => {
          const questionId = normalizeId(item.question_id);
          const correctOption = normalizeOption(
            item.correct_option
          );

          keyMap.set(questionId, correctOption);
        });

        console.log(
          "KEY MAP:",
          Array.from(keyMap.entries())
        );

        /* =========================
           QUESTION IDS
        ========================= */

        const questionIds = loadedQuestions.map((question) =>
          normalizeId(question.id)
        );

        console.log(
          "QUESTION IDS:",
          questionIds
        );

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

        /* =========================
           SAVE QUESTION KEYS
        ========================= */

        setQuestionKeys(loadedKeys);
        setLoading(false);
      } catch (error) {
        console.error(
          "Load assessment error:",
          error
        );

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

  /* =========================
     OPTIONS
  ========================= */

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

      console.log(
        "KEY MAP SAAT SUBMIT:",
        Array.from(keyMap.entries())
      );

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
         
         Semua scoring dihitung SATU KALI.
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
         DEBUG SCORING
      ========================= */

      console.table(
        evaluatedAnswers.map((item) => ({
          question: item.questionId,
          selected: item.selectedOption,
          correct: item.correctOption,
          isCorrect: item.isCorrect,
          score: item.score,
        }))
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

      console.table(
        skillResultRows.map((item) => ({
          skill: item.skill_id,
          score: item.score,
          target: item.target_score,
          gap: item.gap,
          status: item.status,
        }))
      );

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
      <main className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-gray-950 dark:text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-gray-500">
            Memuat assessment...
          </p>
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
      <main className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-gray-950 dark:text-white">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Kembali ke Setup
          </button>

          <div className="rounded-2xl border bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
            <h1 className="text-2xl font-bold">
              Assessment Belum Tersedia
            </h1>

            <p className="mt-3 text-gray-500 dark:text-gray-400">
              Belum ada soal yang tersedia
              untuk career ini.
            </p>

            {errorMessage && (
              <p className="mt-4 text-sm text-red-600">
                {errorMessage}
              </p>
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
    <main className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-8">
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Kembali ke Setup
          </button>

          <p className="text-sm font-medium text-gray-500">
            Skill Check / Assessment
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Pemetaan Kompetensi
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Jawab setiap soal sesuai dengan
            kemampuanmu saat ini.
          </p>
        </div>

        {/* CAREER */}

        <div className="mb-5 rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Target Career
          </p>

          <p className="mt-1 font-semibold">
            {career?.name}
          </p>

          <p className="text-sm text-gray-500">
            {career?.field} · {career?.level}
          </p>
        </div>

        {/* PROGRESS */}

        <div className="mb-5 rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Soal {currentIndex + 1} dari{" "}
              {questions.length}
            </span>

            <span className="text-sm text-gray-500">
              {progress}%
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-black transition-all dark:bg-white"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-gray-500">
            {answeredCount} dari{" "}
            {questions.length} soal telah dijawab
          </p>
        </div>

        {/* QUESTION */}

        <div className="rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Question {currentIndex + 1}
            </p>

            <h2 className="mt-3 text-lg font-semibold leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* OPTIONS */}

          <div className="space-y-3">
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
                  className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-black bg-gray-100 dark:border-white dark:bg-gray-800"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      selected
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {option.key}
                  </span>

                  <span className="pt-1 text-sm leading-relaxed">
                    {option.value}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ERROR */}

          {errorMessage && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950">
              {errorMessage}
            </div>
          )}

          {/* NAVIGATION */}

          <div className="mt-8 flex items-center justify-between border-t pt-5 dark:border-gray-800">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={
                currentIndex === 0 ||
                submitting
              }
              className="rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Sebelumnya
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {submitting
                ? "Memproses..."
                : isLastQuestion
                ? "Selesaikan Assessment"
                : "Soal Berikutnya →"}
            </button>
          </div>
        </div>

        {/* INFO */}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-medium">
              Pemetaan Kompetensi
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Setiap soal terhubung dengan
              skill benchmark.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-medium">
              Hasil per Skill
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Skor dihitung berdasarkan
              jawaban yang benar.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-medium">
              Riwayat Pengukuran
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Hasil assessment tersimpan
              untuk dibandingkan.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}