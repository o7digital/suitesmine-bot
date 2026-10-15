import unittest
from olivia_v2.app.clients import get_client_profile
from olivia_v2.app.language import detect_language, language_name

class NathalieLanguages(unittest.TestCase):
    def test_selected_site_language_wins_over_message_detection(self):
        client = get_client_profile('nathalie')
        for language in ('es','en','de','fr','it','sv','hu','hr','ru','zh-TW','ja'):
            with self.subTest(language=language):
                self.assertIn(language, client.supported_languages)
                self.assertEqual(detect_language('Hello, tell me about Nathalie', language), language)
                self.assertNotEqual(language_name(language), 'Spanish' if language != 'es' else '')
        self.assertEqual(detect_language('Hello', 'zh-Hant-TW'), 'zh-TW')
        self.assertEqual(client.site_domains, ('nathalie-pena-comas.vercel.app',))
        self.assertNotIn('booking', client.integrations)

class NathalieResponses(unittest.IsolatedAsyncioTestCase):
    async def test_artistic_questions_do_not_trigger_hotel_or_contact_intake(self):
        from olivia_v2.app.hostess import build_hostess_response
        from olivia_v2.app.schemas import ChatRequest
        from olivia_v2.app.openai_service import AgentResult
        class Service:
            async def generate(self, system, user, request, client_profile, rates=None):
                self.system = system
                return AgentResult('Nathalie is a Dominican soprano trained in Vienna.', 'test-model', 'fast')
        client = get_client_profile('nathalie')
        for language in client.supported_languages:
            service = Service()
            response = await build_hostess_response(request=ChatRequest(clientCode='nathalie',language=language,message='Tell me about her biography'),client=client,language=language,intent='faq',rates=[],openai_service=service)
            self.assertEqual(response.language, language)
            self.assertEqual(response.clientCode, 'nathalie')
            self.assertEqual(response.missingFields, [])
            self.assertIsNone(response.leadForm)
            self.assertEqual(response.rates, [])
            self.assertIn('Speak in '+language_name(language),service.system)
