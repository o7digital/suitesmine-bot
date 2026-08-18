import json
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


def build_lead_form(language: str, message: str, missing: list[str]) -> dict:
    labels = {
        "es": {"name": "Nombre", "company": "Empresa", "email": "Email", "phone": "Teléfono", "details": "Detalles de la solicitud"},
        "en": {"name": "Name", "company": "Company", "email": "Email", "phone": "Phone", "details": "Request details"},
        "fr": {"name": "Nom", "company": "Entreprise", "email": "Email", "phone": "Téléphone", "details": "Détails de la demande"},
        "it": {"name": "Nome", "company": "Azienda", "email": "Email", "phone": "Telefono", "details": "Dettagli della richiesta"},
        "de": {"name": "Name", "company": "Unternehmen", "email": "E-Mail", "phone": "Telefon", "details": "Details der Anfrage"},
        "ru": {"name": "Имя", "company": "Компания", "email": "Email", "phone": "Телефон", "details": "Детали запроса"},
    }
    return {
        "fields": ["name", "company", "email", "phone", "details"],
        "required": [*missing, "details"],
        "detailsRows": 3,
        "labels": labels.get(language, labels["en"]),
        "initialDetails": message,
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

    if intent == "booking" and client.code == "suitesmine":
        phase, next_action, reply = local_booking_reply(language, fields, missing, rates)
        return OliviaResponse(
            reply=reply,
            clientCode=client.code,
            language=language,
            intent="booking",
            phase=phase,
            nextAction=next_action,
            collected=fields,
            missingFields=missing,
            bookingUrl=booking_url,
            rates=rates,
        )

    if client.code == "zevicapital" and is_zevi_property_request(request.message):
        return OliviaResponse(
            reply=zevi_property_reply(language),
            clientCode=client.code,
            language=language,
            intent="lead",
            phase="answer",
            nextAction="show_property_list",
            handoffRecommended=False,
            collected=fields,
            missingFields=[],
            rates=[],
        )

    should_collect_contact = client.code != "suitesmine" and not (
        client.code == "vialterna" and intent != "handoff"
    )
    contact_missing = missing_contact_fields(fields) if should_collect_contact else []

    system = f"""
You are {client.role_label.get(language) or client.role_label.get("en")}, a proactive AI hostess, not a generic chatbot.
Speak in {language_name(language)}.
Mission:
- welcome the visitor naturally;
- understand their need;
- use the recent conversation to resolve short follow-ups and references without making the visitor repeat information;
- answer the visitor's concrete business question before requesting contact or project details;
- collect first and last name, email and phone for every non-hotel lead, then collect only useful missing project details;
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
    elif client.code != "suitesmine":
        reply = generic_fallback_reply(language, client, contact_missing)
    elif language == "en":
        reply = f"I am {client.role_label.get('en')}. Tell me your dates, number of guests and preferred category so I can help."
    elif language == "fr":
        reply = f"Je suis {client.role_label.get('fr')}. Indiquez-moi vos dates, le nombre de voyageurs et la categorie souhaitee."
    else:
        reply = f"Soy {client.role_label.get('es')}. Indiqueme sus fechas, numero de huespedes y categoria preferida."

    return OliviaResponse(
        reply=reply,
        clientCode=client.code,
        language=language,
        intent="lead" if contact_missing and intent != "handoff" else intent,
        phase="qualification" if contact_missing else ("answer" if intent != "handoff" else "human_handoff"),
        nextAction="collect_contact_details" if contact_missing else ("reply_to_guest" if intent != "handoff" else "offer_human_operator"),
        handoffRecommended=intent == "handoff",
        collected=fields,
        missingFields=contact_missing,
        bookingUrl=booking_url,
        rates=rates,
        action="show_lead_form" if contact_missing else None,
        leadForm=build_lead_form(language, request.message, contact_missing) if contact_missing else None,
        model=generated.model,
        reasoningTier=generated.tier,
        toolsUsed=generated.tools_used,
        sources=generated.sources,
    )
