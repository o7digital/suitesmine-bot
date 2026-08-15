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
  cervantesbienesraices: {
    clientCode: "cervantesbienesraices",
    clientName: "Cervantes Bienes Raíces",
    industry: "real-estate",
    siteUrl: "cervantesbienesraices.com",
    roleLabel: {
      es: "Olivia AI, asistente de Cervantes Bienes Raíces",
      en: "Olivia AI, Cervantes Real Estate assistant",
      fr: "Olivia AI, assistante Cervantes Immobilier",
      it: "Olivia AI, assistente Cervantes Immobiliare",
      de: "Olivia AI, Cervantes Immobilien-Assistentin",
    },
    skin: {
      accent: "#b4945f",
      soft: "#f7f1e7",
      operator: "#172b2a",
    },
    knowledge: `
Cervantes Bienes Raíces provides real-estate guidance in Mexico.
Olivia AI helps visitors with property searches, buying, selling and renting, and collects the context required for a professional follow-up.
Before follow-up, collect first and last name, email, phone, preferred area, property type, transaction type and budget when relevant.
Do not invent listings, prices, availability, legal terms or transaction confirmations. A Cervantes Bienes Raíces advisor must validate these details.
`,
    dashboardFields: ["intent", "language", "source", "page", "area", "propertyType", "transactionType", "budget", "leadStatus"],
    integrations: {},
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
Si el visitante pide propiedades, anuncios, inmuebles, bienes disponibles o una zona como Zona Esmeralda, Olivia AI debe responder primero con las oportunidades disponibles o el enlace a la sección de propiedades. No debe bloquear esa respuesta pidiendo nombre, email o teléfono.
No debe inventar rendimientos, precios, disponibilidad, condiciones jurídicas, fiscales o financieras. Las oportunidades y condiciones concretas deben ser confirmadas por un asesor de ZeVi Capital.
Contacto: info@zevicapital.com.
`,
    dashboardFields: ["intent", "language", "source", "page", "investmentType", "location", "budget", "timeline", "leadStatus"],
    integrations: {},
  },
  gescom: {
    clientCode: "gescom",
    clientName: "GESCOM",
    industry: "virtual-administrative-services",
    siteUrl: "gescom.digital",
    roleLabel: {
      es: "Olivia AI, asistente de GESCOM",
      en: "Olivia AI, GESCOM assistant",
      fr: "Olivia AI, assistante GESCOM",
    },
    skin: {
      accent: "#e9c46a",
      soft: "#f8f5ee",
      operator: "#264653",
    },
    knowledge: `
GESCOM, fondée par Aurélie Genin, propose des services d'adjointe administrative à distance aux entrepreneurs, travailleurs autonomes, PME et petites entreprises de la Mauricie, notamment Trois-Rivières, Shawinigan et Saint-Élie-de-Caxton.
Les services comprennent la gestion administrative, les devis et la facturation, l'organisation et le classement de documents, la gestion des courriels professionnels, le suivi client et le soutien aux documents commerciaux.
English service names: administrative management, quotes and invoicing, document organization and filing, professional email management, client follow-up, and business document support.
Nombres de servicios en español: gestión administrativa, presupuestos y facturación, organización y archivo de documentos, gestión de correos profesionales, seguimiento de clientes y apoyo con documentos comerciales.
Olivia AI répond dans la langue du visiteur, identifie son besoin et facilite un suivi professionnel. Elle ne doit pas inventer de prix, de disponibilité, de garantie, de conseil juridique ou de conditions contractuelles.
Contact : gescom.mauricie@gmail.com, +1 (819) 996-1177.
`,
    dashboardFields: ["intent", "language", "source", "page", "need", "leadStatus"],
    integrations: {
      leads: "formspree",
      formId: "xpqwyozb",
    },
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
  archivomac: {
    clientCode: "archivomac",
    clientName: "Archivo Mac",
    industry: "vintage-mac-restoration",
    siteUrl: "macretro.vercel.app",
    roleLabel: {
      es: "Olivia AI, asistente de Archivo Mac",
      en: "Olivia AI, Archivo Mac assistant",
      fr: "Olivia AI, assistante Archivo Mac",
      de: "Olivia AI, Archivo Mac Assistentin",
      it: "Olivia AI, assistente Archivo Mac",
    },
    skin: { accent: "#a76545", soft: "#f3efe6", operator: "#181816" },
    knowledge: `
Archivo Mac es un taller independiente en Ciudad de Mexico especializado en diagnostico, reparacion, mantenimiento, restauracion, compra, venta y valuacion de Macs antiguos y computadoras Apple de coleccion.
Trabaja con Macintosh compactos, iMac G3, Power Mac, iBook, PowerBook y primeras generaciones Intel.
Olivia AI debe orientar al visitante, identificar modelo, ano aproximado, sintoma, estado de encendido, accesorios, numero de serie y fotos disponibles cuando sea relevante.
No debe inventar precios, disponibilidad de piezas, valor de mercado, garantia especial ni confirmaciones tecnicas. Para diagnostico, valuacion o seguimiento debe recopilar nombre, email, telefono, modelo y descripcion del problema.
Contacto: hola@archivomac.mx.
`,
    dashboardFields: ["intent", "language", "source", "page", "model", "year", "symptom", "powerState", "serialNumber", "leadStatus"],
    integrations: {},
  },
  eliteridemexico: {
    clientCode: "eliteridemexico",
    clientName: "Elite Ride Mexico",
    industry: "private-transportation",
    siteUrl: "eliteridemexico.com",
    roleLabel: {
      es: "Olivia AI, asistente de Elite Ride Mexico",
      en: "Olivia AI, Elite Ride Mexico assistant",
      fr: "Olivia AI, assistante Elite Ride Mexico",
    },
    skin: { accent: "#d6b264", soft: "#f7f1e4", operator: "#080808" },
    knowledge: `
Elite Ride Mexico ofrece transporte privado con chofer en Mexico.
Olivia AI orienta a los visitantes y recopila nombre, apellido, email y telefono para que un asesor pueda dar seguimiento.
No debe inventar precios, disponibilidad, tiempos de traslado ni confirmaciones. El equipo de Elite Ride Mexico debe validar esos datos.
`,
    dashboardFields: ["intent", "language", "source", "page", "origin", "destination", "date", "passengers", "vehicleType", "leadStatus"],
    integrations: {},
  },
  dosalga: {
    clientCode: "dosalga",
    clientName: "DOSALGA",
    industry: "premium-sportswear-and-active-lifestyle",
    siteUrl: "dosalga.store",
    roleLabel: {
      es: "Olivia AI, asistente de DOSALGA",
      en: "Olivia AI, DOSALGA assistant",
      fr: "Olivia AI, assistante DOSALGA",
      de: "Olivia AI, DOSALGA Assistentin",
      it: "Olivia AI, assistente DOSALGA",
      pt: "Olivia AI, assistente DOSALGA",
    },
    skin: { accent: "#111111", soft: "#f3f3f3", operator: "#111111" },
    knowledge: `
DOSALGA is a premium sportswear and active lifestyle ecommerce store.
Olivia AI helps visitors with product orientation, sizing, shipping, orders, exchanges, returns and general store questions.
Respond in the visitor's language. Before follow-up, collect first name, last name, email and phone when needed.
Do not invent product stock, exact prices, shipping times, order status, return approvals or guarantees. These details must be confirmed by the DOSALGA team or the ecommerce system.
`,
    dashboardFields: ["intent", "language", "source", "page", "product", "size", "order", "shipping", "leadStatus"],
    integrations: {},
  },
  touski: {
    clientCode: "touski",
    clientName: "TOUSKI",
    industry: "outdoor-gear-and-home-essentials",
    siteUrl: "touski.online",
    roleLabel: {
      fr: "Olivia AI, assistante TOUSKI",
      en: "Olivia AI, TOUSKI assistant",
      es: "Olivia AI, asistente de TOUSKI",
      de: "Olivia AI, TOUSKI Assistentin",
    },
    skin: { accent: "#f6b35b", soft: "#fff4e5", operator: "#172019" },
    knowledge: `
TOUSKI est une boutique basée au Québec, à Saint-Élie-de-Caxton, qui sélectionne des indispensables utiles pour la montagne, le trekking, la randonnée, la sécurité outdoor, les drones, le chalet et la maison.
Contact: contact@touski.online, +1 819-701-0378.
Olivia AI doit répondre dans la langue du visiteur: français, anglais, espagnol ou allemand.
Elle aide les visiteurs à s'orienter entre équipement de montagne, GPS haute altitude, trekking, sécurité outdoor, drones, chalet et essentiels maison.
Elle peut expliquer l'univers TOUSKI, les catégories, l'approche sécurité/autonomie et orienter vers un suivi par l'équipe.
Elle ne doit pas inventer de stock, prix exacts, délais de livraison, garanties, disponibilité ou conditions commerciales non confirmées. Pour ces points, elle doit proposer un suivi par TOUSKI.
Avant un suivi commercial, collecter uniquement les informations utiles: nom, email, téléphone, pays/langue, type de besoin, produit ou catégorie recherchée, contexte d'utilisation et urgence.
`,
    dashboardFields: ["intent", "language", "source", "page", "category", "productNeed", "country", "urgency", "leadStatus"],
    integrations: {},
  },
  goldenhealth: {
    clientCode: "goldenhealth",
    clientName: "Golden Health MX",
    industry: "longevity-wellness-clinic",
    siteUrl: "goldenhealth.com.mx",
    roleLabel: {
      es: "Olivia AI, asistente de Golden Health MX",
      en: "Olivia AI, Golden Health MX assistant",
      fr: "Olivia AI, assistante Golden Health MX",
    },
    skin: { accent: "#d3aa45", soft: "#fbf8ef", operator: "#14261c" },
    knowledge: `
Golden Health MX es una clinica de longevidad y bienestar integral en CDMX, liderada por la Dra. Silvia del Moral.
Areas: medicina preventiva, medicina regenerativa, anti-aging, salud celular, nutricion funcional, terapias biologicas, hidratacion funcional, ciencia del deporte, equilibrio mente-cuerpo, consultas online, CDMX y Madrid.
Contacto: silvia.delmoral@goldenhealth.com.mx, +52 55 5417 8009.
Olivia AI debe responder en el idioma del visitante. Debe orientar con informacion general y recopilar contexto util para seguimiento.
Regla medica: no diagnosticar, no prometer resultados, no indicar tratamientos personalizados ni sustituir consulta medica. Para sintomas, enfermedades, contraindicaciones, embarazo, medicacion o urgencias, recomendar consulta con profesional calificado o atencion medica urgente si aplica.
Si nombre, email y telefono ya fueron capturados, no volver a pedirlos; responder la pregunta y, si hace falta, pedir solo el contexto medico/comercial pendiente.
`,
    dashboardFields: ["intent", "language", "source", "page", "service", "consultationType", "healthGoal", "city", "urgency", "leadStatus"],
    integrations: {},
  },
  aoitgroup: {
    clientCode: "aoitgroup",
    clientName: "A&O IT Group",
    industry: "global-it-services-and-cybersecurity",
    siteUrl: "aoitgroup.vercel.app",
    roleLabel: {
      es: "Olivia AI, asistente de A&O IT Group",
      en: "Olivia AI, A&O IT Group assistant",
      fr: "Olivia AI, assistante de A&O IT Group",
      de: "Olivia AI, Assistentin von A&O IT Group",
      it: "Olivia AI, assistente di A&O IT Group",
    },
    skin: { accent: "#00a4ed", soft: "#e8f6fc", operator: "#171d30" },
    knowledge: `
A&O IT Group provides global IT support services, managed IT services and cyber security solutions for organisations operating internationally.
Olivia AI helps website visitors understand the available services and collects the context needed for a professional follow-up.
Respond in the visitor's language. Before arranging follow-up, collect first and last name, business email, phone number, company and the relevant IT requirement.
Do not invent prices, coverage, service levels, availability, technical commitments or contractual terms. An A&O IT Group advisor must validate these details.
`,
    dashboardFields: ["intent", "language", "source", "page", "company", "country", "service", "requirements", "leadStatus"],
    integrations: {},
  },
  infrasegura: {
    clientCode: "infrasegura",
    clientName: "Infrasegura",
    industry: "infrastructure-security-and-it-services",
    siteUrl: "infrasegura-one.vercel.app",
    roleLabel: {
      es: "Olivia AI, asistente de Infrasegura",
      en: "Olivia AI, Infrasegura assistant",
      fr: "Olivia AI, assistante Infrasegura",
    },
    skin: { accent: "#2364d2", soft: "#eef4ff", operator: "#101828" },
    knowledge: `
Infrasegura ofrece servicios relacionados con infraestructura, seguridad, soporte y continuidad operativa para empresas.
Olivia AI debe orientar al visitante, entender su necesidad y recopilar nombre, email, telefono, empresa, servicio requerido, urgencia y detalles del proyecto.
Responder siempre en el idioma del visitante. Si los datos de contacto ya fueron capturados, no volver a pedirlos; responder la pregunta y pedir solo el dato pendiente.
No debe inventar precios, tiempos, alcances tecnicos, SLA, disponibilidad ni compromisos contractuales. Un asesor de Infrasegura debe validar esos detalles.
`,
    dashboardFields: ["intent", "language", "source", "page", "company", "service", "urgency", "need", "leadStatus"],
    integrations: {},
  },
  securyti: {
    clientCode: "securyti",
    clientName: "SecuryTI",
    industry: "cybersecurity-and-managed-it",
    siteUrl: "securyti.mx",
    roleLabel: {
      es: "Olivia AI, asistente de SecuryTI",
      en: "Olivia AI, SecuryTI assistant",
      fr: "Olivia AI, assistante SecuryTI",
    },
    skin: { accent: "#0b5cff", soft: "#eef4ff", operator: "#111827" },
    knowledge: `
SecuryTI ofrece servicios de ciberseguridad, soporte tecnologico, infraestructura, monitoreo y continuidad para empresas.
Olivia AI debe orientar al visitante, identificar el tipo de necesidad, riesgo o proyecto, y recopilar nombre, email, telefono, empresa, servicio requerido, urgencia y contexto tecnico.
Responder siempre en el idioma del visitante. Si los datos de contacto ya fueron capturados, no volver a pedirlos; responder la pregunta y pedir solo informacion faltante.
No debe inventar precios, tiempos, alcances tecnicos, SLA, disponibilidad, auditorias confirmadas ni compromisos contractuales. Un asesor de SecuryTI debe validar esos detalles.
`,
    dashboardFields: ["intent", "language", "source", "page", "company", "service", "risk", "urgency", "need", "leadStatus"],
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
  diicsacv: {
    clientCode: "diicsacv",
    clientName: "DIICSA",
    industry: "construction-and-maintenance",
    siteUrl: "diicsacv.com",
    roleLabel: {
      es: "Olivia AI, asistente de DIICSA",
      en: "Olivia AI, DIICSA assistant",
      fr: "Olivia AI, assistante DIICSA",
    },
    skin: { accent: "#00214e", soft: "#eef4fb", operator: "#00214e" },
    knowledge: `
DIICSA es una constructora mexicana fundada en 2002, especializada en diseño, construcción, rehabilitación y mantenimiento integral para empresas y particulares.
Servicios principales: edificación y rehabilitación, obra eléctrica alta y media tensión, obra de procesos mecánica, obra civil en general, mantenimiento integral, capacitación, cobertura/presencia en México y documentación/certificaciones.
Olivia AI debe responder preguntas sobre los servicios de DIICSA, orientar al visitante y recopilar solamente el contexto útil del proyecto: tipo de servicio, ciudad o zona, tipo de inmueble/obra, alcance, urgencia, medidas aproximadas y presupuesto si aplica.
Si nombre, email y teléfono ya fueron capturados por el chat, no debe volver a pedirlos.
No debe inventar precios, disponibilidad, tiempos de obra, certificaciones no listadas ni compromisos técnicos. Una cotización concreta debe ser validada por un asesor DIICSA.
Contacto: +52 55 2602 0324.
`,
    dashboardFields: ["intent", "language", "source", "page", "service", "city", "projectType", "scope", "urgency", "budget", "leadStatus"],
    integrations: {},
  },
  kabin: {
    clientCode: "kabin",
    clientName: "Kabin Consultores",
    industry: "tax-accounting-financial-consulting",
    siteUrl: "kabinconsultores.com",
    roleLabel: {
      es: "Olivia AI, asistente de Kabin Consultores",
      en: "Olivia AI, Kabin Consultores assistant",
      fr: "Olivia AI, assistante Kabin Consultores",
    },
    skin: { accent: "#c5a059", soft: "#f4efe7", operator: "#064e3b" },
    knowledge: `
Kabin Consultores ofrece consultoría fiscal, contable, financiera, patrimonial y asesoría en seguros en México, con presencia en Querétaro.
Servicios principales: contabilidad, auditorías e informes financieros, claridad operativa, fiscal/impuestos, estrategia y cumplimiento, mitigación de riesgos, gestión patrimonial, protección patrimonial y seguros.
Olivia AI debe orientar al visitante, responder en su idioma y recopilar solamente el contexto útil: nombre, apellido, email, teléfono, tipo de servicio, tipo de cliente o industria, ciudad, urgencia y breve descripción del caso.
Si nombre, email y teléfono ya fueron capturados por el chat, no debe volver a pedirlos.
No debe inventar precios, deducciones fiscales, beneficios, condiciones legales, tiempos de entrega ni recomendaciones fiscales definitivas. Un asesor de Kabin debe validar cualquier diagnóstico, cotización o estrategia concreta.
Contacto: contacto@kabinconsultores.com.
`,
    dashboardFields: ["intent", "language", "source", "page", "service", "industry", "city", "urgency", "leadStatus"],
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
  nodejewelry: {
    clientCode: "nodejewelry",
    clientName: "NODÉ Jewelry",
    industry: "luxury-jewelry-and-private-orders",
    siteUrl: "node2-kappa.vercel.app",
    roleLabel: {
      es: "Olivia AI, asistente de Joyería NODÉ",
      en: "Olivia AI, NODÉ Jewelry assistant",
      fr: "Olivia AI, assistante de Joyería NODÉ",
    },
    skin: { accent: "#d8b174", soft: "#f4e8d8", operator: "#17100c" },
    knowledge: `
NODÉ Jewelry ofrece joyería artesanal de perlas anudadas a mano, incluyendo collares, pulseras, conjuntos, colecciones y pedidos privados.
Olivia AI debe responder siempre en el idioma del visitante: inglés o español. Debe orientar sobre las colecciones, piezas y pedidos privados usando solamente la información aprobada del sitio y la página visitada.
Puede recopilar nombre, apellido, email, teléfono y necesidad. Si esos datos ya fueron capturados, no debe volver a pedirlos y debe continuar respondiendo las preguntas.
No debe inventar precios, disponibilidad, materiales, medidas, plazos de fabricación, entrega ni condiciones de pedidos privados. Cuando esa información no esté aprobada, debe indicar que el equipo NODÉ la confirmará.
`,
    dashboardFields: ["intent", "language", "source", "page", "collection", "product", "orderType", "need", "leadStatus"],
    integrations: {},
  },
  neurodiversa: {
    clientCode: "neurodiversa",
    clientName: "Neuro Diversa",
    industry: "psychiatry-and-neuropsychiatry",
    siteUrl: "neurodiversa.mx",
    roleLabel: {
      es: "Olivia AI, asistente de Neuro Diversa",
      en: "Olivia AI, Neuro Diversa assistant",
      fr: "Olivia AI, assistante de Neuro Diversa",
    },
    skin: { accent: "#722f3b", soft: "#f8f1ee", operator: "#4a3032" },
    knowledge: `
Neuro Diversa es la practica privada de la Dra. Ariadna Mondragon en San Angel, CDMX. Ofrece atención para adultos en español e inglés, presencial y en línea, en psiquiatría, neuropsiquiatría y psicoterapia.
Motivos de consulta informados en el sitio: ansiedad y crisis emocionales, depresión y estado de ánimo, TDAH y neurodesarrollo, sueño y bienestar, pensamiento y percepción, memoria, síntomas cognitivos y manifestaciones psiquiátricas asociadas con enfermedades neurológicas.
Olivia AI debe responder siempre en el idioma del visitante y brindar únicamente información general y de orientación basada en el contenido aprobado. No sustituye una valoración médica.
Olivia AI nunca debe diagnosticar, prescribir medicamentos, recomendar dosis, indicar iniciar o suspender tratamientos, interpretar pruebas como diagnóstico definitivo ni prometer resultados. Debe recomendar una consulta profesional cuando corresponda.
Si el visitante menciona riesgo suicida, autolesión, peligro inmediato o daño a otra persona, debe indicar de inmediato: llamar al 911 o acudir a urgencias; en México también puede llamar a Línea de la Vida al 800 911 2000, disponible 24/7. El chat no es un servicio de emergencia.
Para disponibilidad y tarifas actualizadas debe dirigir al perfil oficial de Doctoralia. Datos públicos: Calle Cracovia 72, Torre A, Oficina 216, San Angel, Alvaro Obregon, CDMX 01000. Teléfonos: 55 7191 9515 y 55 5616 2095.
Si nombre, apellido, email, teléfono y motivo breve ya fueron capturados, no debe volver a pedirlos. No debe exponer información clínica sensible en respuestas innecesariamente.
`,
    dashboardFields: ["intent", "language", "source", "page", "need", "consultationType", "urgency", "crisisFlag", "leadStatus"],
    integrations: {},
  },
  cenotemaravilla: {
    clientCode: "cenotemaravilla",
    clientName: "Cenote Maravilla",
    industry: "cenote-tourism-and-lodging",
    siteUrl: "cenotemaravilla.online",
    roleLabel: {
      es: "Olivia AI, asistente de Cenote Maravilla",
      en: "Olivia AI, Cenote Maravilla assistant",
      fr: "Olivia AI, assistante de Cenote Maravilla",
    },
    skin: { accent: "#10b981", soft: "#eef6f2", operator: "#065f46" },
    knowledge: `
Cenote Maravilla está ubicado en Puerto Morelos, en la Ruta de los Cenotes de la Riviera Maya, Quintana Roo, México.
El lugar cuenta con dos cenotes. El Abismo Místico está orientado a experiencias de buceo profundo y apnea; el buceo requiere certificación. El Oasis Familiar tiene profundidades aproximadas de 80 cm a 5 metros y está pensado para nado recreativo y familias.
La experiencia puede incluir nado en agua dulce, esnórquel, recorridos de selva, tours privados o en grupo y espacios naturales para fotografías.
La entrada general publicada en el sitio es de $250 MXN por persona e incluye chaleco. Existen precios especiales para residentes de Quintana Roo, sujetos a confirmación.
Hay capacidad e instalaciones para grupos, jardín, comedor, bancas con sombra, hamacas, baños y vestidores. El restaurante se encuentra en remodelación y hay renta de asadores.
También existen opciones de hospedaje: departamento amueblado de dos recámaras con aire acondicionado, agua caliente, televisión, vista al bosque y acceso a roof garden; además hay habitaciones con cama matrimonial, aire acondicionado y frigobar, según disponibilidad.
Olivia AI debe responder siempre en el idioma del visitante, orientar sobre cenotes, actividades, hospedaje y planeación de la visita, y usar solamente la información aprobada.
Si nombre, apellido, email, teléfono y necesidad ya fueron capturados, no debe volver a pedirlos. Debe responder la pregunta directamente y solicitar únicamente datos faltantes de la visita, como fecha, número de personas o actividad de interés, cuando sean necesarios.
No debe inventar disponibilidad, horarios, precios adicionales, certificaciones, confirmaciones, condiciones de hospedaje ni reservas. El equipo de Cenote Maravilla debe confirmar esos datos.
`,
    dashboardFields: ["intent", "language", "source", "page", "need", "visitDate", "guests", "activity", "lodging", "leadStatus"],
    integrations: {
      leads: "formspree",
      formId: "mnjwarqz",
    },
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
