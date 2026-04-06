import "./globals.css";

export const metadata = {
  title: "Chat Bot",
  description: "Generic website chat widget",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
