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
Do not invent a confirmed reservation number or payment status.

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
