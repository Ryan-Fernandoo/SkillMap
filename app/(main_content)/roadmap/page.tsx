"use client";

import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Lock,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";
import { isPremiumUser } from "@/lib/subscription";

/* =========================================================
   TYPES
========================================================= */

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

type Roadmap = {
  id: number;
  user_id: string;
  career_id: string;
  assessment_id: string;
  skill_id: string;
  title: string;
  description: string;
  priority: number;
  status: string;
  recommendation_type: string;
  created_at: string;
  updated_at: string;
};

type RoadmapCard = {
  skillId: string;
  skillName: string;
  score: number;
  targetScore: number;
  gap: number;
  roadmapItems: Roadmap[];
};

/* =========================================================
   PAGE
========================================================= */

function RoadmapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const careerId =
    searchParams.get("career");

  const assessmentId =
    searchParams.get("assessment");

  /* =======================================================
     STATE
  ======================================================= */

  const [career, setCareer] =
    useState<Career | null>(null);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [skillResults, setSkillResults] =
    useState<SkillResult[]>([]);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [roadmaps, setRoadmaps] =
    useState<Roadmap[]>([]);

  const [selectedCard, setSelectedCard] =
    useState<RoadmapCard | null>(null);

  const [isPremium, setIsPremium] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [aiRoadmap, setAiRoadmap] =
    useState("");

  const [aiRoadmapLoading, setAiRoadmapLoading] =
    useState(false);

  const [aiRoadmapError, setAiRoadmapError] =
    useState("");

  const [aiRoadmapAssessmentId, setAiRoadmapAssessmentId] =
    useState<string | null>(null);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    async function loadRoadmap() {
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
           SUBSCRIPTION
        ========================= */

        const premium =
          await isPremiumUser();

        setIsPremium(premium);

        /* =========================
           FIND CAREER
        ========================= */

        let selectedCareerId =
          careerId;

        if (!selectedCareerId) {
          const {
            data: latestAssessment,
          } = await supabase
            .from("assessments")
            .select(
              "id, career_id, attempt_number, assessment_type, status, completed_at"
            )
            .eq("user_id", user.id)
            .eq("status", "completed")
            .order("completed_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

          if (latestAssessment) {
            selectedCareerId =
              latestAssessment.career_id;
          }
        }

        if (!selectedCareerId) {
          setLoading(false);
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

          setErrorMessage(
            "Data career tidak ditemukan."
          );

          setLoading(false);
          return;
        }

        setCareer(careerData);

        /* =========================
           FIND ASSESSMENT
        ========================= */

        let selectedAssessmentId =
          assessmentId;

        if (!selectedAssessmentId) {
          const {
            data: latestAssessment,
          } = await supabase
            .from("assessments")
            .select(
              "id, career_id, attempt_number, assessment_type, status, completed_at"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "career_id",
              selectedCareerId
            )
            .eq(
              "status",
              "completed"
            )
            .order("completed_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

          if (latestAssessment) {
            selectedAssessmentId =
              latestAssessment.id;

            setAssessment(
              latestAssessment
            );
          }
        } else {
          const {
            data: assessmentData,
            error: assessmentError,
          } = await supabase
            .from("assessments")
            .select(
              "id, career_id, attempt_number, assessment_type, status, completed_at"
            )
            .eq(
              "id",
              selectedAssessmentId
            )
            .eq(
              "user_id",
              user.id
            )
            .single();

          if (
            assessmentError ||
            !assessmentData
          ) {
            setErrorMessage(
              "Data assessment tidak ditemukan."
            );

            setLoading(false);
            return;
          }

          setAssessment(
            assessmentData
          );
        }

        if (!selectedAssessmentId) {
          setLoading(false);
          return;
        }

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
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "career_id",
            selectedCareerId
          )
          .eq(
            "assessment_id",
            selectedAssessmentId
          )
          .order("gap", {
            ascending: false,
          });

        if (skillResultError) {
          console.error(
            "Skill result error:",
            skillResultError
          );

          setErrorMessage(
            "Hasil Skill Gap gagal dimuat."
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
           SKILL NAMES
        ========================= */

        const skillIds =
          loadedSkillResults.map(
            (item) =>
              item.skill_id
          );

        if (skillIds.length > 0) {
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

        /* =========================
           ROADMAP
        ========================= */

        const {
          data: roadmapData,
          error: roadmapError,
        } = await supabase
          .from("roadmaps")
          .select(
            "id, user_id, career_id, assessment_id, skill_id, title, description, priority, status, recommendation_type, created_at, updated_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "career_id",
            selectedCareerId
          )
          .eq(
            "assessment_id",
            selectedAssessmentId
          )
          .order("priority", {
            ascending: true,
          });

        if (roadmapError) {
          console.error(
            "Roadmap error:",
            roadmapError
          );

          setErrorMessage(
            "Data roadmap gagal dimuat."
          );

          setLoading(false);
          return;
        }

        setRoadmaps(
          roadmapData ?? []
        );

        setLoading(false);
      } catch (error) {
        console.error(
          "Roadmap error:",
          error
        );

        setErrorMessage(
          "Terjadi kesalahan saat memuat roadmap."
        );

        setLoading(false);
      }
    }

    loadRoadmap();
  }, [
    careerId,
    assessmentId,
    router,
  ]);

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
     DEVELOPMENT SKILLS
  ========================================================= */

  const developmentResults =
    useMemo(() => {
      return skillResults
        .filter(
          (item) =>
            item.score <
            item.target_score
        )
        .sort(
          (a, b) =>
            b.gap - a.gap
        );
    }, [skillResults]);

  /* =========================================================
     ROADMAP CARDS
  ========================================================= */

  const roadmapCards =
    useMemo<RoadmapCard[]>(() => {
      return developmentResults.map(
        (result) => {
          const items =
            roadmaps
              .filter(
                (roadmap) =>
                  roadmap.skill_id ===
                  result.skill_id
              )
              .sort(
                (a, b) =>
                  a.priority -
                  b.priority
              );

          return {
            skillId:
              result.skill_id,

            skillName:
              skillNameMap.get(
                result.skill_id
              ) ??
              result.skill_id,

            score:
              result.score,

            targetScore:
              result.target_score,

            gap:
              result.gap,

            roadmapItems:
              items,
          };
        }
      );
    }, [
      developmentResults,
      roadmaps,
      skillNameMap,
    ]);

  /* =========================================================
     PRIORITY LABEL
  ========================================================= */

  function getPriorityLabel(
    gap: number
  ) {
    if (
      developmentResults.length ===
      0
    ) {
      return "Prioritas";
    }

    const largestGap =
      developmentResults[0].gap;

    if (
      gap === largestGap
    ) {
      return "Prioritas Utama";
    }

    if (
      gap >=
      largestGap * 0.5
    ) {
      return "Prioritas Tinggi";
    }

    return "Prioritas Berikutnya";
  }

  /* =========================================================
     ASSESSMENT LABEL
  ========================================================= */

  const assessmentLabel =
    useMemo(() => {
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

  /* =========================================================
     AI PERSONALIZED ROADMAP
  ========================================================= */

  useEffect(() => {
    if (!assessment?.id) return;

    const storageKey =
      `skillmap-ai-roadmap-${assessment.id}`;

    const savedRoadmap =
      localStorage.getItem(
        storageKey
      );

    if (savedRoadmap) {
      setAiRoadmap(
        savedRoadmap
      );

      setAiRoadmapAssessmentId(
        assessment.id
      );
    } else {
      setAiRoadmap("");
      setAiRoadmapAssessmentId(
        null
      );
    }
  }, [assessment?.id]);

  async function generateAiRoadmap() {
    if (
      !career ||
      skillResults.length === 0 ||
      !assessment?.id
    ) {
      return;
    }

    if (
      aiRoadmapAssessmentId ===
        assessment.id &&
      aiRoadmap
    ) {
      return;
    }

    setAiRoadmapLoading(true);
    setAiRoadmapError("");

    try {
      const response =
        await fetch(
          "/api/ai-roadmap",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              career:
                career.name,

              skills:
                skillResults.map(
                  (result) => ({
                    name:
                      skillNameMap.get(
                        result.skill_id
                      ) ??
                      result.skill_id,

                    score:
                      result.score,

                    target:
                      result.target_score,

                    gap:
                      result.gap,

                    status:
                      result.status,
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
            "Gagal membuat personalized roadmap."
        );
      }

      const roadmap =
        data.roadmap || "";

      localStorage.setItem(
        `skillmap-ai-roadmap-${assessment.id}`,
        roadmap
      );

      setAiRoadmap(
        roadmap
      );

      setAiRoadmapAssessmentId(
        assessment.id
      );
    } catch (error) {
      console.error(
        "AI personalized roadmap error:",
        error
      );

      setAiRoadmapError(
        error instanceof Error
          ? error.message
          : "Personalized roadmap belum dapat dimuat."
      );
    } finally {
      setAiRoadmapLoading(
        false
      );
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">

        <div className="mx-auto max-w-6xl animate-pulse">

          <div className="h-5 w-36 rounded-full bg-slate-200" />

          <div className="mt-5 h-10 w-80 rounded-xl bg-slate-200" />

          <div className="mt-3 h-4 w-[520px] max-w-full rounded-full bg-slate-100" />

          <div className="mt-8 h-32 rounded-[26px] bg-white" />

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div className="h-56 rounded-[24px] bg-white" />
            <div className="h-56 rounded-[24px] bg-white" />

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

          <div className="rounded-[26px] border border-red-100 bg-white p-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Target size={22} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Roadmap
            </h1>

            <p className="mt-3 text-sm text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/skillgap"
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Kembali ke Skill Gap
              <ArrowRight size={16} />
            </button>

          </div>

        </div>

      </main>
    );
  }

  /* =========================================================
     NO ASSESSMENT
  ========================================================= */

  if (
    !assessment ||
    !career
  ) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">

        <div className="mx-auto max-w-6xl">

          <div className="rounded-[26px] border border-slate-200 bg-white p-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
              <Target size={22} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Roadmap Belum Tersedia
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Selesaikan Skill Check terlebih dahulu
              untuk mendapatkan roadmap pengembangan
              yang disesuaikan dengan hasil kompetensimu.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/skillcheck"
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Mulai Skill Check
              <ArrowRight size={16} />
            </button>

          </div>

        </div>

      </main>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <>
      <main className="min-h-screen bg-[#f7faff] px-6 py-8">

        <div className="mx-auto max-w-6xl">

          {/* =================================================
              HEADER
          ================================================= */}

          <section className="relative overflow-hidden rounded-[30px] border border-blue-100 bg-white p-7 shadow-[0_15px_45px_rgba(37,99,235,0.05)] sm:p-8">

            <div className="relative z-10">

              <div className="flex flex-wrap items-center gap-2">

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                  <MapIcon />
                </span>

                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Roadmap Pengembangan
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                    isPremium
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {isPremium
                    ? "Premium"
                    : "Freemium"}
                </span>

              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Bangun Kompetensi Secara Terarah
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Roadmap disusun berdasarkan kompetensi
                yang masih memiliki gap terhadap benchmark{" "}
                <span className="font-semibold text-slate-700">
                  {career.name}
                </span>
                .
              </p>

              <div className="mt-5 flex flex-wrap gap-2">

                <span className="rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700">
                  {career.name}
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-500">
                  {assessmentLabel}
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-500">
                  {developmentResults.length}{" "}
                  kompetensi perlu dikembangkan
                </span>

              </div>

            </div>

            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-yellow-100/50 blur-3xl" />

          </section>

          {/* =================================================
              FREEMIUM PREVIEW
          ================================================= */}

          {!isPremium && (
            <section className="mt-5 overflow-hidden rounded-[26px] border border-yellow-200 bg-white shadow-[0_10px_35px_rgba(245,158,11,0.06)]">

              {/* PREVIEW HEADER */}

              <div className="border-b border-yellow-100 bg-gradient-to-r from-yellow-50/80 via-white to-white p-6 sm:p-7">

                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                  <div>

                    <div className="flex items-center gap-2">

                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                        <Sparkles size={17} />
                      </span>

                      <p className="text-xs font-bold uppercase tracking-wider text-yellow-700">
                        Preview Roadmap
                      </p>

                    </div>

                    <h2 className="mt-3 text-xl font-bold text-slate-950">
                      Ada{" "}
                      <span className="text-yellow-700">
                        {roadmapCards.length}
                      </span>{" "}
                      fokus pengembangan untukmu
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      Roadmap membantu menentukan langkah
                      pengembangan berdasarkan kompetensi
                      yang paling perlu diperkuat.
                    </p>

                  </div>

                  <div className="shrink-0">

                    <div className="rounded-2xl border border-yellow-100 bg-white px-5 py-4 text-center shadow-sm">

                      <p className="text-2xl font-bold text-yellow-700">
                        {roadmapCards.length}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Fokus
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* PREVIEW CARDS */}

              <div className="p-6 sm:p-7">

                <div className="grid gap-4 md:grid-cols-2">

                  {roadmapCards
                    .slice(0, 4)
                    .map(
                      (card, index) => (
                        <div
                          key={
                            card.skillId
                          }
                          className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
                        >

                          <div className="flex items-start justify-between gap-4">

                            <div className="min-w-0">

                              <span className="inline-flex rounded-full bg-yellow-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-700">
                                Fokus {index + 1}
                              </span>

                              <h3 className="mt-3 text-base font-bold text-slate-900">
                                {card.skillName}
                              </h3>

                              <p className="mt-1 text-xs text-slate-500">
                                Gap{" "}
                                <span className="font-semibold text-yellow-700">
                                  {card.gap}
                                </span>{" "}
                                poin
                              </p>

                            </div>

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                              <Lock size={17} />
                            </div>

                          </div>

                          <div className="mt-5 rounded-xl border border-white bg-white p-4">

                            <div className="flex items-center justify-between">

                              <span className="text-xs text-slate-400">
                                Langkah pengembangan
                              </span>

                              <span className="text-xs font-semibold text-slate-400">
                                {card.roadmapItems.length ||
                                  "—"}{" "}
                                langkah
                              </span>

                            </div>

                            <div className="mt-3 space-y-2">

                              <div className="h-3 w-4/5 rounded-full bg-slate-100" />

                              <div className="h-3 w-3/5 rounded-full bg-slate-100" />

                            </div>

                          </div>

                        </div>
                      )
                    )}

                </div>

                {roadmapCards.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-yellow-200 bg-yellow-50/50 p-6 text-center">

                    <p className="text-sm font-semibold text-slate-700">
                      Belum ada fokus roadmap.
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Lakukan Skill Check untuk mendapatkan
                      rekomendasi pengembangan.
                    </p>

                  </div>
                )}

                {/* UPGRADE */}

                {roadmapCards.length > 0 && (
                  <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-2xl border border-yellow-100 bg-yellow-50/60 p-5 sm:flex-row">

                    <div>

                      <p className="text-sm font-bold text-slate-900">
                        Buka roadmap pengembanganmu
                      </p>

                      <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                        Lihat langkah pengembangan secara
                        lengkap dan gunakan personalized
                        roadmap untuk menentukan prioritasmu.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/upgrade"
                        )
                      }
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-yellow-500/20 transition hover:-translate-y-0.5 hover:bg-yellow-600"
                    >
                      Tingkatkan Paket
                      <ArrowRight size={16} />
                    </button>

                  </div>
                )}

              </div>

            </section>
          )}

          {/* =================================================
              AI PERSONALIZED ROADMAP PREVIEW
          ================================================= */}

          {!isPremium && (
            <section className="mt-5 overflow-hidden rounded-[24px] border border-yellow-100 bg-white shadow-[0_8px_28px_rgba(245,158,11,0.05)]">

              <div className="border-b border-yellow-100 bg-gradient-to-r from-yellow-50/70 via-white to-white px-6 py-5 sm:px-7">

                <div className="flex items-center gap-2">

                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700">
                    <Sparkles size={16} />
                  </span>

                  <p className="text-xs font-bold uppercase tracking-wider text-yellow-700">
                    AI Personalized Roadmap
                  </p>

                </div>

                <h2 className="mt-3 text-lg font-bold text-slate-950">
                  Rekomendasi Pengembangan Personal
                </h2>

                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                  AI akan menyusun langkah pengembangan yang disesuaikan
                  dengan hasil Skill Check dan skill gap kamu.
                </p>

              </div>

              <div className="p-5 sm:p-6">

                <div className="relative overflow-hidden rounded-2xl border border-yellow-100 bg-yellow-50/30 p-4 sm:p-5">

                  {/* CONTOH PREVIEW AI */}

                  <div className="pointer-events-none select-none blur-[2px]">

                    <div className="flex items-center gap-3">

                      <span className="rounded-md bg-yellow-500 px-2 py-1 text-[10px] font-bold text-white">
                        AI
                      </span>

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Roadmap Personal
                        </p>

                        <p className="text-xs text-slate-400">
                          Berdasarkan Skill Check terakhir
                        </p>
                      </div>

                    </div>

                    <div className="mt-4 space-y-2.5">

                      <div className="rounded-xl border bg-white p-3.5">

                        <p className="text-sm font-semibold text-slate-900">
                          01. Perkuat kompetensi prioritas
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Pelajari materi dan lakukan latihan terarah berdasarkan gap kompetensi.
                        </p>

                      </div>

                      <div className="rounded-xl border bg-white p-3.5">

                        <p className="text-sm font-semibold text-slate-900">
                          02. Terapkan melalui proyek
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Bangun pengalaman melalui proyek yang sesuai dengan target karier.
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* LOCK OVERLAY — INFO SAJA */}

                  <div className="absolute inset-0 flex items-center justify-center bg-white/45 px-4">

                    <div className="w-full max-w-sm rounded-2xl border border-yellow-100 bg-white/95 px-5 py-4 text-center shadow-md">

                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                        <Lock size={17} />
                      </div>

                      <h3 className="mt-2.5 text-sm font-bold text-slate-900">
                        Personalized Roadmap dengan AI
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Rekomendasi pengembangan yang disusun berdasarkan kompetensi dan skill gap kamu.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </section>
          )}

          {/* =================================================
              PREMIUM CONTENT
          ================================================= */}

          {isPremium && (
            <>
              {/* ALL COMPLETE */}

              {roadmapCards.length === 0 ? (

                <section className="mt-6 rounded-[26px] border border-emerald-100 bg-white p-7">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={22} />
                  </div>

                  <h2 className="mt-5 text-xl font-bold text-slate-950">
                    Semua kompetensi sudah memenuhi benchmark 🎉
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Saat ini belum ada kompetensi yang
                    membutuhkan fokus pengembangan.
                    Lakukan Skill Check kembali setelah
                    mengembangkan kompetensimu untuk
                    memperbarui roadmap.
                  </p>

                </section>

              ) : (

                <>
                  {/* PRIORITY INFO */}

                  <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                          Prioritas Pengembangan
                        </p>

                        <h2 className="mt-2 text-xl font-bold text-slate-950">
                          Fokus dimulai dari gap terbesar
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Kompetensi dengan gap yang sama
                          memiliki prioritas pengembangan
                          yang setara.
                        </p>

                      </div>

                      <div className="shrink-0 rounded-2xl bg-blue-50 px-5 py-4 text-center">

                        <p className="text-xs text-blue-500">
                          Total fokus
                        </p>

                        <p className="mt-1 text-2xl font-bold text-blue-700">
                          {roadmapCards.length}
                        </p>

                      </div>

                    </div>

                  </section>

                  {/* ROADMAP GRID */}

                  <section className="mt-5">

                    <div className="grid gap-4 md:grid-cols-2">

                      {roadmapCards.map(
                        (card) => {

                          const priorityLabel =
                            getPriorityLabel(
                              card.gap
                            );

                          return (
                            <button
                              key={
                                card.skillId
                              }
                              type="button"
                              onClick={() =>
                                setSelectedCard(
                                  card
                                )
                              }
                              className="group rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-[0_8px_25px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                            >

                              {/* PRIORITY */}

                              <div className="flex items-center justify-between gap-3">

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                    priorityLabel ===
                                    "Prioritas Utama"
                                      ? "bg-blue-600 text-white"
                                      : priorityLabel ===
                                        "Prioritas Tinggi"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {
                                    priorityLabel
                                  }
                                </span>

                                <span className="text-xs text-slate-400">
                                  {
                                    card
                                      .roadmapItems
                                      .length
                                  }{" "}
                                  langkah
                                </span>

                              </div>

                              {/* SKILL */}

                              <div className="mt-5 flex items-start justify-between gap-4">

                                <div>

                                  <h3 className="text-lg font-bold text-slate-950 group-hover:text-blue-600">
                                    {
                                      card.skillName
                                    }
                                  </h3>

                                  <p className="mt-1 text-sm text-slate-500">
                                    Fokus pengembangan
                                    kompetensi
                                  </p>

                                </div>

                                <div className="shrink-0 text-right">

                                  <p className="text-2xl font-bold text-slate-950">
                                    {
                                      card.gap
                                    }
                                  </p>

                                  <p className="text-[11px] text-slate-400">
                                    gap
                                  </p>

                                </div>

                              </div>

                              {/* SCORE */}

                              <div className="mt-5">

                                <div className="flex items-center justify-between text-xs">

                                  <span className="text-slate-500">
                                    Skill Kamu
                                  </span>

                                  <span className="font-semibold text-slate-700">
                                    {
                                      card.score
                                    }{" "}
                                    /{" "}
                                    {
                                      card.targetScore
                                    }
                                  </span>

                                </div>

                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

                                  <div
                                    className="h-full rounded-full bg-blue-600 transition-all"
                                    style={{
                                      width: `${Math.min(
                                        Math.max(
                                          card.score,
                                          0
                                        ),
                                        100
                                      )}%`,
                                    }}
                                  />

                                </div>

                              </div>

                              {/* CLICK */}

                              <div className="mt-5 border-t border-slate-100 pt-4">

                                <p className="text-xs font-medium text-blue-600">
                                  Klik untuk melihat detail roadmap →
                                </p>

                              </div>

                            </button>
                          );
                        }
                      )}

                    </div>

                  </section>

                  {/* =================================================
                      AI PERSONALIZED ROADMAP
                  ================================================= */}

                  <section className="mt-6 rounded-[26px] border border-blue-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">

                    <div>

                      <div className="flex items-center gap-2">

                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                          <Sparkles size={17} />
                        </span>

                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                          Personalized Development
                        </p>

                      </div>

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                        <h2 className="text-lg font-bold text-slate-950">
                          Rekomendasi Pengembangan Personal
                        </h2>

                        {aiRoadmap && (
                          <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                            ✓ Roadmap tersimpan
                          </span>
                        )}

                      </div>

                      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                        Disusun berdasarkan hasil Skill Check
                        terakhir, benchmark, dan skill gap kamu.
                      </p>

                    </div>

                    {!aiRoadmap &&
                      !aiRoadmapLoading && (
                        <div className="mt-5 rounded-2xl border border-dashed border-blue-100 bg-blue-50/50 p-5">

                          <p className="text-sm font-bold text-slate-900">
                            Siap membuat roadmap yang lebih personal?
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            AI akan menentukan prioritas pengembangan
                            berdasarkan kompetensi yang paling perlu diperkuat.
                          </p>

                          <button
                            type="button"
                            onClick={
                              generateAiRoadmap
                            }
                            disabled={
                              aiRoadmapLoading
                            }
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Buat Personalized Roadmap
                            <ArrowRight size={15} />
                          </button>

                        </div>
                      )}

                    {aiRoadmapError && (
                      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

                        <p className="text-sm text-red-600">
                          {aiRoadmapError}
                        </p>

                      </div>
                    )}

                    {aiRoadmapLoading && (
                      <div className="mt-5 rounded-2xl bg-blue-50/60 p-5">

                        <p className="text-sm font-semibold text-slate-900">
                          AI sedang menyusun roadmap personalmu...
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Analisis dilakukan berdasarkan hasil
                          kompetensi dan skill gap pada Skill Check terakhir.
                        </p>

                      </div>
                    )}

                    {aiRoadmap &&
                      !aiRoadmapLoading && (
                        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">

                          <div className="mb-4 flex items-center gap-3">

                            <span className="rounded-md bg-yellow-500 px-2 py-1 text-[10px] font-bold text-white">
                              AI
                            </span>

                            <div>

                              <p className="text-sm font-bold text-slate-900">
                                Roadmap Personal
                              </p>

                              <p className="text-xs text-slate-400">
                                Berdasarkan Skill Check terakhir
                              </p>

                            </div>

                          </div>

                          <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
                            {aiRoadmap
                              .replace(
                                /\*\*/g,
                                ""
                              )
                              .replace(
                                /^#+\s*/gm,
                                ""
                              )
                              .replace(
                                /^\-\s+/gm,
                                "• "
                              )}
                          </div>

                        </div>
                      )}

                  </section>

                  {/* =================================================
                      BOTTOM CTA
                  ================================================= */}

                  <section className="mt-6 rounded-[26px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-6">

                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Setelah Pengembangan
                    </p>

                    <h2 className="mt-2 text-lg font-bold text-slate-950">
                      Ukur kompetensimu kembali
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      Setelah kamu mengembangkan kompetensi,
                      lakukan pengukuran kembali untuk melihat
                      apakah gap terhadap benchmark sudah berkurang.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/skillcheck?career=${career.id}`
                        )
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      Ukur Kompetensi Lagi
                      <ArrowRight size={16} />
                    </button>

                  </section>

                </>
              )}
            </>
          )}

          {/* =================================================
              FOOTER NOTE
          ================================================= */}

          <div className="mt-6 flex items-center gap-2 px-1 pb-8 text-xs text-slate-400">

            <CheckCircle2
              size={14}
              className="text-emerald-500"
            />

            Data berdasarkan Skill Check terakhir.

          </div>

        </div>

      </main>

      {/* =====================================================
          ROADMAP DETAIL MODAL
      ===================================================== */}

      {isPremium &&
        selectedCard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
            onMouseDown={() =>
              setSelectedCard(null)
            }
          >

            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white shadow-2xl"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="border-b border-slate-100 px-6 py-5">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Roadmap Pengembangan
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      {selectedCard.skillName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Fokus untuk menutup gap{" "}
                      <span className="font-semibold text-slate-700">
                        {selectedCard.gap}
                      </span>{" "}
                      poin menuju benchmark.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCard(null)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Tutup"
                  >
                    <X size={18} />
                  </button>

                </div>

                {/* SCORE SUMMARY */}

                <div className="mt-5 grid grid-cols-3 gap-3">

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Skill Kamu
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {selectedCard.score}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Benchmark
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {selectedCard.targetScore}
                    </p>

                  </div>

                  <div className="rounded-xl bg-yellow-50 p-3">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-yellow-700">
                      Gap
                    </p>

                    <p className="mt-1 text-lg font-bold text-yellow-700">
                      {selectedCard.gap}
                    </p>

                  </div>

                </div>

              </div>

              {/* MODAL BODY */}

              <div className="px-6 py-6">

                <div className="mb-5">

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Langkah Pengembangan
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-950">
                    Fokus pengembangan kompetensi
                  </h3>

                </div>

                {selectedCard
                  .roadmapItems
                  .length === 0 ? (

                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">

                    <p className="text-sm font-semibold text-slate-700">
                      Detail roadmap belum tersedia
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Kompetensi ini sudah teridentifikasi
                      sebagai prioritas pengembangan,
                      tetapi langkah roadmap belum
                      dimasukkan ke sistem.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-4">

                    {selectedCard
                      .roadmapItems
                      .map(
                        (
                          item,
                          index
                        ) => (

                          <div
                            key={
                              item.id
                            }
                            className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                          >

                            <div className="flex gap-4">

                              {/* STEP */}

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                {String(
                                  index + 1
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </div>

                              {/* CONTENT */}

                              <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center gap-2">

                                  <h4 className="text-sm font-bold text-slate-900">
                                    {
                                      item.title
                                    }
                                  </h4>

                                  {item.recommendation_type && (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                                      {
                                        item.recommendation_type
                                      }
                                    </span>
                                  )}

                                </div>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                  {
                                    item.description
                                  }
                                </p>

                                <div className="mt-3">

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                                      item.status ===
                                      "completed"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {
                                      item.status
                                    }
                                  </span>

                                </div>

                              </div>

                            </div>

                          </div>

                        )
                      )}

                  </div>

                )}

              </div>

            </div>

          </div>
        )}

    </>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7faff] px-6 py-8">
          <div className="mx-auto max-w-6xl animate-pulse">
            <div className="h-5 w-36 rounded-full bg-slate-200" />
            <div className="mt-5 h-10 w-80 rounded-xl bg-slate-200" />
            <div className="mt-3 h-4 w-[520px] max-w-full rounded-full bg-slate-100" />
            <div className="mt-8 h-32 rounded-[26px] bg-white" />
          </div>
        </main>
      }
    >
      <RoadmapPageContent />
    </Suspense>
  );
}

/* =========================================================
   ROADMAP ICON
========================================================= */

function MapIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
    </svg>
  );
}