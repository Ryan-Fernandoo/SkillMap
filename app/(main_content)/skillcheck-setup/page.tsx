"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Career = {
  id: string;
  name: string;
  field: string;
  level: string;
};

type UserSkill = {
  id: number;
  skill_name: string;
  source: string | null;
};

export default function SkillCheckSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const careerId = searchParams.get("career");

  const [career, setCareer] = useState<Career | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [showSkillForm, setShowSkillForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingSkill, setSavingSkill] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!careerId) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: careerData, error: careerError } =
        await supabase
          .from("careers")
          .select("id, name, field, level")
          .eq("id", careerId)
          .single();

      if (careerError) {
        console.error(
          "Gagal mengambil data karier:",
          careerError
        );
      } else {
        setCareer(careerData);
      }

      const { data: skillData, error: skillError } =
        await supabase
          .from("user_skills")
          .select("id, skill_name, source")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: true,
          });

      if (skillError) {
        console.error(
          "Gagal mengambil skill user:",
          skillError
        );
      } else {
        setSkills(skillData ?? []);
      }

      setLoading(false);
    }

    loadData();
  }, [careerId, router]);

  async function handleAddSkill() {
    const skillName = newSkill.trim();

    if (!skillName) return;

    setSavingSkill(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSavingSkill(false);
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("user_skills")
      .insert({
        user_id: user.id,
        skill_name: skillName,
        mapping_status: "Unmapped",
        source: "self_input",
      })
      .select("id, skill_name, source")
      .single();

    if (error) {
      console.error(
        "Gagal menyimpan skill:",
        error
      );

      setSavingSkill(false);
      return;
    }

    setSkills((currentSkills) => [
      ...currentSkills,
      data,
    ]);

    setNewSkill("");
    setShowSkillForm(false);
    setSavingSkill(false);
  }

  function handleContinue() {
    if (!careerId || !career) return;

    router.push(
      `/skillcheck-assessment?career=${careerId}`
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div>
          <p className="text-sm text-gray-500">
            Skill Check
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Persiapkan Pemetaanmu
          </h1>

          <p className="mt-3 max-w-2xl text-gray-500">
            Lengkapi informasi berikut agar SkillMap dapat
            memahami konteks kemampuanmu sebelum melakukan
            assessment.
          </p>
        </div>

        {/* Target Karier */}
        <section className="mt-8 rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">
            Target Karier
          </p>

          {loading ? (
            <p className="mt-2 text-sm text-gray-500">
              Memuat...
            </p>
          ) : career ? (
            <>
              <h2 className="mt-2 text-xl font-semibold">
                {career.name}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {career.field} · {career.level}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-500">
                Belum dipilih
              </p>

              <button
                type="button"
                onClick={() => router.push("/skillcheck")}
                className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
              >
                Pilih Career
              </button>
            </>
          )}
        </section>

        {/* CV */}
        <section className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">
            CV
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Tambahkan CV untuk memberikan konteks mengenai
            pengalaman dan kemampuanmu.
          </p>

          <button
            type="button"
            className="mt-4 rounded-lg border px-5 py-2 text-sm font-medium transition hover:bg-gray-50"
          >
            Tambah CV
          </button>
        </section>

        {/* Skills */}
        <section className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">
            Skill yang Kamu Miliki
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Masukkan skill yang menurutmu sudah kamu miliki.
            Skill ini digunakan sebagai konteks dan tidak
            otomatis menentukan skor assessment.
          </p>

          {skills.length > 0 ? (
            <div className="mt-4 space-y-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {skill.skill_name}
                    </p>

                    {skill.source && (
                      <p className="mt-1 text-xs text-gray-400">
                        Sumber: {skill.source}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed p-5">
              <p className="text-sm font-medium text-gray-900">
                Belum ada skill
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Tambahkan skill yang menurutmu sudah kamu
                miliki.
              </p>
            </div>
          )}

          {showSkillForm ? (
            <div className="mt-4 max-w-md">
              <input
                type="text"
                value={newSkill}
                onChange={(event) =>
                  setNewSkill(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAddSkill();
                  }
                }}
                placeholder="Contoh: SQL"
                className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm outline-none focus:border-gray-500"
                autoFocus
              />

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={
                    savingSkill ||
                    !newSkill.trim()
                  }
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingSkill
                    ? "Menyimpan..."
                    : "Simpan"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSkillForm(false);
                    setNewSkill("");
                  }}
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                setShowSkillForm(true)
              }
              className="mt-4 rounded-lg border px-5 py-2 text-sm font-medium transition hover:bg-gray-50"
            >
              Tambah Skill
            </button>
          )}
        </section>

        {/* Evidence */}
        <section className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">
            Evidence
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Tambahkan project, pengalaman, pembelajaran,
            atau bukti lain yang relevan.
          </p>

          <button
            type="button"
            className="mt-4 rounded-lg border px-5 py-2 text-sm font-medium transition hover:bg-gray-50"
          >
            Tambah Evidence
          </button>
        </section>

        {/* Continue */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={
            loading ||
            !careerId ||
            !career
          }
          className="mt-8 rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Lanjut Assessment
        </button>
      </div>
    </main>
  );
}