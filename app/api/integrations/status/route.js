export const runtime = "nodejs";

function configured(name) {
  return Boolean(process.env[name]?.trim());
}

export async function GET() {
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
    },
    analytics: {
      configured:
        configured("GA4_PROPERTY_ID") &&
        configured("GOOGLE_SERVICE_ACCOUNT_EMAIL") &&
        configured("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"),
      provider: "ga4-data-api",
    },
    database: {
      configured: configured("DATABASE_URL"),
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
