export const locales = ['es', 'qu', 'ay', 'ase'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  qu: 'Runasimi (Quechua)',
  ay: 'Aymara',
  ase: 'Asháninka',
};

export const localeFlags: Record<Locale, string> = {
  es: '🇵🇪',
  qu: '🏔️',
  ay: '🏔️',
  ase: '🌿',
};

// Flag images for native languages
export const localeFlagImages: Record<Locale, string | null> = {
  es: null, // Use emoji for Spanish
  qu: '/images/flags/quechua.jpg',
  ay: '/images/flags/aymara.png',
  ase: '/images/flags/ashaninka.jpg',
};

// Languages that use AI translation (show disclaimer)
export const aiTranslatedLocales: Locale[] = ['qu', 'ay', 'ase'];

export function isAiTranslated(locale: Locale): boolean {
  return aiTranslatedLocales.includes(locale);
}
