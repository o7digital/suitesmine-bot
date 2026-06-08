from dataclasses import dataclass, field


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
}


def get_client_profile(client_code: str | None) -> ClientProfile:
    key = (client_code or "default").strip().lower()
    return CLIENTS.get(key, CLIENTS["default"])

