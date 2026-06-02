export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const HOTEL_CONTEXT = `
Suites Mine, Rio Ebro 64, Colonia Cuauhtemoc, CDMX 06500, Mexico.
Contact: contacto@suitesmine.com, +52 55 3666 8535.
Suites Mine is an aparthotel/alternative lodging service, not a traditional 24-hour hotel.
Regular check-in: 2:00 pm to 12:30 am next day. Rooftop: 10:30 am to 10:00 pm.
No pets. No children under 6. Parking is free but subject to availability.
Rooms: Estudio up to 3 guests, Suite up to 3 guests, Suite Doble up to 4 guests.
Studios have partial kitchenette. Suites have fuller kitchen. Suite Doble is larger with 2 queen beds.
No air conditioning; fans, water air coolers and heaters can be requested.
Luggage storage is free on check-in/check-out day from 9:00 am to 10:00 pm.
Long stays: 10% discount from 7 consecutive nights, 20% from 30 consecutive nights.
Payment: Mexican pesos cash, Visa, MasterCard, Carnet, American Express; phone reservations may use bank transfer or payment link.
Invoices: most reservations can be invoiced with Mexican SAT tax details.
`;

function json(data, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
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

function extractBookingDetails({ message, metadata }) {
  const draft = metadata.bookingDraft || {};
  const text = clean(message);
  const normalized = normalize(text);
  const email = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0] || clean(draft.email);
  const phone = text.match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0] || clean(draft.phone);
  const roomType = pickRoomType(text, draft.roomType);

  let name = clean(draft.name);
  if (!name && email) {
    const beforeEmail = text.slice(0, text.indexOf(email));
    name = beforeEmail
      .replace(/\b(estudio|studio|suite doble|double suite|suite)\b/gi, "")
      .replace(/\b\d+[.)]?\b/g, "")
      .replace(/[,:;-]+/g, " ")
      .trim();
  }

  if (!name && !email && !phone && !roomType && !hasAny(text, ["reserv", "booking", "pago", "payment", "link"])) {
    name = text;
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
    return `Booking summary:\n\nName: ${details.name}\nEmail: ${details.email}\nPhone: ${details.phone}\nCheck-in: ${details.checkIn}\nCheck-out: ${details.checkOut}\nGuests: ${details.guests}\nCategory: ${details.roomType}\n${priceLine ? `\n${priceLine}\n` : ""}\nCloudbeds booking link:\n${bookingUrl}\n\nNext step: open the link to finalize the reservation and payment in Cloudbeds. Once payment is validated, confirmation and ticket will be sent to ${details.email}.`;
  }

  return `Resumen de reserva:\n\nNombre: ${details.name}\nEmail: ${details.email}\nTelefono: ${details.phone}\nLlegada: ${details.checkIn}\nSalida: ${details.checkOut}\nHuespedes: ${details.guests}\nCategoria: ${details.roomType}\n${priceLine ? `\n${priceLine}\n` : ""}\nLink de reserva Cloudbeds:\n${bookingUrl}\n\nSiguiente paso: abrir el link para finalizar la reserva y el pago en Cloudbeds. Cuando el pago este validado, la confirmacion y el ticket se enviaran a ${details.email}.`;
}

function buildCloudbedsBookingUrl({ language, details }) {
  const base =
    language === "en"
      ? "https://hotels.cloudbeds.com/en/reservation/DzS8Bc"
      : "https://hotels.cloudbeds.com/es/reservation/DzS8Bc";
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

export async function POST(request) {
  try {
    const payload = await request.json();
    const language = clean(payload.language) || "es";
    const message = clean(payload.message);
    const metadata = payload.metadata || {};
    const checkIn = clean(metadata.checkIn);
    const checkOut = clean(metadata.checkOut);
    const guests = clean(metadata.guests);
    const bookingDraft = metadata.bookingDraft || {};

    if (!message) return json({ error: "Missing message" }, 400);

    const rates = await getCloudbedsRates({ checkIn, checkOut });
    const ratesText = formatRatesForPrompt(rates);
    const bookingDetails = extractBookingDetails({ message, metadata: { ...metadata, checkIn, checkOut, guests } });

    if (isBookingFlow(message, bookingDraft)) {
      return json({
        reply: bookingReply(language, bookingDetails, rates),
        mode: "booking",
        rates,
        bookingDraft: { active: true, ...bookingDetails },
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return json({
        reply: fallbackReply(language, { checkIn, checkOut }),
        mode: "fallback",
        rates,
      });
    }

    const system = `
You are Olivia IA, a hotel hostess AI for Suites Mine.
Respond in ${language === "en" ? "English" : "Spanish"}.
Use the website and FAQ context below. Be concise, helpful, and natural.
If dates/guests are already provided in metadata, do not ask for them again.
If the guest wants to reserve, collect only missing fields:
first and last name, email, phone, check-in, check-out, guests, room category.
Ask for room category, never room number. Valid categories: Estudio/Studio, Suite, Suite Doble/Double Suite.
If all booking fields are present, summarize the booking and say the next step is payment.
After payment is validated, confirmation and ticket will be sent by email.
Do not invent a confirmed reservation number, payment status, or payment link.
If the guest asks for a payment link, say the system will generate it after availability validation.

Hotel context:
${HOTEL_CONTEXT}

Live Cloudbeds rates for selected dates:
${ratesText}
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
        reply: fallbackReply(language, { checkIn, checkOut }),
        mode: "openai-error",
        error: data?.error?.message || "OpenAI error",
        rates,
      });
    }

    const reply =
      data.output_text ||
      data.output?.flatMap((item) => item.content || []).find((part) => part.type === "output_text")?.text ||
      fallbackReply(language, { checkIn, checkOut });

    return json({ reply, mode: "openai", rates });
  } catch (error) {
    return json({ error: error.message || "Unexpected error" }, 500);
  }
}
