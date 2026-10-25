export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { career, skills } = body;

    if (!career || !Array.isArray(skills) || skills.length === 0) {
      return Response.json(
        {
          error: "Data kompetensi tidak lengkap.",
        },
        {
          status: 400,
        }
      );
    }

    const skillSummary = skills
      .map(
        (skill: {
          name: string;
          score: number;
          target_score: number;
          gap: number;
          status: string;
        }) =>
          `- ${skill.name}: skor ${skill.score}, target ${skill.target_score}, gap ${skill.gap}, status ${skill.status}`
      )
      .join("\n");

    const prompt = `
Kamu adalah career competency advisor untuk SkillMap.

Analisis hasil Skill Check pengguna berdasarkan career dan data kompetensi yang diberikan.

Berikan feedback dalam Bahasa Indonesia yang natural, jelas, dan personal.

Gunakan format berikut:

Ringkasan
[1 paragraf singkat]

Kekuatan
[1 paragraf singkat mengenai kompetensi yang sudah kuat]

Fokus Pengembangan
[jelaskan skill yang paling perlu dikembangkan dan alasannya]

Saran Berikutnya
1. [saran pertama]
2. [saran kedua]
3. [saran ketiga]

Aturan penting:
- Jangan gunakan Markdown.
- Jangan gunakan simbol **.
- Jangan gunakan tanda #.
- Jangan menggunakan tabel.
- Gunakan judul bagian seperti "Ringkasan", "Kekuatan", "Fokus Pengembangan", dan "Saran Berikutnya".
- Pisahkan setiap bagian dengan baris kosong.
- Jangan memberikan informasi yang tidak didukung oleh data kompetensi pengguna.
- Fokus pada hasil Skill Check yang diberikan.
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
      console.error("OpenRouter error:", data);

      return Response.json(
        {
          error:
            data?.error?.message ||
            "Gagal mendapatkan feedback dari AI.",
        },
        {
          status: response.status,
        }
      );
    }

    const feedback =
      data?.choices?.[0]?.message?.content;

    if (!feedback) {
      return Response.json(
        {
          error: "AI tidak memberikan feedback.",
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      feedback,
    });
  } catch (error) {
    console.error("AI feedback error:", error);

    return Response.json(
      {
        error: "Terjadi kesalahan saat memproses AI feedback.",
      },
      {
        status: 500,
      }
    );
  }
}