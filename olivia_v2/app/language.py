import re


def detect_language(text: str, requested: str | None = None, default: str = "es") -> str:
    normalized = (requested or "").strip().lower()
    if normalized in {"zh-tw", "zh-hant", "zh-hant-tw"}:
        return "zh-TW"
    if normalized in {"es", "en", "fr", "it", "de", "ru", "sv", "hu", "hr", "ja", "zh", "pt"}:
        return normalized

    value = text.lower()
    if re.search(r"\b(ciao|grazie|camera|disponibilita|prenotazione|prezzo)\b", value):
        return "it"
    if re.search(r"\b(hallo|danke|zimmer|verfugbar|buchung|preis)\b", value):
        return "de"
    if re.search(r"\b(привет|спасибо|номер|бронирование|цена)\b", value):
        return "ru"
    if re.search(r"\b(bonjour|merci|reservation|chambre|disponibilite|sejour)\b", value):
        return "fr"
    if re.search(r"\b(hola|gracias|habitacion|disponibilidad|reserva|precio|huesped)\b", value):
        return "es"
    if re.search(
        r"\b(hello|hi|thanks|thank you|regards|dear|please|room|availability|"
        r"booking|price|guest|order|account|confirm|confirmation|email|invoice|"
        r"payment|support|team|link|help)\b",
        value,
    ):
        return "en"
    return default


def language_name(language: str) -> str:
    return {
        "es": "Spanish",
        "en": "English",
        "fr": "French",
        "it": "Italian",
        "de": "German",
        "pt": "Brazilian Portuguese",
        "ru": "Russian",
        "sv": "Swedish",
        "hu": "Hungarian",
        "hr": "Croatian",
        "zh-TW": "Traditional Chinese (Taiwan)",
        "zh": "Chinese",
        "ja": "Japanese",
    }.get(language, "Spanish")
