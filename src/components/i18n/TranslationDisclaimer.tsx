'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { isAiTranslated, type Locale, localeNames } from '@/i18n/config';
import { cn } from '@/lib/utils';

interface TranslationDisclaimerProps {
  locale: Locale;
}

const STORAGE_KEY = 'translation-disclaimer-dismissed';

export function TranslationDisclaimer({ locale }: TranslationDisclaimerProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash
  const t = useTranslations('disclaimer');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== 'true') {
      setDismissed(false);
    }
  }, []);

  // Don't show for Spanish or if dismissed
  if (!isAiTranslated(locale) || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const languageName = localeNames[locale];

  return (
    <div
      className={cn(
        'bg-[var(--flag-amber)]/20',
        'border-b-3 border-[var(--flag-amber)]'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Native language line */}
            <p className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2 flex-wrap">
              <span className="text-base flex-shrink-0">⚠️</span>
              <span>{t('aiTranslation')} ({languageName})</span>
            </p>
            {/* Spanish clarification line */}
            <p className="text-xs text-[var(--muted-foreground)] mt-1 ml-7">
              {t('aiTranslationDetail')}
              {' '}
              <a
                href={`mailto:contacto@eleccionesperu2026.xyz?subject=Corrección de traducción — ${languageName}`}
                className="text-[var(--primary)] underline hover:no-underline font-bold"
              >
                {t('reportError')}
              </a>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className={cn(
              'p-1.5 min-w-[32px] min-h-[32px] flex-shrink-0',
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
    </div>
  );
}
