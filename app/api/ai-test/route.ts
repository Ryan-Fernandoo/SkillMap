export async function POST() {
  try {
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
              content:
                "Jelaskan apa itu Skill Gap dalam satu kalimat bahasa Indonesia.",
            },
          ],
        }),
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("OpenRouter error:", error);

    return Response.json(
      {
        error: "Gagal menghubungi OpenRouter",
      },
      {
        status: 500,
      }
    );
  }
}