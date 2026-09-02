import json
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from olivia_v2.app.clients import ClientProfile
from olivia_v2.app.extraction import (
    extract_fields,
    is_large_group_request,
    is_multiple_room_request,
    missing_booking_fields,
)
from olivia_v2.app.language import language_name
from olivia_v2.app.openai_service import OpenAIService
from olivia_v2.app.schemas import ChatRequest, OliviaResponse


def is_vague_information_request(message: str) -> bool:
    """Return True when Olivia should clarify instead of opening a lead form."""
    normalized = " ".join(message.casefold().strip(" .!?¡¿").split())
    normalized = re.sub(
        r"^(?:(?:hola|buen(?:os días|os dias|as tardes|as noches)|qué tal|que tal|"
        r"hello|hi|good (?:morning|afternoon|evening)|bonjour|bonsoir)[, ]*)+",
        "",
        normalized,
    ).strip()
    exact_requests = {
        "", "buenas", "informacion", "información", "info",
        "busco informacion", "busco información", "busco info",
        "deseo informacion", "deseo información", "deseo info",
        "quiero informacion", "quiero información",
        "quiero mas informacion", "quiero más información",
        "necesito informacion", "necesito información",
        "me puede dar informacion", "me puede dar información",
        "quiero un poco de info", "quiero un poco de informacion",
        "quiero un poco de información", "necesito un poco de info",
        "hello", "hi", "information", "i need information",
        "i would like some information", "bonjour", "informations",
        "je voudrais des informations", "je veux des informations",
    }
    return normalized in exact_requests


def is_vialterna_greeting(message: str) -> bool:
    """Return True only for a greeting with no business question attached."""
    normalized = " ".join(message.casefold().strip(" .!?¡¿").split())
    return bool(re.fullmatch(
        r"(?:(?:hola|buenas|buen(?:os días|os dias|as tardes|as noches)|qué tal|que tal|"
        r"hello|hi|hey|good (?:morning|afternoon|evening)|bonjour|bonsoir)[, ]*)+",
        normalized,
    ))


def is_vialterna_technical_question(message: str) -> bool:
    """Keep technical consulting and implementation details with human specialists."""
    normalized = message.casefold()
    technical_terms = (
        "sd-wan", "sdwan", "superwan", "failover", "qos", "ipsec", "vpn", "vlan",
        "apn", "bgp", "mpls", "latencia", "latency", "ancho de banda", "bandwidth",
        "arquitectura", "architecture", "configur", "implement", "integr", "compatib",
        "protocolo", "protocol", "router", "firewall", "enrut", "túnel", "tunel",
        "topología", "topologia", "topology", "frecuencia", "frequency", "especifica",
        "diagnóst", "diagnost", "cobertura", "coverage", "sla", "sim", "esim", "iot",
        "lte", "5g", "satel", "fibra", "cómo funciona", "como funciona", "how does",
        "how do", "recomiend", "recommend", "technical", "técnic", "tecnic",
        "conectar", "connect ", "conectividad", "connectivity", "terminal de cobro",
        "terminales de cobro", "payment terminal", "punto de venta", "puntos de venta",
        "point of sale", "pos terminal", "sucursales", "branches", "interrupciones",
        "interruptions", "respaldo", "redundancy", "multioperador", "multi-operator",
    )
    return any(term in normalized for term in technical_terms)


def vialterna_technical_reply(language: str) -> str:
    replies = {
        "es": (
            "Para asegurar una respuesta correcta, las preguntas técnicas deben ser revisadas por un especialista de Vialterna. "
            "Compártanos sus datos y lo contactaremos a la brevedad."
        ),
        "en": (
            "To ensure an accurate answer, technical questions must be reviewed by a Vialterna specialist. "
            "Please share your contact details and we will contact you shortly."
        ),
        "fr": (
            "Pour garantir une réponse exacte, les questions techniques doivent être examinées par un spécialiste Vialterna. "
            "Je ne peux pas fournir de conseil technique dans ce chat. Si vous souhaitez parler à un spécialiste, dites-le-moi."
        ),
    }
    return replies.get(language, replies["es"])


def is_raquel_technical_question(message: str) -> bool:
    normalized = message.casefold()
    terms = (
        "estructura", "estructural", "ciment", "muro de carga", "instalación",
        "instalacion", "eléctric", "electric", "hidrául", "hidraul", "plano",
        "cálculo", "calculo", "normativa", "permiso", "licencia", "viabilidad",
        "material", "aislamiento", "impermeabil", "demoler", "construcción",
        "construction", "structural", "foundation", "load-bearing", "technical",
        "building code", "planning permission", "feasibility", "how to build",
        "cómo construir", "como construir", "recommend", "recomiend",
    )
    return any(term in normalized for term in terms)


