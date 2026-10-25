"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type EvidenceType =
  | "project"
  | "experience"
  | "learning";

type Evidence = {
  id: number;
  user_id: string;
  skill_id: string | null;
  evidence_type: EvidenceType;
  title: string;
  description: string | null;
  file_url: string | null;
  external_url: string | null;
  evidence_date: string | null;
  created_at: string;
};

type Skill = {
  id: string;
  name: string;
};

type FormData = {
  evidence_type: EvidenceType;
  skill_id: string;
  title: string;
  description: string;
  file_url: string;
  external_url: string;
  evidence_date: string;
};

const emptyForm: FormData = {
  evidence_type: "project",
  skill_id: "",
  title: "",
  description: "",
  file_url: "",
  external_url: "",
  evidence_date: "",
};

const evidenceGroups: {
  type: EvidenceType;
  label: string;
  description: string;
}[] = [
  {
    type: "project",
    label: "Project & Karya",
    description: "Project yang pernah kamu kerjakan.",
  },
  {
    type: "experience",
    label: "Pengalaman Relevan",
    description:
      "Pengalaman organisasi, pekerjaan, magang, atau aktivitas relevan.",
  },
  {
    type: "learning",
    label: "Pembelajaran & Sertifikasi",
    description:
      "Pembelajaran, kursus, pelatihan, atau sertifikasi.",
  },
];

