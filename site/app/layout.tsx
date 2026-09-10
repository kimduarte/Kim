import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGP/COLOG — Gestão de Patrimônio",
  description: "Sistema de gestão de veículos doados.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
