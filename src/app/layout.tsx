import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Ranking Electoral Perú 2026",
  description: "Ranking transparente de candidatos basado en mérito, integridad y evidencia. Elecciones Generales 12 de abril 2026.",
  keywords: ["elecciones", "perú", "2026", "candidatos", "ranking", "votación"],
};

const InitScript = () => {
  const script = `
    (function() {
      // Dark mode
      const theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
      // Dynamic lang attribute based on URL
      const path = window.location.pathname;
      const langMatch = path.match(/^\\/(es|qu|ay|ase)(\\/|$)/);
      if (langMatch) {
        document.documentElement.lang = langMatch[1];
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <InitScript />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
