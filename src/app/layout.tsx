import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ranking Electoral Perú 2026",
  description: "Ranking transparente de candidatos basado en mérito, integridad y evidencia. Elecciones Generales 12 de abril 2026.",
  keywords: ["elecciones", "perú", "2026", "candidatos", "ranking", "votación"],
  openGraph: {
    title: "Ranking Electoral Perú 2026",
    description: "Elige con datos, no con slogans. Ranking transparente de candidatos.",
    type: "website",
    locale: "es_PE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ranking Electoral Perú 2026",
    description: "Elige con datos, no con slogans.",
  },
};

const DarkModeScript = () => {
  const script = `
    (function() {
      const theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
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
        <DarkModeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
