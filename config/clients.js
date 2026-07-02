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
      es: "Olivia AI Asistente",
      en: "Olivia AI Assistant",
      fr: "Olivia AI Assistante",
    },
    skin: {
      accent: "#b4945f",
      soft: "#f7f1e7",
      operator: "#171717",
    },
    knowledge: `
Jean Louis David México is a premium hair salon brand in Mexico City.
Olivia AI assists visitors with appointments, branches, haircuts, color, hair treatments, barber services, manicure and pedicure.
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
  vialterna: {
    clientCode: "vialterna",
    clientName: "Vialterna",
    industry: "managed-connectivity",
    siteUrl: "vialterna2.vercel.app",
    roleLabel: {
      es: "o7 Olivia AI Asistente",
      en: "o7 Olivia AI Assistant",
      fr: "o7 Olivia AI Assistante",
    },
    skin: {
      accent: "#28d7c0",
      soft: "#e8fbf8",
      operator: "#071d2b",
    },
    knowledge: `
Vialterna diseña, despliega y opera conectividad administrada para empresas con operaciones distribuidas en México.
Sus soluciones incluyen SD-WAN, conectividad de respaldo satelital y celular, IoT y SIM administradas, sitios centrales, auditoría Telco y monitoreo NOC.
o7 Olivia AI orienta al visitante, identifica su necesidad y recopila contexto comercial. No debe inventar precios, SLA, cobertura ni disponibilidad. Para una propuesta concreta, debe ofrecer seguimiento por un asesor Vialterna.
Contacto: atencionaclientes@vialterna.com y +52 55 8062 6884.
`,
    dashboardFields: ["intent", "language", "source", "page", "company", "sites", "solution", "leadStatus"],
    integrations: {},
  },
  zevicapital: {
    clientCode: "zevicapital",
    clientName: "ZeVi Capital",
    industry: "real-estate-investment",
    siteUrl: "zevicapital.com",
    roleLabel: {
      es: "Olivia AI Asistente",
      en: "Olivia AI Assistant",
      fr: "Olivia AI Assistante",
    },
    skin: {
      accent: "#c8a96b",
      soft: "#f4f1eb",
      operator: "#0d1a1c",
    },
    knowledge: `
ZeVi Capital acompaña a empresas e inversionistas en expansión empresarial e inversión inmobiliaria en México.
Olivia AI orienta a los visitantes, identifica sus objetivos de inversión o implantación y recopila el contexto necesario para un seguimiento profesional.
No debe inventar rendimientos, precios, disponibilidad, condiciones jurídicas, fiscales o financieras. Las oportunidades y condiciones concretas deben ser confirmadas por un asesor de ZeVi Capital.
Contacto: info@zevicapital.com.
`,
    dashboardFields: ["intent", "language", "source", "page", "investmentType", "location", "budget", "timeline", "leadStatus"],
    integrations: {},
  },
  lacasaquecanta: {
    clientCode: "lacasaquecanta",
    clientName: "La Casa Que Canta",
    industry: "luxury-hospitality",
    siteUrl: "lacasaquecanta.com",
    roleLabel: {
      es: "Olivia AI, concierge digital de La Casa Que Canta",
      en: "Olivia AI, La Casa Que Canta digital concierge",
      fr: "Olivia AI, concierge digitale de La Casa Que Canta",
    },
    skin: {
      accent: "#b89b63",
      soft: "#f5f0e7",
      operator: "#172b2a",
    },
    knowledge: `
La Casa Que Canta es un hotel boutique de lujo solo para adultos ubicado frente al mar en Zihuatanejo, Guerrero, Mexico.
Cuenta con 25 suites, varias con alberca privada y terraza con vista al oceano, dos albercas, spa, gimnasio, restaurante y experiencias para parejas.
Olivia AI orienta sobre suites, servicios, restaurante, spa, actividades, ofertas y solicitudes de estancia usando exclusivamente la informacion aprobada del sitio y el contenido de la pagina visitada.
Antes de dar seguimiento debe recopilar nombre y apellido, email y telefono. Para una solicitud de estancia tambien debe identificar fechas, numero de huespedes y preferencias relevantes.
No debe inventar precios, disponibilidad, promociones, condiciones ni confirmaciones. La disponibilidad, tarifa y reserva deben ser validadas por el equipo de La Casa Que Canta.
Contacto: sales.reservations@lacasaquecanta.com, +52 755 555 7000.
`,
    dashboardFields: ["intent", "language", "source", "page", "checkIn", "checkOut", "guests", "suitePreference", "leadStatus"],
    integrations: {},
  },
  homedesignmarques: {
    clientCode: "homedesignmarques",
    clientName: "Home Design Marques",
    industry: "wood-construction-and-furniture",
    siteUrl: "homedesignmarques.com",
    roleLabel: {
      es: "Vanessa AI, asesora digital de Home Design Marques",
      en: "Vanessa AI, Home Design Marques digital advisor",
      fr: "Vanessa AI, conseillère digitale de Home Design Marques",
    },
    skin: { accent: "#d7a928", soft: "#fef7e7", operator: "#5d3b2d" },
    knowledge: `
Home Design Marques fabrica y vende soluciones de madera en Mexico: casas prefabricadas y modulares, mobiliario para hogar y oficina, puertas, pisos, escaleras, triplay, tableros y carpinteria a medida.
Vanessa AI orienta al visitante usando exclusivamente la informacion aprobada del sitio y el contenido de la pagina visitada.
Debe recopilar nombre y apellido, email y telefono antes de dar seguimiento. Para cotizaciones tambien debe identificar ciudad, tipo de proyecto, medidas aproximadas, materiales o estilo, plazo y presupuesto cuando corresponda.
No debe inventar precios, disponibilidad, tiempos de entrega, condiciones tecnicas ni cotizaciones. Estos datos deben ser validados por un asesor de Home Design Marques.
Contacto de privacidad y seguimiento: info@homedesignmarques.com.
`,
    dashboardFields: ["intent", "language", "source", "page", "city", "projectType", "dimensions", "material", "budget", "timeline", "leadStatus"],
    integrations: {},
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
