import json
import unittest
from types import SimpleNamespace
from fastapi import HTTPException
from olivia_v2.app.bullbear import AcademyTurn
from olivia_v2.app.clients import get_client_profile
from olivia_v2.app.hostess import build_hostess_response
from olivia_v2.app.openai_service import AgentResult, OpenAIService
from olivia_v2.app.config import Settings
from olivia_v2.app.schemas import ChatRequest


def turn(**overrides):
    return dict(reply='¿Qué curso te interesa?', stage='clarify', interest='', requestSummary='',
                firstName='', lastName='', email='', phone='', **overrides) if not overrides else {
        **turn(), **overrides,
    }


class Service:
    def __init__(self, data): self.data = data
    async def generate(self, system, user, request, client, rates=None, **kwargs):
        self.system, self.user, self.request, self.options = system, user, request, kwargs
        return AgentResult(json.dumps(self.data) if self.data is not None else None, 'test-model', 'fast')


class AcademyConversation(unittest.IsolatedAsyncioTestCase):
    async def respond(self, data, **request):
        self.service = Service(data)
        return await build_hostess_response(request=ChatRequest(clientCode='bullbear', language='es', **request),
            client=get_client_profile('bullbear'), language='es', intent='faq', rates=[], openai_service=self.service)

    async def test_vague_request_clarifies_without_form_or_catalogue(self):
        response = await self.respond(turn(), message='Quiero información')
        self.assertEqual(response.nextAction, 'clarify_need')
        self.assertIsNone(response.leadForm)
        self.assertFalse(response.handoffRecommended)
        self.assertEqual(self.service.options['response_schema'], AcademyTurn.model_json_schema())
        self.assertIn('Do not dump a catalogue', self.service.system)

    async def test_qualified_need_gets_contextual_form_and_supplied_contact(self):
        history = [{'role':'user','content':'quiero información'}, {'role':'assistant','content':'¿Sobre qué curso?'}]
        response = await self.respond(turn(stage='handoff', reply='Te muestro el formulario para un asesor de Forex.',
            interest='Forex para principiantes', requestSummary='Información sobre Forex para principiantes; prefiere online.',
            firstName='Ana'), message='Forex, soy principiante y prefiero online', history=history)
        self.assertEqual(response.action, 'show_lead_form')
        self.assertEqual(response.leadForm['values']['firstName'], 'Ana')
        self.assertIn('online', response.leadForm['initialDetails'])
        self.assertEqual(len(self.service.request.history), 2)
        self.assertEqual(response.model, 'test-model')

    async def test_declining_contact_keeps_conversation_without_form(self):
        response = await self.respond(turn(stage='declined', reply='Claro, podemos seguir por aquí.'),
            message='No quiero dejar mis datos', metadata={'handoffStage':'declined'})
        self.assertIsNone(response.action)
        self.assertFalse(response.handoffRecommended)
        self.assertTrue(json.loads(self.service.user)['formDismissed'])

    async def test_specific_followup_does_not_force_contact(self):
        response = await self.respond(turn(stage='discuss', reply='El curso Forex para todos dura 10 horas.', interest='Forex'),
            message='¿Cuánto dura?')
        self.assertEqual(response.phase, 'answer')
        self.assertIsNone(response.leadForm)

    async def test_received_request_does_not_reopen_form(self):
        response = await self.respond(turn(stage='handoff', reply='Tu solicitud está registrada.'), message='Gracias',
            metadata={'academyRequestStatus':'received','lead':{'firstName':'Ana','email':'ana@example.org'}})
        self.assertIsNone(response.leadForm)
        self.assertFalse(response.handoffRecommended)
        self.assertIn('Current status: received', self.service.system)

    async def test_unavailable_or_invalid_model_does_not_replay_greeting(self):
        for data in [None, {'reply':'catalogue'}]:
            with self.subTest(data=data), self.assertRaises(HTTPException) as error:
                await self.respond(data, message='Je veux des infos')
            self.assertEqual(error.exception.status_code, 503)

    async def test_agent_sends_strict_schema_without_unrelated_business_tools(self):
        calls = []
        async def create(**options):
            calls.append(options)
            return SimpleNamespace(output=[], output_text=json.dumps(turn()))
        service = OpenAIService(Settings(OPENAI_API_KEY=None))
        service.client = SimpleNamespace(responses=SimpleNamespace(create=create))
        request = ChatRequest(clientCode='bullbear', message='información')
        result = await service.generate('system', 'user', request, get_client_profile('bullbear'), [],
            response_schema=AcademyTurn.model_json_schema())
        self.assertTrue(result.text)
        self.assertTrue(calls[0]['text']['format']['strict'])
        self.assertEqual(calls[0]['tools'], [])
        self.assertEqual(calls[0]['text']['format']['schema'], AcademyTurn.model_json_schema())
