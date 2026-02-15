export const locales = ['es', 'qu', 'ay'] as const;
// NOTE: 'ase' (Asháninka) disabled until native speaker translation is available
// To re-enable: add 'ase' to locales array and uncomment ase entries below
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  qu: 'Runasimi (Quechua)',
  ay: 'Aymara',
};

export const localeFlags: Record<Locale, string> = {
  es: '🇵🇪',
  qu: '🏔️',
  ay: '🏔️',
};

// Flag images for native languages
export const localeFlagImages: Record<Locale, string | null> = {
  es: null, // Use emoji for Spanish
  qu: '/images/flags/quechua.jpg',
  ay: '/images/flags/aymara.png',
};

// Languages that use AI translation (show disclaimer)
export const aiTranslatedLocales: Locale[] = ['qu', 'ay'];

export function isAiTranslated(locale: Locale): boolean {
  return aiTranslatedLocales.includes(locale);
}
