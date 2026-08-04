function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

const LANGUAGE_ALIASES = {
  es: "es",
  spanish: "es",
  español: "es",
  espanol: "es",
  en: "en",
  english: "en",
  ingles: "en",
  inglés: "en",
  fr: "fr",
  french: "fr",
  français: "fr",
  francais: "fr",
  ru: "ru",
  russian: "ru",
  ruso: "ru",
  russe: "ru",
  de: "de",
  german: "de",
  aleman: "de",
  alemán: "de",
  it: "it",
  italian: "it",
  italiano: "it",
  pt: "pt",
  portuguese: "pt",
  portugues: "pt",
  português: "pt",
};

const LANGUAGE_NAMES = {
  es: "Spanish",
  en: "English",
  fr: "French",
  ru: "Russian",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
};

export function normalizeLanguage(value) {
  const raw = clean(value).toLowerCase();
  if (!raw) return "";
  const base = raw.split(/[-_]/)[0];
  return LANGUAGE_ALIASES[raw] || LANGUAGE_ALIASES[base] || base;
}

function getOutputText(data) {
  return (
    clean(data?.output_text) ||
    clean(data?.output?.flatMap((item) => item.content || []).find((part) => part.type === "output_text")?.text)
  );
}

export async function translateOperatorReply({
  content,
  sourceLanguage = "es",
  targetLanguage,
}) {
  const original = clean(content);
  const source = normalizeLanguage(sourceLanguage) || "es";
  const target = normalizeLanguage(targetLanguage);

  if (!original || !target || source === target) {
    return { content: original, translated: false, sourceLanguage: source, targetLanguage: target };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      content: original,
      translated: false,
      sourceLanguage: source,
      targetLanguage: target,
      reason: "openai_not_configured",
    };
  }

  const sourceName = LANGUAGE_NAMES[source] || source;
  const targetName = LANGUAGE_NAMES[target] || target;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            `Translate the operator reply from ${sourceName} to ${targetName}. ` +
            "Preserve names, phone numbers, prices, URLs, dates, formatting, and tone. " +
            "Return only the translated message. Do not add explanations.",
        },
        { role: "user", content: original },
      ],
      temperature: 0,
      max_output_tokens: 700,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      content: original,
      translated: false,
      sourceLanguage: source,
      targetLanguage: target,
      reason: data?.error?.message || "translation_failed",
    };
  }

  const translatedContent = getOutputText(data);
  return {
    content: translatedContent || original,
    translated: Boolean(translatedContent),
    sourceLanguage: source,
    targetLanguage: target,
  };
}

export async function translateVisitorMessageForOperator({
  content,
  sourceLanguage,
  targetLanguage = "es",
}) {
  const original = clean(content);
  const source = normalizeLanguage(sourceLanguage);
  const target = normalizeLanguage(targetLanguage) || "es";

  if (!original || source === target) {
    return { content: original, translated: false, sourceLanguage: source, targetLanguage: target };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      content: original,
      translated: false,
      sourceLanguage: source,
      targetLanguage: target,
      reason: "openai_not_configured",
    };
  }

  const targetName = LANGUAGE_NAMES[target] || target;
  const sourceInstruction = source
    ? `Translate the visitor message from ${LANGUAGE_NAMES[source] || source} to ${targetName}.`
    : `Detect the visitor message language and translate it to ${targetName}. If it is already ${targetName}, return it unchanged.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            `${sourceInstruction} ` +
            "Preserve names, phone numbers, prices, URLs, dates, formatting, and intent. " +
            "Return only the message for the operator. Do not add explanations.",
        },
        { role: "user", content: original },
      ],
      temperature: 0,
      max_output_tokens: 700,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      content: original,
      translated: false,
      sourceLanguage: source,
      targetLanguage: target,
      reason: data?.error?.message || "translation_failed",
    };
  }

  const translatedContent = getOutputText(data);
  return {
    content: translatedContent || original,
    translated: Boolean(translatedContent && translatedContent !== original),
    sourceLanguage: source,
    targetLanguage: target,
  };
}
