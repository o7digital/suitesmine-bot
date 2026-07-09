import { getClientProfile } from "@/config/clients";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function callOliviaV2(payload) {
  const baseUrl = clean(process.env.OLIVIA_V2_URL).replace(/\/$/, "");
  if (!baseUrl) return null;

  const response = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      clientCode: payload.clientCode || payload.clientId,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Olivia v2 failed with ${response.status}: ${detail}`);
  }

  return response.json();
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAny(value, words) {
  const text = normalize(value);
  return words.some((word) => text.includes(word));
}

function isBookingFlow(message, bookingDraft = {}) {
  const text = normalize(message);
  return (
    bookingDraft.active ||
    /^\s*[123]\s*$/.test(text) ||
    hasAny(message, [
      "reserv",
      "reserva",
      "booking",
      "book",
      "pago",
      "payment",
      "link",
      "confirm",
      "estudio",
      "suite",
    ])
  );
}

function isMultipleRoomRequest(message) {
  const match = normalize(message).match(/\b(\d+)\s*(?:habitaciones?|cuartos?|rooms?|chambres?)\b/);
  return Boolean(match && Number(match[1]) > 1);
}

function isSpecialBookingRequest(payload) {
  const message = normalize(payload?.message);
  const guestMatch = message.match(
    /\b(\d+)\s*(?:personas?|huespedes?|guests?|people|personnes?|voyageurs?)\b/,
  );
  return (
    Boolean(guestMatch && Number(guestMatch[1]) > 4) ||
    isMultipleRoomRequest(payload?.message)
  );
}

function pickRoomType(value, draftRoomType = "") {
  const text = normalize(value);
  if (text.match(/^\s*1\s*$/)) return "Estudio";
  if (text.match(/^\s*2\s*$/)) return "Suite";
  if (text.match(/^\s*3\s*$/)) return "Suite Doble";
  if (hasAny(text, ["suite doble", "double suite", "doble"])) return "Suite Doble";
  if (hasAny(text, ["estudio", "studio"])) return "Estudio";
  if (hasAny(text, ["suite"])) return "Suite";
  return clean(draftRoomType);
}

function valueAfterStep(text, step) {
  const match = text.match(new RegExp(`(?:^|\\s)${step}[.)]?\\s+([\\s\\S]*?)(?=\\s\\d[.)]?\\s+|$)`, "i"));
  return clean(match?.[1] || "").replace(/^[:.-]\s*/, "").replace(/[,. ;\s]+$/, "");
}

function extractBookingDetails({ message, metadata }) {
  const draft = metadata.bookingDraft || {};
  const text = clean(message);
  const normalized = normalize(text);
  const structuredName = valueAfterStep(text, 1);
  const structuredEmail = valueAfterStep(text, 2).match(/[^\s@]+@[^\s@]+\.[^\s@,.;]+/)?.[0] || "";
  const structuredPhone = valueAfterStep(text, 3).match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0] || "";
  const email = structuredEmail || text.match(/[^\s@]+@[^\s@]+\.[^\s@,.;]+/)?.[0] || clean(draft.email);
  const phone = structuredPhone || text.match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0] || clean(draft.phone);
  const roomType = pickRoomType(valueAfterStep(text, 5) || text, draft.roomType);

  let name = clean(draft.name);
  if (!name && structuredName && !structuredName.includes("@")) {
    name = structuredName;
  }
  if (!name && email) {
    const beforeEmail = text.slice(0, text.indexOf(email));
    name = beforeEmail
      .replace(/\b(estudio|studio|suite doble|double suite|suite)\b/gi, "")
      .replace(/\b\d+[.)]?\b/g, "")
      .replace(/[,:;-]+/g, " ")
      .trim();
  }

  const possibleName = text
    .replace(/\b(hola|hello|bonjour|soy|i am|je suis|me llamo|my name is)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (
    !name &&
    !email &&
    !phone &&
    !roomType &&
    /^[\p{L}' -]{2,80}$/u.test(possibleName) &&
    possibleName.split(/\s+/).length <= 4 &&
    !hasAny(possibleName, [
      "busco", "quiero", "necesito", "invertir", "inversion", "informacion",
      "looking", "want", "need", "invest", "information",
      "cherche", "veux", "besoin", "investir", "information",
    ])
  ) {
    name = possibleName;
  }

  return {
    name,
    email,
    phone,
    checkIn: clean(metadata.checkIn) || clean(draft.checkIn),
    checkOut: clean(metadata.checkOut) || clean(draft.checkOut),
    guests: clean(metadata.guests) || clean(draft.guests),
    roomType,
    wantsPayment: hasAny(normalized, ["pago", "payment", "link"]),
  };
}

function bookingReply(language, details, rates) {
  const missing = [];
  if (!details.name) missing.push(language === "en" ? "first and last name" : "nombre y apellido");
  if (!details.email) missing.push(language === "en" ? "email" : "email");
  if (!details.phone) missing.push(language === "en" ? "phone" : "telefono");
  if (!details.checkIn || !details.checkOut) missing.push(language === "en" ? "dates" : "fechas");
  if (!details.guests) missing.push(language === "en" ? "number of guests" : "numero de huespedes");
  if (!details.roomType) missing.push(language === "en" ? "room category" : "categoria de habitacion");

  if (missing.length) {
    const known =
      language === "en"
        ? `I already have: ${[
            details.checkIn && `check-in ${details.checkIn}`,
            details.checkOut && `check-out ${details.checkOut}`,
            details.guests && `${details.guests} guest(s)`,
            details.roomType && details.roomType,
          ]
            .filter(Boolean)
            .join(", ")}.`
        : `Ya tengo: ${[
            details.checkIn && `llegada ${details.checkIn}`,
            details.checkOut && `salida ${details.checkOut}`,
            details.guests && `${details.guests} huesped(es)`,
            details.roomType && details.roomType,
          ]
            .filter(Boolean)
            .join(", ")}.`;

    return language === "en"
      ? `${known}\n\nTo continue the booking, please send: ${missing.join(", ")}.`
      : `${known}\n\nPara continuar la reserva, envieme: ${missing.join(", ")}.`;
  }

  const selected = rates.find((rate) => normalize(rate.roomTypeName) === normalize(details.roomType));
  const bookingUrl = buildCloudbedsBookingUrl({ language, details });
  const priceLine = selected
    ? language === "en"
      ? `Rate: ${selected.roomRateDetailed?.[0]?.rate ?? selected.roomRate} MXN per night, total ${selected.totalRate} MXN.`
      : `Tarifa: ${selected.roomRateDetailed?.[0]?.rate ?? selected.roomRate} MXN por noche, total ${selected.totalRate} MXN.`
    : "";

  if (language === "en") {
    return `Request summary:\n\nName: ${details.name}\nEmail: ${details.email}\nPhone: ${details.phone}\nCheck-in: ${details.checkIn}\nCheck-out: ${details.checkOut}\nGuests: ${details.guests}\nCategory: ${details.roomType}\n${priceLine ? `\n${priceLine}\n` : ""}\nCloudbeds availability link:\n${bookingUrl}\n\nBefore discussing payment, please check live availability and the real rate in Cloudbeds. If Cloudbeds shows availability, you can continue the booking there. Payment and confirmation only apply after availability is validated.`;
  }

  return `Resumen de solicitud:\n\nNombre: ${details.name}\nEmail: ${details.email}\nTelefono: ${details.phone}\nLlegada: ${details.checkIn}\nSalida: ${details.checkOut}\nHuespedes: ${details.guests}\nCategoria: ${details.roomType}\n${priceLine ? `\n${priceLine}\n` : ""}\nLink para revisar disponibilidad Cloudbeds:\n${bookingUrl}\n\nAntes de hablar de pago, revise disponibilidad y tarifa real en Cloudbeds. Si Cloudbeds muestra disponibilidad, puede continuar ahi con la reserva. El pago y la confirmacion solo aplican despues de validar disponibilidad.`;
}

function missingContactFields(details) {
  return [
    !details.name && "name",
    !details.email && "email",
    !details.phone && "phone",
  ].filter(Boolean);
}

function contactFieldLabels(language, missing) {
  const labels = {
    en: { name: "first and last name", email: "email", phone: "phone" },
    fr: { name: "prénom et nom", email: "email", phone: "téléphone" },
    es: { name: "nombre y apellido", email: "email", phone: "teléfono" },
  }[language] || { name: "nombre y apellido", email: "email", phone: "teléfono" };
  return missing.map((field) => labels[field]);
}

function contactQualificationReply(language, client, details, message) {
  const missing = missingContactFields(details);
  if (!missing.length) return "";
  const labels = contactFieldLabels(language, missing).join(", ");
  const leadIn = clean(message)
    ? {
        en: `I can help with ${client.clientName}. To give proper follow-up, please send: ${labels}.`,
        fr: `Je peux vous aider avec ${client.clientName}. Pour assurer le bon suivi, envoyez-moi : ${labels}.`,
        es: `Puedo ayudarle con ${client.clientName}. Para darle seguimiento correctamente, envíeme: ${labels}.`,
      }
    : {
        en: `Hello, I am ${client.roleLabel.en || "Olivia AI"}. Please send ${labels} so I can assist you.`,
        fr: `Bonjour, je suis ${client.roleLabel.fr || "Olivia AI"}. Envoyez-moi ${labels} afin que je puisse vous aider.`,
        es: `Hola, soy ${client.roleLabel.es || "Olivia AI"}. Envíeme ${labels} para poder atenderle.`,
      };
  return (leadIn[language] || leadIn.es);
}

function buildCloudbedsBookingUrl({ language, details }) {
  const base =
    language === "en"
      ? "https://hotels.cloudbeds.com/en/reservation/UeErs0"
      : "https://hotels.cloudbeds.com/es/reservation/UeErs0";
  const url = new URL(base);
  url.searchParams.set("currency", "mxn");
  if (details.checkIn) url.searchParams.set("checkin", details.checkIn);
  if (details.checkOut) url.searchParams.set("checkout", details.checkOut);
  if (details.guests) {
    url.searchParams.set("guests", details.guests);
    url.searchParams.set("adults", details.guests);
  }
  url.searchParams.set("kids", "0");
  return url.toString();
}

async function getCloudbedsRates({ checkIn, checkOut }) {
  const apiKey = process.env.CLOUDBEDS_API_KEY;
  if (!apiKey || !checkIn || !checkOut) return [];

  const apiBase = process.env.CLOUDBEDS_API_BASE || "https://api.cloudbeds.com/api/v1.2";
  const propertyID = process.env.CLOUDBEDS_PROPERTY_ID || "319424";
  const url = new URL(`${apiBase}/getRatePlans`);
  url.searchParams.set("propertyID", propertyID);
  url.searchParams.set("startDate", checkIn);
  url.searchParams.set("endDate", checkOut);
  url.searchParams.set("detailedRates", "true");

  const res = await fetch(url, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const body = await res.json();
  return Array.isArray(body?.data) ? body.data : [];
}

function formatRatesForPrompt(rates) {
  if (!rates.length) return "No live Cloudbeds rates were returned for the selected dates.";
  return rates
    .map((room) => {
      const nightly = room.roomRateDetailed?.[0]?.rate ?? room.roomRate ?? "n/a";
      const total = room.totalRate ?? "n/a";
      return `${room.roomTypeName}: ${room.roomsAvailable} available, nightly ${nightly} MXN, total ${total} MXN`;
    })
    .join("\n");
}

function fallbackReply(language, metadata) {
  if (language === "en") {
    return "I can help with Suites Mine reservations. Please share your first and last name, email, phone, check-in, check-out, number of guests and preferred category: Studio, Suite or Double Suite.";
  }

  if (metadata?.checkIn && metadata?.checkOut) {
    return `Puedo ayudarle con la reserva para ${metadata.checkIn} al ${metadata.checkOut}. Por favor indiqueme nombre y apellido, email, telefono, numero de huespedes y categoria preferida: Estudio, Suite o Suite Doble.`;
  }

  return "Puedo ayudarle con la reserva. Por favor indiqueme nombre y apellido, email, telefono, llegada, salida, numero de huespedes y categoria preferida: Estudio, Suite o Suite Doble.";
}

function genericFallbackReply(language, client) {
  if (language === "en") {
    return `I am ${client.roleLabel.en || "Olivia AI Assistant"}. I can answer questions about ${client.clientName}. Please tell me how I can help.`;
  }
  if (language === "fr") {
    return `Je suis ${client.roleLabel.fr || "Olivia IA Assistante"}. Je peux répondre à vos questions sur ${client.clientName}. Comment puis-je vous aider ?`;
  }
  return `Soy ${client.roleLabel.es || "Olivia IA Asistente"}. Puedo responder sus preguntas sobre ${client.clientName}. ¿Como puedo ayudarle?`;
}

function languageName(language) {
  return (
    {
      en: "English",
      es: "Spanish",
      fr: "French",
      it: "Italian",
    }[language] || "Spanish"
  );
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const requestedLanguage = clean(payload.language) || "es";
    const requestedClientCode = clean(payload.clientCode || payload.clientId) || "default";

    if (requestedClientCode === "suitesmine" && isSpecialBookingRequest(payload)) {
      const replies = {
        en: "For special requests, please contact the hotel directly via WhatsApp or by phone at +52 55 36 66 85 85.",
        fr: "Pour les demandes particulieres, contactez directement l'hotel via WhatsApp ou par telephone au +52 55 36 66 85 85.",
        es: "Para solicitudes especiales, contacte directamente al hotel via WhatsApp o por telefono al +52 55 36 66 85 85.",
      };
      return json({
        reply: replies[requestedLanguage] || replies.es,
        mode: "handoff",
        handoffRecommended: true,
        clientCode: requestedClientCode,
        rates: [],
      });
    }

    try {
      const v2Response = await callOliviaV2(payload);
      if (v2Response) return json(v2Response);
    } catch (error) {
      console.error("[olivia] v2 fallback to legacy route", error);
    }

    const language = clean(payload.language) || "es";
    const clientCode = clean(payload.clientCode || payload.clientId) || "default";
    const client = getClientProfile(clientCode);
    const message = clean(payload.message);
    const metadata = payload.metadata || {};
    const checkIn = clean(metadata.checkIn);
    const checkOut = clean(metadata.checkOut);
    const guests = clean(metadata.guests);
    const bookingDraft = metadata.bookingDraft || {};

    if (!message) return json({ error: "Missing message" }, 400);

    const isSuitesMine = client.clientCode === "suitesmine";
    const rates = isSuitesMine ? await getCloudbedsRates({ checkIn, checkOut }) : [];
    const ratesText = formatRatesForPrompt(rates);
    const bookingDetails = extractBookingDetails({ message, metadata: { ...metadata, checkIn, checkOut, guests } });

    if (isSuitesMine && isBookingFlow(message, bookingDraft)) {
      return json({
        reply: bookingReply(language, bookingDetails, rates),
        mode: "booking",
        rates,
        bookingDraft: { active: true, ...bookingDetails },
      });
    }

    if (!isSuitesMine) {
      const contactReply = contactQualificationReply(language, client, bookingDetails, message);
      if (contactReply) {
        return json({
          reply: contactReply,
          mode: "lead-qualification",
          clientCode: client.clientCode,
          collected: {
            name: bookingDetails.name || null,
            email: bookingDetails.email || null,
            phone: bookingDetails.phone || null,
          },
          missingFields: missingContactFields(bookingDetails),
        });
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return json({
        reply: isSuitesMine
          ? fallbackReply(language, { checkIn, checkOut })
          : genericFallbackReply(language, client),
        mode: "fallback",
        clientCode: client.clientCode,
        rates,
      });
    }

    const system = `
