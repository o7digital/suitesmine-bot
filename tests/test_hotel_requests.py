import json
import unittest

from olivia_v2.app.clients import get_client_profile
from olivia_v2.app.hostess import build_hostess_response
from olivia_v2.app.openai_service import AgentResult
from olivia_v2.app.schemas import ChatMetadata, ChatRequest, ConversationMessage


class AI:
    def __init__(self, text):
        self.text = text
        self.system = None
        self.history = None

    async def generate(self, system, user, request, client, rates=None):
        self.system, self.history = system, request.history
        assert rates == []
        assert not client.integrations.get("booking")
        return AgentResult(self.text, "gpt-5.6-luna", "fast")


class HotelRequestTests(unittest.IsolatedAsyncioTestCase):
    async def test_reservation_intent_remains_a_generative_contact_request(self):
        service = AI(json.dumps({
            "reply": "Je peux transmettre votre demande à l’hôtel, qui devra confirmer.",
            "collected": {"name": "Marie Dupont", "email": "marie@example.com"},
            "requestSummary": "Demande de séjour pour deux personnes.", "offerHandoff": True,
        }))
        history = [ConversationMessage(role="user", content="Je suis Marie Dupont, marie@example.com")]
        request = ChatRequest(clientCode="suitesmine", language="fr", message="Réservez une suite pour deux.",
                              history=history, metadata=ChatMetadata(bookingDraft={"active": True}))
        response = await build_hostess_response(request=request, client=get_client_profile("suitesmine"),
                                               language="fr", intent="booking", rates=[{"roomsAvailable": 2}],
                                               openai_service=service)
        self.assertEqual(response.model, "gpt-5.6-luna")
        self.assertEqual(response.action, "review_hotel_request")
        self.assertEqual(response.collected.email, "marie@example.com")
        self.assertEqual(response.missingFields, [])
        self.assertIsNone(response.bookingUrl)
        self.assertEqual(response.rates, [])
        self.assertEqual(response.phase, "human_handoff")
        self.assertEqual(service.history, history)
        self.assertIn("NEVER create", service.system)
        self.assertIn("refunds", service.system)

    async def test_model_outage_does_not_enter_legacy_booking_or_claim_email_sent(self):
        response = await build_hostess_response(
            request=ChatRequest(clientCode="suitesmine", message="I want to book"),
            client=get_client_profile("suitesmine"), language="en", intent="booking", rates=[],
            openai_service=AI(None),
        )
        self.assertIsNone(response.bookingUrl)
        self.assertIsNone(response.action)
        self.assertNotIn("sent", response.reply)
        self.assertIn("cannot answer", response.reply)

    async def test_ordinary_question_does_not_force_contact_collection(self):
        response = await build_hostess_response(
            request=ChatRequest(clientCode="suitesmine", message="Is parking free?"),
            client=get_client_profile("suitesmine"), language="en", intent="faq", rates=[],
            openai_service=AI('{"reply":"Parking is free, subject to availability.","collected":{},"offerHandoff":false}'),
        )
        self.assertIsNone(response.action)
        self.assertEqual(response.missingFields, [])
        self.assertIn("Parking", response.reply)
