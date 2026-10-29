# Bull & Bear Academy

The `bullbear` client connects the academy's Astro website to the existing Olivia engine and inbox. The visitor interface is branded Charly IA v3.5; the Python API continues to return its existing `olivia-v2` mode.

- Registered site: `https://bullbear-academy-preview.vercel.app`.
- The chat follows the site language automatically, without a separate language menu.
- Languages: Spanish (`es`), English (`en`), Russian (`ru`), simplified Chinese (`zh`), German (`de`), Italian (`it`), French (`fr`) and Brazilian Portuguese (`pt`).
- Approved context: twelve published courses, durations and official course links, mentoring, Trading Club, archived sessions and the academy's published contact details.
- Ordinary course questions continue across turns and languages without a mandatory lead form. Enrollment, unpublished prices/schedules and personal financial questions go to the published academy contact. No booking/payment connector is enabled.
- Signed widget identities remain bound to the academy's hostname. The Next route requires an engine response with the correct client/language and a model; an outage returns 503 instead of an unrelated fallback answer.

The browser requests consent before fetching an identity, storing a message or calling the model. Messages are persisted through the existing widget conversation API for operator follow-up; the visitor's session history and consent continue across language pages.

Validate with `node --test tests/*.mjs`, `python -m unittest discover -s tests` and `npm run build` with the configured Clerk public key. The academy UI has separate responsive and browser integration checks in its own delivery workflow.

Deploy the Next app to the existing `suitesmine-bot` Vercel project. For the existing Railway `olivia-v2-python` production service in project `cf8f43de-bcad-4356-9156-fc4675b9b3c4`, package `requirements.txt`, `olivia_v2/` and `Dockerfile.python` renamed to `Dockerfile`, then deploy that package with Railway CLI. Keep production credentials in the configured services.
