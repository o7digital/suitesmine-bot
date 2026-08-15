import re


def detect_language(text: str, requested: str | None = None) -> str:
    if requested in {"es", "en", "fr", "it", "de", "ru"}:
        return requested

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
    if re.search(r"\b(hello|thanks|room|availability|booking|price|guest)\b", value):
        return "en"
    return "es"


def language_name(language: str) -> str:
    return {
        "es": "Spanish",
        "en": "English",
        "fr": "French",
        "it": "Italian",
        "de": "German",
        "ru": "Russian",
    }.get(language, "Spanish")