def raquel_technical_reply(language: str) -> str:
    replies = {
        "es": "Para asegurar una respuesta correcta, las preguntas técnicas deben ser revisadas por Raquel Hedo o un especialista. Compártenos tus datos y un breve mensaje, y te contactaremos a la brevedad.",
        "en": "To ensure an accurate answer, technical questions must be reviewed by Raquel Hedo or a specialist. Please share your contact details and a brief message, and we will contact you shortly.",
        "fr": "Pour garantir une réponse exacte, les questions techniques doivent être examinées par Raquel Hedo ou un spécialiste. Partagez vos coordonnées et un bref message, et nous vous contacterons rapidement.",
        "it": "Per garantire una risposta corretta, le domande tecniche devono essere esaminate da Raquel Hedo o da uno specialista. Condivida i suoi dati e un breve messaggio e la contatteremo al più presto.",
        "de": "Für eine korrekte Antwort müssen technische Fragen von Raquel Hedo oder einer Fachperson geprüft werden. Teilen Sie uns Ihre Kontaktdaten und eine kurze Nachricht mit; wir melden uns zeitnah.",
        "pt": "Para garantir uma resposta correta, as perguntas técnicas devem ser analisadas por Raquel Hedo ou por um especialista. Compartilhe seus dados e uma breve mensagem, e entraremos em contato em breve.",
    }
    return replies.get(language, replies["es"])


def vialterna_greeting_reply(language: str, message: str = "") -> str:
    normalized = message.casefold()
    if language == "es":
        if "tardes" in normalized:
            return "¡Hola, buenas tardes! ¿En qué podemos ayudarle?"
        if "noches" in normalized:
            return "¡Hola, buenas noches! ¿En qué podemos ayudarle?"
        if "día" in normalized or "dia" in normalized or "días" in normalized or "dias" in normalized:
            return "¡Hola, buenos días! ¿En qué podemos ayudarle?"
    replies = {
        "es": "¡Hola! ¿En qué podemos ayudarle hoy?",
        "en": "Hello! Of course, happy to help. How can we assist you today?",
        "fr": "Bonjour ! Bien sûr, avec plaisir. Comment pouvons-nous vous aider aujourd’hui ?",
    }
    return replies.get(language, replies["es"])


def visitor_turn_count(request: ChatRequest) -> int:
    """Count completed visitor turns without treating the widget welcome as a turn."""
    return sum(1 for item in request.history if item.role == "user")


def uses_natural_lead_handoff(client: ClientProfile) -> bool:
    """Keep transactional and answer-only experiences out of the generic sales handoff."""
    return client.code not in {"suitesmine", "kallistacafe"}


def advisor_handoff_reply(language: str, client: ClientProfile) -> str:
    if client.code == "vialterna":
        vialterna_replies = {
            "es": (
                "Para asegurar una respuesta correcta, las preguntas técnicas deben ser revisadas por un especialista de Vialterna. "
                "Compártanos sus datos y lo contactaremos a la brevedad."
            ),
            "en": (
                "To ensure an accurate answer, technical questions must be reviewed by a Vialterna specialist. "
                "Please share your contact details and we will contact you shortly."
            ),
        }
        if language in vialterna_replies:
            return vialterna_replies[language]
    replies = {
        "es": (
            f"Claro, con mucho gusto. Le canalizo con un asesor de {client.name}. "
            "Enseguida le comparto nuestro formulario para que pueda dejarnos sus datos."
        ),
        "en": (
            f"Of course, with pleasure. I’ll connect you with a {client.name} advisor. "
            "I’ll share our form with you shortly so you can leave your details."
        ),
        "fr": (
            f"Bien sûr, avec plaisir. Je vous mets en relation avec un conseiller {client.name}. "
            "Je vous transmets notre formulaire dans un instant afin que vous puissiez laisser vos coordonnées."
        ),
        "it": (
            f"Certamente, con piacere. La metto in contatto con un consulente di {client.name}. "
            "Tra poco le mostrerò il modulo per lasciare i suoi dati."
        ),
        "de": (
            f"Sehr gern. Ich leite Ihre Anfrage an einen Berater von {client.name} weiter. "
            "Gleich zeige ich Ihnen unser Formular, in dem Sie Ihre Kontaktdaten hinterlassen können."
        ),
        "ru": (
            f"Конечно. Я передам ваш запрос консультанту {client.name}. "
            "Через несколько секунд появится форма, где можно оставить контактные данные."
        ),
    }
    return replies.get(language, replies["es"])


def clarification_reply(language: str, client: ClientProfile) -> str:
    replies = {
        "es": f"Claro, con gusto. ¿Qué tipo de información busca sobre {client.name}? Cuénteme brevemente qué necesita.",
        "en": f"Of course, happy to help. What would you like to know about {client.name}? Tell me briefly what you need.",
        "fr": f"Bien sûr, avec plaisir. Que souhaitez-vous savoir sur {client.name} ? Expliquez-moi brièvement votre besoin.",
        "it": f"Certamente. Che cosa desidera sapere su {client.name}? Mi descriva brevemente la sua richiesta.",
        "de": f"Sehr gern. Was möchten Sie über {client.name} wissen? Beschreiben Sie kurz Ihr Anliegen.",
        "ru": f"Конечно. Что вы хотели бы узнать о {client.name}? Кратко опишите ваш запрос.",
    }
    return replies.get(language, replies["es"])


