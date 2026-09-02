import re
import unicodedata
from olivia_v2.app.schemas import ChatMetadata, CollectedFields


def clean(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


def normalize(value: object) -> str:
    text = clean(value).lower()
    text = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in text if unicodedata.category(ch) != "Mn")


def has_any(value: object, words: list[str]) -> bool:
    text = normalize(value)
    return any(word in text for word in words)


def is_multiple_room_request(message: str) -> bool:
    text = normalize(message)
    match = re.search(r"\b(\d+)\s*(?:habitaciones?|cuartos?|rooms?|chambres?)\b", text)
    return bool(match and int(match.group(1)) > 1)


def is_large_group_request(message: str) -> bool:
    text = normalize(message)
    match = re.search(
        r"\b(\d+)\s*(?:personas?|huespedes?|guests?|people|personnes?|voyageurs?)\b",
        text,
    )
    return bool(match and int(match.group(1)) > 4)


def detect_intent(message: str, metadata: ChatMetadata) -> str:
    text = normalize(message)
    draft = metadata.bookingDraft or {}
    if draft.get("active") or re.fullmatch(r"[123]", text):
        return "booking"
    if has_any(text, ["reserv", "booking", "book", "pago", "payment", "link", "confirm"]):
        return "booking"
    if has_any(text, ["disponib", "available", "availability", "hay", "fechas"]):
        return "availability"
    if has_any(text, [
        "precio", "price", "rate", "tarifa", "costo", "cost", "cotizacion",
        "presupuesto", "propuesta", "proposal", "quote", "quotation", "budget",
    ]):
        return "pricing"
    if has_any(text, [
        "humano", "persona", "llamar", "whatsapp", "contact", "telefono", "email",
        "asesor", "experto", "demo", "advisor", "expert", "sales rep",
        "call me", "talk to", "speak to",
    ]):
        return "handoff"
    return "faq"


def pick_room_type(message: str, draft_room_type: str | None = None) -> str | None:
    text = normalize(message)
    if re.fullmatch(r"1", text):
        return "Estudio"
    if re.fullmatch(r"2", text):
        return "Suite"
    if re.fullmatch(r"3", text):
        return "Suite Doble"
    if "suite doble" in text or "double suite" in text or "doble" in text:
        return "Suite Doble"
    if "estudio" in text or "studio" in text:
        return "Estudio"
    if "suite" in text:
        return "Suite"
    return clean(draft_room_type) or None


def value_after_step(message: str, step: int) -> str:
    match = re.search(rf"(?:^|\s){step}[.)]?\s+([\s\S]*?)(?=\s\d[.)]?\s+|$)", message, flags=re.I)
    if not match:
        return ""
    return re.sub(r"^[:.-]\s*", "", match.group(1).strip()).rstrip(",.; ")


def extract_fields(message: str, metadata: ChatMetadata) -> CollectedFields:
    draft = metadata.bookingDraft or {}
    lead = metadata.lead or {}
    structured_name = value_after_step(message, 1)
    structured_email = re.search(r"[^\s@]+@[^\s@]+\.[^\s@,.;]+", value_after_step(message, 2))
    structured_phone = re.search(r"(?:\+?\d[\d\s().-]{6,}\d)", value_after_step(message, 3))
    email = structured_email or re.search(r"[^\s@]+@[^\s@]+\.[^\s@,.;]+", message)
    phone = structured_phone or re.search(r"(?:\+?\d[\d\s().-]{6,}\d)", message)
    room_type = pick_room_type(value_after_step(message, 5) or message, draft.get("roomType"))

    lead_name = clean(lead.get("name")) or f"{clean(lead.get('firstName'))} {clean(lead.get('lastName'))}".strip()
    name = clean(draft.get("name")) or lead_name
    if not name and structured_name and "@" not in structured_name:
        name = structured_name
    if not name and email:
        before_email = message[: email.start()]
        name = re.sub(r"\b(estudio|studio|suite doble|double suite|suite)\b", "", before_email, flags=re.I)
        name = re.sub(r"\b\d+[.)]?\b|[,:;-]+", " ", name).strip()

    return CollectedFields(
        name=name or None,
        email=email.group(0) if email else clean(draft.get("email")) or clean(lead.get("email")) or None,
        phone=phone.group(0) if phone else clean(draft.get("phone")) or clean(lead.get("phone")) or None,
        checkIn=clean(metadata.checkIn) or clean(draft.get("checkIn")) or None,
        checkOut=clean(metadata.checkOut) or clean(draft.get("checkOut")) or None,
        guests=str(metadata.guests) if metadata.guests else clean(draft.get("guests")) or None,
        roomType=room_type,
    )


def missing_booking_fields(fields: CollectedFields) -> list[str]:
    missing = []
    for key, label in [
        ("name", "name"),
        ("email", "email"),
        ("phone", "phone"),
        ("checkIn", "checkIn"),
        ("checkOut", "checkOut"),
        ("guests", "guests"),
        ("roomType", "roomType"),
    ]:
        if not getattr(fields, key):
            missing.append(label)
    return missing
