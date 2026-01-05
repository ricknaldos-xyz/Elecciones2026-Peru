'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { isAiTranslated, type Locale, localeNames } from '@/i18n/config';
import { cn } from '@/lib/utils';

interface TranslationDisclaimerProps {
  locale: Locale;
}

export function TranslationDisclaimer({ locale }: TranslationDisclaimerProps) {
  const [dismissed, setDismissed] = useState(false);
  const t = useTranslations('disclaimer');

  // Don't show for Spanish or if dismissed
  if (!isAiTranslated(locale) || dismissed) {
    return null;
  }

  const languageName = localeNames[locale];

  return (
    <div
      className={cn(
        'bg-[var(--flag-amber)]/20',
        'border-b-2 border-[var(--flag-amber)]',
        'px-4 py-2'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2 flex-wrap">
          <span className="text-base">⚠️</span>
          <span>
            {t('aiTranslation')} ({languageName})
          </span>
          <span className="text-[var(--muted-foreground)]">•</span>
          <a
            href="mailto:contacto@rankingelectoral.pe?subject=Error de traducción"
            className="text-[var(--primary)] underline hover:no-underline font-bold"
          >
            {t('reportError')}
          </a>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className={cn(
            'p-1.5 min-w-[32px] min-h-[32px]',
            'flex items-center justify-center',
            'text-[var(--muted-foreground)]',
            'hover:text-[var(--foreground)]',
            'hover:bg-[var(--muted)]',
            'border-2 border-transparent',
            'hover:border-[var(--border)]',
            'transition-all duration-100'
          )}
          aria-label="Cerrar"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
