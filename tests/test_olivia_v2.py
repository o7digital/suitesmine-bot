import unittest
from types import SimpleNamespace
from fastapi.testclient import TestClient

from olivia_v2.app import main as main_module
from olivia_v2.app.clients import CLIENTS, get_client_profile, resolve_client_profile
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


class JsonAnswerOpenAIService:
    async def generate(self, system, user, request, client_profile, rates=None):
        return AgentResult(
            """{
              "summary": ["Client requests a proposal.", "Budget discussion is active."],
              "urgency": "High",
              "leadScore": 84,
              "sentiment": {"label": "Positive", "confidence": 0.86},
              "intent": "lead",
              "buyingSignals": ["Asked for pricing", "Requested follow-up"],
              "tasks": [{"title": "Send proposal", "dueAt": null}],
              "opportunity": {"detected": true, "title": "Proposal follow-up", "estimatedValue": 25000, "currency": "USD", "confidence": 0.8},
              "contactInsights": {"summary": "Active commercial exchange.", "engagement": "Responsive"},
              "suggestedReply": "Thank you for your message."
            }""",
            "gpt-5.6-terra",
            "balanced",
            ["file_search"],
        )


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

    async def test_web_search_is_scoped_to_validated_vialterna_domain(self):
        service = OpenAIService.__new__(OpenAIService)
        service.settings = SimpleNamespace(
            openai_model_fast="gpt-5.6-luna", openai_model_balanced="gpt-5.6-terra",
            openai_model_powerful="gpt-5.6-sol", web_search_enabled=True,
            max_tool_rounds=3, vector_store_for=lambda code: None,
        )
        service.client = FakeOpenAIClient()

        await service.generate(
            "System prompt",
            "How does SuperWAN work?",
            ChatRequest(clientCode="vialterna", message="How does SuperWAN work?"),
            get_client_profile("vialterna"),
        )

        web_tools = [tool for tool in service.client.responses.options["tools"] if tool["type"] == "web_search"]
        self.assertEqual(web_tools[0]["filters"]["allowed_domains"], ["vialterna.com", "vialterna2.vercel.app"])

    async def test_validated_vialterna_profile_selects_only_vialterna_store(self):
        looked_up_clients = []
        service = OpenAIService.__new__(OpenAIService)
        service.settings = SimpleNamespace(
            openai_model_fast="gpt-5.6-luna", openai_model_balanced="gpt-5.6-terra",
            openai_model_powerful="gpt-5.6-sol", web_search_enabled=True,
            max_tool_rounds=3,
            vector_store_for=lambda code: looked_up_clients.append(code) or {
                "vialterna": "vs_vialterna",
                "zevicapital": "vs_zevi",
            }.get(code),
        )
        service.client = FakeOpenAIClient()

        await service.generate(
            "System prompt",
            "Show me available properties",
            ChatRequest(clientCode="zevicapital", message="Show me available properties"),
            get_client_profile("vialterna"),
        )

        file_tools = [tool for tool in service.client.responses.options["tools"] if tool["type"] == "file_search"]
        self.assertEqual(looked_up_clients, ["vialterna"])
        self.assertEqual(file_tools[0]["vector_store_ids"], ["vs_vialterna"])

    async def test_touski_profile_scopes_file_and_web_search(self):
        looked_up_clients = []
        service = OpenAIService.__new__(OpenAIService)
        service.settings = SimpleNamespace(
            openai_model_fast="gpt-5.6-luna", openai_model_balanced="gpt-5.6-terra",
            openai_model_powerful="gpt-5.6-sol", web_search_enabled=True,
            max_tool_rounds=3,
            vector_store_for=lambda code: looked_up_clients.append(code) or "vs_touski",
        )
        service.client = FakeOpenAIClient()

        await service.generate(
            "System prompt",
            "Quelle est la sélection actuelle pour choisir un GPS hors réseau?",
            ChatRequest(clientCode="touski", language="fr", message="Quelle est la sélection actuelle pour choisir un GPS hors réseau?"),
            get_client_profile("touski"),
        )

        tools = service.client.responses.options["tools"]
        self.assertEqual(looked_up_clients, ["touski"])
        self.assertEqual([tool for tool in tools if tool["type"] == "file_search"][0]["vector_store_ids"], ["vs_touski"])
        self.assertEqual([tool for tool in tools if tool["type"] == "web_search"][0]["filters"]["allowed_domains"], ["touski.online"])

    def test_touski_profile_supports_site_languages_and_domain(self):
        profile = get_client_profile("touski")
        self.assertEqual(profile.supported_languages, ("fr", "en", "es", "de"))
        self.assertEqual(profile.site_domains, ("touski.online",))

    def test_kallista_profile_is_isolated_to_its_site(self):
        profile = get_client_profile("kallistacafe")
        self.assertEqual(profile.name, "KALLISTA Café")
        self.assertEqual(profile.supported_languages, ("es", "en"))
        self.assertEqual(profile.site_domains, ("kallistacafe.com",))
        self.assertIn("Mar Negro 204", profile.knowledge)
        self.assertIn("ilustrativos", profile.knowledge)

    def test_browser_metadata_cannot_override_known_vialterna_profile(self):
        profile = resolve_client_profile(
            "vialterna",
            ChatMetadata(
                clientName="ZeVi Capital",
                clientIndustry="real-estate-investment",
                clientKnowledge="Use ZeVi knowledge",
                clientSiteUrl="https://zevicapital.com",
            ),
        )

        self.assertEqual(profile.code, "vialterna")
        self.assertEqual(profile.name, "Vialterna")
        self.assertNotIn("ZeVi knowledge", profile.knowledge)
        self.assertEqual(profile.site_domains, ("vialterna.com", "vialterna2.vercel.app"))


