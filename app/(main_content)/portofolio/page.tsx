"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/language-provider";

type EvidenceType = "project" | "experience" | "learning";

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

const evidenceTypes: EvidenceType[] = [
  "project",
  "experience",
  "learning",
];

function Icon({
  name,
  size = 20,
}: {
  name:
    | "folder"
    | "briefcase"
    | "book"
    | "plus"
    | "edit"
    | "trash"
    | "external"
    | "file"
    | "close"
    | "calendar"
    | "link"
    | "check"
    | "info";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "folder") {
    return (
      <svg {...common}>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      </svg>
    );
  }

  if (name === "briefcase") {
    return (
      <svg {...common}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
      </svg>
    );
  }

  if (name === "book") {
    return (
      <svg {...common}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" />
        <path d="M4 5.5v15" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M10 11v5M14 11v5" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </svg>
    );
  }

  if (name === "external") {
    return (
      <svg {...common}>
        <path d="M14 5h5v5" />
        <path d="M10 14 19 5" />
        <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
      </svg>
    );
  }

  if (name === "file") {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }

  if (name === "link") {
    return (
      <svg {...common}>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 7 20l1.1-1.1" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export default function PortofolioPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [userId, setUserId] = useState<string | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] =
    useState<Evidence | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);

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
            t("portfolio.loadError")
        );
      }

      setEvidences(
        (evidenceData || []) as Evidence[]
      );

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
          t("portfolio.loadError")
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function openAddModal(type: EvidenceType) {
    setEditingEvidence(null);

    setForm({
      ...emptyForm,
      evidence_type: type,
    });

    setErrorMessage("");
    setSuccessMessage("");
    setModalOpen(true);
  }

  function openEditModal(evidence: Evidence) {
    setEditingEvidence(evidence);

    setForm({
      evidence_type: evidence.evidence_type,
      skill_id: evidence.skill_id || "",
      title: evidence.title || "",
      description: evidence.description || "",
      file_url: evidence.file_url || "",
      external_url: evidence.external_url || "",
      evidence_date: evidence.evidence_date || "",
    });

    setErrorMessage("");
    setSuccessMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingEvidence(null);
    setForm(emptyForm);
    setErrorMessage("");
  }

  function updateForm(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    if (!userId) {
      setErrorMessage(
        t("portfolio.userNotFound")
      );
      return;
    }

    if (!form.title.trim()) {
      setErrorMessage(
        t("portfolio.titleRequired")
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        user_id: userId,
        skill_id: form.skill_id || null,
        evidence_type: form.evidence_type,
        title: form.title.trim(),
        description:
          form.description.trim() || null,
        file_url:
          form.file_url.trim() || null,
        external_url:
          form.external_url.trim() || null,
        evidence_date:
          form.evidence_date || null,
      };

      if (editingEvidence) {
        const { error: updateError } =
          await supabase
            .from("evidences")
            .update({
              skill_id: payload.skill_id,
              evidence_type:
                payload.evidence_type,
              title: payload.title,
              description:
                payload.description,
              file_url: payload.file_url,
              external_url:
                payload.external_url,
              evidence_date:
                payload.evidence_date,
            })
            .eq("id", editingEvidence.id)
            .eq("user_id", userId);

        if (updateError) {
          console.error(
            "Gagal update evidence:",
            updateError
          );

          throw new Error(
            updateError.message ||
              t("portfolio.updateError")
          );
        }

        setSuccessMessage(
          t("portfolio.updateSuccess")
        );
      } else {
        const { error: insertError } =
          await supabase
            .from("evidences")
            .insert(payload);

        if (insertError) {
          console.error(
            "Gagal insert evidence:",
            insertError
          );

          throw new Error(
            insertError.message ||
              t("portfolio.saveError")
          );
        }

        setSuccessMessage(
          t("portfolio.saveSuccess")
        );
      }

      setModalOpen(false);
      setEditingEvidence(null);
      setForm(emptyForm);

      await loadData();
    } catch (error) {
      console.error(
        "Save evidence error:",
        error
      );

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          t("portfolio.saveError")
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    evidence: Evidence
  ) {
    if (!userId) return;

    const confirmed = window.confirm(
      `${t("portfolio.deleteConfirm")} "${evidence.title}"?`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error: deleteError } =
        await supabase
          .from("evidences")
          .delete()
          .eq("id", evidence.id)
          .eq("user_id", userId);

      if (deleteError) {
        console.error(
          "Gagal menghapus evidence:",
          deleteError
        );

        throw new Error(
          deleteError.message ||
            t("portfolio.deleteError")
        );
      }

      setSuccessMessage(
        t("portfolio.deleteSuccess")
      );

      await loadData();
    } catch (error) {
      console.error(
        "Delete evidence error:",
        error
      );

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          t("portfolio.deleteError")
        );
      }
    }
  }

  function getSkillName(
    skillId: string | null
  ) {
    if (!skillId) return null;

    return (
      skills.find(
        (skill) => skill.id === skillId
      )?.name || null
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      language === "English" ? "en-US" : "id-ID",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function getTypeLabel(type: EvidenceType) {
    if (type === "project") {
      return t("portfolio.project");
    }

    if (type === "experience") {
      return t("portfolio.experience");
    }

    return t("portfolio.learning");
  }

  function getTypeShortLabel(
    type: EvidenceType
  ) {
    if (type === "project") {
      return t("portfolio.projectShort");
    }

    if (type === "experience") {
      return t("portfolio.experienceShort");
    }

    return t("portfolio.learningShort");
  }

  function getTypeDescription(
    type: EvidenceType
  ) {
    if (type === "project") {
      return t("portfolio.projectDescription");
    }

    if (type === "experience") {
      return t("portfolio.experienceDescription");
    }

    return t("portfolio.learningDescription");
  }

  function getTypeIcon(type: EvidenceType) {
    if (type === "project") {
      return "folder" as const;
    }

    if (type === "experience") {
      return "briefcase" as const;
    }

    return "book" as const;
  }

  const groupedEvidence = useMemo(() => {
    return evidenceTypes.map((type) => ({
      type,
      items: evidences.filter(
        (item) => item.evidence_type === type
      ),
    }));
  }, [evidences]);

  const totalEvidence = evidences.length;

  const projectCount = evidences.filter(
    (item) => item.evidence_type === "project"
  ).length;

  const experienceCount = evidences.filter(
    (item) => item.evidence_type === "experience"
  ).length;

  const learningCount = evidences.filter(
    (item) => item.evidence_type === "learning"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-4 w-40 rounded bg-gray-200" />
            <div className="mt-4 h-10 w-72 rounded bg-gray-200" />
            <div className="mt-3 h-5 w-full max-w-2xl rounded bg-gray-200" />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl border border-gray-200 bg-white"
                />
              ))}
            </div>

            <div className="mt-8 h-40 rounded-2xl border border-gray-200 bg-white" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 px-5 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* HEADER */}
          <header>
            <p className="text-sm font-medium text-gray-500">
              {t("portfolio.eyebrow")}
            </p>

            <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                  {t("portfolio.title")}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                  {t("portfolio.subtitle")}
                </p>
              </div>
            </div>
          </header>

          {/* ERROR */}
          {errorMessage && !modalOpen && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <Icon name="info" size={18} />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* SUCCESS */}
          {successMessage && !modalOpen && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                <Icon name="check" size={16} />
              </span>
              <p>{successMessage}</p>
            </div>
          )}

          {/* SUMMARY */}
          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {t("portfolio.totalEvidence")}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-950">
                    {totalEvidence}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <Icon name="folder" size={21} />
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                {t("portfolio.totalEvidenceDescription")}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {t("portfolio.projects")}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-950">
                    {projectCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <Icon name="folder" size={21} />
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                {t("portfolio.projectsDescription")}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {t("portfolio.experienceLearning")}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-950">
                    {experienceCount + learningCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <Icon name="briefcase" size={21} />
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                {t("portfolio.experienceLearningDescription")}
              </p>
            </div>
          </section>

          {/* INFO */}
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <Icon name="info" size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-950">
                  {t("portfolio.infoTitle")}
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                  {t("portfolio.infoDescription")}
                </p>
              </div>
            </div>
          </section>

          {/* EVIDENCE GROUPS */}
          <div className="mt-10 space-y-10">
            {groupedEvidence.map((group) => (
              <section key={group.type}>
                {/* SECTION HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm">
                      <Icon
                        name={getTypeIcon(group.type)}
                        size={19}
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-950">
                          {getTypeLabel(group.type)}
                        </h2>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                          {group.items.length}
                        </span>
                      </div>

                      <p className="mt-1 max-w-xl text-sm text-gray-500">
                        {getTypeDescription(group.type)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openAddModal(group.type)
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-[0.98]"
                  >
                    <Icon name="plus" size={17} />
                    {t("portfolio.add")}
                  </button>
                </div>

                {/* CARDS */}
                <div className="mt-4">
                  {group.items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                        <Icon
                          name={getTypeIcon(group.type)}
                          size={20}
                        />
                      </div>

                      <p className="mt-4 text-sm font-medium text-gray-700">
                        {t("portfolio.emptyTitle")}
                      </p>

                      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-400">
                        {t("portfolio.emptyDescription")}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          openAddModal(group.type)
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <Icon name="plus" size={16} />
                        {t("portfolio.addFirst")}
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {group.items.map(
                        (evidence) => {
                          const skillName =
                            getSkillName(
                              evidence.skill_id
                            );

                          return (
                            <article
                              key={evidence.id}
                              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                            >
                              {/* CARD TOP */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                                      {getTypeShortLabel(
                                        evidence.evidence_type
                                      )}
                                    </span>

                                    {skillName && (
                                      <span className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                                        {skillName}
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-gray-950">
                                    {evidence.title}
                                  </h3>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditModal(
                                        evidence
                                      )
                                    }
                                    aria-label={t(
                                      "portfolio.edit"
                                    )}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                                  >
                                    <Icon
                                      name="edit"
                                      size={16}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete(
                                        evidence
                                      )
                                    }
                                    aria-label={t(
                                      "portfolio.delete"
                                    )}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Icon
                                      name="trash"
                                      size={16}
                                    />
                                  </button>
                                </div>
                              </div>

                              {/* DESCRIPTION */}
                              {evidence.description && (
                                <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                                  {evidence.description}
                                </p>
                              )}

                              {/* DATE */}
                              {evidence.evidence_date && (
                                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                                  <Icon
                                    name="calendar"
                                    size={14}
                                  />

                                  <span>
                                    {formatDate(
                                      evidence.evidence_date
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* LINKS */}
                              {(evidence.external_url ||
                                evidence.file_url) && (
                                <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                                  {evidence.external_url && (
                                    <a
                                      href={
                                        evidence.external_url
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                                    >
                                      <Icon
                                        name="link"
                                        size={14}
                                      />
                                      {t(
                                        "portfolio.viewLink"
                                      )}
                                      <Icon
                                        name="external"
                                        size={13}
                                      />
                                    </a>
                                  )}

                                  {evidence.file_url && (
                                    <a
                                      href={
                                        evidence.file_url
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                                    >
                                      <Icon
                                        name="file"
                                        size={14}
                                      />
                                      {t(
                                        "portfolio.viewFile"
                                      )}
                                      <Icon
                                        name="external"
                                        size={13}
                                      />
                                    </a>
                                  )}
                                </div>
                              )}
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* BOTTOM NOTE */}
          <div className="mt-12 border-t border-gray-200 pt-6">
            <p className="text-xs leading-5 text-gray-400">
              {t("portfolio.bottomNote")}
            </p>
          </div>
        </div>
      </main>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
            {/* MODAL HEADER */}
            <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-5 py-5 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    {getTypeShortLabel(
                      form.evidence_type
                    )}
                  </span>
                </div>

                <h2 className="mt-2 text-xl font-semibold text-gray-950">
                  {editingEvidence
                    ? t("portfolio.editEvidence")
                    : t("portfolio.addEvidence")}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {t("portfolio.modalDescription")}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label={t(
                  "portfolio.close"
                )}
                className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
              >
                <Icon name="close" size={19} />
              </button>
            </div>

            {/* FORM */}
            <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="space-y-5">
                {/* TYPE */}
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    {t("portfolio.type")}
                  </label>

                  <select
                    value={
                      form.evidence_type
                    }
                    onChange={(event) =>
                      updateForm(
                        "evidence_type",
                        event.target
                          .value as EvidenceType
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                  >
                    <option value="project">
                      {t("portfolio.project")}
                    </option>

                    <option value="experience">
                      {t("portfolio.experience")}
                    </option>

                    <option value="learning">
                      {t("portfolio.learning")}
                    </option>
                  </select>
                </div>

                {/* TITLE */}
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    {t("portfolio.evidenceTitle")}
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
                    placeholder={t(
                      "portfolio.titlePlaceholder"
                    )}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {/* SKILL + DATE */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      {t(
                        "portfolio.relatedSkill"
                      )}
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        ({t("portfolio.optional")})
                      </span>
                    </label>

                    <select
                      value={form.skill_id}
                      onChange={(event) =>
                        updateForm(
                          "skill_id",
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                    >
                      <option value="">
                        {t(
                          "portfolio.noSpecificSkill"
                        )}
                      </option>

                      {skills.map((skill) => (
                        <option
                          key={skill.id}
                          value={skill.id}
                        >
                          {skill.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      {t("portfolio.date")}
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        ({t("portfolio.optional")})
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
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    {t("portfolio.description")}
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      ({t("portfolio.optional")})
                    </span>
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    rows={5}
                    placeholder={t(
                      "portfolio.descriptionPlaceholder"
                    )}
                    className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-3.5 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {/* EXTERNAL URL */}
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    {t(
                      "portfolio.externalLink"
                    )}
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      ({t("portfolio.optional")})
                    </span>
                  </label>

                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Icon name="link" size={17} />
                    </div>

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
                      className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                </div>

                {/* FILE URL */}
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    {t("portfolio.fileLink")}
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      ({t("portfolio.optional")})
                    </span>
                  </label>

                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Icon name="file" size={17} />
                    </div>

                    <input
                      type="url"
                      value={form.file_url}
                      onChange={(event) =>
                        updateForm(
                          "file_url",
                          event.target.value
                        )
                      }
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/5"
                    />
                  </div>

                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    {t(
                      "portfolio.fileLinkDescription"
                    )}
                  </p>
                </div>

                {/* ERROR */}
                {errorMessage && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <Icon
                      name="info"
                      size={17}
                    />
                    <p>{errorMessage}</p>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="h-11 rounded-xl border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
              >
                {t("portfolio.cancel")}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t("portfolio.saving")}
                  </>
                ) : (
                  <>
                    <Icon name="check" size={17} />
                    {editingEvidence
                      ? t(
                          "portfolio.saveChanges"
                        )
                      : t("portfolio.save")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}