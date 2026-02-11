import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Ranking Electoral Perú 2026",
  description: "Ranking transparente de candidatos basado en mérito, historial legal y evidencia. Elecciones Generales 12 de abril 2026.",
  keywords: ["elecciones", "perú", "2026", "candidatos", "ranking", "votación"],
  openGraph: {
    type: 'website',
    siteName: 'Ranking Electoral Perú 2026',
    locale: 'es_PE',
  },
};

const InitScript = () => {
  const script = `
    (function() {
      try {
        // Cargar preferencias de accesibilidad
        var prefs = JSON.parse(localStorage.getItem('accessibility-preferences') || '{}');
        var html = document.documentElement;

        // Dark mode (preferencia guardada o del sistema)
        var darkMode = prefs.darkMode !== undefined
          ? prefs.darkMode
          : (localStorage.getItem('theme') === 'dark' ||
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches));
        if (darkMode) {
          html.classList.add('dark');
        }

        // Color vision mode (daltonismo)
        if (prefs.colorVisionMode && prefs.colorVisionMode !== 'normal') {
          html.classList.add(prefs.colorVisionMode);
        }

        // High contrast
        if (prefs.highContrast) {
          html.classList.add('high-contrast');
        }

        // Reduced motion
        if (prefs.reducedMotion) {
          html.classList.add('reduce-motion');
        }

        // Show patterns
        if (prefs.showPatterns) {
          html.classList.add('show-patterns');
        }

        // Font size
        if (prefs.fontSize && prefs.fontSize !== 'normal') {
          var sizes = { 'large': '112.5%', 'extra-large': '125%' };
          document.body.style.fontSize = sizes[prefs.fontSize] || '100%';
        }
      } catch(e) {
        // Fallback: usar solo tema guardado
        var theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        }
      }

      // Dynamic lang attribute based on URL
      var path = window.location.pathname;
      var langMatch = path.match(/^\\/(es|qu|ay|ase)(\\/|$)/);
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
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
