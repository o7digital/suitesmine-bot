"""Suites Mine's AI concierge qualifies enquiries; the hotel handles bookings."""

import json
from dataclasses import replace

from olivia_v2.app.schemas import CollectedFields, OliviaResponse


async def build_hotel_response(request, client, language, openai_service):
    # Keep the generative agent, its conversation history, routing and knowledge.
    # There is deliberately no reservation engine or payment action in this flow.
    client = replace(client, integrations={}, booking_categories=())
    system = f"""
You are Olivia AI, the conversational concierge for Suites Mine. Reply in {language}.
Answer the visitor's actual question naturally, using approved context and conversation history.
You may remember and collect their name, email, phone and request for the hotel.
For a stay enquiry, dates, guests and room preference are optional request details, not a booking.
For cancellations, changes, refunds, complaints and early arrivals, address that specific need;
never restart a reservation flow. Only the hotel can process or confirm these actions.
NEVER create, hold, confirm, modify or cancel a reservation, accept payment, quote a guaranteed
rate or availability, generate a booking/payment link, or direct the visitor into Cloudbeds.
Do not claim that an email or request has been sent unless metadata.hotelRequestStatus is sent:
only the application sends it after the visitor reviews the details and presses the send button.
A request is never a reservation.
When the visitor needs hotel follow-up, offer to send their request to contacto@suitesmine.com.
Ask naturally for missing contact information, without repeating details already supplied.
For ordinary information questions, answer first and do not require personal information.
Never turn an old bookingDraft.active flag or a short follow-up into a booking workflow.

Approved hotel context:
{client.knowledge}

Return ONLY a JSON object with these keys:
reply: your natural, concise reply to the visitor;
collected: an object with name, email, phone, checkIn, checkOut, guests, roomType (strings or null);
requestSummary: a concise faithful summary of what the visitor wants the hotel to handle;
offerHandoff: boolean, true when hotel follow-up is requested or needed.
Extract contact and request details from the whole conversation and metadata, without invention.
When offerHandoff is true and name plus email are known, say the visitor can review and send
the request using the form below. The form can collect an optional phone number.
Never include a reservation or payment URL, even if it appears in previous messages.
""".strip()
    user = json.dumps({
        "message": request.message,
        "metadata": request.metadata.model_dump(),
    }, ensure_ascii=False)
    generated = await openai_service.generate(system, user, request, client, [])
    try:
        text = (generated.text or "").strip()
        start, end = text.index("{"), text.rindex("}")
        data = json.loads(text[start:end + 1])
        if not isinstance(data.get("reply"), str) or not data["reply"].strip():
            raise ValueError("Missing AI reply")
        fields = CollectedFields.model_validate(data.get("collected") or {})
        summary = str(data.get("requestSummary") or "")[:6000]
        handoff = data.get("offerHandoff") is True
        reply = data["reply"].strip()
    except (ValueError, TypeError):
        # An unavailable model must not fall back into the legacy booking flow.
        fields = CollectedFields()
        summary, handoff = "", False
        reply = {
            "fr": "Je ne peux pas répondre pour le moment. Contactez Suites Mine à contacto@suitesmine.com ou au +52 55 3666 8535. Seul l’hôtel peut traiter votre réservation.",
            "en": "I cannot answer right now. Please contact Suites Mine at contacto@suitesmine.com or +52 55 3666 8535. Only the hotel can handle your reservation.",
        }.get(language, "No puedo responder en este momento. Contacte a Suites Mine en contacto@suitesmine.com o al +52 55 3666 8535. Solo el hotel puede gestionar su reserva.")
    return OliviaResponse(
        reply=reply, clientCode=client.code, language=language,
        intent="handoff" if handoff else "faq",
        phase="human_handoff" if handoff else "answer",
        nextAction="review_hotel_request" if handoff else "reply_to_guest",
        handoffRecommended=handoff, collected=fields,
        missingFields=[key for key in ("name", "email") if not getattr(fields, key)] if handoff else [],
        bookingUrl=None, rates=[], action="review_hotel_request" if handoff else None,
        hotelRequestSummary=summary,
        model=generated.model, reasoningTier=generated.tier,
        toolsUsed=generated.tools_used, sources=generated.sources,
    )
