import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { career, skills } = body;

    if (!career || !Array.isArray(skills)) {
      return NextResponse.json(
        { error: "Data roadmap tidak lengkap." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY belum tersedia." },
        { status: 500 }
      );
    }

    const skillSummary = skills
      .map(
        (skill: {
          name: string;
          score: number;
          target: number;
          gap: number;
          status: string;
        }) =>
          `- ${skill.name}: skor ${skill.score}, benchmark ${skill.target}, gap ${skill.gap}, status ${skill.status}`
      )
      .join("\n");

    const prompt = `
Kamu adalah AI career advisor di platform SkillMap.

Career target:
${career}

Hasil kompetensi pengguna:
${skillSummary}

Buat personalized roadmap pengembangan kompetensi berdasarkan hasil tersebut.

Prioritaskan kompetensi dengan gap terbesar.

Berikan jawaban dalam Bahasa Indonesia yang natural, praktis, dan mudah dipahami.

Gunakan format berikut:

PRIORITAS PENGEMBANGAN
Jelaskan 2 sampai 3 kompetensi yang paling perlu dikembangkan dan alasannya.

LANGKAH PENGEMBANGAN
1. Langkah konkret pertama.
2. Langkah konkret kedua.
3. Langkah konkret ketiga.

FOKUS PRAKTIK
Berikan contoh latihan, aktivitas, atau proyek sederhana yang relevan dengan kompetensi pengguna.

SARAN BERIKUTNYA
Jelaskan langkah yang sebaiknya dilakukan setelah pengguna menjalankan roadmap tersebut.

ATURAN:
- Jangan mengubah skor atau hasil assessment.
- Jangan membuat skill baru yang tidak terdapat dalam data.
- Jangan memberikan rekomendasi lowongan atau perusahaan.
- Fokus pada pengembangan kompetensi.
- Jangan menggunakan tabel.
- Jangan menggunakan Markdown seperti # atau **.
- Gunakan bahasa yang natural dan tidak terlalu panjang.
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter roadmap error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Gagal mendapatkan rekomendasi dari AI.",
        },
        { status: response.status }
      );
    }

    const roadmap =
      data?.choices?.[0]?.message?.content;

    if (!roadmap) {
      return NextResponse.json(
        { error: "AI tidak memberikan roadmap." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      roadmap,
    });
  } catch (error) {
    console.error("AI roadmap error:", error);

    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat membuat personalized roadmap.",
      },
      { status: 500 }
    );
  }
}