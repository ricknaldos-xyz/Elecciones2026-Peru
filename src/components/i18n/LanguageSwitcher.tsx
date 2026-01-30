'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from '@/i18n/routing';
import { locales, type Locale, localeNames, localeFlags, localeFlagImages } from '@/i18n/config';
import { cn } from '@/lib/utils';

// Flag component that renders image or emoji
function LocaleFlag({ locale, size = 'md' }: { locale: Locale; size?: 'sm' | 'md' | 'lg' }) {
  const imageSrc = localeFlagImages[locale];
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt={localeNames[locale]}
        width={size === 'lg' ? 28 : size === 'md' ? 24 : 20}
        height={size === 'lg' ? 28 : size === 'md' ? 24 : 20}
        className={cn(sizeClasses[size], 'object-cover border border-[var(--border)]')}
      />
    );
  }

  // Fallback to emoji for Spanish
  return (
    <span className={cn(
      size === 'sm' && 'text-base',
      size === 'md' && 'text-lg',
      size === 'lg' && 'text-xl',
    )}>
      {localeFlags[locale]}
    </span>
  );
}

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key handler (accessibility)
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'px-3 py-2',
          'min-w-[44px] min-h-[44px]',
          'flex items-center gap-2',
          'text-[var(--foreground)]',
          'border-2 border-transparent',
          'transition-all duration-100',
          'hover:bg-[var(--muted)]',
          'hover:border-[var(--border)]',
          'hover:-translate-x-0.5 hover:-translate-y-0.5',
          'hover:shadow-[var(--shadow-brutal-sm)]',
          isOpen && [
            'bg-[var(--muted)]',
            'border-[var(--border)]',
            'shadow-[var(--shadow-brutal-sm)]',
          ]
        )}
        aria-label="Cambiar idioma"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="language-menu"
      >
        <span aria-hidden="true"><LocaleFlag locale={currentLocale} size="md" /></span>
        <span className="hidden sm:inline text-sm font-bold uppercase">
          {currentLocale}
        </span>
        <svg
          className={cn(
            'w-4 h-4 transition-transform duration-100',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          id="language-menu"
          role="listbox"
          aria-label="Seleccionar idioma"
          className={cn(
            'absolute right-0 top-full mt-2',
            'w-56',
            'bg-[var(--card)]',
            'border-3 border-[var(--border)]',
            'shadow-[var(--shadow-brutal-lg)]',
            'overflow-hidden',
            'z-50'
          )}
        >
          {locales.map((locale) => (
            <button
              key={locale}
              role="option"
              aria-selected={locale === currentLocale}
              onClick={() => handleLocaleChange(locale)}
              className={cn(
                'w-full px-4 py-3 text-left',
                'flex items-center gap-3',
                'transition-all duration-100',
                'border-b-2 border-[var(--border)] last:border-b-0',
                locale === currentLocale
                  ? [
                      'bg-[var(--primary)]',
                      'text-white',
                    ]
                  : [
                      'hover:bg-[var(--muted)]',
                    ]
              )}
            >
              <span aria-hidden="true"><LocaleFlag locale={locale} size="lg" /></span>
              <div className="flex-1">
                <div className={cn(
                  'text-sm font-bold uppercase',
                  locale === currentLocale ? 'text-white' : 'text-[var(--foreground)]'
                )}>
                  {localeNames[locale]}
                </div>
                <div className={cn(
                  'text-xs font-medium',
                  locale === currentLocale ? 'text-white/80' : 'text-[var(--muted-foreground)]'
                )}>
                  {locale === 'es' && 'Español'}
                  {locale === 'qu' && 'Quechua Sureño'}
                  {locale === 'ay' && 'Aymara Central'}
                  {locale === 'ase' && 'Asháninka'}
                </div>
              </div>
              {locale === currentLocale && (
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
