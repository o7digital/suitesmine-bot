import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata = {
  title: "Chat Channel Manager Olivia AI",
  description: "Inbox sécurisé pour gérer les conversations Olivia AI.",
  openGraph: {
    title: "Chat Channel Manager Olivia AI",
    description: "Inbox sécurisé pour gérer les conversations Olivia AI.",
    url: "https://olivia-ai.o7digital.com",
    siteName: "Olivia AI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Chat Channel Manager Olivia AI",
    description: "Inbox sécurisé pour gérer les conversations Olivia AI.",
  },
};

export default function RootLayout({ children }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <html lang="fr">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="fr">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
