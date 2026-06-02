export const runtime = "nodejs";

const DEFAULT_MODEL = "openai/gpt-oss-20b:fastest";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function json(data, status = 200) {
  return Response.json(data, { status });
}

export async function POST(request) {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return json({ error: "HF_TOKEN is not configured" }, 503);
  }

  const payload = await request.json().catch(() => ({}));
  const transcript = clean(payload.transcript);
  const language = clean(payload.language) || "fr";

  if (!transcript) {
    return json({ error: "Missing transcript" }, 400);
  }

  const model = process.env.HF_DASHBOARD_MODEL || DEFAULT_MODEL;
  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 450,
      messages: [
        {
          role: "system",
          content: `You assist an operator dashboard. Analyze the visitor conversation and return strict JSON only. Use ${language}. Return: summary (string), intent (string), sentiment (positive|neutral|negative), urgency (low|medium|high), tags (array of strings), suggestedReply (string), missingInformation (array of strings).`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json(
      { error: data?.error?.message || data?.error || "Hugging Face request failed" },
      response.status
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    return json({ error: "Hugging Face returned an empty response" }, 502);
  }

  try {
    return json({ analysis: JSON.parse(content), model });
  } catch {
    return json({ analysis: { summary: content }, model });
  }
}