def build_booking_url(language: str, fields) -> str:
    base = (
        "https://hotels.cloudbeds.com/en/reservation/UeErs0"
        if language == "en"
        else "https://hotels.cloudbeds.com/es/reservation/UeErs0"
    )
    params = {
        "currency": "usd",
        "kids": "0",
    }
    if fields.checkIn:
        params["checkin"] = fields.checkIn
    if fields.checkOut:
        params["checkout"] = fields.checkOut
    if fields.guests:
        params["guests"] = fields.guests
        params["adults"] = fields.guests
    return f"{base}?{urlencode(params)}"


def format_rates(rates: list[dict]) -> str:
    if not rates:
        return "No live rates are available for these dates."
    lines = []
    for room in rates:
        nightly = room.get("roomRateDetailed", [{}])[0].get("rate") if room.get("roomRateDetailed") else room.get("roomRate")
        lines.append(
            f"{room.get('roomTypeName', 'Room')}: {room.get('roomsAvailable', 'n/a')} available, "
            f"{nightly or 'n/a'} MXN/night, total {room.get('totalRate', 'n/a')} MXN"
        )
    return "\n".join(lines)


def localized_missing_fields(language: str, missing: list[str]) -> list[str]:
    labels = {
        "es": {
            "name": "nombre y apellido",
            "email": "email",
            "phone": "telefono",
            "checkIn": "llegada",
            "checkOut": "salida",
            "guests": "numero de huespedes",
            "roomType": "categoria de habitacion",
        },
        "fr": {
            "name": "nom et prenom",
            "email": "email",
            "phone": "telephone",
            "checkIn": "date d'arrivee",
            "checkOut": "date de depart",
            "guests": "nombre de voyageurs",
            "roomType": "categorie de chambre",
        },
        "en": {
            "name": "first and last name",
            "email": "email",
            "phone": "phone",
            "checkIn": "check-in",
            "checkOut": "check-out",
            "guests": "number of guests",
            "roomType": "room category",
        },
        "it": {
            "name": "nome e cognome",
            "email": "email",
            "phone": "telefono",
            "checkIn": "arrivo",
            "checkOut": "partenza",
            "guests": "numero di ospiti",
            "roomType": "categoria di camera",
        },
        "de": {
            "name": "Vor- und Nachname",
            "email": "E-Mail",
            "phone": "Telefon",
            "checkIn": "Anreise",
            "checkOut": "Abreise",
            "guests": "Anzahl der Gäste",
            "roomType": "Zimmerkategorie",
        },
        "ru": {
            "name": "имя и фамилия",
            "email": "email",
            "phone": "телефон",
            "checkIn": "дата заезда",
            "checkOut": "дата выезда",
            "guests": "количество гостей",
            "roomType": "категория номера",
        },
    }
    language_labels = labels.get(language, labels["es"])
    return [language_labels.get(field, field) for field in missing]


def missing_contact_fields(fields) -> list[str]:
    missing = []
    if not fields.name:
        missing.append("name")
    if not fields.email:
        missing.append("email")
    if not fields.phone:
        missing.append("phone")
    return missing


