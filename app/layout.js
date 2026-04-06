import "./globals.css";

export const metadata = {
  title: "O7 AI Widget",
  description: "Premium SaaS widget",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
