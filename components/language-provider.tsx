
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type Language = "Indonesia" | "English";

type TranslationTree = {
  [key: string]: string | TranslationTree;
};

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (path: string) => string;
};

/* =========================================================
   FINAL LANGUAGE DICTIONARY
   Satu sumber translation untuk seluruh aplikasi SkillMap.
   Dashboard, Progress, Portfolio, Upgrade, dan halaman utama
   memakai provider global ini.
========================================================= */

const translations: Record<Language, TranslationTree> = {
  Indonesia: {
    common: {
      loading: "Memuat...",
      save: "Simpan",
      cancel: "Batal",
      close: "Tutup",
      back: "Kembali",
      continue: "Lanjutkan",
      start: "Mulai",
      finish: "Selesai",
      submit: "Kirim",
      view: "Lihat",
      detail: "Detail",
      edit: "Edit",
      delete: "Hapus",
      search: "Cari",
      yes: "Ya",
      no: "Tidak",
      or: "atau",
      and: "dan",
      free: "Gratis",
      premium: "Premium",
      locked: "Terkunci",
      active: "Aktif",
      completed: "Selesai",
      notAvailable: "Belum tersedia",
      noData: "Belum ada data.",
      error: "Terjadi kesalahan.",
      retry: "Coba Lagi",
      refresh: "Muat Ulang",
      seeMore: "Lihat Selengkapnya",
      seeLess: "Lihat Lebih Sedikit",
    },

    sidebar: {
      dashboard: "Dashboard",
      skillCheck: "Skill Check",
      skillProfile: "Skill Profile",
      skillGap: "Skill Gap",
      roadmap: "Roadmap",
      progress: "Progress & History",
      portfolio: "Portfolio & Experience",
      upgrade: "Tingkatkan Paket",
      settings: "Pengaturan",
      account: "Akun",
      premium: "Premium",
      free: "Free",
    },

    settings: {
      label: "Pengaturan",
      title: "Pengaturan",
      subtitle: "Kelola profil, bahasa, dan keamanan akunmu.",

      profile: {
        title: "Profil Akun",
        description: "Atur informasi dasar dan tampilan profilmu.",
        photo: "Foto Profil",
        photoPreview: "Preview foto profil",
        photoReady: "Foto profil siap digunakan",
        uploadTitle: "Upload Foto Profil",
        uploadDescription:
          "Pilih foto yang ingin digunakan sebagai foto profilmu.",
        choosePhoto: "Pilih Foto",
        changePhoto: "Ganti Foto",
        photoHint: "JPEG, JPG, atau PNG · Maksimal 15 MB",
        name: "Nama",
        namePlaceholder: "Masukkan nama",
        email: "Email",
        emailHint: "Email digunakan sebagai identitas akun.",
      },

      preferences: {
        title: "Preferensi",
        description: "Atur pengalaman penggunaan SkillMap.",
        language: "Bahasa",
        languageHint: "Pilih bahasa yang digunakan di SkillMap.",
      },

      security: {
        title: "Keamanan",
        description: "Kelola keamanan akunmu.",
        password: "Password",
        passwordDescription: "Kelola akses dan keamanan akun.",
        changePassword: "Ubah Password",
      },

      save: "Simpan Perubahan",
      saving: "Menyimpan...",
      saved: "Pengaturan berhasil disimpan.",

      errors: {
        photoSize: "Ukuran foto maksimal 15 MB.",
        photoType: "Format foto harus JPEG, JPG, atau PNG.",
        photoUpload: "Foto gagal diupload. Coba lagi.",
        profileSave: "Profil gagal disimpan.",
        general: "Terjadi kesalahan saat menyimpan pengaturan.",
      },
    },

    dashboard: {
      title: "Dashboard",
      welcome: "Selamat datang kembali",
      subtitle: "Pantau perkembangan kompetensi dan persiapan kariermu.",

      currentCareer: "Target Karier",
      noCareer: "Belum menentukan target karier",

      skillSummary: "Ringkasan Kompetensi",
      averageScore: "Rata-rata Skor",
      completedSkills: "Kompetensi Dinilai",
      needsDevelopment: "Perlu Dikembangkan",

      strongSkills: "Kompetensi Kuat",
      developmentSkills: "Perlu Dikembangkan",
      noStrongSkills: "Belum ada kompetensi kuat yang dapat ditampilkan.",
      noDevelopmentSkills: "Belum ada kompetensi yang perlu dikembangkan.",

      latestAssessment: "Assessment Terakhir",
      assessmentCompleted: "Assessment selesai",
      noAssessment: "Belum ada assessment yang selesai.",

      startSkillCheck: "Mulai Skill Check",
      viewProfile: "Lihat Skill Profile",
      viewSkillGap: "Lihat Skill Gap",
      viewRoadmap: "Lihat Roadmap",

      careerJourney: "Career Journey",
      stepSkillCheck: "Skill Check",
      stepSkillProfile: "Skill Profile",
      stepSkillGap: "Skill Gap",
      stepRoadmap: "Roadmap",

      completedLabel: "Selesai",
      currentLabel: "Saat Ini",
      nextLabel: "Berikutnya",

      loading: "Memuat dashboard...",
      errorTitle: "Dashboard tidak dapat dimuat",
      errorDescription: "Terjadi masalah saat mengambil data dashboard.",
      dataLoadError: "Data dashboard gagal dimuat.",
      loadError: "Gagal memuat dashboard.",
      retry: "Coba Lagi",

      emptyTitle: "Mulai perjalanan kompetensimu",
      emptyDescription:
        "Lakukan Skill Check untuk mengetahui kondisi kompetensimu dan mendapatkan rekomendasi pengembangan.",

      hello: "Halo",
      defaultUser: "Pengguna",

      startHere: "Mulai dari Sini",
      threeSteps: "Tiga langkah untuk mengembangkan kompetensimu",
      stepMeasureTitle: "Ukur",
      stepMeasureDescription: "Ukur kondisi kompetensimu melalui Skill Check.",
      stepGapTitle: "Pahami Prioritas",
      stepGapDescription: "Temukan kompetensi yang paling penting untuk dikembangkan.",
      stepRoadmapTitle: "Bertindak",
      stepRoadmapDescription: "Ubah prioritas menjadi langkah pengembangan yang nyata.",

      premium: "Premium",
      free: "Free",

      competencyScore: "Skor Kompetensi",
      outOf100: "dari 100",
      level: "Level",
      benchmark: "Benchmark",
      skillsMet: "Kompetensi Memenuhi Benchmark",
      skillsBelowBenchmark: "Kompetensi di Bawah Benchmark",

      active: "Aktif",
      lastMapping: "Pemetaan Terakhir",
      targetLabel: "Target",
      assessmentLabel: "Assessment",
      viewResult: "Lihat Hasil",
      measureAgain: "Ukur Lagi",

      skillsMetCount: "kompetensi memenuhi benchmark",
      viewAll: "Lihat Semua",
      otherSkills: "Kompetensi Lain",
      developmentPriority: "Prioritas Pengembangan",
      skillGapAnalysis: "Analisis Skill Gap",
      allSkillsMet: "Semua kompetensi sudah memenuhi benchmark.",
      keepImproving: "Pertahankan dan terus kembangkan kompetensimu.",
      viewFullSkillGap: "Lihat Skill Gap Lengkap",
      findSkillGap: "Temukan Skill Gap",
      skillGapLockedDescription:
        "Lihat kompetensi yang paling penting untuk dikembangkan berdasarkan target kariermu.",

      nextStep: "Langkah Berikutnya",
      continueDevelopment: "Lanjutkan Pengembangan",
      nextStepDescription:
        "Gunakan hasil pemetaan untuk menentukan prioritas dan langkah pengembangan berikutnya.",

      dataBasedOnLatest: "Data berdasarkan hasil Skill Check terakhir.",
      target: "Target",
      score: "Skor",
      gap: "Gap",

      levelStrong: "Sangat Siap",
      levelReady: "Siap",
      levelDeveloping: "Berkembang",
      levelBeginner: "Perlu Penguatan",

      levelDescriptionStrong:
        "Sebagian besar kompetensimu sudah berada pada atau di atas benchmark target karier.",
      levelDescriptionReady:
        "Fondasi kompetensimu sudah cukup kuat untuk mendukung target karier.",
      levelDescriptionDeveloping:
        "Beberapa kompetensi masih membutuhkan pengembangan untuk mendekati target karier.",
      levelDescriptionBeginner:
        "Kompetensimu masih membutuhkan penguatan dasar untuk mendukung target karier.",
    },

    skillCheck: {
      label: "Skill Check",
      title: "Skill Check",
      subtitle:
        "Ukur kompetensimu berdasarkan target karier yang ingin kamu capai.",

      careerJourney: "Career Journey",

      selectedCareer: "Target Karier",
      chooseCareer: "Pilih Target Karier",

      assessment: "Assessment",
      assessmentDescription:
        "Jawab pertanyaan berdasarkan kemampuan dan pengalamanmu.",

      currentMapping: "Pemetaan Kompetensi",
      currentMappingDescription:
        "Hasil assessment akan digunakan untuk memetakan kompetensimu.",

      preparing: "Menyiapkan Skill Check...",
      loading: "Memuat Skill Check...",

      startSkillCheck: "Mulai Skill Check",
      continueSkillCheck: "Lanjutkan Skill Check",
      retakeSkillCheck: "Ukur Lagi",

      startAssessment: "Mulai Assessment",
      continueAssessment: "Lanjutkan Assessment",

      selectCareerFirst:
        "Pilih target karier terlebih dahulu.",

      noCareer:
        "Belum ada target karier yang tersedia.",

      noAssessment:
        "Belum ada assessment untuk target karier ini.",

      question: "Pertanyaan",
      questionOf: "dari",

      nextQuestion: "Pertanyaan Berikutnya",
      previousQuestion: "Pertanyaan Sebelumnya",

      finishAssessment: "Selesaikan Assessment",

      summary: "Ringkasan",
      totalQuestions: "Total Pertanyaan",
      answeredQuestions: "Sudah Dijawab",
      unansweredQuestions: "Belum Dijawab",

      process: "Proses Skill Check",

      processOneTitle: "Pilih Target Karier",
      processOneDescription:
        "Tentukan karier yang ingin kamu jadikan tujuan pengembangan.",

      processTwoTitle: "Kerjakan Assessment",
      processTwoDescription:
        "Jawab pertanyaan berdasarkan kemampuanmu saat ini.",

      processThreeTitle: "Lihat Hasil",
      processThreeDescription:
        "Dapatkan pemetaan kompetensi berdasarkan hasil assessment.",

      successTitle: "Skill Check Selesai",
      successDescription:
        "Hasil kompetensimu berhasil dipetakan.",

      viewResult: "Lihat Hasil",

      errorTitle: "Skill Check tidak dapat dimuat",
      errorDescription:
        "Terjadi masalah saat memuat data Skill Check.",

      result: {
        title: "Hasil Skill Check",
        subtitle: "Lihat hasil pemetaan kompetensimu berdasarkan assessment terakhir.",
        overallScore: "Skor Kompetensi",
        level: "Level Kompetensi",
        benchmarkStatus: "Status Benchmark",
        benchmarkMet: "Benchmark Terpenuhi",
        belowBenchmark: "Di Bawah Benchmark",
        currentAssessment: "Assessment Saat Ini",
        competencyMapping: "Pemetaan Kompetensi",
        currentScore: "Skor Saat Ini",
        benchmark: "Benchmark",
        gap: "Gap",
        status: "Status",
        strong: "Kuat",
        needsDevelopment: "Perlu Dikembangkan",
        viewProfile: "Lihat Skill Profile",
        empty: "Belum ada hasil assessment.",
      },
    },

    skillProfile: {
      label: "Skill Profile",
      title: "Profil Kompetensi",
      subtitle:
        "Pahami gambaran kompetensimu berdasarkan hasil assessment.",

      loading: "Memuat profil kompetensi...",

      noProfile:
        "Belum ada profil kompetensi.",
      noProfileDescription:
        "Lakukan Skill Check terlebih dahulu untuk membentuk profil kompetensimu.",

      overallScore: "Skor Kompetensi",
      averageScore: "Rata-rata Skor",

      competencySignature: "Competency Signature",

      strengthSignature: "Strength Signature",
      strengthSignatureDescription:
        "Kekuatan utama yang paling membentuk profil kompetensimu.",

      noStrengthSignature:
        "Belum ada kekuatan utama yang memenuhi benchmark.",

      developmentPattern: "Development Pattern",
      developmentPatternTitle:
        "Pola Pengembangan",

      developmentPatternDescription:
        "Pola ini menunjukkan area kompetensi yang paling membutuhkan perhatian.",

      developmentAreas: "Area Pengembangan",
      developmentAreasDescription:
        "Kompetensi yang masih berada di bawah benchmark target karier.",

      averageGap: "Rata-rata Gap",
      averageGapDescription:
        "Rata-rata jarak skor kompetensimu terhadap benchmark.",

      currentFocus: "Fokus Saat Ini",
      currentFocusNote:
        "Area ini dapat menjadi perhatian pada tahap pengembangan berikutnya.",

      noDevelopment:
        "Tidak ada area pengembangan utama yang terdeteksi.",

      competencyCharacter: "Karakter Kompetensi",
      characterTitle: "Gambaran Kompetensimu",

      characterAllReady:
        "Kompetensimu sudah relatif siap terhadap target karier.",
      characterStrength:
        "Profilmu menunjukkan beberapa kekuatan kompetensi yang menonjol.",
      characterBalanced:
        "Profilmu cukup seimbang, dengan beberapa area yang masih dapat dikembangkan.",
      characterDeveloping:
        "Profilmu masih berada dalam tahap pengembangan dan membutuhkan penguatan beberapa kompetensi.",

      profileSummaryLabel: "Ringkasan Profil",

      summaryAllReady:
        "Sebagian besar kompetensimu sudah memenuhi benchmark target karier.",
      summaryNeedsFoundation:
        "Profilmu menunjukkan beberapa kompetensi yang masih membutuhkan penguatan dasar.",
      summaryReadyDevelop:
        "Fondasi kompetensimu sudah terbentuk dan beberapa area dapat dikembangkan lebih lanjut.",
      summaryBuilding:
        "Profil kompetensimu sedang berkembang dan masih memiliki beberapa area yang perlu diperkuat.",

      progress: "Progress",
      assessmentHistory: "Riwayat Assessment",
      assessmentHistoryDescription:
        "Lihat perkembangan skor kompetensimu dari assessment ke assessment.",

      measurements: "Pengukuran",
      latestChange: "Perubahan Terakhir",
      scoreImproved: "Skor meningkat",
      scoreDecreased: "Skor menurun",
      scoreSame: "Skor tetap",

      points: "poin",
      current: "Saat Ini",
      score: "Skor",
      benchmarkMet: "Benchmark tercapai",

      userInput: "Input Pengguna",
      userSkills: "Skill yang Kamu Masukkan",
      userSkillsDescription:
        "Skill tambahan yang kamu masukkan berdasarkan pengalaman atau penilaian pribadi.",

      nextStep: "Langkah Berikutnya",
      nextStepTitle:
        "Lanjutkan Pengembangan Kompetensimu",
      nextStepDescription:
        "Gunakan profil ini sebagai dasar untuk menentukan prioritas pengembangan dan langkah berikutnya.",

      measureAgain: "Ukur Kompetensi Lagi",

      strongSkills: "Kompetensi Kuat",
      strongSkillsDescription:
        "Kompetensi yang sudah berada pada atau di atas benchmark.",

      developmentSkills: "Perlu Dikembangkan",
      developmentSkillsDescription:
        "Kompetensi yang masih memiliki gap terhadap benchmark.",

      summary: "Ringkasan Profil",
      summaryDescription:
        "Gambaran umum kondisi kompetensimu saat ini.",

      skillsBySkill: "Kompetensi per Skill",

      strength: "Kekuatan",
      focus: "Fokus",

      scoreLabel: "Skor",
      benchmark: "Benchmark",
      gap: "Gap",
      status: "Status",

      good: "Baik",
      needsDevelopment: "Perlu Dikembangkan",

      noStrongSkills:
        "Belum ada kompetensi yang masuk kategori kuat.",
      noDevelopmentSkills:
        "Belum ada kompetensi yang perlu dikembangkan.",

      careerJourney: "Career Journey",
      targetCareer: "Target Karier",

      errorTitle: "Profil Kompetensi",
      errorDescription:
        "Terjadi masalah saat memuat profil kompetensi.",
    },

    skillGap: {
      errorTitle: "Skill Gap tidak dapat dimuat",
      label: "Skill Gap",
      title: "Skill Gap",
      subtitle:
        "Tentukan kompetensi mana yang paling penting untuk dikembangkan menuju target karier.",

      currentScore: "Skor Saat Ini",
      benchmark: "Benchmark",
      gap: "Gap",
      importance: "Tingkat Kepentingan",
      priority: "Prioritas",

      strong: "Kuat",
      development: "Perlu Dikembangkan",

      skillGapSummary: "Analisis Skill Gap",
      priorityAnalysis: "Analisis Prioritas",
      criticalCompetencies: "Kompetensi Prioritas",
      whyItMatters: "Mengapa Ini Penting",
      developmentPriority:
        "Prioritas Pengembangan",

      benchmarkMet: "Benchmark Terpenuhi",
      critical: "Kritis",
      high: "Tinggi",
      medium: "Sedang",

      nextStepTitle: "Langkah Berikutnya",
      nextStepDescription:
        "Gunakan hasil prioritas ini untuk menentukan tindakan pengembangan berikutnya.",
      viewRoadmap: "Lihat Roadmap",
      footer:
        "Skill Gap membantu menentukan apa yang paling penting untuk dikembangkan sebelum kamu masuk ke tahap tindakan.",

      noGap:
        "Belum ada data Skill Gap. Selesaikan Skill Check terlebih dahulu.",

      premiumTitle:
        "Dapatkan Analisis Skill Gap Lengkap",

      premiumDescription:
        "Upgrade ke Premium untuk melihat prioritas kompetensi berdasarkan gap dan kepentingannya terhadap target karier.",

      upgradeNow: "Tingkatkan ke Premium",

      freePreview: "Preview Skill Gap",
      fullAnalysis: "Analisis Lengkap",

      lockedContent:
        "Konten ini tersedia untuk pengguna Premium.",

      targetCareer: "Target Karier",
    },

    roadmap: {
      label: "Roadmap",
      title: "Personalized Roadmap",
      subtitle:
        "Ubah prioritas pengembangan kompetensi menjadi langkah yang dapat kamu lakukan.",

      loading: "Membuat personalized roadmap...",

      generate: "Buat Personalized Roadmap",
      regenerate: "Buat Ulang Roadmap",

      priority: "Prioritas Pengembangan",
      developmentSteps: "Langkah Pengembangan",
      practiceFocus: "Fokus Praktik",
      nextStep: "Saran Berikutnya",

      noRoadmap:
        "Belum ada personalized roadmap. Selesaikan Skill Check terlebih dahulu.",

      premiumTitle:
        "Dapatkan Personalized Roadmap",

      premiumDescription:
        "Upgrade ke Premium untuk mendapatkan roadmap pengembangan kompetensi yang personal berdasarkan prioritas Skill Gap-mu.",

      upgradeNow: "Tingkatkan ke Premium",

      lockedTitle: "Roadmap Premium",
      lockedDescription:
        "Personalized Roadmap tersedia untuk pengguna Premium.",

      preview: "Preview Roadmap",
      fullRoadmap: "Full Roadmap",

      targetCareer: "Target Karier",

      aiGenerating:
        "AI sedang menganalisis kompetensimu...",
      aiGenerated:
        "Personalized Roadmap berhasil dibuat.",

      aiError:
        "Gagal membuat personalized roadmap. Silakan coba lagi.",
    },

    progress: {
      label: "Progress & History",
      title: "Progress & History",
      subtitle: "Pantau perkembangan kompetensi dan riwayat assessment-mu.",

      progressTitle: "Progress Kompetensi",
      historyTitle: "Riwayat Assessment",

      currentScore: "Skor Saat Ini",
      previousScore: "Skor Sebelumnya",
      improvement: "Perkembangan",

      assessmentDate: "Tanggal Assessment",
      career: "Target Karier",
      score: "Skor",

      noProgress: "Belum ada data perkembangan kompetensi.",
      noHistory: "Belum ada riwayat assessment.",

      viewAssessment: "Lihat Assessment",
      viewProfile: "Lihat Skill Profile",

      assessmentLoadError: "Gagal memuat riwayat assessment.",
      skillLoadError: "Gagal memuat data kompetensi.",
      loadError: "Gagal memuat progress.",
      loading: "Memuat progress...",

      backToSkillCheck: "Kembali ke Skill Check",
      emptyTitle: "Belum ada progress",
      emptyDescription:
        "Lakukan Skill Check terlebih dahulu untuk mulai melihat perkembangan kompetensimu.",
      startSkillCheck: "Mulai Skill Check",

      heading: "Perkembangan Kompetensimu",
      measurements: "Pengukuran",
      measurementUnit: "pengukuran",
      latestMeasurement: "Pengukuran Terakhir",
      assessment: "Assessment",
      averageScore: "Rata-rata Skor",
      benchmarkMet: "Benchmark Tercapai",
      scoreChange: "Perubahan Skor",
      comparedToPrevious: "Dibandingkan pengukuran sebelumnya",

      totalGapChange: "Perubahan Total Gap",
      gapChangeDescription:
        "Perubahan total jarak kompetensi terhadap benchmark.",

      bestDevelopment: "Perkembangan Terbaik",
      increasedBy: "meningkat",
      points: "poin",
      noImprovement: "Belum ada peningkatan",

      development: "Perkembangan",
      firstMeasurementRecorded: "Pengukuran Pertama Tercatat",
      firstMeasurementDescription:
        "Ini menjadi baseline untuk melihat perkembangan kompetensimu pada assessment berikutnya.",

      skillChanges: "Perubahan Kompetensi",
      whatChanged: "Apa yang Berubah?",
      skillComparisonDescription:
        "Bandingkan skor setiap kompetensi dengan pengukuran sebelumnya.",
      currentGap: "Gap Saat Ini",

      insight: "Insight",
      progressRecorded: "Progress Tercatat",
      journeyStartsHere:
        "Perjalanan pengembanganmu dimulai dari pengukuran ini.",
      skill: "Skill",
      improvedBy: "meningkat sebesar",
      comparedToPreviousMeasurement:
        "dibandingkan pengukuran sebelumnya.",
      totalGapReduced: "Total gap berkurang",
      closerToBenchmark: "kamu semakin dekat dengan benchmark.",
      baselineDescription:
        "Belum ada pengukuran sebelumnya untuk dibandingkan.",
      scoreChangedBy: "Skor berubah sebesar",
      developmentAttention:
        "Perhatikan kompetensi yang masih memiliki gap terbesar.",

      history: "Riwayat",
      measurementHistory: "Riwayat Pengukuran",
      historyDescription:
        "Lihat perkembangan skor dari assessment ke assessment.",
      met: "Tercapai",

      noMeasurementHistory: "Belum Ada Riwayat Pengukuran",
      noMeasurementHistoryDescription:
        "Setelah menyelesaikan Skill Check, perkembangan kompetensimu akan tercatat di halaman ini.",
      developmentTitle: "Pengukuran pertama berhasil tercatat",
      developmentDescription:
        "Lakukan Skill Check kembali setelah mengembangkan kompetensi untuk melihat perubahan skor dan skill gap dari waktu ke waktu.",
      perSkillChanges: "Perubahan per Skill",
      insightTitle: "Insight Progress",
      insightContinuedTitle: "Perkembanganmu terus tercatat",
      insightStartedTitle: "Perjalanan kompetensimu dimulai dari sini",
      historyCareerDescription: "Semua hasil Skill Check untuk career ini.",
      improvementInsightPrefix: "Kompetensi",
      improvementInsightText: "mengalami peningkatan sebesar",
      comparedPreviousText: "dibandingkan pengukuran sebelumnya.",
      baselineInsightText:
        "Hasil ini menjadi baseline untuk mengukur perkembangan kompetensimu pada pengukuran berikutnya.",
      declineInsightText: "mengalami perubahan skor sebesar",
      declineInsightAttention:
        "Kompetensi ini dapat menjadi perhatian pada pengembangan berikutnya.",
      nextStep: "Langkah Berikutnya",
      measureAgainCtaTitle: "Sudah berkembang? Ukur kembali.",
      measureAgainCtaDescription:
        "Lakukan Skill Check kembali setelah mengembangkan kompetensi untuk memperbarui profil, skill gap, roadmap, dan progress-mu.",
      measureAgainTitle: "Ukur Lagi untuk Melihat Perkembangan",
      measureAgainDescription:
        "Lakukan assessment berikutnya setelah mengembangkan kompetensi yang menjadi fokusmu.",
      measureAgain: "Ukur Kompetensi Lagi",
      baseline: "Baseline",
      reassessment: "Reassessment",
    },

    portfolio: {
      label: "Portfolio & Experience",
      title: "Portfolio & Experience",
      subtitle:
        "Dokumentasikan pengalaman dan hasil pekerjaan yang mendukung kompetensimu.",

      portfolio: "Portfolio",
      experience: "Experience",

      addPortfolio: "Tambah Portfolio",
      addExperience: "Tambah Experience",

      titleField: "Judul",
      descriptionField: "Deskripsi",
      organization: "Organisasi",
      role: "Peran",
      startDate: "Tanggal Mulai",
      endDate: "Tanggal Selesai",

      noPortfolio:
        "Belum ada portfolio yang ditambahkan.",

      noExperience:
        "Belum ada pengalaman yang ditambahkan.",

      savePortfolio: "Simpan Portfolio",
      saveExperience: "Simpan Experience",

      editPortfolio: "Edit Portfolio",
      editExperience: "Edit Experience",
    },

    upgrade: {
      label: "Tingkatkan Paket",
      title: "Kembangkan kompetensimu lebih terarah",
      subtitle:
        "Tentukan kompetensi yang perlu kamu prioritaskan dan dapatkan rencana pengembangan yang sesuai dengan target kariermu.",

      currentPlan: "Paket Saat Ini",
      freePlan: "Freemium",
      premiumPlan: "Premium",

      price: "Rp49.000 / bulan",
      free: "gratis",
      month: "bulan",

      freeDescription:
        "Untuk mengenali kondisi kompetensi dan melihat perkembanganmu.",

      premiumDescription:
        "Untuk mengubah hasil pemetaan menjadi prioritas dan rencana pengembangan yang jelas.",

      features: "Yang Kamu Dapatkan",
      recommended: "Rekomendasi",

      freeFeatureAssessment:
        "Skill Check hingga 2 assessment",
      freeFeatureProfile: "Skill Profile",
      freeFeatureResult: "Hasil pemetaan kompetensi",
      freeFeatureCareer: "Target karier",
      freeFeatureProgress: "Progress & History",
      freeFeaturePortfolio: "Portfolio & Pengalaman",

      premiumFeatureAssessment:
        "Assessment berkelanjutan setelah batas 2 assessment Free",
      premiumFeatureGap:
        "Analisis Skill Gap berdasarkan target karier",
      premiumFeaturePriority:
        "Prioritas kompetensi yang perlu dikembangkan",
      premiumFeatureRoadmap:
        "AI Roadmap pengembangan personal",

      upgradeButton: "Upgrade ke Premium",

      payment: "Pembayaran",
      paymentDescription:
        "Lanjutkan pembayaran untuk mengaktifkan paket Premium.",

      paymentSuccess:
        "Pembayaran berhasil. Paket Premium sedang diaktifkan.",

      paymentFailed:
        "Pembayaran gagal. Silakan coba lagi.",

      alreadyPremium:
        "Kamu sudah menggunakan paket Premium.",

      securePayment: "Pembayaran diproses secara aman.",
      instantAccess: "Akses Premium setelah pembayaran.",
      paymentNote: "Pembayaran diproses secara aman.",

      premiumActive: "Premium Aktif",
      activeTitle: "Akses pengembanganmu sudah terbuka",
      activeDescription:
        "Kamu dapat melanjutkan assessment, melihat analisis Skill Gap, menentukan prioritas kompetensi, dan menggunakan AI Roadmap untuk pengembanganmu.",
    },
  },

  English: {
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      back: "Back",
      continue: "Continue",
      start: "Start",
      finish: "Finish",
      submit: "Submit",
      view: "View",
      detail: "Detail",
      edit: "Edit",
      delete: "Delete",
      search: "Search",
      yes: "Yes",
      no: "No",
      or: "or",
      and: "and",
      free: "Free",
      premium: "Premium",
      locked: "Locked",
      active: "Active",
      completed: "Completed",
      notAvailable: "Not available yet",
      noData: "No data yet.",
      error: "Something went wrong.",
      retry: "Try Again",
      refresh: "Refresh",
      seeMore: "See More",
      seeLess: "See Less",
    },

    sidebar: {
      dashboard: "Dashboard",
      skillCheck: "Skill Check",
      skillProfile: "Skill Profile",
      skillGap: "Skill Gap",
      roadmap: "Roadmap",
      progress: "Progress & History",
      portfolio: "Portfolio & Experience",
      upgrade: "Upgrade Plan",
      settings: "Settings",
      account: "Account",
      premium: "Premium",
      free: "Free",
    },

    settings: {
      label: "Settings",
      title: "Settings",
      subtitle:
        "Manage your profile, language, and account security.",

      profile: {
        title: "Account Profile",
        description:
          "Manage your basic information and profile appearance.",
        photo: "Profile Photo",
        photoPreview: "Profile photo preview",
        photoReady: "Profile photo ready",
        uploadTitle: "Upload Profile Photo",
        uploadDescription:
          "Choose a photo to use as your profile picture.",
        choosePhoto: "Choose Photo",
        changePhoto: "Change Photo",
        photoHint: "JPEG, JPG, or PNG · Maximum 15 MB",
        name: "Name",
        namePlaceholder: "Enter your name",
        email: "Email",
        emailHint:
          "Your email is used as your account identity.",
      },

      preferences: {
        title: "Preferences",
        description:
          "Customize your SkillMap experience.",
        language: "Language",
        languageHint:
          "Choose the language used throughout SkillMap.",
      },

      security: {
        title: "Security",
        description:
          "Manage your account security.",
        password: "Password",
        passwordDescription:
          "Manage your account access and security.",
        changePassword: "Change Password",
      },

      save: "Save Changes",
      saving: "Saving...",
      saved: "Settings saved successfully.",

      errors: {
        photoSize:
          "Photo size must not exceed 15 MB.",
        photoType:
          "Photo format must be JPEG, JPG, or PNG.",
        photoUpload:
          "Failed to upload photo. Please try again.",
        profileSave:
          "Failed to save profile.",
        general:
          "Something went wrong while saving settings.",
      },
    },

    dashboard: {
      title: "Dashboard",
      welcome: "Welcome back",
      subtitle: "Monitor your competency development and career preparation.",

      currentCareer: "Target Career",
      noCareer: "No target career selected yet",

      skillSummary: "Competency Summary",
      averageScore: "Average Score",
      completedSkills: "Assessed Competencies",
      needsDevelopment: "Needs Development",

      strongSkills: "Strong Competencies",
      developmentSkills: "Needs Development",
      noStrongSkills: "There are no strong competencies to display yet.",
      noDevelopmentSkills: "There are no competencies requiring development.",

      latestAssessment: "Latest Assessment",
      assessmentCompleted: "Assessment completed",
      noAssessment: "No completed assessment yet.",

      startSkillCheck: "Start Skill Check",
      viewProfile: "View Skill Profile",
      viewSkillGap: "View Skill Gap",
      viewRoadmap: "View Roadmap",

      careerJourney: "Career Journey",
      stepSkillCheck: "Skill Check",
      stepSkillProfile: "Skill Profile",
      stepSkillGap: "Skill Gap",
      stepRoadmap: "Roadmap",

      completedLabel: "Completed",
      currentLabel: "Current",
      nextLabel: "Next",

      loading: "Loading dashboard...",
      errorTitle: "Unable to load dashboard",
      errorDescription: "There was a problem loading your dashboard data.",
      dataLoadError: "Dashboard data could not be loaded.",
      loadError: "Failed to load dashboard.",
      retry: "Try Again",

      emptyTitle: "Start your competency journey",
      emptyDescription:
        "Take the Skill Check to understand your competencies and get development recommendations.",

      hello: "Hello",
      defaultUser: "User",

      startHere: "Start Here",
      threeSteps: "Three steps to develop your competencies",
      stepMeasureTitle: "Measure",
      stepMeasureDescription: "Measure your current competencies through Skill Check.",
      stepGapTitle: "Understand Priorities",
      stepGapDescription: "Find the competencies that matter most to develop.",
      stepRoadmapTitle: "Act",
      stepRoadmapDescription: "Turn priorities into concrete development steps.",

      premium: "Premium",
      free: "Free",

      competencyScore: "Competency Score",
      outOf100: "out of 100",
      level: "Level",
      benchmark: "Benchmark",
      skillsMet: "Competencies Meeting Benchmark",
      skillsBelowBenchmark: "Competencies Below Benchmark",

      active: "Active",
      lastMapping: "Latest Mapping",
      targetLabel: "Target",
      assessmentLabel: "Assessment",
      viewResult: "View Results",
      measureAgain: "Measure Again",

      skillsMetCount: "competencies meet the benchmark",
      viewAll: "View All",
      otherSkills: "Other Competencies",
      developmentPriority: "Development Priority",
      skillGapAnalysis: "Skill Gap Analysis",
      allSkillsMet: "All competencies meet the benchmark.",
      keepImproving: "Keep developing and strengthening your competencies.",
      viewFullSkillGap: "View Full Skill Gap",
      findSkillGap: "Find Your Skill Gap",
      skillGapLockedDescription:
        "See which competencies matter most to develop based on your target career.",

      nextStep: "Next Step",
      continueDevelopment: "Continue Development",
      nextStepDescription:
        "Use your mapping results to determine your next development priorities and actions.",

      dataBasedOnLatest: "Data based on your latest Skill Check result.",
      target: "Target",
      score: "Score",
      gap: "Gap",

      levelStrong: "Highly Ready",
      levelReady: "Ready",
      levelDeveloping: "Developing",
      levelBeginner: "Needs Foundation",

      levelDescriptionStrong:
        "Most of your competencies meet or exceed the target career benchmark.",
      levelDescriptionReady:
        "Your competency foundation is strong enough to support your target career.",
      levelDescriptionDeveloping:
        "Several competencies still need development to move closer to your target career.",
      levelDescriptionBeginner:
        "Your competencies still need foundational strengthening to support your target career.",
    },

    skillCheck: {
      label: "Skill Check",
      title: "Skill Check",
      subtitle:
        "Measure your competencies based on your target career.",

      careerJourney: "Career Journey",

      selectedCareer: "Target Career",
      chooseCareer: "Choose Target Career",

      assessment: "Assessment",
      assessmentDescription:
        "Answer questions based on your current skills and experience.",

      currentMapping: "Competency Mapping",
      currentMappingDescription:
        "Your assessment results will be used to map your competencies.",

      preparing: "Preparing Skill Check...",
      loading: "Loading Skill Check...",

      startSkillCheck: "Start Skill Check",
      continueSkillCheck:
        "Continue Skill Check",
      retakeSkillCheck: "Retake Skill Check",

      startAssessment: "Start Assessment",
      continueAssessment:
        "Continue Assessment",

      selectCareerFirst:
        "Please choose a target career first.",

      noCareer:
        "No target career is available yet.",

      noAssessment:
        "No assessment is available for this career.",

      question: "Question",
      questionOf: "of",

      nextQuestion: "Next Question",
      previousQuestion: "Previous Question",

      finishAssessment:
        "Finish Assessment",

      summary: "Summary",
      totalQuestions: "Total Questions",
      answeredQuestions: "Answered",
      unansweredQuestions: "Unanswered",

      process: "Skill Check Process",

      processOneTitle:
        "Choose Target Career",
      processOneDescription:
        "Choose the career you want to use as your development target.",

      processTwoTitle:
        "Take the Assessment",
      processTwoDescription:
        "Answer questions based on your current abilities.",

      processThreeTitle:
        "View Results",
      processThreeDescription:
        "Get your competency mapping based on your assessment results.",

      successTitle:
        "Skill Check Completed",
      successDescription:
        "Your competencies have been successfully mapped.",

      viewResult: "View Results",

      errorTitle:
        "Unable to load Skill Check",
      errorDescription:
        "There was a problem loading Skill Check data.",

      result: {
        title: "Skill Check Results",
        subtitle: "View your competency mapping based on the latest assessment.",
        overallScore: "Competency Score",
        level: "Competency Level",
        benchmarkStatus: "Benchmark Status",
        benchmarkMet: "Benchmark Met",
        belowBenchmark: "Below Benchmark",
        currentAssessment: "Current Assessment",
        competencyMapping: "Competency Mapping",
        currentScore: "Current Score",
        benchmark: "Benchmark",
        gap: "Gap",
        status: "Status",
        strong: "Strong",
        needsDevelopment: "Needs Development",
        viewProfile: "View Skill Profile",
        empty: "No assessment results yet.",
      },
    },

    skillProfile: {
      label: "Skill Profile",
      title: "Competency Profile",
      subtitle:
        "Understand your competency overview based on your assessment results.",

      loading:
        "Loading competency profile...",

      noProfile:
        "No competency profile yet.",
      noProfileDescription:
        "Complete the Skill Check first to build your competency profile.",

      overallScore: "Competency Score",
      averageScore: "Average Score",

      competencySignature:
        "Competency Signature",

      strengthSignature:
        "Strength Signature",
      strengthSignatureDescription:
        "The main strengths that shape your competency profile.",

      noStrengthSignature:
        "No main strengths currently meet the benchmark.",

      developmentPattern:
        "Development Pattern",
      developmentPatternTitle:
        "Development Pattern",

      developmentPatternDescription:
        "This pattern shows the competency areas that need the most attention.",

      developmentAreas:
        "Development Areas",
      developmentAreasDescription:
        "Competencies that are currently below the target career benchmark.",

      averageGap: "Average Gap",
      averageGapDescription:
        "The average distance between your competency scores and the benchmark.",

      currentFocus: "Current Focus",
      currentFocusNote:
        "This area can become a focus during your next development stage.",

      noDevelopment:
        "No major development area was detected.",

      competencyCharacter:
        "Competency Character",
      characterTitle:
        "Your Competency Overview",

      characterAllReady:
        "Your competencies are relatively ready for the target career.",
      characterStrength:
        "Your profile shows several notable competency strengths.",
      characterBalanced:
        "Your profile is fairly balanced, with several areas that can still be developed.",
      characterDeveloping:
        "Your profile is still developing and requires strengthening in several competencies.",

      profileSummaryLabel:
        "Profile Summary",

      summaryAllReady:
        "Most of your competencies meet the target career benchmark.",
      summaryNeedsFoundation:
        "Your profile shows several competencies that still need foundational strengthening.",
      summaryReadyDevelop:
        "Your competency foundation is established and several areas can be developed further.",
      summaryBuilding:
        "Your competency profile is developing and still has several areas that need strengthening.",

      progress: "Progress",
      assessmentHistory:
        "Assessment History",
      assessmentHistoryDescription:
        "Track how your competency scores change from one assessment to another.",

      measurements: "Measurements",
      latestChange: "Latest Change",
      scoreImproved: "Score improved",
      scoreDecreased: "Score decreased",
      scoreSame: "Score unchanged",

      points: "points",
      current: "Current",
      score: "Score",
      benchmarkMet: "Benchmark met",

      userInput: "User Input",
      userSkills: "Skills You Added",
      userSkillsDescription:
        "Additional skills you entered based on your experience or self-assessment.",

      nextStep: "Next Step",
      nextStepTitle:
        "Continue Developing Your Competencies",
      nextStepDescription:
        "Use this profile as a foundation for deciding your development priorities and next actions.",

      measureAgain:
        "Measure Competencies Again",

      strongSkills:
        "Strong Competencies",
      strongSkillsDescription:
        "Competencies that meet or exceed the benchmark.",

      developmentSkills:
        "Needs Development",
      developmentSkillsDescription:
        "Competencies that still have a gap against the benchmark.",

      summary: "Profile Summary",
      summaryDescription:
        "An overview of your current competency profile.",

      skillsBySkill:
        "Competencies by Skill",

      strength: "Strength",
      focus: "Focus",

      scoreLabel: "Score",
      benchmark: "Benchmark",
      gap: "Gap",
      status: "Status",

      good: "Good",
      needsDevelopment:
        "Needs Development",

      noStrongSkills:
        "No strong competencies yet.",
      noDevelopmentSkills:
        "No competencies requiring development yet.",

      careerJourney: "Career Journey",
      targetCareer: "Target Career",

      errorTitle:
        "Competency Profile",
      errorDescription:
        "There was a problem loading your competency profile.",
    },

    skillGap: {
      errorTitle: "Skill Gap could not be loaded",
      label: "Skill Gap",
      title: "Skill Gap",
      subtitle:
        "Determine which competencies matter most to develop toward your target career.",

      currentScore: "Current Score",
      benchmark: "Benchmark",
      gap: "Gap",
      importance: "Importance",
      priority: "Priority",

      strong: "Strong",
      development: "Needs Development",

      skillGapSummary:
        "Skill Gap Analysis",
      priorityAnalysis:
        "Priority Analysis",
      criticalCompetencies:
        "Priority Competencies",
      whyItMatters:
        "Why It Matters",
      developmentPriority:
        "Development Priority",

      benchmarkMet: "Benchmark Met",
      critical: "Critical",
      high: "High",
      medium: "Medium",

      nextStepTitle: "Next Step",
      nextStepDescription:
        "Use these priorities to determine your next development actions.",
      viewRoadmap: "View Roadmap",
      footer:
        "Skill Gap helps determine what matters most to develop before moving into action.",

      noGap:
        "No Skill Gap data yet. Complete the Skill Check first.",

      premiumTitle:
        "Get Full Skill Gap Analysis",

      premiumDescription:
        "Upgrade to Premium to see competency priorities based on gaps and their importance to your target career.",

      upgradeNow:
        "Upgrade to Premium",

      freePreview:
        "Skill Gap Preview",
      fullAnalysis:
        "Full Analysis",

      lockedContent:
        "This content is available for Premium users.",

      targetCareer:
        "Target Career",
    },

    roadmap: {
      label: "Roadmap",
      title: "Personalized Roadmap",
      subtitle:
        "Turn your competency development priorities into actionable steps.",

      loading:
        "Creating personalized roadmap...",

      generate:
        "Create Personalized Roadmap",
      regenerate:
        "Regenerate Roadmap",

      priority:
        "Development Priorities",
      developmentSteps:
        "Development Steps",
      practiceFocus:
        "Practice Focus",
      nextStep:
        "Next Recommendation",

      noRoadmap:
        "No personalized roadmap yet. Complete the Skill Check first.",

      premiumTitle:
        "Get a Personalized Roadmap",

      premiumDescription:
        "Upgrade to Premium to get a personalized competency development roadmap based on your Skill Gap priorities.",

      upgradeNow:
        "Upgrade to Premium",

      lockedTitle:
        "Premium Roadmap",
      lockedDescription:
        "Personalized Roadmap is available for Premium users.",

      preview:
        "Roadmap Preview",
      fullRoadmap:
        "Full Roadmap",

      targetCareer:
        "Target Career",

      aiGenerating:
        "AI is analyzing your competencies...",
      aiGenerated:
        "Personalized Roadmap created successfully.",

      aiError:
        "Failed to create personalized roadmap. Please try again.",
    },

    progress: {
      label: "Progress & History",
      title: "Progress & History",
      subtitle: "Track your competency development and assessment history.",

      progressTitle: "Competency Progress",
      historyTitle: "Assessment History",

      currentScore: "Current Score",
      previousScore: "Previous Score",
      improvement: "Development",

      assessmentDate: "Assessment Date",
      career: "Target Career",
      score: "Score",

      noProgress: "No competency progress data yet.",
      noHistory: "No assessment history yet.",

      viewAssessment: "View Assessment",
      viewProfile: "View Skill Profile",

      assessmentLoadError: "Failed to load assessment history.",
      skillLoadError: "Failed to load competency data.",
      loadError: "Failed to load progress.",
      loading: "Loading progress...",

      backToSkillCheck: "Back to Skill Check",
      emptyTitle: "No progress yet",
      emptyDescription:
        "Complete the Skill Check first to start tracking your competency development.",
      startSkillCheck: "Start Skill Check",

      heading: "Your Competency Development",
      measurements: "Measurements",
      measurementUnit: "measurements",
      latestMeasurement: "Latest Measurement",
      assessment: "Assessment",
      averageScore: "Average Score",
      benchmarkMet: "Benchmark Met",
      scoreChange: "Score Change",
      comparedToPrevious: "Compared with the previous measurement",

      totalGapChange: "Total Gap Change",
      gapChangeDescription:
        "Change in the total distance between your competencies and the benchmark.",

      bestDevelopment: "Best Development",
      increasedBy: "increased by",
      points: "points",
      noImprovement: "No improvement yet",

      development: "Development",
      firstMeasurementRecorded: "First Measurement Recorded",
      firstMeasurementDescription:
        "This becomes your baseline for tracking competency development in future assessments.",

      skillChanges: "Competency Changes",
      whatChanged: "What Changed?",
      skillComparisonDescription:
        "Compare each competency score with the previous measurement.",
      currentGap: "Current Gap",

      insight: "Insight",
      progressRecorded: "Progress Recorded",
      journeyStartsHere:
        "Your development journey starts with this measurement.",
      skill: "Skill",
      improvedBy: "increased by",
      comparedToPreviousMeasurement:
        "compared with the previous measurement.",
      totalGapReduced: "Total gap reduced",
      closerToBenchmark: "you are getting closer to the benchmark.",
      baselineDescription:
        "There is no previous measurement to compare against.",
      scoreChangedBy: "Score changed by",
      developmentAttention:
        "Pay attention to competencies with the largest remaining gaps.",

      history: "History",
      measurementHistory: "Measurement History",
      historyDescription:
        "Track how your scores change from one assessment to another.",
      met: "Met",

      noMeasurementHistory: "No Measurement History Yet",
      noMeasurementHistoryDescription:
        "After completing the Skill Check, your competency development will be recorded on this page.",
      developmentTitle: "First Measurement Recorded",
      developmentDescription:
        "Take the Skill Check again after developing your competencies to see how your scores and skill gaps change over time.",
      perSkillChanges: "Changes per Skill",
      insightTitle: "Progress Insight",
      insightContinuedTitle: "Your development continues to be tracked",
      insightStartedTitle: "Your competency journey starts here",
      historyCareerDescription: "All Skill Check results for this career.",
      improvementInsightPrefix: "Competency",
      improvementInsightText: "improved by",
      comparedPreviousText: "compared with the previous measurement.",
      baselineInsightText:
        "This result becomes the baseline for tracking your competency development in future measurements.",
      declineInsightText: "changed by",
      declineInsightAttention:
        "This competency can become a focus for your next development cycle.",
      nextStep: "Next Step",
      measureAgainCtaTitle: "Ready to measure again?",
      measureAgainCtaDescription:
        "Take the Skill Check again after developing your competencies to update your profile, skill gap, roadmap, and progress.",
      measureAgainTitle: "Measure Again to Track Your Progress",
      measureAgainDescription:
        "Take your next assessment after developing the competencies you are focusing on.",
      measureAgain: "Measure Competencies Again",
      baseline: "Baseline",
      reassessment: "Reassessment",
    },

    portfolio: {
      label: "Portfolio & Experience",
      title: "Portfolio & Experience",
      subtitle:
        "Document your experiences and work that support your competencies.",

      portfolio: "Portfolio",
      experience: "Experience",
      evidence: "Competency Evidence",
      evidenceDescription:
        "Store projects, experiences, learning, and certifications that provide context for your competencies.",
      evidenceInfoTitle: "Evidence provides useful context",
      evidenceInfoDescription:
        "Projects and experiences you add do not automatically increase your Skill Check score. They are used as evidence and context to understand your competencies.",

      project: "Projects & Work",
      experienceGroup: "Relevant Experience",
      learning: "Learning & Certifications",
      projectUpper: "PROJECT",
      experienceUpper: "EXPERIENCE",
      learningUpper: "LEARNING",
      groupProjectDescription: "Projects you have worked on.",
      groupExperienceDescription:
        "Relevant organization, work, internship, or other experience.",
      groupLearningDescription:
        "Learning, courses, training, or certifications.",

      add: "Add",
      addPortfolio: "Add Portfolio",
      addExperience: "Add Experience",
      empty: "No data has been added yet.",
      edit: "Edit",
      delete: "Delete",
      viewLink: "View link →",
      viewFile: "View file →",

      editEvidence: "Edit Competency Evidence",
      addEvidence: "Add Competency Evidence",
      type: "Type",
      projectOption: "Project",
      experienceOption: "Experience",
      learningOption: "Learning/Certification",
      relatedSkill: "Related Skill",
      optional: "optional",
      noSpecificSkill: "Not linked to a specific skill",
      titleField: "Title",
      titlePlaceholder: "Example: SME Dashboard",
      descriptionField: "Description",
      descriptionPlaceholder:
        "Describe your contribution, tasks, or results.",
      evidenceDate: "Evidence Date",
      externalLink: "External Link",
      fileLink: "File Link",
      cancel: "Cancel",
      saving: "Saving...",
      save: "Save",
      saveChanges: "Save Changes",

      userNotFound: "User not found.",
      titleRequired: "Title is required.",
      loadError: "Failed to load portfolio data.",
      saveError: "Failed to save data.",
      updateError: "Failed to update data.",
      deleteError: "Failed to delete data.",
      saved: "Competency evidence saved successfully.",
      updated: "Competency evidence updated successfully.",
      deleted: "Competency evidence deleted successfully.",
      deleteConfirm: "Delete",
      deleteConfirmSuffix: "?",

      noPortfolio: "No portfolio items added yet.",
      noExperience: "No experience added yet.",
      savePortfolio: "Save Portfolio",
      saveExperience: "Save Experience",
      editPortfolio: "Edit Portfolio",
      editExperience: "Edit Experience",
      organization: "Organization",
      role: "Role",
      startDate: "Start Date",
      endDate: "End Date",
    },

    upgrade: {
      label: "Upgrade Plan",
      title: "Develop Your Competencies with Clearer Direction",
      subtitle:
        "Identify the competencies that matter most and get a development plan aligned with your career target.",

      currentPlan: "Current Plan",
      freePlan: "Free",
      premiumPlan: "Premium",

      price: "Rp49,000 / month",
      free: "free",
      month: "month",

      freeDescription:
        "For understanding your competency profile and tracking your progress.",

      premiumDescription:
        "For turning your competency results into clear priorities and a focused development plan.",

      features: "What You Get",
      recommended: "Recommended",

      freeFeatureAssessment:
        "Up to 2 Skill Check assessments",
      freeFeatureProfile: "Skill Profile",
      freeFeatureResult: "Competency mapping results",
      freeFeatureCareer: "Career target",
      freeFeatureProgress: "Progress & History",
      freeFeaturePortfolio: "Portfolio & Experience",

      premiumFeatureAssessment:
        "Ongoing assessments beyond the 2-assessment Free limit",
      premiumFeatureGap:
        "Skill Gap analysis based on your career target",
      premiumFeaturePriority:
        "Priority ranking for competencies to develop",
      premiumFeatureRoadmap:
        "Personalized AI development roadmap",

      upgradeButton: "Upgrade to Premium",

      payment: "Payment",
      paymentDescription:
        "Continue to payment to activate your Premium plan.",

      paymentSuccess:
        "Payment successful. Your Premium plan is being activated.",

      paymentFailed:
        "Payment failed. Please try again.",

      alreadyPremium:
        "You are already using the Premium plan.",

      securePayment: "Secure payment.",
      instantAccess: "Premium access after payment.",
      paymentNote: "Payments are processed securely.",

      premiumActive: "Premium Active",
      activeTitle: "Your development access is unlocked",
      activeDescription:
        "You can continue taking assessments, review Skill Gap analysis, prioritize competencies, and use the AI Roadmap for your development.",
    },
  },
};

