import { clients, getClientProfile } from "@/config/clients";
import { resolveRequestClient, serverApprovedMetadata } from "@/lib/client-identity.mjs";
import { findVisitorConversation } from "@/lib/conversations";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Olivia-Widget-Identity",
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

function sanitizeHistory(history) {
  return (Array.isArray(history) ? history : [])
    .filter(
      (item) =>
        (item?.role === "user" || item?.role === "assistant") &&
        clean(item?.content),
    )
    .slice(-12)
    .map((item) => ({ role: item.role, content: clean(item.content).slice(0, 4000) }));
}

async function resolveConversationHistory(payload, clientCode) {
  const supplied = sanitizeHistory(payload.history);
  if (supplied.length || !isDatabaseConfigured()) return supplied;

  const visitorId = clean(payload.visitorId);
  if (!visitorId) return [];

  try {
    const conversation = await findVisitorConversation(clientCode, visitorId);
    const persisted = (conversation?.messages || [])
      .map((item) => ({
        role: item.role === "visitor" ? "user" : ["ai", "operator"].includes(item.role) ? "assistant" : "",
        content: clean(item.content),
      }))
      .filter((item) => item.role && item.content);

    const currentMessage = clean(payload.message);
    const lastMessage = persisted.at(-1);
    if (lastMessage?.role === "user" && lastMessage.content === currentMessage) {
      persisted.pop();
    }
    return sanitizeHistory(persisted);
  } catch (error) {
    console.warn("[olivia] unable to restore conversation history", error);
    return [];
  }
}

