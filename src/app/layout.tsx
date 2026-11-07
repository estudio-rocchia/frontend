import type { Metadata } from "next";
import localFont from "next/font/local";

import { DirectionProvider } from "@/components/foundations/direction/direction";
import { WebVitalsReporter } from "@/components/observability/WebVitalsReporter";
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";

// Archivo local: next/font/google se rompe en Turbopack cuando Google responde
// con URLs /l/font?kit=...&skey=... (el query deja de tener una sola entrada).
const dmSans = localFont({
  src: "../fonts/dm-sans-latin.woff2",
  variable: "--font-dm-sans",
  weight: "100 1000",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: "Rocchia — Jurídico · Inmobiliario",
  description: "Panel operativo Rocchia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <DirectionProvider locale="es-AR">
          <AuthProvider>
            <WebVitalsReporter />
            {children}
          </AuthProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
