import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
  "/inbox(.*)",
  "/api/conversations(.*)",
  "/api/dashboard(.*)",
  "/api/integrations(.*)",
]);

const isPublicMetaWebhook = createRouteMatcher([
  "/api/integrations/meta/webhook(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const userAgent = request.headers.get("user-agent") || "";
  const isLinkPreviewBot = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|Slackbot|TelegramBot|LinkedInBot/i.test(userAgent);

  if (request.nextUrl.pathname.startsWith("/inbox") && isLinkPreviewBot) {
    return NextResponse.next();
  }

  if (isProtectedRoute(request) && !isPublicMetaWebhook(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
