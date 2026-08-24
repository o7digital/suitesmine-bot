import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 60 * 60;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeHost(value) {
  const raw = clean(value);
  if (!raw) return "";
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return (url.hostname || "").toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function signingSecret() {
  return clean(process.env.OLIVIA_WIDGET_SIGNING_SECRET);
}

function exactClient(clientProfiles, clientCode) {
  const code = clean(clientCode).toLowerCase();
  return Object.prototype.hasOwnProperty.call(clientProfiles, code) ? clientProfiles[code] : null;
}

export function requestSiteHost(request) {
  const browserOrigin = clean(request.headers?.get?.("origin"));
  return normalizeHost(browserOrigin || request.url);
}

export function clientCodeForSiteHost(host, clientProfiles) {
  const normalized = normalizeHost(host);
  if (!normalized) return "";
  const match = Object.values(clientProfiles).find((client) => normalizeHost(client.siteUrl) === normalized);
  if (match) return match.clientCode;
  if (normalized === "suitesmine-bot.vercel.app" || normalized.startsWith("suitesmine-bot-git-")) {
    return "suitesmine";
  }
  return "";
}

function signature(encodedPayload, secret) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function issueWidgetIdentity(clientCode, host, clientProfiles, now = Date.now()) {
  const secret = signingSecret();
  const client = exactClient(clientProfiles, clientCode);
  const normalizedHost = normalizeHost(host);
  if (!secret) throw new Error("Widget identity signing is not configured");
  if (!client || !normalizedHost) throw new Error("Invalid widget identity binding");
  const encodedPayload = Buffer.from(JSON.stringify({
    clientCode: client.clientCode,
    expiresAt: Math.floor(now / 1000) + TOKEN_TTL_SECONDS,
    host: normalizedHost,
  })).toString("base64url");
  return `${encodedPayload}.${signature(encodedPayload, secret)}`;
}

export function verifyWidgetIdentity(token, host, clientProfiles, now = Date.now()) {
  const secret = signingSecret();
  const [encodedPayload, suppliedSignature] = clean(token).split(".");
  if (!secret || !encodedPayload || !suppliedSignature) return null;
  const expectedSignature = signature(encodedPayload, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (payload.expiresAt < Math.floor(now / 1000) || payload.host !== normalizeHost(host)) return null;
    return exactClient(clientProfiles, payload.clientCode)?.clientCode || null;
  } catch {
    return null;
  }
}

export function resolveRequestClient(request, claimedClientCode, clientProfiles) {
  const internalToken = clean(request.headers.get("x-olivia-internal-token"));
  const expectedInternalToken = clean(process.env.OLIVIA_INTERNAL_TOKEN);
  if (internalToken && expectedInternalToken) {
    const supplied = Buffer.from(internalToken);
    const expected = Buffer.from(expectedInternalToken);
    if (supplied.length === expected.length && timingSafeEqual(supplied, expected)) {
      const client = exactClient(clientProfiles, claimedClientCode);
      if (!client) throw new Error("Unknown server client");
      return client.clientCode;
    }
  }

  const host = requestSiteHost(request);
  const token = request.headers.get("x-olivia-widget-identity");
  const validatedClientCode = verifyWidgetIdentity(token, host, clientProfiles);
  if (!validatedClientCode) throw new Error("Invalid widget identity");
  return validatedClientCode;
}

export function serverApprovedMetadata(profile, suppliedMetadata = {}) {
  return {
    ...suppliedMetadata,
    clientName: profile.clientName,
    clientIndustry: profile.industry,
    clientKnowledge: profile.knowledge,
    clientSiteUrl: clean(profile.siteUrl || profile.website),
  };
}