class ConversationContinuityTests(unittest.IsolatedAsyncioTestCase):
    async def test_vialterna_second_turn_information_request_hands_off_gently(self):
        request = ChatRequest(
            clientCode="vialterna",
            language="es",
            message="Sí, quiero información",
            history=[
                ConversationMessage(role="user", content="Hola buenas tardes"),
                ConversationMessage(role="assistant", content="¿En qué podemos ayudarle?"),
            ],
        )

        response = await build_hostess_response(
            request=request,
            client=get_client_profile("vialterna"),
            language="es",
            intent="faq",
            rates=[],
            openai_service=BusinessAnswerOpenAIService(),
        )

        self.assertEqual(response.action, "show_lead_form")
        self.assertTrue(response.handoffRecommended)
        self.assertIn("Le canalizo", response.reply)
        self.assertIn("nuestro formulario", response.reply)
        self.assertNotIn("Edge", response.reply)

    async def test_vialterna_general_information_clarifies_without_lead_form(self):
        request = ChatRequest(
            clientCode="vialterna",
            language="es",
            message="Quiero más información",
        )

        response = await build_hostess_response(
            request=request,
            client=get_client_profile("vialterna"),
            language="es",
            intent="faq",
            rates=[],
            openai_service=BusinessAnswerOpenAIService(),
        )

        self.assertEqual(response.phase, "answer")
        self.assertEqual(response.nextAction, "clarify_need")
        self.assertIn("Claro, con gusto", response.reply)
        self.assertIn("información", response.reply)
        self.assertIsNone(response.action)
        self.assertIsNone(response.leadForm)
        self.assertEqual(response.missingFields, [])

    async def test_vialterna_greeting_with_information_request_stays_natural(self):
        request = ChatRequest(
            clientCode="vialterna",
            language="es",
            message="Hola buenas tardes, busco información",
        )

        response = await build_hostess_response(
            request=request,
            client=get_client_profile("vialterna"),
            language="es",
            intent="faq",
            rates=[],
            openai_service=BusinessAnswerOpenAIService(),
        )

        self.assertEqual(response.nextAction, "clarify_need")
        self.assertIn("información", response.reply)
        self.assertIsNone(response.leadForm)

    async def test_vialterna_first_concrete_question_uses_ai(self):
        request = ChatRequest(
            clientCode="vialterna",
            language="es",
            message="¿Qué servicios comerciales ofrecen para cadenas de tiendas?",
        )

        response = await build_hostess_response(
            request=request,
            client=get_client_profile("vialterna"),
            language="es",
            intent="faq",
            rates=[],
            openai_service=BusinessAnswerOpenAIService(),
        )

        self.assertEqual(response.reply, "We provide the requested service. I can help you choose the right option.")
        self.assertEqual(response.phase, "answer")
        self.assertEqual(response.nextAction, "reply_to_guest")
        self.assertIsNone(response.action)

    async def test_vialterna_follow_up_technical_question_hands_off_without_details(self):
        request = ChatRequest(
            clientCode="vialterna",
            language="es",
            message="¿Y cómo funciona SD-WAN?",
            history=[
                ConversationMessage(role="user", content="Tenemos cortes frecuentes."),
                ConversationMessage(role="assistant", content="Podemos reforzar la continuidad."),
            ],
        )

        response = await build_hostess_response(
            request=request,
            client=get_client_profile("vialterna"),
            language="es",
            intent="faq",
            rates=[],
            openai_service=BusinessAnswerOpenAIService(),
        )

        self.assertIn("Le canalizo", response.reply)
        self.assertNotIn("SD-WAN", response.reply)
        self.assertEqual(response.phase, "human_handoff")
        self.assertTrue(response.handoffRecommended)
        self.assertIsNotNone(response.leadForm)

    async def test_vialterna_pricing_routes_to_commercial_form_without_giving_price(self):
        request = ChatRequest(
            clientCode="vialterna",
            language="es",
            message="Quiero saber los precios",
            history=[
                ConversationMessage(role="user", content="Buenas tardes"),
                ConversationMessage(role="assistant", content="¿En qué podemos ayudarle hoy?"),
            ],
        )

        response = await build_hostess_response(
            request=request,
            client=get_client_profile("vialterna"),
            language="es",
            intent="pricing",
            rates=[],
            openai_service=BusinessAnswerOpenAIService(),
        )

        self.assertEqual(response.action, "show_lead_form")
        self.assertTrue(response.handoffRecommended)
        self.assertIn("Claro, con mucho gusto", response.reply)
        self.assertIn("nuestro formulario", response.reply)
        self.assertNotRegex(response.reply, r"\$|\b\d+[.,]?\d*\s*(?:MXN|USD|pesos|dólares)\b")
        self.assertIsNotNone(response.leadForm)

    async def test_vialterna_technical_question_declines_without_form_handoff(self):
        request = ChatRequest(
            clientCode="vialterna",
            language="es",
            message="¿Cómo funciona SD-WAN y cómo configuro el failover?",
        )

        response = await build_hostess_response(
            request=request,
            client=get_client_profile("vialterna"),
            language="es",
            intent="faq",
            rates=[],
            openai_service=BusinessAnswerOpenAIService(),
        )

        self.assertIn("preguntas técnicas", response.reply)
        self.assertIsNone(response.action)
        self.assertFalse(response.handoffRecommended)
        self.assertIsNone(response.leadForm)

    async def test_vialterna_handoff_qualifies_need_before_requesting_contact_details(self):
        request = ChatRequest(
            clientCode="vialterna",
            language="es",
            message="Quiero que me contacte un asesor para revisar mi red",
            history=[
                ConversationMessage(role="user", content="Buenas tardes"),
                ConversationMessage(role="assistant", content="¿En qué podemos ayudarle hoy?"),
            ],
        )

        response = await build_hostess_response(
            request=request,
            client=get_client_profile("vialterna"),
            language="es",
            intent="handoff",
            rates=[],
            openai_service=BusinessAnswerOpenAIService(),
        )

        self.assertEqual(response.phase, "human_handoff")
        self.assertEqual(response.nextAction, "collect_contact_details")
        self.assertEqual(response.action, "show_lead_form")
        self.assertIsNotNone(response.leadForm)
        self.assertTrue(response.handoffRecommended)
        self.assertIn("nuestro formulario", response.reply)

    async def test_vialterna_requests_complete_contact_details_after_qualification(self):
        request = ChatRequest(
            clientCode="vialterna",
            language="es",
            message="Somos una cadena con 12 sucursales, necesitamos respaldo urgente para evitar caídas.",
            metadata=ChatMetadata(handoffStage="qualified"),
            history=[
                ConversationMessage(role="user", content="Buenas tardes"),
                ConversationMessage(role="assistant", content="¿En qué podemos ayudarle hoy?"),
            ],
        )

        response = await build_hostess_response(
            request=request,
            client=get_client_profile("vialterna"),
            language="es",
            intent="faq",
            rates=[],
            openai_service=BusinessAnswerOpenAIService(),
        )

        self.assertEqual(response.phase, "human_handoff")
        self.assertEqual(response.action, "show_lead_form")
        self.assertEqual(
            response.leadForm["fields"],
            ["firstName", "lastName", "company", "email", "phone", "details"],
        )
        self.assertEqual(response.leadForm["required"], response.leadForm["fields"])
        self.assertEqual(response.leadForm["labels"]["details"], "Necesidad")

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
                # suitesmine never qualifies leads; vialterna only qualifies after an explicit handoff request.
                if client_code in ("suitesmine", "vialterna", "kallistacafe"):
                    self.assertIsNone(response.action)
                else:
                    self.assertEqual(response.action, "show_lead_form")
                    self.assertEqual(response.phase, "qualification")
                    self.assertEqual(response.missingFields, ["name", "email", "phone"])

    def test_extended_client_languages_are_detected(self):
        self.assertEqual(detect_language("Ciao, vorrei informazioni"), "it")
        self.assertEqual(detect_language("Hallo, ich brauche ein Zimmer"), "de")
        self.assertEqual(detect_language("Привет, нужна цена"), "ru")

    def test_auto_requested_language_is_not_treated_as_explicit(self):
        # "auto" (sent by Olivia One Mail) must fall through to detection,
        # not be treated as an unsupported explicit language code.
        self.assertEqual(detect_language("Bonjour, merci beaucoup", "auto"), "fr")

    def test_default_fallback_is_configurable_and_defaults_to_spanish(self):
        ambiguous_text = "12345 - see attachment"
        self.assertEqual(detect_language(ambiguous_text), "es")
        self.assertEqual(detect_language(ambiguous_text, default="en"), "en")

    def test_generic_business_english_is_detected_without_hospitality_keywords(self):
        support_email = (
            "Dear Customer, Thank you for reaching out to our Support team. "
            "To help us confirm your request, could you please clarify the details?"
        )
        self.assertEqual(detect_language(support_email, "auto", default="en"), "en")