const LanguageContext =
  createContext<LanguageContextType | null>(null);

function getNestedValue(
  object: TranslationTree,
  path: string
): string | null {
  const result = path
    .split(".")
    .reduce<unknown>((current, key) => {
      if (
        current &&
        typeof current === "object" &&
        key in current
      ) {
        return (
          current as Record<string, unknown>
        )[key];
      }

      return undefined;
    }, object);

  return typeof result === "string"
    ? result
    : null;
}

/* =========================================================
   SAFE FALLBACK FOR NEW UI KEYS
   Kalau halaman baru memakai key yang belum ada di dictionary,
   UI tidak akan lagi menampilkan "roadmap.someKey".
========================================================= */

const missingKeyFallbacks: Record<
  Language,
  Record<string, string>
> = {
  Indonesia: {
    "roadmap.priorityFoundation": "Prioritas Fondasi",
    "roadmap.priorityFoundationTitle": "Perkuat Fondasi Kompetensi",
    "roadmap.priorityFoundationDescription": "Fokus pada kompetensi dasar yang paling penting untuk mendukung target kariermu.",
    "roadmap.priorityGrowth": "Prioritas Pengembangan",
    "roadmap.priorityGrowthTitle": "Kembangkan Kompetensi Prioritas",
    "roadmap.priorityGrowthDescription": "Kembangkan kompetensi yang memiliki gap dan berdampak besar terhadap kesiapan kariermu.",
    "roadmap.priorityAction": "Prioritas Aksi",
    "roadmap.priorityActionTitle": "Mulai dari Langkah yang Paling Berdampak",
    "roadmap.priorityActionDescription": "Gunakan rekomendasi roadmap untuk mengubah hasil analisis menjadi tindakan nyata.",
    "roadmap.priorityAnalysis": "Analisis Prioritas",
    "roadmap.priorityAnalysisTitle": "Urutan Prioritas Pengembangan",
    "roadmap.priorityAnalysisDescription": "Prioritas ditentukan dari gap kompetensi dan kebutuhan terhadap target karier.",
    "roadmap.nextAction": "Langkah Berikutnya",
    "roadmap.nextActionTitle": "Mulai Pengembanganmu",
    "roadmap.nextActionDescription": "Pilih langkah yang paling relevan dan mulai membangun kompetensi secara bertahap.",
    "roadmap.developmentFocus": "Fokus Pengembangan",
    "roadmap.developmentFocusTitle": "Kompetensi yang Perlu Diperkuat",
    "roadmap.developmentFocusDescription": "Fokuskan waktu dan praktik pada kompetensi yang paling membutuhkan pengembangan.",
    "roadmap.noPriority": "Belum ada prioritas pengembangan.",
    "roadmap.noPriorityDescription": "Selesaikan Skill Check untuk mendapatkan prioritas kompetensi.",
    "roadmap.aiTitle": "Personalized Roadmap dengan AI",
    "roadmap.aiDescription": "AI menyusun langkah pengembangan berdasarkan hasil Skill Check dan prioritas kompetensimu.",
    "roadmap.aiGenerate": "Buat Roadmap dengan AI",
    "roadmap.aiRegenerate": "Buat Ulang Roadmap AI",
    "roadmap.aiLoading": "AI sedang menyusun roadmap personalmu...",
    "roadmap.aiSuccess": "Personalized Roadmap berhasil dibuat.",
    "roadmap.skillFocus": "Fokus Kompetensi",
    "roadmap.skillGap": "Gap Kompetensi",
    "roadmap.currentScore": "Skor Saat Ini",
    "roadmap.benchmark": "Benchmark",
    "roadmap.gap": "Gap",
    "roadmap.steps": "Langkah",
    "roadmap.recommendation": "Rekomendasi",
    "roadmap.goal": "Tujuan Pengembangan",
    "roadmap.closeDetail": "Tutup Detail",
    "roadmap.viewDetail": "Lihat Detail",
    "roadmap.backToSkillGap": "Kembali ke Skill Gap",
    "roadmap.measureAgain": "Ukur Kompetensi Lagi",
    "roadmap.allReady": "Semua kompetensi sudah memenuhi benchmark.",
    "roadmap.noAssessment": "Belum ada hasil Skill Check.",
    "roadmap.noAssessmentDescription": "Selesaikan Skill Check terlebih dahulu untuk mendapatkan roadmap pengembangan.",
    "roadmap.upgradeTitle": "Buka Personalized Roadmap",
    "roadmap.upgradeDescription": "Upgrade ke Premium untuk melihat prioritas dan langkah pengembangan secara lengkap.",
    "roadmap.upgradeNow": "Tingkatkan Paket",
    "roadmap.completed": "Selesai",
    "roadmap.inProgress": "Sedang Berjalan",
    "roadmap.notStarted": "Belum Dimulai",

    "skillGap.errorTitle": "Skill Gap tidak dapat dimuat",
    "skillGap.benchmarkMet": "Benchmark Terpenuhi",
    "skillGap.nextStepTitle": "Langkah Berikutnya",
    "skillGap.nextStepDescription": "Lihat Roadmap untuk mengubah prioritas kompetensi menjadi langkah pengembangan.",
    "skillGap.viewRoadmap": "Lihat Roadmap",
    "skillGap.footer": "Data berdasarkan hasil Skill Check terakhir.",
    "skillGap.critical": "Kritis",
    "skillGap.high": "Tinggi",
    "skillGap.medium": "Sedang",
  },
  English: {
    "roadmap.priorityFoundation": "Foundation Priority",
    "roadmap.priorityFoundationTitle": "Strengthen Your Competency Foundation",
    "roadmap.priorityFoundationDescription": "Focus on the core competencies that matter most for your target career.",
    "roadmap.priorityGrowth": "Development Priority",
    "roadmap.priorityGrowthTitle": "Develop Priority Competencies",
    "roadmap.priorityGrowthDescription": "Develop competencies with meaningful gaps and strong impact on career readiness.",
    "roadmap.priorityAction": "Action Priority",
    "roadmap.priorityActionTitle": "Start with the Highest-Impact Step",
    "roadmap.priorityActionDescription": "Use the roadmap recommendations to turn analysis into concrete action.",
    "roadmap.priorityAnalysis": "Priority Analysis",
    "roadmap.priorityAnalysisTitle": "Development Priority Order",
    "roadmap.priorityAnalysisDescription": "Priorities are based on competency gaps and target-career needs.",
    "roadmap.nextAction": "Next Action",
    "roadmap.nextActionTitle": "Start Your Development",
    "roadmap.nextActionDescription": "Choose the most relevant step and build your competency progressively.",
    "roadmap.developmentFocus": "Development Focus",
    "roadmap.developmentFocusTitle": "Competencies to Strengthen",
    "roadmap.developmentFocusDescription": "Focus your time and practice on competencies that need the most development.",
    "roadmap.noPriority": "No development priorities yet.",
    "roadmap.noPriorityDescription": "Complete the Skill Check to get competency priorities.",
    "roadmap.aiTitle": "AI-Powered Personalized Roadmap",
    "roadmap.aiDescription": "AI creates development steps based on your Skill Check results and competency priorities.",
    "roadmap.aiGenerate": "Create AI Roadmap",
    "roadmap.aiRegenerate": "Regenerate AI Roadmap",
    "roadmap.aiLoading": "AI is creating your personalized roadmap...",
    "roadmap.aiSuccess": "Personalized Roadmap created successfully.",
    "roadmap.skillFocus": "Competency Focus",
    "roadmap.skillGap": "Competency Gap",
    "roadmap.currentScore": "Current Score",
    "roadmap.benchmark": "Benchmark",
    "roadmap.gap": "Gap",
    "roadmap.steps": "Steps",
    "roadmap.recommendation": "Recommendation",
    "roadmap.goal": "Development Goal",
    "roadmap.closeDetail": "Close Detail",
    "roadmap.viewDetail": "View Detail",
    "roadmap.backToSkillGap": "Back to Skill Gap",
    "roadmap.measureAgain": "Measure Competencies Again",
    "roadmap.allReady": "All competencies meet the benchmark.",
    "roadmap.noAssessment": "No Skill Check result yet.",
    "roadmap.noAssessmentDescription": "Complete the Skill Check first to get a development roadmap.",
    "roadmap.upgradeTitle": "Unlock Personalized Roadmap",
    "roadmap.upgradeDescription": "Upgrade to Premium to see complete priorities and development steps.",
    "roadmap.upgradeNow": "Upgrade Plan",
    "roadmap.completed": "Completed",
    "roadmap.inProgress": "In Progress",
    "roadmap.notStarted": "Not Started",

    "skillGap.errorTitle": "Unable to load Skill Gap",
    "skillGap.benchmarkMet": "Benchmark Met",
    "skillGap.nextStepTitle": "Next Step",
    "skillGap.nextStepDescription": "Open the Roadmap to turn competency priorities into development steps.",
    "skillGap.viewRoadmap": "View Roadmap",
    "skillGap.footer": "Data based on your latest Skill Check result.",
    "skillGap.critical": "Critical",
    "skillGap.high": "High",
    "skillGap.medium": "Medium",
  },
};