def build_lead_form(
    language: str,
    message: str,
    missing: list[str],
    client_code: str = "",
    industry: str = "",
) -> dict:
    del missing  # The handoff form is intentionally complete and consistent.
    b2b_industries = {
        "managed-connectivity", "real-estate-investment", "virtual-administrative-assistant",
        "virtual-administrative-services", "construction-and-maintenance",
        "wood-construction-and-furniture", "tax-accounting-financial-consulting",
        "financial-consulting", "cybersecurity", "technology", "generic",
        "global-it-services-and-cybersecurity", "infrastructure-security-and-it-services",
        "cybersecurity-and-managed-it", "fractional-cfo-and-strategic-finance",
    }
    detail_labels = {
        "vialterna": {"es": "Necesidad", "en": "Request", "fr": "Besoin"},
        "zevicapital": {"es": "Proyecto, zona y presupuesto", "en": "Project, area and budget", "fr": "Projet, zone et budget"},
        "elite7piel": {"es": "Producto o necesidad", "en": "Product or need", "fr": "Produit ou besoin"},
        "jeanlouisdavid": {"es": "Servicio, sucursal y fecha", "en": "Service, branch and date", "fr": "Service, salon et date"},
        "cervantesbienesraices": {"es": "Operación, zona y presupuesto", "en": "Transaction, area and budget", "fr": "Opération, zone et budget"},
        "cusi": {"es": "Ocasión, entrega y presupuesto", "en": "Occasion, delivery and budget", "fr": "Occasion, livraison et budget"},
        "lacasaquecanta": {"es": "Fechas, huéspedes y solicitud", "en": "Dates, guests and request", "fr": "Dates, voyageurs et demande"},
        "homedesignmarques": {"es": "Proyecto, medidas y ciudad", "en": "Project, dimensions and city", "fr": "Projet, dimensions et ville"},
        "diicsacv": {"es": "Proyecto, ubicación y urgencia", "en": "Project, location and urgency", "fr": "Projet, lieu et urgence"},
        "kabin": {"es": "Servicio y breve descripción", "en": "Service and brief description", "fr": "Service et brève description"},
        "eliteridemexico": {"es": "Ruta, fecha y pasajeros", "en": "Route, date and passengers", "fr": "Trajet, date et passagers"},
        "goldenhealth": {"es": "Motivo de consulta", "en": "Reason for consultation", "fr": "Motif de consultation"},
        "touski": {"es": "Producto y uso previsto", "en": "Product and intended use", "fr": "Produit et utilisation prévue"},
        "gescom": {"es": "Necesidad administrativa", "en": "Administrative need", "fr": "Besoin administratif"},
        "archivomac": {"es": "Equipo y reparación", "en": "Device and repair", "fr": "Appareil et réparation"},
        "dosalga": {"es": "Producto o consulta", "en": "Product or request", "fr": "Produit ou demande"},
        "aoitgroup": {"es": "Necesidad tecnológica", "en": "Technology need", "fr": "Besoin technologique"},
        "infrasegura": {"es": "Necesidad tecnológica", "en": "Technology need", "fr": "Besoin technologique"},
        "securyti": {"es": "Necesidad de seguridad o TI", "en": "Security or IT need", "fr": "Besoin sécurité ou TI"},
        "lacaqc": {"es": "Fechas, huéspedes y solicitud", "en": "Dates, guests and request", "fr": "Dates, voyageurs et demande"},
        "nodejewelry": {"es": "Pieza o pedido privado", "en": "Piece or private order", "fr": "Pièce ou commande privée"},
        "neurodiversa": {"es": "Motivo de consulta", "en": "Reason for consultation", "fr": "Motif de consultation"},
        "cenotemaravilla": {"es": "Fecha, visitantes y actividad", "en": "Date, visitors and activity", "fr": "Date, visiteurs et activité"},
        "finidi": {"es": "Necesidad financiera", "en": "Financial need", "fr": "Besoin financier"},
    }
    localized_labels = {
        "es": {"firstName": "Nombre", "lastName": "Apellido", "company": "Empresa", "email": "Email", "phone": "Teléfono", "details": "Necesidad"},
        "en": {"firstName": "First name", "lastName": "Last name", "company": "Company", "email": "Email", "phone": "Phone", "details": "Request"},
        "fr": {"firstName": "Prénom", "lastName": "Nom", "company": "Entreprise", "email": "Email", "phone": "Téléphone", "details": "Besoin"},
        "it": {"firstName": "Nome", "lastName": "Cognome", "company": "Azienda", "email": "Email", "phone": "Telefono", "details": "Richiesta"},
        "de": {"firstName": "Vorname", "lastName": "Nachname", "company": "Unternehmen", "email": "E-Mail", "phone": "Telefon", "details": "Anfrage"},
        "ru": {"firstName": "Имя", "lastName": "Фамилия", "company": "Компания", "email": "Email", "phone": "Телефон", "details": "Запрос"},
    }
    labels = dict(localized_labels.get(language, localized_labels["es"]))
    labels["details"] = detail_labels.get(client_code, {}).get(language, labels["details"])
    fields = ["firstName", "lastName"]
    if industry in b2b_industries or client_code == "vialterna":
        fields.append("company")
    fields.extend(["email", "phone", "details"])
    return {
        "fields": fields,
        "required": fields,
        "detailsRows": 3,
        "labels": labels,
        "initialDetails": message,
        "delayMinMs": 5000,
        "delayMaxMs": 12000,
    }


def generic_fallback_reply(language: str, client: ClientProfile, contact_missing: list[str]) -> str:
    role = client.role_label.get(language) or client.role_label.get("en") or client.name
    missing = ", ".join(localized_missing_fields(language, contact_missing))
    replies = {
        "es": f"Soy {role}. Cuénteme qué necesita y le orientaré con la información disponible.",
        "en": f"I am {role}. Tell me what you need and I will guide you with the available information.",
        "fr": f"Je suis {role}. Expliquez-moi votre besoin et je vous guiderai avec les informations disponibles.",
        "it": f"Sono {role}. Mi dica di cosa ha bisogno e la guiderò con le informazioni disponibili.",
        "de": f"Ich bin {role}. Beschreiben Sie Ihr Anliegen, und ich helfe Ihnen mit den verfügbaren Informationen.",
        "ru": f"Я {role}. Расскажите, что вам нужно, и я помогу на основе доступной информации.",
    }
    reply = replies.get(language, replies["en"])
    if missing:
        prompts = {
            "es": f" Para darle seguimiento, también puede compartir: {missing}.",
            "en": f" For follow-up, you can also share: {missing}.",
            "fr": f" Pour assurer le suivi, vous pouvez aussi indiquer : {missing}.",
            "it": f" Per il seguito, può anche indicare: {missing}.",
            "de": f" Für die weitere Bearbeitung können Sie außerdem Folgendes angeben: {missing}.",
            "ru": f" Для продолжения вы также можете указать: {missing}.",
        }
        reply += prompts.get(language, prompts["en"])
    return reply