async function callOliviaV2(payload) {
  const baseUrl = clean(process.env.OLIVIA_V2_URL).replace(/\/$/, "");
  if (!baseUrl) return null;
  const internalToken = clean(process.env.OLIVIA_INTERNAL_TOKEN);
  if (!internalToken) throw new Error("OLIVIA_INTERNAL_TOKEN is required for Olivia v2");

  const clientCode = payload.clientCode;
  const profile = getClientProfile(clientCode);
  const response = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Olivia-Internal-Token": internalToken,
    },
    body: JSON.stringify({
      ...payload,
      clientCode,
      metadata: serverApprovedMetadata(profile, payload.metadata),
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

function requestsHumanFollowUp(value) {
  return hasAny(value, [
    "hablar con",
    "contactarme",
    "contactenme",
    "llamenme",
    "llamada",
    "cotizacion",
    "presupuesto",
    "asesor",
    "experto",
    "call me",
    "contact me",
    "talk to",
    "speak to",
    "quote",
    "sales rep",
  ]);
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
  const lead = metadata.lead || {};
  const text = clean(message);
  const normalized = normalize(text);
  const structuredName = valueAfterStep(text, 1);
  const structuredEmail = valueAfterStep(text, 2).match(/[^\s@]+@[^\s@]+\.[^\s@,.;]+/)?.[0] || "";
  const structuredPhone = valueAfterStep(text, 3).match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0] || "";
  const leadName = clean(lead.name) || `${clean(lead.firstName)} ${clean(lead.lastName)}`.trim();
  const email = structuredEmail || text.match(/[^\s@]+@[^\s@]+\.[^\s@,.;]+/)?.[0] || clean(draft.email) || clean(lead.email);
  const phone = structuredPhone || text.match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0] || clean(draft.phone) || clean(lead.phone);
  const roomType = pickRoomType(valueAfterStep(text, 5) || text, draft.roomType);

  let name = clean(draft.name) || leadName;
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
  const available = Number(selected?.roomsAvailable);
  const availabilityLine = selected
    ? language === "en"
      ? available > 0
        ? `Live Cloudbeds availability: ${available} ${details.roomType} unit(s) still available for these dates.`
        : `Live Cloudbeds availability: ${details.roomType} is fully booked for these dates.`
      : available > 0
        ? `Disponibilidad Cloudbeds en vivo: quedan ${available} unidad(es) ${details.roomType} para estas fechas.`
        : `Disponibilidad Cloudbeds en vivo: ${details.roomType} esta completo para estas fechas.`
    : language === "en"
      ? "Live Cloudbeds availability: no live availability was returned for this category."
      : "Disponibilidad Cloudbeds en vivo: no se recibio disponibilidad en vivo para esta categoria.";
  const priceLine = selected
    ? language === "en"
      ? `Rate: ${selected.roomRateDetailed?.[0]?.rate ?? selected.roomRate} USD per night, total ${selected.totalRate} USD.`
      : `Tarifa: ${selected.roomRateDetailed?.[0]?.rate ?? selected.roomRate} USD por noche, total ${selected.totalRate} USD.`
    : "";

  if (language === "en") {
    if (selected && available <= 0) {
      return `Request summary:\n\nName: ${details.name}\nEmail: ${details.email}\nPhone: ${details.phone}\nCheck-in: ${details.checkIn}\nCheck-out: ${details.checkOut}\nGuests: ${details.guests}\nCategory: ${details.roomType}\n\n${availabilityLine}\n\nI should not send the payment or booking link for a sold-out category. Please choose another category or different dates.`;
    }
    return `Request summary:\n\nName: ${details.name}\nEmail: ${details.email}\nPhone: ${details.phone}\nCheck-in: ${details.checkIn}\nCheck-out: ${details.checkOut}\nGuests: ${details.guests}\nCategory: ${details.roomType}\n\n${availabilityLine}\n${priceLine ? `\n${priceLine}\n` : ""}\nCloudbeds test booking engine:\n${bookingUrl}\n\nYou can continue the reservation in the Cloudbeds test booking engine. Payment and confirmation happen only inside Cloudbeds.`;
  }

  if (selected && available <= 0) {
    return `Resumen de solicitud:\n\nNombre: ${details.name}\nEmail: ${details.email}\nTelefono: ${details.phone}\nLlegada: ${details.checkIn}\nSalida: ${details.checkOut}\nHuespedes: ${details.guests}\nCategoria: ${details.roomType}\n\n${availabilityLine}\n\nNo debo enviar link de pago ni de reserva para una categoria sin disponibilidad. Por favor elija otra categoria u otras fechas.`;
  }
  return `Resumen de solicitud:\n\nNombre: ${details.name}\nEmail: ${details.email}\nTelefono: ${details.phone}\nLlegada: ${details.checkIn}\nSalida: ${details.checkOut}\nHuespedes: ${details.guests}\nCategoria: ${details.roomType}\n\n${availabilityLine}\n${priceLine ? `\n${priceLine}\n` : ""}\nMotor de reserva Cloudbeds TEST:\n${bookingUrl}\n\nPuede continuar la reserva en el motor de reserva Cloudbeds de prueba. El pago y la confirmacion se hacen solamente dentro de Cloudbeds.`;
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

function leadFormResponse({ language, client, details, message }) {
  const reply =
    {
      en: `Please leave your contact details and request information so a ${client.clientName} expert can follow up.`,
      fr: `Laissez vos coordonnées et les détails de votre demande afin qu'un expert ${client.clientName} puisse assurer le suivi.`,
      es: `Déjenos sus datos de contacto y los detalles de su solicitud para que un experto de ${client.clientName} pueda dar seguimiento.`,
    }[language] ||
    `Déjenos sus datos de contacto y los detalles de su solicitud para que un experto de ${client.clientName} pueda dar seguimiento.`;

  return {
    reply,
    mode: "lead-qualification",
    action: "show_lead_form",
    clientCode: client.clientCode,
    collected: {
      name: details.name || null,
      email: details.email || null,
      phone: details.phone || null,
    },
    missingFields: missingContactFields(details),
    leadForm: {
      fields: ["name", "company", "email", "phone", "details"],
      required: ["name", "email", "phone", "details"],
      detailsRows: 3,
      labels: {
        name: language === "en" ? "Name" : language === "fr" ? "Nom" : "Nombre",
        company: language === "en" ? "Company" : language === "fr" ? "Entreprise" : "Empresa",
        email: "Email",
        phone: language === "en" ? "Phone" : language === "fr" ? "Téléphone" : "Teléfono",
        details:
          language === "en"
            ? "Request info details"
            : language === "fr"
              ? "Détails de la demande"
              : "Detalles de la solicitud",
      },
      initialDetails: clean(message),
    },
  };
}

function isZeviPropertyRequest(message) {
  return hasAny(message, [
    "propiedad", "propiedades", "bienes", "bien", "inmueble", "inmuebles",
    "anuncio", "anuncios", "lista", "listado", "zona esmeralda",
    "renta", "venta", "comprar", "for rent", "for sale",
    "property", "properties", "listing", "listings", "real estate",
  ]);
}

async function fetchZeviProperties() {
  const url = new URL("https://zevicapital-directus-backend-lc-inmobiliaria.up.railway.app/items/properties");
  url.searchParams.set("fields", "id,title,price,price_text,currency,location,address,listing_status,tag,sqft,bedrooms,bathrooms,public_url");
  url.searchParams.set("limit", "6");
  url.searchParams.set("filter[status][_eq]", "published");

  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) return [];
  const payload = await response.json().catch(() => null);
  return Array.isArray(payload?.data) ? payload.data : [];
}

function zeviMoney(value, currency, priceText) {
  if (priceText) return priceText;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "precio bajo solicitud";
  return `$${number.toLocaleString("es-MX", { maximumFractionDigits: 0 })} ${currency || "MXN"}`;
}