You are ${client.roleLabel[language] || client.roleLabel.en || "Olivia AI Assistant"} for ${client.clientName}.
Respond in ${languageName(language)}.
Use the approved website and FAQ context below. Be concise, helpful, and natural.
Do not invent information that is not present in the approved context.
If dates/guests are already provided in metadata, do not ask for them again.
For every non-hotel client, qualify the visitor as a business lead: keep track of first and last name, email and phone, then collect the minimum project context useful for the client.
${isSuitesMine ? `
If the guest wants to reserve, collect only missing fields:
first and last name, email, phone, check-in, check-out, guests, room category.
Ask for room category, never room number. Valid categories: Estudio/Studio, Suite, Suite Doble/Double Suite.
If all booking fields are present, summarize the request and send the Cloudbeds link only to check live availability and the real rate first.
Do not tell the guest to pay, finalize payment, or expect confirmation until Cloudbeds availability has been validated.
Do not invent a confirmed reservation number, payment status, or payment link.
If the guest asks for a payment link, say the system will generate it after availability validation.
` : ""}

Client context:
${client.knowledge}

Page context provided by the visited site, if any:
${clean(metadata.pageTitle) ? `Title: ${clean(metadata.pageTitle)}` : ""}
${clean(metadata.pageContent).slice(0, 5000)}

${isSuitesMine ? `Live Cloudbeds rates for selected dates:\n${ratesText}` : ""}
`;

    const user = {
      message,
      metadata: {
        checkIn,
        checkOut,
        guests,
        bookingDraft,
        pageUrl: clean(payload.pageUrl),
      },
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(user) },
        ],
        temperature: 0.3,
        max_output_tokens: 450,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return json({
        reply: isSuitesMine
          ? fallbackReply(language, { checkIn, checkOut })
          : genericFallbackReply(language, client),
        mode: "openai-error",
        error: data?.error?.message || "OpenAI error",
        rates,
      });
    }

    const reply =
      data.output_text ||
      data.output?.flatMap((item) => item.content || []).find((part) => part.type === "output_text")?.text ||
      fallbackReply(language, { checkIn, checkOut });

    return json({ reply, mode: "openai", clientCode: client.clientCode, rates });
  } catch (error) {
    return json({ error: error.message || "Unexpected error" }, 500);
  }
}
