import crypto from "node:crypto";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
const sign = (value) => crypto.createHmac("sha256", process.env.CLERK_SECRET_KEY).update(value).digest("base64url");

export async function GET(request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI || !process.env.CLERK_SECRET_KEY) return Response.json({ error: "Gmail OAuth is not configured" }, { status: 503 });
  const clientCode = new URL(request.url).searchParams.get("client")?.trim();
  if (!clientCode) return Response.json({ error: "Missing client" }, { status: 400 });
  const payload = Buffer.from(JSON.stringify({ clientCode, userId, expires: Date.now() + 600000 })).toString("base64url");
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: process.env.GOOGLE_REDIRECT_URI, response_type: "code", access_type: "offline", prompt: "consent", scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email", state: `${payload}.${sign(payload)}` });
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