async function zeviPropertyReply(language) {
  const site = "https://www.zevicapital.com";
  const properties = await fetchZeviProperties();
  if (!properties.length) {
    const replies = {
      en: `You can see ZeVi Capital's current property opportunities here:\n${site}/#properties\n\nI can help you filter them by area, budget, use case or investment objective.`,
      fr: `Vous pouvez consulter les opportunités immobilières actuelles de ZeVi Capital ici :\n${site}/#properties\n\nJe peux vous aider à les filtrer par zone, budget, usage ou objectif d'investissement.`,
      es: `Puedes ver las oportunidades inmobiliarias actuales de ZeVi Capital aquí:\n${site}/#properties\n\nPuedo ayudarte a filtrarlas por zona, presupuesto, uso u objetivo de inversión.`,
    };
    return replies[language] || replies.es;
  }

  const lines = properties.map((item) => {
    const link = item.public_url || `${site}/listing_details_01?id=${item.id}`;
    const details = [
      item.listing_status || item.tag,
      item.location || item.address,
      zeviMoney(item.price, item.currency, item.price_text),
      item.sqft && `${item.sqft} sqft`,
      item.bedrooms && `${item.bedrooms} rec.`,
      item.bathrooms && `${item.bathrooms} baños`,
    ].filter(Boolean).join(" · ");
    return `- ${item.title || "Propiedad"} — ${details}\n  ${link}`;
  });

  const intros = {
    en: "These are the current ZeVi Capital property opportunities I found:",
    fr: "Voici les opportunités immobilières ZeVi Capital disponibles :",
    es: "Estas son las oportunidades inmobiliarias actuales de ZeVi Capital:",
  };
  const outros = {
    en: `\n\nFull property section: ${site}/#properties\nTell me the area or budget and I will narrow the list.`,
    fr: `\n\nSection complète : ${site}/#properties\nIndiquez-moi la zone ou le budget et je filtre la liste.`,
    es: `\n\nSección completa: ${site}/#properties\nDime la zona o presupuesto y te filtro la lista.`,
  };
  return `${intros[language] || intros.es}\n\n${lines.join("\n")}${outros[language] || outros.es}`;
}

