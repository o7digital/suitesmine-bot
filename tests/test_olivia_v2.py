import unittest
from types import SimpleNamespace

from olivia_v2.app.clients import CLIENTS, get_client_profile
from olivia_v2.app.extraction import detect_intent, extract_fields
from olivia_v2.app.hostess import build_hostess_response
from olivia_v2.app.language import detect_language
from olivia_v2.app.openai_service import OpenAIService
from olivia_v2.app.openai_service import AgentResult
from olivia_v2.app.schemas import (
    ChatMetadata,
    ChatRequest,
    ConversationMessage,
)


class FakeResponses:
    def __init__(self):
        self.options = None

    async def create(self, **options):
        self.options = options
        return SimpleNamespace(output_text="A contextual answer", output=[], id="resp_test", model_dump=lambda: {"output": []})


class FakeOpenAIClient:
    def __init__(self):
        self.responses = FakeResponses()


class RecordingOpenAIService:
    def __init__(self):
        self.history = None

    async def generate(self, system, user, request, client_profile, rates=None):
        self.history = request.history
        return AgentResult("Le parking est gratuit, sous réserve de disponibilité.", "gpt-5.6-luna", "fast")


class BusinessAnswerOpenAIService:
    async def generate(self, system, user, request, client_profile, rates=None):
        return AgentResult("We provide the requested service. I can help you choose the right option.", "gpt-5.6-luna", "fast")


class OpenAIServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_generate_sends_recent_history_before_current_message(self):
        service = OpenAIService.__new__(OpenAIService)
        service.settings = SimpleNamespace(
            openai_model_fast="gpt-5.6-luna", openai_model_balanced="gpt-5.6-terra",
            openai_model_powerful="gpt-5.6-sol", web_search_enabled=True,
            max_tool_rounds=3, vector_store_for=lambda code: None,
        )
        service.client = FakeOpenAIClient()
        history = [
            ConversationMessage(role="user", content="Je cherche une suite."),
            ConversationMessage(role="assistant", content="Pour quelles dates ?"),
        ]

        request = ChatRequest(message="Du 4 au 6 mai", history=history)
        result = await service.generate("System prompt", "Du 4 au 6 mai", request, get_client_profile("default"))

        self.assertEqual(result.text, "A contextual answer")
        options = service.client.responses.options
        self.assertEqual(
            [message["role"] for message in options["input"]],
            ["system", "user", "assistant", "user"],
        )
        self.assertEqual(options["input"][-1]["content"][0]["text"], "Du 4 au 6 mai")
        self.assertNotIn("temperature", options)


class ConversationContinuityTests(unittest.IsolatedAsyncioTestCase):
    def test_booking_draft_survives_a_short_follow_up(self):
        metadata = ChatMetadata(
            bookingDraft={
                "active": True,
                "name": "Marie Dupont",
                "email": "marie@example.com",
                "phone": "+33 6 12 34 56 78",
                "checkIn": "2026-10-04",
                "checkOut": "2026-10-06",
                "guests": "2",
            }
        )

        self.assertEqual(detect_intent("2", metadata), "booking")
        fields = extract_fields("2", metadata)
        self.assertEqual(fields.name, "Marie Dupont")
        self.assertEqual(fields.checkIn, "2026-10-04")
        self.assertEqual(fields.roomType, "Suite")

    async def test_hostess_receives_conversation_history(self):
        history = [
            ConversationMessage(role="user", content="Avez-vous un parking ?"),
            ConversationMessage(
                role="assistant",
                content="Oui, il est gratuit sous réserve de disponibilité.",
            ),
        ]
        request = ChatRequest(
            clientCode="suitesmine",
            language="fr",
            message="Et faut-il le réserver ?",
            history=history,
        )
        service = RecordingOpenAIService()

        response = await build_hostess_response(
            request=request,
            client=get_client_profile("suitesmine"),
            language="fr",
            intent="faq",
            rates=[],
            openai_service=service,
        )

        self.assertEqual(response.language, "fr")
        self.assertEqual(service.history, history)
        self.assertIn("parking", response.reply.lower())

    async def test_every_client_profile_answers_before_contact_qualification(self):
        for client_code, client in CLIENTS.items():
            with self.subTest(client=client_code):
                request = ChatRequest(
                    clientCode=client_code,
                    language="en",
                    message="What services do you provide?",
                )
                response = await build_hostess_response(
                    request=request,
                    client=client,
                    language="en",
                    intent="faq",
                    rates=[],
                    openai_service=BusinessAnswerOpenAIService(),
                )

                self.assertIn("requested service", response.reply)
                if client_code == "suitesmine":
                    self.assertIsNone(response.action)
                else:
                    self.assertEqual(response.action, "show_lead_form")
                    self.assertEqual(response.phase, "qualification")
                    self.assertEqual(response.missingFields, ["name", "email", "phone"])

    def test_extended_client_languages_are_detected(self):
        self.assertEqual(detect_language("Ciao, vorrei informazioni"), "it")
        self.assertEqual(detect_language("Hallo, ich brauche ein Zimmer"), "de")
        self.assertEqual(detect_language("Привет, нужна цена"), "ru")


if __name__ == "__main__":
    unittest.main()
