import { NextResponse } from "next/server";

type PrioritySkill = {
  name: string;
  score: number;
  target: number;
  gap: number;
  importance: number;
  priorityScore: number;
  priorityLevel: string;
};

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const {
      career,
      priorities,
    } = body as {
      career?: string;
      priorities?: PrioritySkill[];
    };

    if (
      !career ||
      !Array.isArray(priorities)
    ) {
      return NextResponse.json(
        {
          error:
            "Data roadmap tidak lengkap.",
        },
        {
          status: 400,
        }
      );
    }

    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENROUTER_API_KEY belum tersedia.",
        },
        {
          status: 500,
        }
      );
    }

    const prioritySummary =
      priorities
        .map(
          (
            skill,
            index
          ) =>
            `${index + 1}. ${
              skill.name
            }
- skor saat ini: ${skill.score}
- benchmark: ${skill.target}
- gap: ${skill.gap}
- tingkat kepentingan career: ${skill.importance}/5
- priority score: ${Math.round(
              skill.priorityScore
            )}
- level prioritas: ${
              skill.priorityLevel
            }`
        )
        .join("\n\n");

    const prompt = `
Kamu adalah AI career development advisor di platform SkillMap.

Target career:
${career}

Berikut adalah hasil PRIORITAS dari Skill Gap SkillMap:

${prioritySummary}

Tugasmu adalah mengubah prioritas tersebut menjadi personalized development roadmap yang praktis.

PENTING:
- Gunakan urutan prioritas yang diberikan.
- Jangan mengubah priority score.
- Jangan mengubah skor assessment.
- Jangan membuat skill baru.
- Jangan menghilangkan kompetensi prioritas utama.
- Fokus pada pengembangan kompetensi.
- Jangan memberikan rekomendasi lowongan atau perusahaan.
- Jangan membuat roadmap berdasarkan gap terbesar saja.
- Pertimbangkan priority score dan tingkat kepentingan career.
- Jangan menggunakan tabel.
- Jangan menggunakan Markdown heading seperti # atau ##.
- Jangan menggunakan **.
- Gunakan Bahasa Indonesia yang natural.
- Jawaban harus praktis dan tidak terlalu panjang.

Gunakan format berikut:

RINGKASAN PRIORITAS
Jelaskan secara singkat kompetensi mana yang menjadi fokus utama dan mengapa.

ROADMAP PENGEMBANGAN

FASE 1 — FOKUS UTAMA
Jelaskan kompetensi prioritas pertama.
Berikan langkah belajar dan latihan yang konkret.

FASE 2 — PENGUATAN
Jelaskan kompetensi prioritas berikutnya.
Berikan aktivitas atau latihan yang konkret.

FASE 3 — PENERAPAN
Berikan contoh proyek atau praktik yang menggabungkan kompetensi prioritas tersebut.

TARGET TINDAKAN
Berikan 3 sampai 5 tindakan konkret yang dapat dilakukan pengguna dalam beberapa minggu ke depan.

EVALUASI ULANG
Jelaskan kapan pengguna sebaiknya melakukan Skill Check kembali untuk melihat perubahan kompetensinya.

Buat roadmap yang personal, realistis, dan berorientasi tindakan.
`;

    const response =
      await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model:
              "openrouter/free",
            messages: [
              {
                role: "user",
                content:
                  prompt,
              },
            ],
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "OpenRouter roadmap error:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.error
              ?.message ||
            "Gagal mendapatkan rekomendasi dari AI.",
        },
        {
          status:
            response.status,
        }
      );
    }

    const roadmap =
      data?.choices?.[0]
        ?.message?.content;

    if (!roadmap) {
      return NextResponse.json(
        {
          error:
            "AI tidak memberikan roadmap.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      roadmap,
    });
  } catch (error) {
    console.error(
      "AI roadmap error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan saat membuat personalized roadmap.",
      },
      {
        status: 500,
      }
    );
  }
}