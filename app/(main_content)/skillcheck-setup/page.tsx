"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  FolderOpen,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/language-provider";

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

type SelectedFile = {
  file: File;
  name: string;
  size: number;
  type: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const EVIDENCE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts[parts.length - 1].toUpperCase();
}

export default function SkillCheckSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const careerId = searchParams.get("career");

  const { language } = useLanguage();
  const isEnglish = language === "English";

  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const evidenceInputRef =
    useRef<HTMLInputElement | null>(null);

  const [career, setCareer] = useState<Career | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [showSkillForm, setShowSkillForm] =
    useState(false);

  const [cvFile, setCvFile] =
    useState<SelectedFile | null>(null);

  const [evidenceFile, setEvidenceFile] =
    useState<SelectedFile | null>(null);

  const [fileError, setFileError] = useState("");

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

      const {
        data: careerData,
        error: careerError,
      } = await supabase
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

      const {
        data: skillData,
        error: skillError,
      } = await supabase
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

    const {
      data,
      error,
    } = await supabase
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

  function validateFile(
    file: File,
    allowedTypes: string[]
  ) {
    setFileError("");

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        isEnglish
          ? "File size must not exceed 10 MB."
          : "Ukuran file maksimal 10 MB."
      );

      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      setFileError(
        isEnglish
          ? "This file type is not supported."
          : "Jenis file ini tidak didukung."
      );

      return false;
    }

    return true;
  }

  function handleCvChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validateFile(file, CV_TYPES)) {
      event.target.value = "";
      return;
    }

    setCvFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    });

    setFileError("");
  }

  function handleEvidenceChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validateFile(file, EVIDENCE_TYPES)) {
      event.target.value = "";
      return;
    }

    setEvidenceFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    });

    setFileError("");
  }

  function removeCvFile() {
    setCvFile(null);

    if (cvInputRef.current) {
      cvInputRef.current.value = "";
    }
  }

  function removeEvidenceFile() {
    setEvidenceFile(null);

    if (evidenceInputRef.current) {
      evidenceInputRef.current.value = "";
    }
  }

  function handleBack() {
    router.push("/skillcheck");
  }

  function handleContinue() {
    if (!careerId || !career) {
      return;
    }

    router.push(
      `/skillcheck-assessment?career=${careerId}`
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faff] px-6 py-8">
      <div className="mx-auto max-w-4xl">

        {/* BACK */}
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          {isEnglish
            ? "Back to Skill Check"
            : "Kembali ke Skill Check"}
        </button>

        {/* HEADER */}
        <section className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Skill Check
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {isEnglish
              ? "Prepare Your Mapping"
              : "Persiapkan Pemetaanmu"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            {isEnglish
              ? "Complete the information below so SkillMap can understand your competency context before the assessment."
              : "Lengkapi informasi berikut agar SkillMap dapat memahami konteks kemampuanmu sebelum melakukan assessment."}
          </p>
        </section>

        {/* CAREER */}
        <section className="rounded-[26px] border border-blue-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CheckCircle2 size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {isEnglish
                  ? "Career Target"
                  : "Target Karier"}
              </p>

              {loading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  {isEnglish
                    ? "Loading..."
                    : "Memuat..."}
                </div>
              ) : career ? (
                <>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    {career.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {career.field} · {career.level}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-slate-500">
                    {isEnglish
                      ? "No career selected"
                      : "Belum dipilih"}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/skillcheck")
                    }
                    className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {isEnglish
                      ? "Choose Career"
                      : "Pilih Career"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* CV */}
        <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-950">
                CV
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isEnglish
                  ? "Add your CV to provide context about your experience and competencies."
                  : "Tambahkan CV untuk memberikan konteks mengenai pengalaman dan kemampuanmu."}
              </p>

              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCvChange}
                className="hidden"
              />

              {!cvFile ? (
                <button
                  type="button"
                  onClick={() =>
                    cvInputRef.current?.click()
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Upload size={17} />
                  {isEnglish
                    ? "Add CV"
                    : "Tambah CV"}
                </button>
              ) : (
                <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {cvFile.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {getFileExtension(
                          cvFile.name
                        )}{" "}
                        ·{" "}
                        {formatFileSize(
                          cvFile.size
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeCvFile}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-red-500"
                    aria-label={
                      isEnglish
                        ? "Remove CV"
                        : "Hapus CV"
                    }
                  >
                    <X size={17} />
                  </button>
                </div>
              )}

              <p className="mt-3 text-xs text-slate-400">
                PDF, DOC, DOCX · max. 10 MB
              </p>
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CheckCircle2 size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-950">
                {isEnglish
                  ? "Skills You Have"
                  : "Skill yang Kamu Miliki"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isEnglish
                  ? "Add skills you believe you already have. These are used as context and do not automatically determine your assessment score."
                  : "Masukkan skill yang menurutmu sudah kamu miliki. Skill ini digunakan sebagai konteks dan tidak otomatis menentukan skor assessment."}
              </p>

              {skills.length > 0 ? (
                <div className="mt-5 space-y-2">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {skill.skill_name}
                        </p>

                        {skill.source && (
                          <p className="mt-1 text-xs text-slate-400">
                            {isEnglish
                              ? `Source: ${skill.source}`
                              : `Sumber: ${skill.source}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5">
                  <p className="text-sm font-semibold text-slate-800">
                    {isEnglish
                      ? "No skills added yet"
                      : "Belum ada skill"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {isEnglish
                      ? "Add skills that you already have."
                      : "Tambahkan skill yang menurutmu sudah kamu miliki."}
                  </p>
                </div>
              )}

              {showSkillForm ? (
                <div className="mt-5 max-w-md">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(event) =>
                      setNewSkill(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleAddSkill();
                      }
                    }}
                    placeholder={
                      isEnglish
                        ? "Example: SQL"
                        : "Contoh: SQL"
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
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
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {savingSkill && (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      )}

                      {savingSkill
                        ? isEnglish
                          ? "Saving..."
                          : "Menyimpan..."
                        : isEnglish
                        ? "Save"
                        : "Simpan"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSkillForm(false);
                        setNewSkill("");
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      {isEnglish
                        ? "Cancel"
                        : "Batal"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setShowSkillForm(true)
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <span className="text-lg leading-none">
                    +
                  </span>
                  {isEnglish
                    ? "Add Skill"
                    : "Tambah Skill"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* EVIDENCE */}
        <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FolderOpen size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-950">
                Evidence
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isEnglish
                  ? "Add a project, experience, learning material, certification, or other relevant evidence."
                  : "Tambahkan project, pengalaman, pembelajaran, sertifikasi, atau bukti lain yang relevan."}
              </p>

              <input
                ref={evidenceInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleEvidenceChange}
                className="hidden"
              />

              {!evidenceFile ? (
                <button
                  type="button"
                  onClick={() =>
                    evidenceInputRef.current?.click()
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Upload size={17} />
                  {isEnglish
                    ? "Add Evidence"
                    : "Tambah Evidence"}
                </button>
              ) : (
                <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                      <FolderOpen size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {evidenceFile.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {getFileExtension(
                          evidenceFile.name
                        )}{" "}
                        ·{" "}
                        {formatFileSize(
                          evidenceFile.size
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      removeEvidenceFile
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-red-500"
                    aria-label={
                      isEnglish
                        ? "Remove evidence"
                        : "Hapus evidence"
                    }
                  >
                    <X size={17} />
                  </button>
                </div>
              )}

              <p className="mt-3 text-xs text-slate-400">
                PDF, JPG, PNG, DOC, DOCX, PPT, PPTX,
                XLS, XLSX · max. 10 MB
              </p>

              {fileError && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {fileError}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CONTINUE */}
        <div className="mt-7 flex flex-col gap-3 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-400">
            {isEnglish
              ? "Your selected files will be used as supporting context for this setup."
              : "File yang dipilih digunakan sebagai konteks pendukung untuk setup ini."}
          </p>

          <button
            type="button"
            onClick={handleContinue}
            disabled={
              loading ||
              !careerId ||
              !career
            }
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {isEnglish
              ? "Continue Assessment"
              : "Lanjut Assessment"}
          </button>
        </div>
      </div>
    </main>
  );
}