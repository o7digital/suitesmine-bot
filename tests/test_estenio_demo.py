import unittest
from unittest.mock import AsyncMock

from olivia_v2.app.clients import resolve_client_profile
from olivia_v2.app.extraction import detect_intent
from olivia_v2.app.hostess import build_hostess_response
from olivia_v2.app.openai_service import AgentResult
from olivia_v2.app.schemas import ChatMetadata, ChatRequest, ConversationMessage


class EstenioDemoTests(unittest.IsolatedAsyncioTestCase):
    async def answer(self, message="¿Qué servicios de pensión ofrecen?", source="estenio2-demo", client_code="estenio", result=None):
        request = ChatRequest(
            clientCode=client_code, source=source, language="es", message=message,
            history=[ConversationMessage(role="user", content="Necesito orientación de pensión."), ConversationMessage(role="assistant", content="¿Buscas apoyo personal o empresarial?")],
            metadata=ChatMetadata(clientName="Corporativo Estenio", clientKnowledge="Servicios de Seguridad Social en México."),
        )
        service = AsyncMock()
        service.generate.return_value = result or AgentResult("Estenio ofrece asesoría de pensión personal y empresarial.", "test-model", "fast")
        response = await build_hostess_response(request=request, client=resolve_client_profile(client_code, request.metadata), language="es", intent=detect_intent(message, request.metadata), rates=[], openai_service=service)
        return response, service

    async def test_follow_up_uses_the_engine_and_preserves_history(self):
        response, service = await self.answer()
        self.assertEqual(response.model, "test-model")
        self.assertIsNone(response.leadForm)
        self.assertFalse(response.handoffRecommended)
        system, _, request, _, _ = service.generate.call_args.args
        self.assertIn("Estenio", system)
        self.assertIn("individualized legal", system)
        self.assertEqual(len(request.history), 2)

    async def test_explicit_human_request_recommends_contact(self):
        response, _ = await self.answer(message="Quiero hablar con un asesor de Estenio.")
        self.assertTrue(response.handoffRecommended)
        self.assertEqual(response.model, "test-model")
        self.assertIsNone(response.leadForm)

    async def test_regular_website_keeps_its_sales_flow(self):
        response, service = await self.answer(source="website")
        service.generate.assert_not_called()
        self.assertIsNotNone(response.leadForm)

    async def test_other_client_cannot_use_estenio_demo_mode(self):
        response, service = await self.answer(client_code="other-client")
        service.generate.assert_not_called()
        self.assertIsNotNone(response.leadForm)

    async def test_failed_generation_does_not_produce_fake_ai(self):
        with self.assertRaisesRegex(RuntimeError, "AI response unavailable"):
            await self.answer(result=AgentResult(None, "test-model", "fast"))
