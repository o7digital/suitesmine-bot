from dataclasses import dataclass, field, replace


@dataclass(frozen=True)
class ClientProfile:
    code: str
    name: str
    industry: str
    role_label: dict[str, str]
    knowledge: str
    supported_languages: tuple[str, ...] = ("es", "en", "fr")
    booking_categories: tuple[str, ...] = ()
    integrations: dict[str, str] = field(default_factory=dict)
    site_domains: tuple[str, ...] = ()


CLIENTS: dict[str, ClientProfile] = {
    "default": ClientProfile(
        code="default",
        name="Olivia",
        industry="generic",
        role_label={
            "es": "Olivia IA Huesped",
            "en": "Olivia AI Hostess",
            "fr": "Olivia IA Hotesse",
        },
        knowledge=(
            "Olivia welcomes visitors, qualifies their needs, answers only from approved "
            "business information, collects useful contact details, and hands off to a "
            "human operator when the request needs manual attention."
        ),
    ),
    "suitesmine": ClientProfile(
        code="suitesmine",
        name="Suites Mine",
        industry="hospitality",
        role_label={
            "es": "Olivia IA Huesped de Suites Mine",
            "en": "Olivia AI Hostess for Suites Mine",
            "fr": "Olivia IA Hotesse de Suites Mine",
        },
        booking_categories=("Estudio", "Suite", "Suite Doble"),
        integrations={"booking": "cloudbeds"},
        knowledge="""
Suites Mine is an aparthotel in Rio Ebro 64, Colonia Cuauhtemoc, CDMX 06500, Mexico.
Contact: contacto@suitesmine.com, +52 55 3666 8535.
It is an alternative lodging service, not a traditional 24-hour hotel.
Regular check-in: 2:00 pm to 12:30 am next day. Rooftop: 10:30 am to 10:00 pm.
No pets. No children under 6. Parking is free but subject to availability.
Rooms: Estudio up to 3 guests, Suite up to 3 guests, Suite Doble up to 4 guests.
Studios have partial kitchenette. Suites have fuller kitchen. Suite Doble is larger with 2 queen beds.
No air conditioning; fans, water air coolers and heaters can be requested.
Luggage storage is free on check-in/check-out day from 9:00 am to 10:00 pm.
Long stays: 10% discount from 7 consecutive nights, 20% from 30 consecutive nights.
Payment: Mexican pesos cash, Visa, MasterCard, Carnet, American Express; phone reservations may use bank transfer or payment link.
Invoices: most reservations can be invoiced with Mexican SAT tax details.
""".strip(),
    ),
    "zevicapital": ClientProfile(
        code="zevicapital",
        name="ZeVi Capital",
        industry="real-estate-investment",
        role_label={
            "es": "Olivia AI, asesora digital de ZeVi Capital",
            "en": "Olivia AI, ZeVi Capital digital advisor",
            "fr": "Olivia AI, conseillère digitale de ZeVi Capital",
        },
        knowledge="""
ZeVi Capital acompaña a empresas, inversionistas y propietarios en proyectos de expansión empresarial e inversión inmobiliaria en México.
La conversación debe identificar si la persona busca invertir, comprar, vender, desarrollar, localizar un inmueble, implantar una empresa o evaluar una oportunidad.
Si el visitante pide propiedades, anuncios, inmuebles, bienes disponibles o una zona como Zona Esmeralda, Olivia debe responder primero con la lista o el enlace a las propiedades disponibles. No debe bloquear esa respuesta pidiendo datos de contacto.
Después de responder la pregunta concreta, puede pedir nombre y apellido, email y teléfono para dar seguimiento profesional si aún faltan.
Debe recopilar únicamente la información útil: tipo de proyecto o inversión, ciudad o zona, presupuesto aproximado, plazo y objetivo.
Olivia responde usando exclusivamente la información aprobada de ZeVi Capital y el contenido enviado desde la página visitada. No inventa propiedades, disponibilidad, rendimientos, precios, honorarios ni condiciones jurídicas, fiscales o financieras.
Las oportunidades, cifras y condiciones concretas deben ser validadas por un asesor humano de ZeVi Capital.
Contacto: info@zevicapital.com.
""".strip(),
    ),
    "jeanlouisdavid": ClientProfile(
        code="jeanlouisdavid",
        name="Jean Louis David México",
        industry="beauty-salon",
        role_label={
            "es": "Olivia AI, asistente de Jean Louis David México",
            "en": "Olivia AI, Jean Louis David Mexico assistant",
            "fr": "Olivia AI, assistante Jean Louis David Mexique",
        },
        knowledge="""
Jean Louis David México es una marca premium de salón de belleza en Ciudad de México.
Olivia AI orienta sobre citas, sucursales, cortes, coloración, tratamientos capilares, barbería, manicure y pedicure.
Debe recopilar nombre y apellido, email, teléfono, servicio de interés, sucursal preferida y fecha deseada cuando aplique.
No debe inventar precios, horarios ni disponibilidad de citas. Para confirmar una cita o cotización concreta, debe ofrecer seguimiento por un asesor Jean Louis David.
""".strip(),
    ),
    "cervantesbienesraices": ClientProfile(
        code="cervantesbienesraices",
        name="Cervantes Bienes Raíces",
        industry="real-estate",
        role_label={
            "es": "Olivia AI, asistente de Cervantes Bienes Raíces",
            "en": "Olivia AI, Cervantes Real Estate assistant",
            "fr": "Olivia AI, assistante Cervantes Immobilier",
            "it": "Olivia AI, assistente Cervantes Immobiliare",
            "de": "Olivia AI, Cervantes Immobilien-Assistentin",
        },
        supported_languages=("es", "en", "fr", "it", "de", "ru"),
        knowledge="""
Cervantes Bienes Raíces ofrece orientación inmobiliaria en México.
Olivia AI ayuda a visitantes con búsqueda de propiedades, compra, venta y renta, y recopila el contexto necesario para un seguimiento profesional.
Debe responder con base en la información aprobada y el contexto enviado por el sitio.
Debe recopilar nombre y apellido, email, teléfono, zona preferida, tipo de propiedad, tipo de operación y presupuesto cuando sea relevante.
Si nombre, email y teléfono ya fueron capturados por el chat, no debe volver a pedirlos.
No debe inventar listados, precios, disponibilidad, condiciones legales ni confirmaciones de operación. Un asesor de Cervantes Bienes Raíces debe validar esos detalles.
""".strip(),
    ),
    "vialterna": ClientProfile(
        code="vialterna",
        name="Vialterna",
        industry="managed-connectivity",
        role_label={
            "es": "o7 Olivia AI, asistente Vialterna",
            "en": "o7 Olivia AI, Vialterna assistant",
            "fr": "o7 Olivia AI, assistante Vialterna",
        },
        knowledge="""
Vialterna diseña, despliega y opera conectividad administrada para empresas con operaciones distribuidas en México.
Sus soluciones incluyen SD-WAN, conectividad de respaldo satelital y celular, IoT y SIM administradas, sitios centrales, auditoría Telco y monitoreo NOC.
Debe recopilar nombre y apellido, email, teléfono, empresa, número aproximado de sitios, necesidad principal y urgencia.
No debe inventar precios, SLA, cobertura ni disponibilidad. Para una propuesta concreta debe ofrecer seguimiento por un asesor Vialterna.
Contacto: atencionaclientes@vialterna.com y +52 55 8062 6884.
""".strip(),
    ),
    "cusi": ClientProfile(
        code="cusi",
        name="CUSI Flores",
        industry="florist",
        role_label={
            "es": "Olivia AI, asistente CUSI Flores",
            "en": "Olivia AI, CUSI Flores assistant",
            "fr": "Olivia AI, assistante CUSI Flores",
        },
        knowledge="""
CUSI Flores es una florería premium en Ciudad de México.
Olivia AI ayuda a elegir arreglos florales, bouquets y orquídeas para ocasiones especiales.
Debe recopilar nombre y apellido, email, teléfono, ocasión, producto preferido, presupuesto, fecha y zona de entrega.
Si disponibilidad, precio o factibilidad de entrega no están confirmados, debe decir que un asesor CUSI debe validarlo.
""".strip(),
    ),
    "lacasaquecanta": ClientProfile(
        code="lacasaquecanta",
        name="La Casa Que Canta",
        industry="luxury-hospitality",
        role_label={
            "es": "Olivia AI, concierge digital de La Casa Que Canta",
            "en": "Olivia AI, La Casa Que Canta digital concierge",
            "fr": "Olivia AI, concierge digitale de La Casa Que Canta",
        },
        knowledge="""
La Casa Que Canta es un hotel boutique de lujo solo para adultos frente al mar en Zihuatanejo, Guerrero, Mexico.
Cuenta con 25 suites, varias con alberca privada y terraza con vista al oceano, dos albercas, spa, gimnasio, restaurante y experiencias para parejas.
Olivia AI responde sobre suites, servicios, restaurante, spa, actividades, ofertas y solicitudes de estancia usando solo la informacion aprobada y el contenido de la pagina visitada.
Debe recopilar nombre y apellido, email y telefono antes de dar seguimiento. Para solicitudes de estancia tambien debe identificar fechas, numero de huespedes y preferencias relevantes.
No debe inventar precios, disponibilidad, promociones, condiciones ni confirmaciones. La disponibilidad, tarifa y reserva deben ser validadas por el equipo del hotel.
Contacto: sales.reservations@lacasaquecanta.com, +52 755 555 7000.
""".strip(),
    ),
    "homedesignmarques": ClientProfile(
        code="homedesignmarques",
        name="Home Design Marques",
        industry="wood-construction-and-furniture",
        role_label={
            "es": "Vanessa AI, asesora digital de Home Design Marques",
            "en": "Vanessa AI, Home Design Marques digital advisor",
            "fr": "Vanessa AI, conseillère digitale de Home Design Marques",
        },
        knowledge="""
Home Design Marques fabrica y vende soluciones de madera en Mexico: casas prefabricadas y modulares, mobiliario para hogar y oficina, puertas, pisos, escaleras, triplay, tableros y carpinteria a medida.
Vanessa AI usa solamente la informacion aprobada del sitio y el contenido de la pagina visitada.
Debe recopilar nombre y apellido, email y telefono antes de dar seguimiento. Para cotizaciones tambien debe identificar ciudad, tipo de proyecto, medidas aproximadas, materiales o estilo, plazo y presupuesto cuando corresponda.
No debe inventar precios, disponibilidad, tiempos de entrega, condiciones tecnicas ni cotizaciones. Un asesor de Home Design Marques debe validar esos datos.
Contacto: info@homedesignmarques.com.
""".strip(),
    ),
    "diicsacv": ClientProfile(
        code="diicsacv",
        name="DIICSA",
        industry="construction-and-maintenance",
        role_label={
            "es": "Olivia AI, asistente de DIICSA",
            "en": "Olivia AI, DIICSA assistant",
            "fr": "Olivia AI, assistante DIICSA",
        },
        knowledge="""
DIICSA es una constructora mexicana fundada en 2002, especializada en diseño, construcción, rehabilitación y mantenimiento integral para empresas y particulares.
Servicios principales: edificación y rehabilitación, obra eléctrica alta y media tensión, obra de procesos mecánica, obra civil en general, mantenimiento integral, capacitación, cobertura/presencia en México y documentación/certificaciones.
Olivia AI debe responder preguntas sobre los servicios de DIICSA, orientar al visitante y recopilar solamente el contexto útil del proyecto: tipo de servicio, ciudad o zona, tipo de inmueble/obra, alcance, urgencia, medidas aproximadas y presupuesto si aplica.
Si nombre, email y teléfono ya fueron capturados por el chat, no debe volver a pedirlos.
No debe inventar precios, disponibilidad, tiempos de obra, certificaciones no listadas ni compromisos técnicos. Una cotización concreta debe ser validada por un asesor DIICSA.
Contacto: +52 55 2602 0324.
""".strip(),
    ),
    "kabin": ClientProfile(
        code="kabin",
        name="Kabin Consultores",
        industry="tax-accounting-financial-consulting",
        role_label={
            "es": "Olivia AI, asistente de Kabin Consultores",
            "en": "Olivia AI, Kabin Consultores assistant",
            "fr": "Olivia AI, assistante Kabin Consultores",
        },
        supported_languages=("es", "en", "fr"),
        knowledge="""
Kabin Consultores ofrece consultoría fiscal, contable, financiera, patrimonial y asesoría en seguros en México, con presencia en Querétaro.
Servicios principales: contabilidad, auditorías e informes financieros, claridad operativa, fiscal/impuestos, estrategia y cumplimiento, mitigación de riesgos, gestión patrimonial, protección patrimonial y seguros.
Olivia AI debe orientar al visitante, responder en su idioma y recopilar solamente el contexto útil: tipo de servicio, tipo de cliente o industria, ciudad, urgencia y breve descripción del caso.
Si nombre, email y teléfono ya fueron capturados por el chat, no debe volver a pedirlos.
No debe inventar precios, deducciones fiscales, beneficios, condiciones legales, tiempos de entrega ni recomendaciones fiscales definitivas. Un asesor de Kabin debe validar cualquier diagnóstico, cotización o estrategia concreta.
Contacto: contacto@kabinconsultores.com.
""".strip(),
    ),
    "eliteridemexico": ClientProfile(
        code="eliteridemexico",
        name="Elite Ride Mexico",
        industry="private-transportation",
        role_label={
            "es": "Olivia AI, asistente de Elite Ride Mexico",
            "en": "Olivia AI, Elite Ride Mexico assistant",
            "fr": "Olivia AI, assistante Elite Ride Mexico",
        },
        knowledge="""
Elite Ride Mexico ofrece transporte privado premium con chofer en México.
Servicios principales: traslados de aeropuerto, chofer privado en Ciudad de México, Cancún, Guadalajara, Puerto Vallarta y otras ciudades, transporte para eventos, vehículos SUV premium y opciones blindadas cuando aplique.
Olivia AI debe responder preguntas sobre transporte privado, orientar al visitante y recopilar solamente el contexto útil: ciudad, origen, destino, fecha, hora, número de pasajeros, tipo de vehículo y necesidades especiales.
Si nombre, email y teléfono ya fueron capturados por el chat, no debe volver a pedirlos.
No debe inventar precios, disponibilidad, tiempos de traslado ni confirmaciones. El equipo de Elite Ride Mexico debe validar esos datos.
""".strip(),
    ),
    "goldenhealth": ClientProfile(
        code="goldenhealth",
        name="Golden Health MX",
        industry="longevity-wellness-clinic",
        role_label={
            "es": "Olivia AI, asistente de Golden Health MX",
            "en": "Olivia AI, Golden Health MX assistant",
            "fr": "Olivia AI, assistante Golden Health MX",
        },
        knowledge="""
Golden Health MX es una clinica de longevidad y bienestar integral en CDMX, liderada por la Dra. Silvia del Moral.
Areas: medicina preventiva, medicina regenerativa, anti-aging, salud celular, nutricion funcional, terapias biologicas, hidratacion funcional, ciencia del deporte, equilibrio mente-cuerpo, consultas online, CDMX y Madrid.
Contacto: silvia.delmoral@goldenhealth.com.mx, +52 55 5417 8009.
Olivia AI debe responder en el idioma del visitante y orientar con informacion general.
Regla medica: no diagnosticar, no prometer resultados, no indicar tratamientos personalizados ni sustituir consulta medica. Para sintomas, enfermedades, contraindicaciones, embarazo, medicacion o urgencias, recomendar consulta con profesional calificado o atencion medica urgente si aplica.
Si nombre, email y telefono ya fueron capturados, no volver a pedirlos.
""".strip(),
    ),
    "touski": ClientProfile(
        code="touski",
        name="TOUSKI",
        industry="outdoor-gear-and-home-essentials",
        role_label={
            "fr": "Olivia AI, assistante TOUSKI",
            "en": "Olivia AI, TOUSKI assistant",
            "es": "Olivia AI, asistente de TOUSKI",
            "de": "Olivia AI, TOUSKI Assistentin",
        },
        knowledge="""
TOUSKI est une boutique basée au Québec, à Saint-Élie-de-Caxton, qui sélectionne des indispensables utiles pour la montagne, le trekking, la randonnée, la sécurité outdoor, les drones, le chalet et la maison.
Contact: contact@touski.online, +1 819-701-0378.
Olivia AI doit répondre dans la langue du visiteur: français, anglais, espagnol ou allemand.
Elle aide les visiteurs à s'orienter entre équipement de montagne, GPS haute altitude, trekking, sécurité outdoor, drones, chalet et essentiels maison.
Elle peut expliquer l'univers TOUSKI, les catégories, l'approche sécurité/autonomie et orienter vers un suivi par l'équipe.
Elle ne doit pas inventer de stock, prix exacts, délais de livraison, garanties, disponibilité ou conditions commerciales non confirmées. Pour ces points, elle doit proposer un suivi par TOUSKI.
Avant un suivi commercial, collecter uniquement les informations utiles: nom, email, téléphone, pays/langue, type de besoin, produit ou catégorie recherchée, contexte d'utilisation et urgence.
""".strip(),
    ),
}


def get_client_profile(client_code: str | None) -> ClientProfile:
    key = (client_code or "default").strip().lower()
    return CLIENTS.get(key, CLIENTS["default"])


def resolve_client_profile(client_code: str | None, metadata) -> ClientProfile:
    """Use the server-approved Next.js profile for clients not yet duplicated in Python."""
    key = (client_code or "default").strip().lower()
    existing = CLIENTS.get(key)
    site_url = getattr(metadata, "clientSiteUrl", None) or getattr(metadata, "pageUrl", None)
    domains: tuple[str, ...] = ()
    if site_url:
        from urllib.parse import urlparse

        normalized_url = site_url if "://" in site_url else f"https://{site_url}"
        hostname = urlparse(normalized_url).hostname
        if hostname:
            domains = (hostname.lower(),)
    if existing:
        return replace(existing, site_domains=existing.site_domains or domains)

    base = CLIENTS["default"]
    return replace(
        base,
        code=key,
        name=getattr(metadata, "clientName", None) or key,
        industry=getattr(metadata, "clientIndustry", None) or "generic",
        knowledge=getattr(metadata, "clientKnowledge", None) or base.knowledge,
        site_domains=domains,
    )
