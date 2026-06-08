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


def detect_intent(message: str, metadata: ChatMetadata) -> str:
    text = normalize(message)
    draft = metadata.bookingDraft or {}
    if draft.get("active") or re.fullmatch(r"[123]", text):
        return "booking"
    if has_any(text, ["reserv", "booking", "book", "pago", "payment", "link", "confirm"]):
        return "booking"
    if has_any(text, ["disponib", "available", "availability", "hay", "fechas"]):
        return "availability"
    if has_any(text, ["precio", "price", "rate", "tarifa", "costo", "cost"]):
        return "pricing"
    if has_any(text, ["humano", "persona", "llamar", "whatsapp", "contact", "telefono", "email"]):
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


def extract_fields(message: str, metadata: ChatMetadata) -> CollectedFields:
    draft = metadata.bookingDraft or {}
    email = re.search(r"[^\s@]+@[^\s@]+\.[^\s@]+", message)
    phone = re.search(r"(?:\+?\d[\d\s().-]{6,}\d)", message)
    room_type = pick_room_type(message, draft.get("roomType"))

    name = clean(draft.get("name"))
    if not name and email:
        before_email = message[: email.start()]
        name = re.sub(r"\b(estudio|studio|suite doble|double suite|suite)\b", "", before_email, flags=re.I)
        name = re.sub(r"\b\d+[.)]?\b|[,:;-]+", " ", name).strip()

    return CollectedFields(
        name=name or None,
        email=email.group(0) if email else clean(draft.get("email")) or None,
        phone=phone.group(0) if phone else clean(draft.get("phone")) or None,
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

