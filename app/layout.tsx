import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "meuprocesso — acompanhe seu processo",
  description: "Consulte seu processo judicial e entenda as movimentações em linguagem simples.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
