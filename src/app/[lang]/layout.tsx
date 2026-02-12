import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale, localeNames } from '@/i18n/config';
import { TranslationDisclaimer } from '@/components/i18n/TranslationDisclaimer';
import { ClientProviders } from '@/components/providers/ClientProviders';
import { VedaElectoral } from '@/components/legal/VedaElectoral';
import { Footer } from '@/components/layout/Footer';

type Props = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://eleccionesperu2026.xyz'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;

  const titles: Record<Locale, string> = {
    es: 'EleccionesPerú2026',
    qu: 'EleccionesPerú2026 - Akllana',
    ay: 'EleccionesPerú2026 - Ajilana',
    ase: 'EleccionesPerú2026 - Apatotantsi',
  };

  const descriptions: Record<Locale, string> = {
    es: 'Ranking transparente de candidatos basado en mérito, historial legal y evidencia. Elecciones Generales 12 de abril 2026.',
    qu: 'Akllasqa runakunapa ranking, yachayninwan, allin kayninwan. Hatun Akllana 12 abril 2026.',
    ay: 'Ajilanakana ranking, yatiqawinakampi, kamachi qillqampi. Jach\'a Ajilana 12 abril 2026.',
    ase: 'Ranking kenkitsarentsikë apatotantsipë. Antëromani Apatotantsi 12 abril 2026.',
  };

  return {
    title: titles[locale] || titles.es,
    description: descriptions[locale] || descriptions.es,
    openGraph: {
      title: titles[locale] || titles.es,
      description: descriptions[locale] || descriptions.es,
      type: 'website',
      locale: locale === 'es' ? 'es_PE' : locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[locale] || titles.es,
      description: descriptions[locale] || descriptions.es,
    },
    alternates: {
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}`])
        ),
        'x-default': `${BASE_URL}/es`,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { lang } = await params;

  // Validate locale
  if (!locales.includes(lang as Locale)) {
    notFound();
  }

  const locale = lang as Locale;

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ClientProviders>
        <TranslationDisclaimer locale={locale} />
        <VedaElectoral />
        {children}
        <Footer />
      </ClientProviders>
    </NextIntlClientProvider>
  );
}