ZEVI_DIRECTUS_URL = "https://zevicapital-directus-backend-lc-inmobiliaria.up.railway.app"
ZEVI_SITE_URL = "https://www.zevicapital.com"


def is_zevi_property_request(message: str) -> bool:
    text = message.lower()
    triggers = [
        "propiedad", "propiedades", "bienes", "bien", "inmueble", "inmuebles",
        "anuncio", "anuncios", "lista", "listado", "zona esmeralda", "for rent",
        "for sale", "renta", "venta", "comprar", "rent", "sale", "property",
        "properties", "listing", "listings", "real estate",
    ]
    return any(trigger in text for trigger in triggers)


def fetch_zevi_properties() -> list[dict]:
    params = urlencode(
        {
            "fields": "id,title,price,price_text,currency,location,address,listing_status,tag,sqft,bedrooms,bathrooms,public_url",
            "limit": "6",
            "filter[status][_eq]": "published",
        }
    )
    url = f"{ZEVI_DIRECTUS_URL}/items/properties?{params}"
    try:
        with urlopen(url, timeout=6) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, ValueError):
        return []
    data = payload.get("data")
    return data if isinstance(data, list) else []


def format_money(value, currency: str | None, price_text: str | None) -> str:
    if price_text:
        return price_text
    try:
        amount = float(value)
    except (TypeError, ValueError):
        return "precio bajo solicitud"
    if amount <= 0:
        return "precio bajo solicitud"
    code = currency or "MXN"
    return f"${amount:,.0f} {code}"


def zevi_property_reply(language: str) -> str:
    properties = fetch_zevi_properties()
    if not properties:
        if language == "en":
            return (
                "You can see ZeVi Capital's current property opportunities here:\n"
                f"{ZEVI_SITE_URL}/#properties\n\n"
                "I can help you filter them by area, budget, use case or investment objective."
            )
        if language == "fr":
            return (
                "Vous pouvez consulter les opportunités immobilières actuelles de ZeVi Capital ici :\n"
                f"{ZEVI_SITE_URL}/#properties\n\n"
                "Je peux vous aider à les filtrer par zone, budget, usage ou objectif d'investissement."
            )
        return (
            "Puedes ver las oportunidades inmobiliarias actuales de ZeVi Capital aquí:\n"
            f"{ZEVI_SITE_URL}/#properties\n\n"
            "Puedo ayudarte a filtrarlas por zona, presupuesto, uso u objetivo de inversión."
        )

    lines = []
    for item in properties:
        link = item.get("public_url") or f"{ZEVI_SITE_URL}/listing_details_01?id={item.get('id')}"
        details = [
            item.get("listing_status") or item.get("tag"),
            item.get("location") or item.get("address"),
            format_money(item.get("price"), item.get("currency"), item.get("price_text")),
        ]
        specs = []
        if item.get("sqft"):
            specs.append(f"{item.get('sqft')} sqft")
        if item.get("bedrooms"):
            specs.append(f"{item.get('bedrooms')} rec.")
        if item.get("bathrooms"):
            specs.append(f"{item.get('bathrooms')} baños")
        if specs:
            details.append(", ".join(specs))
        lines.append(f"- {item.get('title') or 'Propiedad'} — {' · '.join(str(x) for x in details if x)}\n  {link}")

    if language == "en":
        intro = "These are the current ZeVi Capital property opportunities I found:"
        outro = f"\n\nFull property section: {ZEVI_SITE_URL}/#properties\nTell me the area or budget and I will narrow the list."
    elif language == "fr":
        intro = "Voici les opportunités immobilières ZeVi Capital disponibles :"
        outro = f"\n\nSection complète : {ZEVI_SITE_URL}/#properties\nIndiquez-moi la zone ou le budget et je filtre la liste."
    else:
        intro = "Estas son las oportunidades inmobiliarias actuales de ZeVi Capital:"
        outro = f"\n\nSección completa: {ZEVI_SITE_URL}/#properties\nDime la zona o presupuesto y te filtro la lista."
    return intro + "\n\n" + "\n".join(lines) + outro


