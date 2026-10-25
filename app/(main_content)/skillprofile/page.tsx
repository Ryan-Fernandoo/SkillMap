"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

type SkillProfileItem = {
  skillId: string;
  skillName: string;
  score: number;
  target: number;
  gap: number;
  status: string;
};

/* =====================================================
   HELPER
===================================================== */

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

function getScoreBarClass(score: number) {
  if (score >= 85) {
    return "bg-black";
  }

  if (score >= 70) {
    return "bg-gray-600";
  }

  if (score >= 50) {
    return "bg-gray-400";
  }

  return "bg-gray-300";
}

/* =====================================================
   PAGE
===================================================== */

export default function SkillProfilePage() {
  const searchParams = useSearchParams();

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
    useState<SkillProfileItem[]>([]);

  const [userSkills, setUserSkills] =
    useState<UserSkill[]>([]);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  /* =====================================================
     LOAD PROFILE
  ===================================================== */

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
        .select(
          "id, name"
        )
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

         PENTING:
         self_input menyimpan nama skill
         langsung di kolom skill_name.

         Contoh database:
         skill_id   = NULL
         skill_name = "SQL, Spreadsheet"
         source     = "self_input"
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
         LOAD ASSESSMENT
      ================================================= */

      let assessmentQuery =
        supabase
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
          )
          .limit(1);

      /*
        Jika assessment diberikan
        lewat URL, gunakan assessment tersebut.
      */

      if (assessmentParam) {
        assessmentQuery =
          supabase
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
              "id",
              assessmentParam
            )
            .limit(1);
      }

      /*
        Jika career diberikan tapi assessment
        tidak diberikan, ambil assessment terbaru
        untuk career tersebut.
      */

      else if (careerParam) {
        assessmentQuery =
          supabase
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
              "career_id",
              careerParam
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
            )
            .limit(1);
      }

      const {
        data: assessmentData,
        error: assessmentError,
      } = await assessmentQuery;

      if (assessmentError) {
        throw new Error(
          assessmentError.message
        );
      }

      const latestAssessment =
        assessmentData?.[0] || null;

      setAssessment(
        latestAssessment as Assessment | null
      );

      /* =================================================
         BELUM ADA ASSESSMENT
      ================================================= */

      if (!latestAssessment) {
        setCareer(null);
        setSkillResults([]);
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
         LOAD SKILL RESULTS
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

      const results =
        (resultData || []) as SkillResult[];

      /* =================================================
         COMBINE RESULT + SKILL NAME
      ================================================= */

      const loadedSkills =
        (skillData || []) as Skill[];

      const profileItems: SkillProfileItem[] =
        results.map(
          (result) => {
            const skill =
              loadedSkills.find(
                (item) =>
                  item.id ===
                  result.skill_id
              );

            return {
              skillId:
                result.skill_id,

              skillName:
                skill?.name ||
                result.skill_id,

              score:
                result.score,

              target:
                result.target_score,

              gap:
                Math.max(
                  result.gap || 0,
                  0
                ),

              status:
                result.status ||
                (
                  result.score >=
                  result.target_score
                    ? "fulfilled"
                    : "development"
                ),
            };
          }
        );

      setSkillResults(
        profileItems
      );
    } catch (error) {
      console.error(
        "Skill Profile error:",
        error
      );

      if (error instanceof Error) {
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

  /* =====================================================
     OVERALL SCORE
  ===================================================== */

  const overallScore =
    useMemo(() => {
      if (
        skillResults.length === 0
      ) {
        return 0;
      }

      const total =
        skillResults.reduce(
          (sum, item) =>
            sum + item.score,
          0
        );

      return Math.round(
        total /
          skillResults.length
      );
    }, [skillResults]);

  /* =====================================================
     STRONG SKILLS
  ===================================================== */

  const strongSkills =
    useMemo(() => {
      return skillResults.filter(
        (item) =>
          item.score >= item.target
      );
    }, [skillResults]);

  /* =====================================================
     DEVELOPMENT SKILLS
  ===================================================== */

  const developmentSkills =
    useMemo(() => {
      return skillResults
        .filter(
          (item) =>
            item.score <
            item.target
        )
        .sort(
          (a, b) =>
            b.gap - a.gap
        );
    }, [skillResults]);

  /* =====================================================
     SELF INPUT SKILLS

     PENTING:
     Ambil langsung skill_name.

     Karena data kamu sekarang:

     skill_id   = NULL
     skill_name = "SQL, Spreadsheet"
     source     = "self_input"
  ===================================================== */

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
          ...item,
          name:
            item.skill_name!.trim(),
        }))
        .filter(
          (item, index, array) =>
            array.findIndex(
              (other) =>
                other.name.toLowerCase() ===
                item.name.toLowerCase()
            ) === index
        );
    }, [userSkills]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-gray-500">
            Memuat profil kompetensi...
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
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">

          <p className="text-sm text-gray-500">
            Skill Profile
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Profil Kompetensi
          </h1>

          <div className="mt-6 rounded-xl border border-red-200 bg-white px-5 py-4 text-sm text-red-600">
            {errorMessage}
          </div>

        </div>
      </main>
    );
  }

  /* =====================================================
     EMPTY STATE
  ===================================================== */

  if (
    !assessment ||
    skillResults.length === 0
  ) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">

          <p className="text-sm text-gray-500">
            Skill Profile
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Profil Kompetensi
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Lihat profil kompetensimu berdasarkan
            hasil Skill Check dan skill yang kamu
            miliki.
          </p>

          {/* EMPTY PROFILE */}

          <div className="mt-8 rounded-2xl border bg-white p-8 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg">
              —
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Belum Ada Profil Kompetensi
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              Profil kompetensi akan terbentuk
              setelah kamu menyelesaikan Skill Check
              untuk career journey yang kamu pilih.
            </p>

            <Link
              href="/skillcheck"
              className="mt-6 inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Mulai Skill Check
            </Link>

          </div>

          {/* SELF INPUT */}

          {claimedSkills.length >
            0 && (
            <section className="mt-8">

              <p className="text-xs uppercase tracking-wide text-gray-400">
                Input Pengguna
              </p>

              <h2 className="mt-1 text-base font-semibold text-gray-950">
                Skill yang Kamu Miliki
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Skill yang kamu tambahkan sendiri
                sebagai konteks profil.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">

                {claimedSkills.map(
                  (skill) => (
                    <span
                      key={
                        skill.id
                      }
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

  /* =====================================================
     MAIN PROFILE
  ===================================================== */

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div>

          <p className="text-sm text-gray-500">
            Skill Profile
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Profil Kompetensi
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Gambaran kompetensi berdasarkan hasil
            Skill Check terakhir pada career journey
            yang kamu pilih.
          </p>

        </div>

        {/* =================================================
            CAREER JOURNEY
        ================================================= */}

        <div className="mt-6 rounded-xl border bg-white px-5 py-4">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-xs uppercase tracking-wide text-gray-400">
                Career Journey
              </p>

              <h2 className="mt-1 text-lg font-semibold text-gray-950">
                {career?.name ||
                  "Belum ditentukan"}
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

            <div className="text-right">

              <p className="text-xs text-gray-400">
                Skill Check
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                Attempt #
                {assessment.attempt_number ||
                  1}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">

          {/* OVERALL */}

          <div className="rounded-xl border bg-white p-5">

            <p className="text-sm text-gray-500">
              Overall Score
            </p>

            <div className="mt-3 flex items-end gap-2">

              <span className="text-3xl font-bold text-gray-950">
                {overallScore}
              </span>

              <span className="pb-1 text-sm text-gray-400">
                / 100
              </span>

            </div>

            <p className="mt-2 text-sm font-medium text-gray-700">
              {getLevel(
                overallScore
              )}
            </p>

          </div>

          {/* STRONG */}

          <div className="rounded-xl border bg-white p-5">

            <p className="text-sm text-gray-500">
              Kompetensi Kuat
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-950">
              {strongSkills.length}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              dari {skillResults.length} skill
              memenuhi benchmark
            </p>

          </div>

          {/* DEVELOPMENT */}

          <div className="rounded-xl border bg-white p-5">

            <p className="text-sm text-gray-500">
              Perlu Dikembangkan
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-950">
              {developmentSkills.length}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              skill masih di bawah benchmark
            </p>

          </div>

        </div>

        {/* =================================================
            SUMMARY PROFILE
        ================================================= */}

        <div className="mt-5 rounded-xl border bg-white p-5">

          <div className="flex items-start gap-4">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold">
              i
            </div>

            <div>

              <p className="font-medium text-gray-950">
                Ringkasan Profil
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-600">

                Profilmu saat ini berada pada level{" "}

                <span className="font-medium text-gray-900">
                  {getLevel(
                    overallScore
                  )}
                </span>

                {" "}dengan rata-rata kompetensi{" "}

                <span className="font-medium text-gray-900">
                  {overallScore}/100
                </span>
                .

                {" "}Fokus pengembangan dapat diarahkan
                pada{" "}

                <span className="font-medium text-gray-900">
                  {developmentSkills.length}
                </span>

                {" "}skill yang masih berada di bawah
                benchmark.

              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            COMPETENCY PER SKILL
        ================================================= */}

        <section className="mt-8">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-xs uppercase tracking-wide text-gray-400">
                Kompetensi
              </p>

              <h2 className="mt-1 text-lg font-semibold text-gray-950">
                Kompetensi per Skill
              </h2>

            </div>

            <p className="text-sm text-gray-400">
              {skillResults.length} skill
            </p>

          </div>

          <div className="mt-4 space-y-3">

            {skillResults.map(
              (item) => {

                const isStrong =
                  item.score >=
                  item.target;

                return (
                  <div
                    key={
                      item.skillId
                    }
                    className="rounded-xl border bg-white p-5"
                  >

                    {/* TOP */}

                    <div className="flex items-center justify-between gap-4">

                      <div className="min-w-0">

                        <h3 className="font-medium text-gray-950">
                          {item.skillName}
                        </h3>

                        <p className="mt-1 text-xs text-gray-400">

                          {isStrong
                            ? "Memenuhi benchmark"
                            : `Gap ${item.gap} poin`}

                        </p>

                      </div>

                      <div className="shrink-0 text-right">

                        <span className="text-lg font-semibold text-gray-950">
                          {item.score}
                        </span>

                        <span className="text-sm text-gray-400">
                          {" "}
                          / {item.target}
                        </span>

                      </div>

                    </div>

                    {/* BAR */}

                    <div className="mt-4">

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className={`h-full rounded-full transition-all ${getScoreBarClass(
                            item.score
                          )}`}
                          style={{
                            width: `${Math.min(
                              Math.max(
                                item.score,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                      <div className="mt-2 flex justify-between text-xs text-gray-400">

                        <span>
                          Skill kamu
                        </span>

                        <span>
                          Benchmark{" "}
                          {item.target}
                        </span>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* =================================================
            STRONG SKILLS
        ================================================= */}

        {strongSkills.length >
          0 && (
          <section className="mt-8">

            <p className="text-xs uppercase tracking-wide text-gray-400">
              Kekuatan
            </p>

            <h2 className="mt-1 text-lg font-semibold text-gray-950">
              Kompetensi Kuat
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">

              {strongSkills.map(
                (skill) => (
                  <span
                    key={
                      skill.skillId
                    }
                    className="rounded-full border bg-white px-3 py-1.5 text-sm text-gray-700"
                  >
                    {skill.skillName}
                  </span>
                )
              )}

            </div>

          </section>
        )}

        {/* =================================================
            DEVELOPMENT SKILLS
        ================================================= */}

        {developmentSkills.length >
          0 && (
          <section className="mt-8">

            <p className="text-xs uppercase tracking-wide text-gray-400">
              Fokus
            </p>

            <h2 className="mt-1 text-lg font-semibold text-gray-950">
              Perlu Dikembangkan
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">

              {developmentSkills
                .map(
                  (skill) => (
                    <div
                      key={
                        skill.skillId
                      }
                      className="rounded-xl border bg-white p-4"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <p className="font-medium text-gray-950">
                          {
                            skill.skillName
                          }
                        </p>

                        <span className="text-sm font-medium text-gray-700">
                          Gap{" "}
                          {skill.gap}
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        Skor {skill.score}
                        {" "}• Benchmark{" "}
                        {skill.target}
                      </p>

                    </div>
                  )
                )}

            </div>

          </section>
        )}

        {/* =================================================
            SELF INPUT SKILLS
        ================================================= */}

        <section className="mt-8">

          <p className="text-xs uppercase tracking-wide text-gray-400">
            Input Pengguna
          </p>

          <h2 className="mt-1 text-lg font-semibold text-gray-950">
            Skill yang Kamu Miliki
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Skill yang kamu tambahkan sendiri
            sebagai konteks profil.
          </p>

          {claimedSkills.length >
          0 ? (
            <div className="mt-4 flex flex-wrap gap-2">

              {claimedSkills.map(
                (skill) => (
                  <span
                    key={
                      skill.id
                    }
                    className="rounded-full border bg-white px-3 py-1.5 text-sm text-gray-700"
                  >
                    {skill.name}
                  </span>
                )
              )}

            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed bg-white px-5 py-5 text-sm text-gray-400">
              Belum ada skill yang kamu
              tambahkan secara manual.
            </div>
          )}

        </section>

        {/* =================================================
            BOTTOM ACTION
        ================================================= */}

        <div className="mt-10 flex justify-center pb-8">

          <Link
            href={
              career
                ? `/skillcheck?career=${career.id}`
                : "/skillcheck"
            }
            className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Ukur Kompetensi Lagi
          </Link>

        </div>

      </div>
    </main>
  );
}