import unittest
from olivia_v2.app.clients import get_client_profile, resolve_client_profile
from olivia_v2.app.language import detect_language, language_name
from olivia_v2.app.schemas import ChatRequest
from olivia_v2.app.openai_service import AgentResult
from olivia_v2.app.hostess import build_hostess_response


class BullBearLanguages(unittest.IsolatedAsyncioTestCase):
    async def test_language_changes_keep_course_follow_ups_out_of_hotel_and_lead_intake(self):
        class Service:
            async def generate(self, system, user, request, client_profile, rates=None):
                self.system = system
                self.request = request
                return AgentResult('Academy course information.', 'test-model', 'fast')

        client = get_client_profile('bullbear')
        self.assertEqual(client.supported_languages, ('es', 'en', 'ru', 'zh'))
        for language in client.supported_languages:
            with self.subTest(language=language):
                service = Service()
                request = ChatRequest(clientCode='bullbear', language=language,
                    message='Tell me more about that course', history=[
                        {'role': 'user', 'content': 'What cryptocurrency courses are available?'},
                        {'role': 'assistant', 'content': 'There are 10-hour and 25-hour courses.'},
                    ])
                self.assertEqual(detect_language(request.message, language), language)
                response = await build_hostess_response(request=request, client=client,
                    language=language, intent='faq', rates=[], openai_service=service)
                self.assertEqual(response.language, language)
                self.assertEqual(response.clientCode, 'bullbear')
                self.assertEqual(response.model, 'test-model')
                self.assertIsNone(response.leadForm)
                self.assertEqual(response.missingFields, [])
                self.assertEqual(response.rates, [])
                self.assertIn('Speak in ' + language_name(language), service.system)
                self.assertIn('Never give personalized financial', service.system)
                self.assertEqual(len(service.request.history), 2)

    def test_browser_metadata_cannot_replace_the_academy_knowledge(self):
        request = ChatRequest(message='Hello', metadata={
            'clientName': 'Suites Mine', 'clientKnowledge': 'Sell hotel rooms',
            'clientSiteUrl': 'https://suitesmine.com',
        })
        profile = resolve_client_profile('bullbear', request.metadata)
        self.assertEqual(profile.name, 'Bull & Bear Academy')
        self.assertEqual(profile.site_domains, ('bullbear-academy-preview.vercel.app',))
        self.assertNotIn('booking', profile.integrations)
        self.assertIn('12 courses', profile.knowledge)
