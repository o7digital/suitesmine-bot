# Bull & Bear Academy

The `bullbear` client connects the academy's Astro website to the existing Olivia engine and inbox. The visitor interface is branded Charly IA. It calls the generative Python agent; the API retains its historical `olivia-v2` mode identifier. A widget version label is not an engine version.

- Registered site: `https://bullbear-academy-preview.vercel.app`.
- The chat follows the site language automatically, without a separate language menu.
- Languages: Spanish (`es`), English (`en`), Russian (`ru`), simplified Chinese (`zh`), German (`de`), Italian (`it`), French (`fr`) and Brazilian Portuguese (`pt`).
- Approved context: twelve published courses, durations and official course links, mentoring, Trading Club, archived sessions and the academy's published contact details.
- The dedicated academy agent uses strict structured responses: vague requests clarify the course/service, a qualified enquiry offers an inline contact form, and factual follow-ups continue naturally. Declining contact keeps the chat usable. Enrollment and unpublished prices/schedules require an advisor; no booking/payment connector is enabled.
- Signed widget identities remain bound to the academy's hostname. The Next route requires an engine response with the correct client/language and a model; an outage returns 503 instead of an unrelated fallback answer.

The browser requests consent before fetching an identity, storing a message or calling the model. Messages are persisted through the existing widget conversation API for operator follow-up; the visitor's session history and consent continue across language pages.

Validate with `node --test tests/*.mjs`, `python -m unittest discover -s tests` and `npm run build` with the configured Clerk public key. The academy UI has separate responsive and browser integration checks in its own delivery workflow.

Deploy the Next app to the existing `suitesmine-bot` Vercel project. For the existing Railway `olivia-v2-python` production service in project `cf8f43de-bcad-4356-9156-fc4675b9b3c4`, package `requirements.txt`, `olivia_v2/` and `Dockerfile.python` renamed to `Dockerfile`, then deploy that package with Railway CLI. Keep production credentials in the configured services.

## Contact requests

`POST /api/widget/leads` requires a signed BullBear widget identity, an existing visitor conversation, both data and contact consent, valid contact details and a non-empty request. An atomic database statement stores the contact fields, the reviewed request and a transcript entry. A stable submission ID makes retries idempotent. Ordinary widget message metadata cannot forge or overwrite the receipt.

The form confirms success only after persistence. The inbox at `https://olivia-ai.o7digital.com/inbox?client=bullbear` shows the request and contact details in a dedicated panel. `academyRequestStatus=received` is loaded from the persisted conversation before calling the agent so it does not ask for coordinates again. This queues an academy follow-up; it does not send email, guarantee a response time or claim a live human is connected.