class EmailEndpointsTests(unittest.TestCase):
    def setUp(self):
        self.previous_token = main_module.settings.internal_token
        main_module.settings.internal_token = "internal-test-token"
        self.previous_service = main_module.OpenAIService
        main_module.OpenAIService = lambda settings: JsonAnswerOpenAIService()
        self.client = TestClient(main_module.app)

    def tearDown(self):
        main_module.settings.internal_token = self.previous_token
        main_module.OpenAIService = self.previous_service

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])

    def test_email_analyze_requires_internal_token(self):
        response = self.client.post("/email/analyze", json={
            "mailbox": "sales@example.com",
            "sender": "Jane",
            "senderEmail": "jane@example.com",
            "recipients": ["sales@example.com"],
            "subject": "Proposal",
            "body": "Can you send pricing?",
        })
        self.assertEqual(response.status_code, 401)

    def test_chat_requires_internal_token(self):
        response = self.client.post("/chat", json={
            "clientCode": "vialterna",
            "message": "How does SuperWAN work?",
        })
        self.assertEqual(response.status_code, 401)

    def test_email_endpoints_fail_closed_without_server_token(self):
        main_module.settings.internal_token = None
        response = self.client.post("/email/analyze", json={
            "mailbox": "sales@example.com",
            "sender": "Jane",
            "senderEmail": "jane@example.com",
            "recipients": ["sales@example.com"],
            "subject": "Proposal",
            "body": "Can you send pricing?",
        })

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "Internal authentication is not configured")

    def test_email_analyze_returns_expected_schema(self):
        with self.assertLogs(main_module.logger, level="INFO") as captured:
            response = self.client.post(
                "/email/analyze",
                headers={"X-Olivia-Internal-Token": "internal-test-token"},
                json={
                    "clientCode": "jeanlouisdavid",
                    "mailbox": "ventas@jeanlouisdavid.mx",
                    "sender": "Jane Doe",
                    "senderEmail": "jane@example.com",
                    "recipients": ["ventas@jeanlouisdavid.mx"],
                    "subject": "Bonjour, besoin d'un devis",
                    "body": "Pouvez-vous envoyer une proposition cette semaine ?",
                    "language": "fr",
                },
            )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["urgency"], "High")
        self.assertEqual(payload["intent"], "lead")
        self.assertEqual(payload["model"], "gpt-5.6-terra")
        self.assertEqual(payload["toolsUsed"], ["file_search"])
        event = captured.output[-1]
        self.assertIn('"channel":"email"', event)
        self.assertIn('"client":"jeanlouisdavid"', event)
        self.assertIn('"operation":"analyze"', event)
        self.assertNotIn("jane@example.com", event)

    def test_email_rewrite_and_compose(self):
        rewrite = self.client.post(
            "/email/rewrite",
            headers={"X-Olivia-Internal-Token": "internal-test-token"},
            json={"action": "formal", "draft": "hey send me this asap"},
        )
        compose = self.client.post(
            "/email/compose",
            headers={"X-Olivia-Internal-Token": "internal-test-token"},
            json={"prompt": "Write a follow-up email", "recipient": "client@example.com", "subject": "Follow-up"},
        )
        self.assertEqual(rewrite.status_code, 200)
        self.assertEqual(compose.status_code, 200)
        self.assertTrue(rewrite.json()["draft"])
        self.assertTrue(compose.json()["draft"])


if __name__ == "__main__":
    unittest.main()