function humanizeMissingKey(
  path: string,
  language: Language
): string {
  const exact = missingKeyFallbacks[language][path];
  if (exact) return exact;

  const key = path.split(".").pop() ?? path;
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>("Indonesia");

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem("skillmap-language");

    if (
      savedLanguage === "Indonesia" ||
      savedLanguage === "English"
    ) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    function handleLanguageChange() {
      const savedLanguage =
        localStorage.getItem(
          "skillmap-language"
        );

      if (
        savedLanguage === "Indonesia" ||
        savedLanguage === "English"
      ) {
        setLanguageState(savedLanguage);
      }
    }

    window.addEventListener(
      "skillmap-language-updated",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "skillmap-language-updated",
        handleLanguageChange
      );
    };
  }, []);

  function setLanguage(
    nextLanguage: Language
  ) {
    setLanguageState(nextLanguage);

    localStorage.setItem(
      "skillmap-language",
      nextLanguage
    );

    window.dispatchEvent(
      new Event("skillmap-language-updated")
    );
  }

  const value =
    useMemo<LanguageContextType>(
      () => ({
        language,
        setLanguage,

        t: (path: string) => {
          const value = getNestedValue(
            translations[language],
            path
          );

          return (
            value ??
            missingKeyFallbacks[language][path] ??
            humanizeMissingKey(path, language)
          );
        },
      }),
      [language]
    );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage harus digunakan di dalam LanguageProvider."
    );
  }

  return context;
}