export default function PortofolioPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(
    null
  );

  const [evidences, setEvidences] = useState<Evidence[]>(
    []
  );

  const [skills, setSkills] = useState<Skill[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingEvidence, setEditingEvidence] =
    useState<Evidence | null>(null);

  const [form, setForm] = useState<FormData>(
    emptyForm
  );

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      /* =================================================
         LOAD EVIDENCES
      ================================================= */

      const {
        data: evidenceData,
        error: evidenceError,
      } = await supabase
        .from("evidences")
        .select(
          `
            id,
            user_id,
            skill_id,
            evidence_type,
            title,
            description,
            file_url,
            external_url,
            evidence_date,
            created_at
          `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (evidenceError) {
        console.error(
          "Gagal mengambil evidences:",
          evidenceError
        );

        throw new Error(
          evidenceError.message ||
            "Data portofolio gagal dimuat."
        );
      }

      setEvidences(
        (evidenceData || []) as Evidence[]
      );

      /* =================================================
         LOAD SKILLS
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
    } catch (error) {
      console.error(
        "Portofolio load error:",
        error
      );

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Data portofolio gagal dimuat."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  function openAddModal(
    type: EvidenceType
  ) {
    setEditingEvidence(null);

    setForm({
      ...emptyForm,
      evidence_type: type,
    });

    setErrorMessage("");
    setSuccessMessage("");

    setModalOpen(true);
  }

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */

  function openEditModal(
    evidence: Evidence
  ) {
    setEditingEvidence(evidence);

    setForm({
      evidence_type:
        evidence.evidence_type,

      skill_id:
        evidence.skill_id || "",

      title:
        evidence.title || "",

      description:
        evidence.description || "",

      file_url:
        evidence.file_url || "",

      external_url:
        evidence.external_url || "",

      evidence_date:
        evidence.evidence_date || "",
    });

    setErrorMessage("");
    setSuccessMessage("");

    setModalOpen(true);
  }

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingEvidence(null);

    setForm(emptyForm);

    setErrorMessage("");
  }

  /* =====================================================
     UPDATE FORM
  ===================================================== */

  function updateForm(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function handleSave() {
    if (!userId) {
      setErrorMessage(
        "User belum ditemukan."
      );
      return;
    }

    if (!form.title.trim()) {
      setErrorMessage(
        "Judul wajib diisi."
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      /* =================================================
         PAYLOAD

         Nilai evidence_type HARUS menggunakan
         nilai yang diizinkan database:

         project
         experience
         learning
      ================================================= */

      const payload = {
        user_id: userId,

        skill_id:
          form.skill_id || null,

        evidence_type:
          form.evidence_type,

        title:
          form.title.trim(),

        description:
          form.description.trim() ||
          null,

        file_url:
          form.file_url.trim() ||
          null,

        external_url:
          form.external_url.trim() ||
          null,

        evidence_date:
          form.evidence_date ||
          null,
      };

      /* =================================================
         UPDATE
      ================================================= */

      if (editingEvidence) {
        const {
          error: updateError,
        } = await supabase
          .from("evidences")
          .update({
            skill_id:
              payload.skill_id,

            evidence_type:
              payload.evidence_type,

            title:
              payload.title,

            description:
              payload.description,

            file_url:
              payload.file_url,

            external_url:
              payload.external_url,

            evidence_date:
              payload.evidence_date,
          })
          .eq(
            "id",
            editingEvidence.id
          )
          .eq(
            "user_id",
            userId
          );

        if (updateError) {
          console.error(
            "Gagal update evidence:",
            updateError
          );

          throw new Error(
            updateError.message ||
              "Data gagal diperbarui."
          );
        }

        setSuccessMessage(
          "Bukti kompetensi berhasil diperbarui."
        );
      }

      /* =================================================
         INSERT
      ================================================= */

      else {
        const {
          error: insertError,
        } = await supabase
          .from("evidences")
          .insert(payload);

        if (insertError) {
          console.error(
            "Gagal insert evidence:",
            insertError
          );

          throw new Error(
            insertError.message ||
              "Data gagal disimpan."
          );
        }

        setSuccessMessage(
          "Bukti kompetensi berhasil disimpan."
        );
      }

      /* =================================================
         MODAL LANGSUNG DITUTUP
      ================================================= */

      setModalOpen(false);
      setEditingEvidence(null);
      setForm(emptyForm);

      /* =================================================
         REFRESH DATA
      ================================================= */

      await loadData();
    } catch (error) {
      console.error(
        "Save evidence error:",
        error
      );

      /*
        Kalau gagal, modal tetap terbuka.
      */

      if (error instanceof Error) {
        setErrorMessage(
          error.message
        );
      } else {
        setErrorMessage(
          "Data gagal disimpan."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function handleDelete(
    evidence: Evidence
  ) {
    if (!userId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Hapus "${evidence.title}"?`
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("evidences")
        .delete()
        .eq(
          "id",
          evidence.id
        )
        .eq(
          "user_id",
          userId
        );

      if (deleteError) {
        console.error(
          "Gagal menghapus evidence:",
          deleteError
        );

        throw new Error(
          deleteError.message ||
            "Data gagal dihapus."
        );
      }

      setSuccessMessage(
        "Bukti kompetensi berhasil dihapus."
      );

      await loadData();
    } catch (error) {
      console.error(
        "Delete evidence error:",
        error
      );

      if (error instanceof Error) {
        setErrorMessage(
          error.message
        );
      } else {
        setErrorMessage(
          "Data gagal dihapus."
        );
      }
    }
  }

  /* =====================================================
     GET SKILL NAME
  ===================================================== */

  function getSkillName(
    skillId: string | null
  ) {
    if (!skillId) {
      return null;
    }

    return (
      skills.find(
        (skill) =>
          skill.id === skillId
      )?.name || null
    );
  }

  /* =====================================================
     GROUP DATA
  ===================================================== */

  const groupedEvidence =
    useMemo(() => {
      return evidenceGroups.map(
        (group) => ({
          ...group,

          items:
            evidences.filter(
              (item) =>
                item.evidence_type ===
                group.type
            ),
        })
      );
    }, [evidences]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-gray-500">
            Memuat portofolio...
          </p>
        </div>
      </main>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div>
          <p className="text-sm text-gray-500">
            Portofolio & Pengalaman
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Bukti Kompetensi
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Simpan project, pengalaman,
            pembelajaran, dan sertifikasi
            yang membantu memberikan konteks
            terhadap kompetensimu.
          </p>
        </div>

        {/* ERROR */}

        {errorMessage && !modalOpen && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {/* SUCCESS */}

        {successMessage && !modalOpen && (
          <div className="mt-5 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            {successMessage}
          </div>
        )}

        {/* INFO */}

        <div className="mt-5 flex gap-4 rounded-xl border bg-white p-5">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold">
            i
          </div>

          <div>
            <p className="font-medium text-gray-950">
              Evidence membantu memberikan konteks
            </p>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Project dan pengalaman yang kamu
              masukkan tidak otomatis menambah
              skor Skill Check. Data ini digunakan
              sebagai bukti dan konteks untuk
              memahami kompetensi yang kamu miliki.
            </p>
          </div>

        </div>

        {/* GROUPS */}

        <div className="mt-8 space-y-8">

          {groupedEvidence.map(
            (group) => (
              <section
                key={group.type}
              >

                {/* GROUP HEADER */}

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {group.type ===
                      "project"
                        ? "PROJECT"
                        : group.type ===
                          "experience"
                        ? "PENGALAMAN"
                        : "PEMBELAJARAN"}
                    </p>

                    <h2 className="mt-1 text-base font-semibold text-gray-950">
                      {group.label}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openAddModal(
                        group.type
                      )
                    }
                    className={
                      group.type ===
                      "project"
                        ? "rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                        : "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    }
                  >
                    + Tambah
                  </button>

                </div>

                {/* CARDS */}

                <div className="mt-4 grid gap-4 md:grid-cols-2">

                  {group.items.length ===
                  0 ? (
                    <div className="flex min-h-[72px] items-center justify-center rounded-xl border border-dashed bg-white px-5 text-sm text-gray-400">
                      Belum ada data
                      yang ditambahkan.
                    </div>
                  ) : (
                    group.items.map(
                      (evidence) => {
                        const skillName =
                          getSkillName(
                            evidence.skill_id
                          );

                        return (
                          <article
                            key={
                              evidence.id
                            }
                            className="rounded-xl border bg-white p-5 transition hover:border-gray-400"
                          >

                            {/* HEADER */}

                            <div className="flex items-start justify-between gap-4">

                              <div className="min-w-0">

                                <h3 className="font-semibold text-gray-950">
                                  {
                                    evidence.title
                                  }
                                </h3>

                                {skillName && (
                                  <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                                    {skillName}
                                  </span>
                                )}

                              </div>

                              <div className="flex shrink-0 gap-3">

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      evidence
                                    )
                                  }
                                  className="text-xs text-gray-500 transition hover:text-black"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      evidence
                                    )
                                  }
                                  className="text-xs text-red-500 transition hover:text-red-700"
                                >
                                  Hapus
                                </button>

                              </div>

                            </div>

                            {/* DESCRIPTION */}

                            {evidence.description && (
                              <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                                {
                                  evidence.description
                                }
                              </p>
                            )}

                            {/* DATE */}

                            {evidence.evidence_date && (
                              <p className="mt-3 text-xs text-gray-400">
                                {new Date(
                                  evidence.evidence_date
                                ).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            )}

                            {/* LINKS */}

                            <div className="mt-4 flex flex-wrap gap-3">

                              {evidence.external_url && (
                                <a
                                  href={
                                    evidence.external_url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium underline"
                                >
                                  Lihat link →
                                </a>
                              )}

                              {evidence.file_url && (
                                <a
                                  href={
                                    evidence.file_url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium underline"
                                >
                                  Lihat file →
                                </a>
                              )}

                            </div>

                          </article>
                        );
                      }
                    )
                  )}

                </div>

              </section>
            )
          )}

        </div>

      </div>

      {/* ===================================================
          MODAL
      =================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {form.evidence_type ===
                  "project"
                    ? "PROJECT"
                    : form.evidence_type ===
                      "experience"
                    ? "PENGALAMAN"
                    : "PEMBELAJARAN"}
                </p>

                <h2 className="mt-1 text-xl font-semibold text-gray-950">
                  {editingEvidence
                    ? "Edit Bukti Kompetensi"
                    : "Tambah Bukti Kompetensi"}
                </h2>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-2xl leading-none text-gray-400 transition hover:text-black disabled:opacity-40"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <div className="space-y-5 p-6">

              {/* JENIS */}

              <div>
                <label className="text-sm font-medium text-gray-900">
                  Jenis
                </label>

                <select
                  value={
                    form.evidence_type
                  }
                  onChange={(event) =>
                    updateForm(
                      "evidence_type",
                      event.target.value as EvidenceType
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                >
                  <option value="project">
                    Project
                  </option>

                  <option value="experience">
                    Pengalaman
                  </option>

                  <option value="learning">
                    Pembelajaran/Sertifikasi
                  </option>
                </select>
              </div>

              {/* SKILL */}

              <div>
                <label className="text-sm font-medium text-gray-900">
                  Skill Terkait
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>

                <select
                  value={
                    form.skill_id
                  }
                  onChange={(event) =>
                    updateForm(
                      "skill_id",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                >
                  <option value="">
                    Tidak dikaitkan dengan skill tertentu
                  </option>

                  {skills.map(
                    (skill) => (
                      <option
                        key={skill.id}
                        value={skill.id}
                      >
                        {skill.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* JUDUL */}

              <div>
                <label className="text-sm font-medium text-gray-900">
                  Judul
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="Contoh: Dashboard UMKM"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              {/* DESKRIPSI */}

              <div>
                <label className="text-sm font-medium text-gray-900">
                  Deskripsi
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Jelaskan kontribusi, tugas, atau hasil yang kamu kerjakan."
                  className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              {/* TANGGAL */}

              <div>
                <label className="text-sm font-medium text-gray-900">
                  Tanggal Bukti
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>

                <input
                  type="date"
                  value={
                    form.evidence_date
                  }
                  onChange={(event) =>
                    updateForm(
                      "evidence_date",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              {/* EXTERNAL URL */}

              <div>
                <label className="text-sm font-medium text-gray-900">
                  Link Eksternal
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>

                <input
                  type="url"
                  value={
                    form.external_url
                  }
                  onChange={(event) =>
                    updateForm(
                      "external_url",
                      event.target.value
                    )
                  }
                  placeholder="https://github.com/..."
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              {/* FILE URL */}

              <div>
                <label className="text-sm font-medium text-gray-900">
                  Link File
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>

                <input
                  type="url"
                  value={
                    form.file_url
                  }
                  onChange={(event) =>
                    updateForm(
                      "file_url",
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              {/* ERROR */}

              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorMessage}
                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t px-6 py-4">

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : editingEvidence
                  ? "Simpan Perubahan"
                  : "Simpan"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}