function buildCloudbedsBookingUrl({ language, details }) {
  const base =
    language === "en"
      ? "https://hotels.cloudbeds.com/en/reservation/UeErs0"
      : "https://hotels.cloudbeds.com/es/reservation/UeErs0";
  const url = new URL(base);
  url.searchParams.set("currency", "usd");
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
    let requestedClientCode;
    try {
      requestedClientCode = resolveRequestClient(request, payload.clientCode || payload.clientId, clients);
    } catch {
      return json({ error: "Invalid widget identity" }, 401);
    }
    payload.clientCode = requestedClientCode;
    delete payload.clientId;
    payload.history = await resolveConversationHistory(payload, requestedClientCode);
    const requestedLanguage = clean(payload.language) || "es";

    if (requestedClientCode === "suitesmine" && isSpecialBookingRequest(payload)) {
      const replies = {
        en: "For special requests, please contact the hotel directly via WhatsApp or by phone at +52 55 36 66 85 35.",
        fr: "Pour les demandes particulieres, contactez directement l'hotel via WhatsApp ou par telephone au +52 55 36 66 85 35.",
        es: "Para solicitudes especiales, contacte directamente al hotel via WhatsApp o por telefono al +52 55 36 66 85 35.",
      };
      return json({
        reply: replies[requestedLanguage] || replies.es,
        mode: "handoff",
        handoffRecommended: true,
        clientCode: requestedClientCode,
        rates: [],
      });
    }

    // Booking-flow messages are no longer answered here with a fixed template: they go to
    // Olivia v2 first so the AI drafts the reply from live Cloudbeds data. The identical
    // template below only runs as a fallback if the v2 call fails (see catch block).
    try {
      const v2Response = await callOliviaV2(payload);
      const v2ClientCode = clean(v2Response?.clientCode);
      if (v2Response && (!requestedClientCode || requestedClientCode === "default" || v2ClientCode === requestedClientCode)) {
        if (v2ClientCode === "vialterna" && !requestsHumanFollowUp(payload.message)) {
          return json({
            ...v2Response,
            intent: v2Response.intent === "lead" ? "faq" : v2Response.intent,
            phase: "answer",
            nextAction: "reply_to_guest",
            missingFields: [],
            action: null,
            leadForm: null,
          });
        }
        return json(v2Response);
      }
      if (v2Response) {
        console.warn("[olivia] v2 returned mismatched client, using JS profile", {
          requestedClientCode,
          v2ClientCode: v2ClientCode || "unknown",
        });
      }
    } catch (error) {
      console.error("[olivia] v2 fallback to legacy route", error);
    }

    const language = clean(payload.language) || "es";
    const clientCode = requestedClientCode;
    const client = getClientProfile(clientCode);
    const message = clean(payload.message);
    const metadata = payload.metadata || {};
    const lead = metadata.lead || {};
    const leadName = [clean(lead.firstName), clean(lead.lastName)].filter(Boolean).join(" ") || clean(lead.name);
    const hasLeadContact = Boolean(leadName && clean(lead.email) && clean(lead.phone));
    const checkIn = clean(metadata.checkIn);
    const checkOut = clean(metadata.checkOut);
    const guests = clean(metadata.guests);
    const bookingDraft = metadata.bookingDraft || {};

    if (!message) return json({ error: "Missing message" }, 400);

    const isSuitesMine = client.clientCode === "suitesmine";
    const rates = isSuitesMine ? await getCloudbedsRates({ checkIn, checkOut }) : [];
    const ratesText = formatRatesForPrompt(rates);
    const bookingDetails = extractBookingDetails({ message, metadata: { ...metadata, checkIn, checkOut, guests } });
    const contactDetails = hasLeadContact
      ? {
          ...bookingDetails,
          name: bookingDetails.name || leadName,
          email: bookingDetails.email || clean(lead.email),
          phone: bookingDetails.phone || clean(lead.phone),
        }
      : bookingDetails;

    if (isSuitesMine && isBookingFlow(message, bookingDraft)) {
      return json({
        reply: bookingReply(language, bookingDetails, rates),
        mode: "booking",
        rates,
        bookingDraft: { active: true, ...bookingDetails },
      });
    }

    if (client.clientCode === "zevicapital" && isZeviPropertyRequest(message)) {
      return json({
        reply: await zeviPropertyReply(language),
        mode: "property-list",
        clientCode: client.clientCode,
        missingFields: [],
      });
    }

    const contactReply = !isSuitesMine && !(client.clientCode === "vialterna" && !requestsHumanFollowUp(message))
      ? contactQualificationReply(language, client, contactDetails, message)
      : "";
    const leadQualification = contactReply
      ? leadFormResponse({ language, client, details: contactDetails, message })
      : null;
    const leadUi = leadQualification
      ? {
          action: leadQualification.action,
          leadForm: leadQualification.leadForm,
          collected: leadQualification.collected,
          missingFields: leadQualification.missingFields,
        }
      : {};

    if (!process.env.OPENAI_API_KEY) {
      return json({
        reply: isSuitesMine
          ? fallbackReply(language, { checkIn, checkOut })
          : genericFallbackReply(language, client),
        mode: "fallback",
        clientCode: client.clientCode,
        rates,
        ...leadUi,
      });
    }

    const system = `
You are ${client.roleLabel[language] || client.roleLabel.en || "Olivia AI Assistant"} for ${client.clientName}.
Respond in ${languageName(language)}.
Use the approved website and FAQ context below. Be concise, helpful, and natural.
Do not invent information that is not present in the approved context.
If dates/guests are already provided in metadata, do not ask for them again.
For every non-hotel client, qualify the visitor as a business lead: keep track of first and last name, email and phone, then collect the minimum project context useful for the client.
${hasLeadContact ? `The visitor contact details are already collected: ${leadName}, ${clean(lead.email)}, ${clean(lead.phone)}. Do not ask for name, email or phone again under any circumstance. Answer the business question directly, then ask only for missing project/product context if needed.` : "If name, email and phone are already present in metadata.lead or collected, do not ask for them again. Answer the visitor's business question directly, then ask only for the missing project context if needed."}
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

    const conversationHistory = sanitizeHistory(payload.history);

    const openAIModel = process.env.OPENAI_MODEL || "gpt-5.6-luna";
    const openAIRequest = {
      model: openAIModel,
      input: [
        { role: "system", content: system },
        ...conversationHistory,
        { role: "user", content: JSON.stringify(user) },
      ],
      max_output_tokens: 450,
    };
    if (!/^(gpt-5|o)/.test(openAIModel)) {
      openAIRequest.temperature = 0.3;
    }

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(openAIRequest),
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
        ...leadUi,
      });
    }

    const reply =
      data.output_text ||
      data.output?.flatMap((item) => item.content || []).find((part) => part.type === "output_text")?.text ||
      fallbackReply(language, { checkIn, checkOut });

    return json({ reply, mode: "openai", clientCode: client.clientCode, rates, ...leadUi });
  } catch (error) {
    return json({ error: error.message || "Unexpected error" }, 500);
  }
}
