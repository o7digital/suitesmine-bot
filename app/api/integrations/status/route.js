export const runtime = "nodejs";

import { isDatabaseConfigured } from "@/lib/db";
import { getOAuthConnection } from "@/lib/oauth-connections";
import { getMetaWebhookUrl } from "@/lib/meta-channels";

function configured(name) {
  return Boolean(process.env[name]?.trim());
}

export async function GET(request) {
  const clientCode = new URL(request.url).searchParams.get("client")?.trim() || "";
  const gmailConnection = clientCode && isDatabaseConfigured()
    ? await getOAuthConnection(clientCode, "gmail").catch(() => null)
    : null;
  return Response.json({
    huggingFace: {
      configured: configured("HF_TOKEN") || configured("HUGGING_FACE_TOKEN"),
      model: process.env.HF_DASHBOARD_MODEL || "openai/gpt-oss-20b:fastest",
    },
    mailbox: {
      configured:
        configured("GOOGLE_CLIENT_ID") &&
        configured("GOOGLE_CLIENT_SECRET") &&
        configured("GOOGLE_REDIRECT_URI"),
      provider: "gmail-oauth",
      connected: Boolean(gmailConnection),
      accountEmail: gmailConnection?.account_email || null,
    },
    whatsapp: {
      configured:
        configured("META_WEBHOOK_VERIFY_TOKEN") &&
        configured("WHATSAPP_PHONE_NUMBER_ID") &&
        configured("WHATSAPP_ACCESS_TOKEN"),
      provider: "meta-whatsapp-cloud-api",
      webhookUrl: getMetaWebhookUrl(),
    },
    facebook: {
      configured:
        configured("META_WEBHOOK_VERIFY_TOKEN") &&
        configured("META_PAGE_ID") &&
        configured("META_PAGE_ACCESS_TOKEN"),
      provider: "meta-messenger-platform",
      webhookUrl: getMetaWebhookUrl(),
    },
    instagram: {
      configured:
        configured("META_WEBHOOK_VERIFY_TOKEN") &&
        configured("INSTAGRAM_ACCOUNT_ID") &&
        configured("META_PAGE_ACCESS_TOKEN"),
      provider: "instagram-messaging-api",
      webhookUrl: getMetaWebhookUrl(),
    },
    analytics: {
      configured:
        configured("GA4_PROPERTY_ID") &&
        configured("GOOGLE_SERVICE_ACCOUNT_EMAIL") &&
        configured("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"),
      provider: "ga4-data-api",
    },
    database: {
      configured: configured("DATABASE_URL") || configured("DATABASE_PUBLIC_URL"),
      provider: "postgres",
    },
    clerk: {
      configured:
        configured("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") &&
        configured("CLERK_SECRET_KEY"),
    },
    openai: {
      configured: configured("OPENAI_API_KEY"),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    cloudbeds: {
      configured:
        configured("CLOUDBEDS_API_KEY") &&
        configured("CLOUDBEDS_PROPERTY_ID"),
    },
  });
}