def local_booking_reply(language: str, fields, missing: list[str], rates: list[dict]) -> tuple[str, str, str]:
    if missing:
        readable_missing = localized_missing_fields(language, missing)
        if language == "en":
            return (
                "booking_intake",
                "collect_missing_booking_fields",
                "I can take care of the reservation intake. Please send the missing details: "
                + ", ".join(readable_missing)
                + ". Valid categories are Studio, Suite or Double Suite.",
            )
        if language == "fr":
            return (
                "booking_intake",
                "collect_missing_booking_fields",
                "Je peux preparer la demande de reservation. Envoyez-moi les informations manquantes: "
                + ", ".join(readable_missing)
                + ". Les categories sont Estudio, Suite ou Suite Doble.",
            )
        return (
            "booking_intake",
            "collect_missing_booking_fields",
            "Puedo preparar la solicitud de reserva. Envieme los datos faltantes: "
            + ", ".join(readable_missing)
            + ". Las categorias son Estudio, Suite o Suite Doble.",
        )

    booking_url = build_booking_url(language, fields)
    selected = next((r for r in rates if str(r.get("roomTypeName", "")).lower() == fields.roomType.lower()), None)
    available = int(selected.get("roomsAvailable", 0)) if selected and str(selected.get("roomsAvailable", "")).isdigit() else 0
    if selected:
        if language == "en":
            availability = (
                f"Live Cloudbeds availability: {available} {fields.roomType} unit(s) still available for these dates."
                if available > 0
                else f"Live Cloudbeds availability: {fields.roomType} is fully booked for these dates."
            )
        else:
            availability = (
                f"Disponibilidad Cloudbeds en vivo: quedan {available} unidad(es) {fields.roomType} para estas fechas."
                if available > 0
                else f"Disponibilidad Cloudbeds en vivo: {fields.roomType} esta completo para estas fechas."
            )
    else:
        availability = (
            "Live Cloudbeds availability: no live availability was returned for this category."
            if language == "en"
            else "Disponibilidad Cloudbeds en vivo: no se recibio disponibilidad en vivo para esta categoria."
        )
    price = ""
    if selected:
        price = f"\nTarifa estimada: {selected.get('totalRate', 'n/a')} USD total."
    if language == "en":
        if selected and available <= 0:
            return (
                "availability_check",
                "offer_alternative_dates_or_category",
                f"Request summary:\n\nName: {fields.name}\nEmail: {fields.email}\nPhone: {fields.phone}\nCheck-in: {fields.checkIn}\nCheck-out: {fields.checkOut}\nGuests: {fields.guests}\nCategory: {fields.roomType}\n\n{availability}\n\nI should not send the payment or booking link for a sold-out category. Please choose another category or different dates.",
            )
        return (
            "availability_check",
            "send_cloudbeds_availability_link",
            f"Request summary:\n\nName: {fields.name}\nEmail: {fields.email}\nPhone: {fields.phone}\nCheck-in: {fields.checkIn}\nCheck-out: {fields.checkOut}\nGuests: {fields.guests}\nCategory: {fields.roomType}\n\n{availability}{price}\n\nCloudbeds test booking engine:\n{booking_url}\n\nYou can continue the reservation in the Cloudbeds test booking engine. Payment and confirmation happen only inside Cloudbeds.",
        )
    if selected and available <= 0:
        return (
            "availability_check",
            "offer_alternative_dates_or_category",
            f"Resumen de solicitud:\n\nNombre: {fields.name}\nEmail: {fields.email}\nTelefono: {fields.phone}\nLlegada: {fields.checkIn}\nSalida: {fields.checkOut}\nHuespedes: {fields.guests}\nCategoria: {fields.roomType}\n\n{availability}\n\nNo debo enviar link de pago ni de reserva para una categoria sin disponibilidad. Por favor elija otra categoria u otras fechas.",
        )
    return (
        "availability_check",
        "send_cloudbeds_availability_link",
        f"Resumen de solicitud:\n\nNombre: {fields.name}\nEmail: {fields.email}\nTelefono: {fields.phone}\nLlegada: {fields.checkIn}\nSalida: {fields.checkOut}\nHuespedes: {fields.guests}\nCategoria: {fields.roomType}\n\n{availability}{price}\n\nMotor de reserva Cloudbeds TEST:\n{booking_url}\n\nPuede continuar la reserva en el motor de reserva Cloudbeds de prueba. El pago y la confirmacion se hacen solamente dentro de Cloudbeds.",
    )


