import unittest

from olivia_v2.app.clients import resolve_client_profile
from olivia_v2.app.extraction import detect_intent
from olivia_v2.app.hostess import build_hostess_response
from olivia_v2.app.openai_service import AgentResult
from olivia_v2.app.schemas import ChatMetadata, ChatRequest, ConversationMessage


class DemoAI:
    def __init__(self):
        self.calls = []

    async def generate(self, system, user, request, client, rates=None):
        self.calls.append((system, request))
        return AgentResult("The illustrative runway is 5.8 months.", "test-model", "fast")


class FinidiDemoTests(unittest.IsolatedAsyncioTestCase):
    async def answer(self, source="finidiops-demo", message="Analyze the demo cash runway.", history=None, client_code="finidi"):
        request = ChatRequest(
            clientCode=client_code, source=source, language="en", message=message,
            history=history or [],
            metadata=ChatMetadata(clientName="FINIDI", clientKnowledge="California and San Diego CFO services."),
        )
        client = resolve_client_profile(client_code, request.metadata)
        service = DemoAI()
        response = await build_hostess_response(
            request=request, client=client, language="en", intent=detect_intent(message, request.metadata),
            rates=[], openai_service=service,
        )
        return response, service

    async def test_demo_question_uses_ai_instead_of_sales_handoff(self):
        response, service = await self.answer()
        self.assertEqual(len(service.calls), 1)
        self.assertEqual(response.model, "test-model")
        self.assertEqual(response.intent, "faq")
        self.assertIsNone(response.leadForm)
        self.assertFalse(response.handoffRecommended)
        self.assertIn("without requesting personal data", service.calls[0][0])

    async def test_follow_up_keeps_history_and_uses_ai(self):
        history = [ConversationMessage(role="user", content="Analyze cash runway."), ConversationMessage(role="assistant", content="5.8 months.")]
        response, service = await self.answer(message="What does that mean?", history=history)
        self.assertEqual(response.model, "test-model")
        self.assertEqual(service.calls[0][1].history, history)
        self.assertIsNone(response.leadForm)
        self.assertEqual(response.phase, "answer")

    async def test_explicit_human_request_still_recommends_handoff(self):
        response, service = await self.answer(message="I want to speak to FINIDI.")
        self.assertEqual(response.model, "test-model")
        self.assertTrue(response.handoffRecommended)
        self.assertIsNone(response.leadForm)

    async def test_regular_finidi_sales_flow_is_preserved(self):
        response, service = await self.answer(source="website", history=[ConversationMessage(role="user", content="I need cash flow support.")])
        self.assertEqual(service.calls, [])
        self.assertTrue(response.handoffRecommended)
        self.assertIsNotNone(response.leadForm)

    async def test_other_clients_cannot_select_the_finidi_demo_flow(self):
        response, service = await self.answer(client_code="another-client", history=[ConversationMessage(role="user", content="I need advice.")])
        self.assertEqual(service.calls, [])
        self.assertIsNotNone(response.leadForm)
