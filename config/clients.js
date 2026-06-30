export const clients = {
  default: {
    clientCode: "default",
    clientName: "Olivia",
    industry: "generic",
    siteUrl: "",
    roleLabel: {
      es: "Olivia IA Asistente",
      en: "Olivia AI Assistant",
      fr: "Olivia IA Assistante",
    },
    skin: {
      accent: "#3159c9",
      soft: "#eaf0ff",
      operator: "#1f2a44",
    },
    knowledge:
      "Answer questions about the business using only the approved client context. If information is missing, ask a precise follow-up question or offer manual assistance.",
    dashboardFields: ["intent", "language", "source", "page"],
    integrations: {},
  },
  suitesmine: {
    clientCode: "suitesmine",
    clientName: "Suites Mine",
    industry: "hospitality",
    siteUrl: "suitesmine.com",
    roleLabel: {
      es: "Olivia IA Concierge",
      en: "Olivia AI Concierge",
      fr: "Olivia IA Concierge",
    },
    skin: {
      accent: "#4169e1",
      soft: "#eaf0ff",
      operator: "#1f2a44",
    },
    knowledge: `
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
`,
    dashboardFields: [
      "intent",
      "language",
      "source",
      "page",
      "checkIn",
      "checkOut",
      "guests",
      "roomType",
      "cloudbedsStatus",
      "bookingUrl",
    ],
    integrations: {
      booking: "cloudbeds",
    },
  },
  cusi: {
    clientCode: "cusi",
    clientName: "CUSI Flores",
    industry: "florist",
    siteUrl: "cusiflores.com",
    roleLabel: {
      es: "Olivia IA Asistente",
      en: "Olivia AI Assistant",
      fr: "Olivia IA Assistante",
      it: "Olivia AI Assistant",
    },
    skin: {
      accent: "#9a503e",
      soft: "#f8e8df",
      operator: "#45251f",
    },
    knowledge: `
CUSI Flores is a premium florist in Mexico City.
The assistant helps visitors choose flower arrangements, bouquets and orchids for special occasions.
Collect useful details when relevant: occasion, preferred flowers, budget, delivery date, delivery area and contact details.
If exact product availability, price or delivery feasibility is unknown, say that a CUSI advisor must confirm it.
`,
    dashboardFields: [
      "intent",
      "language",
      "source",
      "page",
      "occasion",
      "deliveryDate",
      "deliveryArea",
      "budget",
      "preferredProduct",
      "leadStatus",
    ],
    integrations: {},
  },
  jeanlouisdavid: {
    clientCode: "jeanlouisdavid",
    clientName: "Jean Louis David México",
    industry: "beauty-salon",
    siteUrl: "jeanlouisdavid.com.mx",
    roleLabel: {
      es: "Sofia Asistente",
      en: "Sofia Assistant",
      fr: "Sofia Assistante",
    },
    skin: {
      accent: "#b4945f",
      soft: "#f7f1e7",
      operator: "#171717",
    },
    knowledge: `
Jean Louis David México is a premium hair salon brand in Mexico City.
Sofia assists visitors with appointments, branches, haircuts, color, hair treatments, barber services, manicure and pedicure.
For appointment availability, exact prices or personalized recommendations, collect the visitor's name, email, phone and request, then offer follow-up by a Jean Louis David advisor.
Do not invent prices, schedules or appointment availability.
`,
    dashboardFields: [
      "intent",
      "language",
      "source",
      "page",
      "service",
      "branch",
      "preferredDate",
      "leadStatus",
    ],
    integrations: {
      leads: "formspree",
      formId: "xkgdyvze",
    },
  },
  lacaqc: {
    clientCode: "lacaqc",
    clientName: "Client Hotel",
    industry: "hospitality",
    siteUrl: "client-hotel.example",
    roleLabel: {
      es: "Olivia IA Concierge",
      en: "Olivia AI Concierge",
      fr: "Olivia IA Concierge",
    },
    skin: {
      accent: "#2f6f62",
      soft: "#eaf7f3",
      operator: "#173d36",
    },
    knowledge:
      "This is a hotel client profile placeholder. Answer only from approved client information and offer manual assistance when information is missing.",
    dashboardFields: ["intent", "language", "source", "page", "checkIn", "checkOut", "guests", "roomType"],
    integrations: {},
  },
  demo: {
    clientCode: "demo",
    clientName: "Demo Hotel",
    industry: "hospitality",
    siteUrl: "demo-hotel.example",
    roleLabel: {
      es: "Olivia IA Concierge",
      en: "Olivia AI Concierge",
      fr: "Olivia IA Concierge",
    },
    skin: {
      accent: "#8a5cf6",
      soft: "#f1ebff",
      operator: "#33215f",
    },
    knowledge:
      "This is a demonstration profile. Do not invent business information. Offer manual assistance when information is missing.",
    dashboardFields: ["intent", "language", "source", "page"],
    integrations: {},
  },
};

export function getClientProfile(clientCode) {
  return clients[clientCode] || clients.default;
}
