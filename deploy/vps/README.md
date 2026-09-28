# Olivia v2 on VPS 1

The Python engine runs independently of Olivia v3.5 at `/opt/o7/apps/olivia-v2`,
on the existing `o7-apps` Docker network. It publishes no host port. Mailcow TLS
and `o7-proxy` expose it at `https://olivia.o7digitalgroup.com/v2`.

Copy only `Dockerfile.python`, `.dockerignore`, `requirements.txt`, `olivia_v2/` and `deploy/vps/`
from the reviewed release. Store the existing Railway Python engine variables
in `.env.vps` with permission `600`; keep `OLIVIA_INTERNAL_TOKEN` identical to
Railway so existing server callers can use either instance. Do not copy any
Railway platform variables. Keep OpenAI models, client vector stores and Cloudbeds
credentials intact. No inbox database is moved: it belongs to the web gateway.

```sh
cd /opt/o7/apps/olivia-v2
OLIVIA_RELEASE=<commit> docker compose -f deploy/vps/compose.yaml up -d --build --wait
```

Add `nginx-location.conf` inside the existing `o7-proxy` server block after taking
a backup. Validate with `docker exec o7-proxy nginx -t`, then reload with
`docker exec o7-proxy nginx -s reload`. Existing V3 routes are preserved.

Verify `/v2/health`, refusal of unauthenticated `/v2/chat`, and authenticated
multi-turn responses. Verify the V3 readiness endpoint and its unchanged container
ID after the migration. Railway remains running at
`https://olivia-v2-python-production.up.railway.app`; do not stop or delete it.

FINIDI's Vercel server function uses `OLIVIA_V2_URL` set to the VPS URL and
`OLIVIA_INTERNAL_TOKEN` set to the engine secret. These variables stay on the
server. The existing shared Olivia web gateway can continue using Railway.

To roll back FINIDI, restore its previous server environment and deployment.
To roll back the proxy, restore the saved configuration, validate and reload.
Changing or stopping v2 does not require restarting v3.5.
