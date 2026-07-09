import json
from urllib.parse import urlencode

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


def contact_qualification_reply(language: str, client: ClientProfile, fields, message: str) -> tuple[str, list[str]] | None:
    missing = missing_contact_fields(fields)
    if not missing:
        return None
    labels = localized_missing_fields(language, missing)
    if language == "en":
        return (
            f"I can help with {client.name}. To give proper follow-up, please send: {', '.join(labels)}.",
            missing,
        )
    if language == "fr":
        return (
            f"Je peux vous aider avec {client.name}. Pour assurer le bon suivi, envoyez-moi : {', '.join(labels)}.",
            missing,
        )
    return (
        f"Puedo ayudarle con {client.name}. Para darle seguimiento correctamente, envíeme: {', '.join(labels)}.",
        missing,
    )


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
                "or by phone at +52 55 36 66 85 85."
            )
        elif language == "fr":
            reply = (
                "Pour les demandes particulieres, contactez directement l'hotel via WhatsApp "
                "ou par telephone au +52 55 36 66 85 85."
            )
        else:
            reply = (
                "Para solicitudes especiales, contacte directamente al hotel via WhatsApp "
                "o por telefono al +52 55 36 66 85 85."
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

    if client.code != "suitesmine":
        contact_reply = contact_qualification_reply(language, client, fields, request.message)
        if contact_reply:
            reply, contact_missing = contact_reply
            return OliviaResponse(
                reply=reply,
                clientCode=client.code,
                language=language,
                intent="lead",
                phase="qualification",
                nextAction="collect_contact_details",
                handoffRecommended=False,
                collected=fields,
                missingFields=contact_missing,
                rates=[],
            )

    system = f"""
You are {client.role_label.get(language) or client.role_label.get("en")}, a proactive AI hostess, not a generic chatbot.
Speak in {language_name(language)}.
Mission:
- welcome the visitor naturally;
- understand their need;
- collect first and last name, email and phone for every non-hotel lead, then collect only useful missing project details;
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
        },
        ensure_ascii=True,
    )
    generated = await openai_service.generate(system, user)
    if generated:
        reply = generated.strip()
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
        intent=intent,
        phase="answer" if intent != "handoff" else "human_handoff",
        nextAction="reply_to_guest" if intent != "handoff" else "offer_human_operator",
        handoffRecommended=intent == "handoff",
        collected=fields,
        missingFields=[],
        bookingUrl=booking_url,
        rates=rates,
    )