async def build_hostess_response(
    *,
    request: ChatRequest,
    client: ClientProfile,
    language: str,
    intent: str,
    rates: list[dict],
    openai_service: OpenAIService,
) -> OliviaResponse:
    fields = extract_fields(request.message, request.metadata)
    missing = missing_booking_fields(fields)
    booking_url = build_booking_url(language, fields) if not missing and client.code == "suitesmine" else None
    prior_visitor_turns = visitor_turn_count(request)
    contact_missing = missing_contact_fields(fields)
    is_property_request = client.code == "zevicapital" and is_zevi_property_request(request.message)
    natural_lead_flow = uses_natural_lead_handoff(client) and not is_property_request
    is_vialterna_technical = client.code == "vialterna" and is_vialterna_technical_question(request.message)
    is_raquel_technical = client.code == "raquelhedo" and is_raquel_technical_question(request.message)

    if natural_lead_flow and prior_visitor_turns == 0 and is_vialterna_greeting(request.message):
        return OliviaResponse(
            reply=vialterna_greeting_reply(language, request.message),
            clientCode=client.code,
            language=language,
            intent="faq",
            phase="greeting",
            nextAction="clarify_need",
            handoffRecommended=False,
            collected=fields,
            missingFields=[],
            rates=[],
            action=None,
            leadForm=None,
        )

    if natural_lead_flow and prior_visitor_turns == 0 and is_vague_information_request(request.message):
        return OliviaResponse(
            reply=clarification_reply(language, client),
            clientCode=client.code,
            language=language,
            intent="faq",
            phase="answer",
            nextAction="clarify_need",
            handoffRecommended=False,
            collected=fields,
            missingFields=[],
            rates=[],
            action=None,
            leadForm=None,
        )

    should_open_lead_form = (
        natural_lead_flow
        and not is_vialterna_technical
        and not is_raquel_technical
        and bool(contact_missing)
        and (prior_visitor_turns >= 1 or intent in {"pricing", "handoff"})
    )
    if should_open_lead_form:
        return OliviaResponse(
            reply=advisor_handoff_reply(language, client),
            clientCode=client.code,
            language=language,
            intent="pricing" if intent == "pricing" else "handoff",
            phase="human_handoff",
            nextAction="collect_contact_details",
            handoffRecommended=True,
            collected=fields,
            missingFields=[],
            rates=[],
            action="show_lead_form",
            leadForm=build_lead_form(
                language, request.message, contact_missing, client.code, client.industry
            ),
        )

    if is_vialterna_technical:
        return OliviaResponse(
            reply=vialterna_technical_reply(language),
            clientCode=client.code,
            language=language,
            intent="faq",
            phase="human_handoff",
            nextAction="collect_contact_details",
            handoffRecommended=True,
            collected=fields,
            missingFields=[],
            rates=[],
            action="show_lead_form",
            leadForm=build_lead_form(
                language, request.message, contact_missing, client.code, client.industry
            ),
        )

    if is_raquel_technical:
        return OliviaResponse(
            reply=raquel_technical_reply(language), clientCode=client.code,
            language=language, intent="faq", phase="human_handoff",
            nextAction="collect_contact_details", handoffRecommended=True,
            collected=fields, missingFields=[], rates=[], action="show_lead_form",
            leadForm=build_lead_form(language, request.message, contact_missing, client.code, client.industry),
        )

    if client.code == "suitesmine" and (
        is_large_group_request(request.message)
        or is_multiple_room_request(request.message)
    ):
        if language == "en":
            reply = (
                "For special requests, please contact the hotel directly via WhatsApp "
                "or by phone at +52 55 36 66 85 35."
            )
        elif language == "fr":
            reply = (
                "Pour les demandes particulieres, contactez directement l'hotel via WhatsApp "
                "ou par telephone au +52 55 36 66 85 35."
            )
        else:
            reply = (
                "Para solicitudes especiales, contacte directamente al hotel via WhatsApp "
                "o por telefono al +52 55 36 66 85 35."
            )
        return OliviaResponse(
            reply=reply,
            clientCode=client.code,
            language=language,
            intent="handoff",
            phase="human_handoff",
            nextAction="offer_human_operator",
            handoffRecommended=True,
            collected=fields,
            missingFields=[],
            rates=[],
        )

    # Any client with a live data connector (Cloudbeds rates, Zevi listings, ...) gets that data
    # injected as ground truth so the AI writes the reply instead of a fixed template.
    is_booking_flow = intent == "booking" and client.code == "suitesmine"
    booking_phase = booking_next_action = booking_fallback_reply = None
    if is_booking_flow:
        booking_phase, booking_next_action, booking_fallback_reply = local_booking_reply(
            language, fields, missing, rates
        )

    zevi_fallback_reply = zevi_property_reply(language) if is_property_request else None

    answer_first_clients = {"kallistacafe"}
    should_collect_contact = (
        not natural_lead_flow
        and client.code != "suitesmine"
        and not (client.code in answer_first_clients and intent != "handoff")
    )
    contact_missing = missing_contact_fields(fields) if should_collect_contact else []
    contact_mission = (
        "- this is the first visitor exchange: answer briefly from approved information and ask one natural question to understand the need; do not request personal data or mention the form yet;"
        if natural_lead_flow
        else "- for KALLISTA Café, never request personal data during ordinary questions; offer the site contact form or Instagram only when the visitor requests human follow-up or needs confirmation of unpublished information;"
        if client.code == "kallistacafe"
        else "- collect first and last name, email and phone for every non-hotel lead, then collect only useful missing project details;"
    )

    booking_mission = ""
    if is_booking_flow:
        readable_missing = ", ".join(localized_missing_fields(language, missing)) if missing else "nothing else"
        booking_mission = (
            "\n- the guest is in a reservation flow; use the deterministic booking status below as ground truth "
            "for availability, pricing and the booking link, never contradict it or invent a different one; "
            f"if fields are still missing, ask only for: {readable_missing}; valid room categories are "
            "Estudio/Studio, Suite, Suite Doble/Double Suite, never ask for a room number; "
            "do not say the reservation is confirmed or paid, payment and confirmation happen only inside Cloudbeds; "
            "still answer any other question the guest asked in the same message."
        )

    property_mission = ""
    if is_property_request:
        property_mission = (
            "\n- use the deterministic property data below as ground truth; do not invent properties, prices "
            "or availability beyond it; help the guest narrow the list by area, budget or use case."
        )

    live_data_sections = []
    if is_booking_flow:
        live_data_sections.append(f"Deterministic booking status (facts, do not contradict):\n{booking_fallback_reply}")
    if is_property_request:
        live_data_sections.append(f"Deterministic property data (facts, do not contradict):\n{zevi_fallback_reply}")

    system = f"""
You are {client.role_label.get(language) or client.role_label.get("en")}, a proactive AI hostess, not a generic chatbot.
Speak in {language_name(language)}.
Mission:
- welcome the visitor naturally;
- understand their need;
- use the recent conversation to resolve short follow-ups and references without making the visitor repeat information;
- answer the visitor's concrete business question before requesting contact or project details;
{contact_mission}{booking_mission}{property_mission}
- for Vialterna, never provide prices, technical explanations, technical advice, configurations, specifications, architecture, coverage or SLA details; a price, quote or proposal request must be routed to the commercial contact form, while a technical question must only state calmly that a specialist must validate it without automatically collecting contact details;
- for Raquel Hedo, never provide technical, structural, regulatory or feasibility advice, or invent fees, budgets, schedules or availability; route those questions to Raquel or a specialist and collect contact details plus the project message;
- when missingContactFields are present, end with one brief invitation to provide them; do not make them a condition for answering;
- if name, email and phone are already present in metadata.lead or collected, do not ask for them again; answer the visitor's business question directly, then ask only for missing project context if needed;
- answer from approved client context only;
- keep responses concise and operational;
- recommend human handoff for urgent, sensitive, unclear or unsupported requests.

Client context:
{client.knowledge}

Page context from the visited site, if provided:
Title: {request.metadata.model_dump().get("pageTitle", "")}
{str(request.metadata.model_dump().get("pageContent", ""))[:5000]}

Live rates, if relevant:
{format_rates(rates)}

{chr(10).join(live_data_sections)}
""".strip()
    user = json.dumps(
        {
            "message": request.message,
            "metadata": request.metadata.model_dump(),
            "intent": intent,
            "collected": fields.model_dump(),
            "missingContactFields": contact_missing,
        },
        ensure_ascii=True,
    )
    generated = await openai_service.generate(system, user, request, client, rates)
    if generated.text:
        reply = generated.text.strip()
    elif is_booking_flow:
        reply = booking_fallback_reply
    elif is_property_request:
        reply = zevi_fallback_reply
    elif client.code != "suitesmine":
        reply = generic_fallback_reply(language, client, contact_missing)
    elif language == "en":
        reply = f"I am {client.role_label.get('en')}. Tell me your dates, number of guests and preferred category so I can help."
    elif language == "fr":
        reply = f"Je suis {client.role_label.get('fr')}. Indiquez-moi vos dates, le nombre de voyageurs et la categorie souhaitee."
    else:
        reply = f"Soy {client.role_label.get('es')}. Indiqueme sus fechas, numero de huespedes y categoria preferida."

    if is_booking_flow:
        resp_intent, resp_phase, resp_next_action = "booking", booking_phase, booking_next_action
        resp_missing, resp_action, resp_lead_form = missing, None, None
    elif is_property_request:
        resp_intent, resp_phase, resp_next_action = "lead", "answer", "show_property_list"
        resp_missing, resp_action, resp_lead_form = [], None, None
    else:
        resp_intent = "lead" if contact_missing and intent != "handoff" else intent
        resp_phase = "qualification" if contact_missing else ("answer" if intent != "handoff" else "human_handoff")
        resp_next_action = (
            "collect_contact_details" if contact_missing else ("reply_to_guest" if intent != "handoff" else "offer_human_operator")
        )
        resp_missing = contact_missing
        resp_action = "show_lead_form" if contact_missing else None
        resp_lead_form = (
            build_lead_form(language, request.message, contact_missing, client.code, client.industry)
            if contact_missing
            else None
        )

    return OliviaResponse(
        reply=reply,
        clientCode=client.code,
        language=language,
        intent=resp_intent,
        phase=resp_phase,
        nextAction=resp_next_action,
        handoffRecommended=intent == "handoff",
        collected=fields,
        missingFields=resp_missing,
        bookingUrl=booking_url,
        rates=rates,
        action=resp_action,
        leadForm=resp_lead_form,
        model=generated.model,
        reasoningTier=generated.tier,
        toolsUsed=generated.tools_used,
        sources=generated.sources,
    )
