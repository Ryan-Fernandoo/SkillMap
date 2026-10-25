"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  History,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

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
  skill_id: string;
  score: number;
  target_score: number;
  gap: number;
  status: string;
};

export default function SkillCheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const careerFromUrl = searchParams.get("career");

  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareerId, setSelectedCareerId] =
    useState<string>(careerFromUrl ?? "");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [skillResults, setSkillResults] = useState<SkillResult[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingAssessment, setLoadingAssessment] =
    useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  /* =====================================================
     LOAD CAREERS + USER ASSESSMENTS
  ===================================================== */

  useEffect(() => {
    async function loadData() {
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
           CAREERS
        ========================= */

        const {
          data: careerData,
          error: careerError,
        } = await supabase
          .from("careers")
          .select("id, name, field, level, status")
          .order("name");

        if (careerError) {
          console.error("Career error:", careerError);

          setErrorMessage(
            "Data karier gagal dimuat."
          );

          setLoading(false);
          return;
        }

        const loadedCareers = careerData ?? [];

        setCareers(loadedCareers);

        /* =========================
           USER ASSESSMENTS
        ========================= */

        const {
          data: assessmentData,
          error: assessmentError,
        } = await supabase
          .from("assessments")
          .select(
            "id, career_id, attempt_number, assessment_type, status, completed_at"
          )
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("completed_at", {
            ascending: false,
          });

        if (assessmentError) {
          console.error(
            "Assessment error:",
            assessmentError
          );

          setErrorMessage(
            "Riwayat Skill Check gagal dimuat."
          );

          setLoading(false);
          return;
        }

        const loadedAssessments = assessmentData ?? [];

        setAssessments(loadedAssessments);

        /* =========================
           DEFAULT CAREER

           Prioritas:
           1. career dari URL
           2. career assessment terbaru
        ========================= */

        if (careerFromUrl) {
          setSelectedCareerId(careerFromUrl);
        } else if (loadedAssessments.length > 0) {
          setSelectedCareerId(
            loadedAssessments[0].career_id
          );
        }

        /* =========================
           SKILL RESULTS
        ========================= */

        const assessmentIds = loadedAssessments.map(
          (assessment) => assessment.id
        );

        if (assessmentIds.length > 0) {
          const {
            data: resultData,
            error: resultError,
          } = await supabase
            .from("skill_results")
            .select(
              "id, assessment_id, skill_id, score, target_score, gap, status"
            )
            .eq("user_id", user.id)
            .in("assessment_id", assessmentIds);

          if (resultError) {
            console.error(
              "Skill result error:",
              resultError
            );
          } else {
            setSkillResults(resultData ?? []);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error(
          "Skill Check error:",
          error
        );

        setErrorMessage(
          "Terjadi kesalahan saat memuat Skill Check."
        );

        setLoading(false);
      }
    }

    loadData();
  }, [careerFromUrl, router]);

  /* =====================================================
     SELECTED CAREER
  ===================================================== */

  const selectedCareer = useMemo(() => {
    return (
      careers.find(
        (career) => career.id === selectedCareerId
      ) ?? null
    );
  }, [careers, selectedCareerId]);

  /* =====================================================
     ASSESSMENTS FOR SELECTED CAREER
  ===================================================== */

  const careerAssessments = useMemo(() => {
    return assessments
      .filter(
        (assessment) =>
          assessment.career_id === selectedCareerId
      )
      .sort((a, b) => {
        const dateA = a.completed_at
          ? new Date(a.completed_at).getTime()
          : 0;

        const dateB = b.completed_at
          ? new Date(b.completed_at).getTime()
          : 0;

        return dateB - dateA;
      });
  }, [assessments, selectedCareerId]);

  /* =====================================================
     LATEST ASSESSMENT
  ===================================================== */

  const latestAssessment =
    careerAssessments[0] ?? null;

  /* =====================================================
     CURRENT SKILL RESULTS
  ===================================================== */

  const latestResults = useMemo(() => {
    if (!latestAssessment) {
      return [];
    }

    return skillResults.filter(
      (result) =>
        result.assessment_id ===
        latestAssessment.id
    );
  }, [latestAssessment, skillResults]);

  /* =====================================================
     SCORE SUMMARY
  ===================================================== */

  const scoreSummary = useMemo(() => {
    if (latestResults.length === 0) {
      return {
        average: 0,
        completed: 0,
        total: 0,
        totalGap: 0,
      };
    }

    const totalScore = latestResults.reduce(
      (sum, result) => sum + result.score,
      0
    );

    const totalGap = latestResults.reduce(
      (sum, result) => sum + result.gap,
      0
    );

    const completed = latestResults.filter(
      (result) =>
        result.score >= result.target_score
    ).length;

    return {
      average: Math.round(
        totalScore / latestResults.length
      ),
      completed,
      total: latestResults.length,
      totalGap,
    };
  }, [latestResults]);

  /* =====================================================
     CAREER CHANGE
  ===================================================== */

  function handleCareerChange(value: string) {
    setSelectedCareerId(value);

    if (value) {
      router.replace(
        `/skillcheck?career=${value}`
      );
    } else {
      router.replace("/skillcheck");
    }
  }

  /* =====================================================
     START / REASSESSMENT
  ===================================================== */

  function handleStartSkillCheck() {
    if (!selectedCareerId) {
      return;
    }

    setLoadingAssessment(true);

    router.push(
      `/skillcheck-setup?career=${selectedCareerId}`
    );
  }

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  function formatDate(date: string | null) {
    if (!date) {
      return "-";
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  }

  /* =====================================================
     ASSESSMENT LABEL
  ===================================================== */

  function getAssessmentLabel(type: string) {
    if (type === "baseline") {
      return "Baseline";
    }

    if (type === "reassessment") {
      return "Reassessment";
    }

    return type;
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-10 w-80 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-[520px] max-w-full rounded bg-slate-200" />

            <div className="mt-8 h-40 rounded-[24px] bg-white shadow-sm" />

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="h-28 rounded-2xl bg-white" />
              <div className="h-28 rounded-2xl bg-white" />
              <div className="h-28 rounded-2xl bg-white" />
            </div>
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
      <main className="min-h-screen bg-[#f8fafc] px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[24px] border border-red-100 bg-white p-8 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <ClipboardCheck size={21} />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-red-500">
              Skill Check
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              Terjadi Kesalahan
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Coba Lagi
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     MAIN PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-8">
      <div className="mx-auto max-w-6xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-[26px] border border-blue-100 bg-white p-7 shadow-[0_12px_35px_rgba(37,99,235,0.05)] sm:p-8">
          <div className="relative z-10">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <div className="flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
                  <Sparkles size={14} />
                  Skill Check
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Ukur Kompetensimu
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  Pilih target karier dan lakukan
                  pemetaan kompetensi berdasarkan
                  benchmark yang relevan dengan
                  karier tersebut.
                </p>
              </div>

              {latestAssessment && selectedCareer && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 lg:min-w-[210px]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                    Career Journey
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {selectedCareer.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Assessment #
                    {latestAssessment.attempt_number}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-100/60 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-16 right-1/3 h-32 w-32 rounded-full bg-yellow-100/50 blur-3xl" />
        </section>

        {/* =================================================
            CAREER SELECTOR
        ================================================= */}

        <section className="mt-6 rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_8px_25px_rgba(15,23,42,0.03)] sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Target size={21} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                Langkah 01
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Tentukan Target Karier
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Skill Check akan menyesuaikan
                kompetensi yang diukur berdasarkan
                target kariermu.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label
                htmlFor="career"
                className="text-sm font-semibold text-slate-800"
              >
                Target Karier
              </label>

              <div className="relative mt-2">
                <select
                  id="career"
                  value={selectedCareerId}
                  onChange={(event) =>
                    handleCareerChange(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-10 text-sm font-medium text-slate-800 outline-none transition hover:border-blue-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">
                    Pilih target karier
                  </option>

                  {careers.map((career) => (
                    <option
                      key={career.id}
                      value={career.id}
                      disabled={
                        career.status !== "Aktif"
                      }
                    >
                      {career.name}
                      {career.status !== "Aktif" &&
                        " — Coming Soon"}
                    </option>
                  ))}
                </select>

                <ChevronRight
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Kamu dapat memilih career journey
                yang berbeda kapan saja.
              </p>
            </div>

            {selectedCareer && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-4 lg:min-w-[230px]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                  Target Terpilih
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {selectedCareer.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedCareer.field} ·{" "}
                  {selectedCareer.level}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            NO CAREER SELECTED
        ================================================= */}

        {!selectedCareer && (
          <section className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-white p-8">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Target size={24} />
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                Pilih target karier untuk memulai
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                SkillMap akan menggunakan target
                karier tersebut untuk menentukan
                kompetensi yang perlu diukur.
              </p>
            </div>
          </section>
        )}

        {/* =================================================
            CAREER NOT YET ASSESSED
        ================================================= */}

        {selectedCareer &&
          !latestAssessment && (
            <section className="relative mt-5 overflow-hidden rounded-[24px] border border-blue-100 bg-white p-7 shadow-[0_10px_30px_rgba(37,99,235,0.04)] sm:p-8">
              <div className="relative z-10">
                <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <ClipboardCheck size={18} />
                      </span>

                      <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Belum Ada Pemetaan
                      </span>
                    </div>

                    <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
                      Siap mengukur kompetensimu?
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      Mulai Skill Check untuk mengetahui
                      posisi kompetensimu saat ini
                      terhadap benchmark{" "}
                      <span className="font-semibold text-slate-700">
                        {selectedCareer.name}
                      </span>
                      .
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <InfoPill
                        icon={<Target size={14} />}
                        text="Benchmark industri"
                      />

                      <InfoPill
                        icon={<BarChart3 size={14} />}
                        text="Skill gap"
                      />

                      <InfoPill
                        icon={<TrendingUp size={14} />}
                        text="Roadmap pengembangan"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleStartSkillCheck
                    }
                    disabled={
                      selectedCareer.status !==
                        "Aktif" ||
                      loadingAssessment
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {loadingAssessment
                      ? "Mempersiapkan..."
                      : selectedCareer.status ===
                        "Aktif"
                      ? "Mulai Skill Check"
                      : "Coming Soon"}

                    {!loadingAssessment &&
                      selectedCareer.status ===
                        "Aktif" && (
                        <ArrowRight size={17} />
                      )}
                  </button>
                </div>
              </div>

              <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-100/60 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-yellow-100/50 blur-3xl" />
            </section>
          )}

        {/* =================================================
            CAREER ALREADY ASSESSED
        ================================================= */}

        {selectedCareer &&
          latestAssessment && (
            <>
              {/* CURRENT STATUS */}

              <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_8px_25px_rgba(15,23,42,0.03)] sm:p-7">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <CheckCircle2 size={18} />
                        </span>

                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                          Pemetaan Terakhir
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-bold text-slate-950">
                        {selectedCareer.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {getAssessmentLabel(
                          latestAssessment.assessment_type
                        )}{" "}
                        ·{" "}
                        {formatDate(
                          latestAssessment.completed_at
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 sm:min-w-[120px]">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Assessment
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-950">
                        #
                        {
                          latestAssessment.attempt_number
                        }
                      </p>
                    </div>
                  </div>

                  {/* SUMMARY */}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <SummaryCard
                      icon={<BarChart3 size={18} />}
                      label="Skor terakhir"
                      value={scoreSummary.average}
                      suffix="/100"
                      tone="blue"
                    />

                    <SummaryCard
                      icon={
                        <CheckCircle2 size={18} />
                      }
                      label="Benchmark terpenuhi"
                      value={`${scoreSummary.completed}/${scoreSummary.total}`}
                      tone="green"
                    />

                    <SummaryCard
                      icon={<Clock3 size={18} />}
                      label="Status"
                      value="Sudah dipetakan"
                      tone="yellow"
                    />
                  </div>
                </div>
              </section>

              {/* QUICK ACTIONS */}

              <section className="mt-5 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/skillcheck-result?career=${selectedCareer.id}&assessment=${latestAssessment.id}`
                    )
                  }
                  className="group rounded-[22px] border border-blue-100 bg-white p-6 text-left shadow-[0_8px_25px_rgba(37,99,235,0.03)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BarChart3 size={20} />
                    </div>

                    <ArrowRight
                      size={18}
                      className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500"
                    />
                  </div>

                  <h3 className="mt-5 text-base font-bold text-slate-900">
                    Lihat Hasil Skill Check
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Lihat detail skor kompetensi dan
                    hasil pemetaan skill terakhir.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={
                    handleStartSkillCheck
                  }
                  disabled={loadingAssessment}
                  className="group rounded-[22px] border border-yellow-100 bg-white p-6 text-left shadow-[0_8px_25px_rgba(245,158,11,0.03)] transition hover:-translate-y-0.5 hover:border-yellow-200 hover:shadow-[0_12px_30px_rgba(245,158,11,0.08)] disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                      <Zap size={20} />
                    </div>

                    <ArrowRight
                      size={18}
                      className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-yellow-500"
                    />
                  </div>

                  <h3 className="mt-5 text-base font-bold text-slate-900">
                    {loadingAssessment
                      ? "Mempersiapkan..."
                      : "Ukur Kompetensi Lagi"}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Lakukan reassessment untuk melihat
                    perkembangan kompetensimu.
                  </p>
                </button>
              </section>

              {/* CAREER JOURNEY */}

              <section className="mt-5 rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_8px_25px_rgba(15,23,42,0.03)]">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <History
                        size={17}
                        className="text-blue-600"
                      />

                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                        Career Journey
                      </p>
                    </div>

                    <h2 className="mt-2 text-lg font-bold text-slate-950">
                      Ingin mengukur karier lain?
                    </h2>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                      Pilih target karier lain di atas
                      untuk membuat journey kompetensi
                      yang berbeda.
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">
                      Journey aktif
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedCareer.name}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

        {/* =================================================
            HOW IT WORKS
        ================================================= */}

        <section className="mt-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
              Cara Kerja
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dari pengukuran ke pengembangan
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ProcessCard
              number="01"
              icon={<ClipboardCheck size={19} />}
              title="Skill Check"
              description="Jawab assessment untuk memetakan kemampuanmu."
            />

            <ProcessCard
              number="02"
              icon={<Target size={19} />}
              title="Skill Gap"
              description="Bandingkan kompetensimu dengan benchmark target."
            />

            <ProcessCard
              number="03"
              icon={<TrendingUp size={19} />}
              title="Roadmap"
              description="Tentukan fokus pengembangan berdasarkan gap."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  tone: "blue" | "green" | "yellow";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-slate-400">
          {label}
        </p>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1">
        <p className="text-2xl font-bold text-slate-950">
          {value}
        </p>

        {suffix && (
          <span className="mb-1 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   INFO PILL
========================================================= */

function InfoPill({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
      <span className="text-blue-500">
        {icon}
      </span>

      {text}
    </span>
  );
}

/* =========================================================
   PROCESS CARD
========================================================= */

function ProcessCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.025)] transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105">
          {icon}
        </div>

        <span className="text-xs font-bold text-slate-200">
          {number}
        </span>
      </div>

      <h3 className="mt-5 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}