'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { DataFreshnessFooter } from './DataFreshnessFooter'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="border-t-4 border-[var(--border)] bg-[var(--card)]" aria-label={t('siteFooter')}>
      {/* Section A: Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-sm">PE</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-[var(--foreground)] uppercase leading-tight">
                  Elecciones
                </span>
                <span className="text-xs text-[var(--primary)] font-bold uppercase tracking-widest">
                  Perú 2026
                </span>
              </div>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mb-4">
              {t('tagline')}
            </p>
            <ul className="space-y-1.5" role="list">
              <li className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-[var(--score-good)] flex-shrink-0" aria-hidden="true" />
                {t('officialSources')}
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-[var(--score-good)] flex-shrink-0" aria-hidden="true" />
                {t('verifiable')}
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-[var(--score-good)] flex-shrink-0" aria-hidden="true" />
                {t('noPoliticalAffiliation')}
              </li>
            </ul>
          </div>

          {/* Platform Column */}
          <nav aria-label={t('platformNav')}>
            <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest border-b-2 border-[var(--border)] pb-2 mb-3">
              {t('platform')}
            </h3>
            <ul className="space-y-0.5" role="list">
              <li>
                <Link href="/ranking" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('ranking')}
                </Link>
              </li>
              <li>
                <Link href="/comparar" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('compare')}
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('quiz')}
                </Link>
              </li>
              <li>
                <Link href="/noticias" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('news')}
                </Link>
              </li>
              <li>
                <Link href="/franja-electoral" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('franjaElectoral')}
                </Link>
              </li>
              <li>
                <Link href="/transparencia" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('transparency')}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal Column */}
          <nav aria-label={t('legalNav')}>
            <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest border-b-2 border-[var(--border)] pb-2 mb-3">
              {t('legal')}
            </h3>
            <ul className="space-y-0.5" role="list">
              <li>
                <Link href="/privacidad" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/rectificacion" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('rectification')}
                </Link>
              </li>
              <li>
                <Link href="/publicidad" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('advertising')}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources Column */}
          <nav aria-label={t('resourcesNav')}>
            <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest border-b-2 border-[var(--border)] pb-2 mb-3">
              {t('resources')}
            </h3>
            <ul className="space-y-0.5" role="list">
              <li>
                <Link href="/metodologia" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('methodology')}
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('docs')}
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('partners')}
                </Link>
              </li>
              <li>
                <Link href="/antecedentes" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('records')}
                </Link>
              </li>
              <li>
                <Link href="/votaciones" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                  {t('votes')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Section B: Data Transparency Bar */}
      <div className="border-t-3 border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <DataFreshnessFooter />
        </div>
      </div>

      {/* Section C: Independence Disclaimer */}
      <div className="border-t-2 border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-[var(--muted-foreground)] text-center leading-relaxed">
            <span className="font-black uppercase">{t('importantDisclaimer')}</span>{' '}
            {t('disclaimer')}
          </p>
        </div>
      </div>

      {/* Section D: Bottom Bar */}
      <div className="border-t-3 border-[var(--border)] bg-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-[var(--muted-foreground)] font-medium">
            <span>{t('copyright')}</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span>{t('operatedBy')}</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <a
              href="mailto:contacto@eleccionesperu2026.xyz"
              className="hover:text-[var(--foreground)] hover:underline transition-colors min-h-[44px] inline-flex items-center"
            >
              contacto@eleccionesperu2026.xyz
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
