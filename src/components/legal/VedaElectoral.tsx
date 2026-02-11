'use client'

import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

const ELECTION_DATE = process.env.NEXT_PUBLIC_ELECTION_DATE || '2026-04-12T07:00:00-05:00'
const VEDA_DAYS = 7

const EXEMPT_ROUTES = ['/metodologia', '/privacidad', '/rectificacion', '/docs']

function isVedaActive(): boolean {
  try {
    const electionDate = new Date(ELECTION_DATE)
    if (isNaN(electionDate.getTime())) return false
    const now = new Date()
    const vedaStart = new Date(electionDate.getTime() - VEDA_DAYS * 24 * 60 * 60 * 1000)
    return now >= vedaStart && now <= electionDate
  } catch {
    // Fail-open: if date parsing fails, do NOT show veda
    return false
  }
}

function isExemptRoute(pathname: string): boolean {
  return EXEMPT_ROUTES.some((route) => pathname.includes(route))
}

export function VedaElectoral() {
  const pathname = usePathname()
  const t = useTranslations('veda')
  const locale = useLocale()

  if (!isVedaActive() || isExemptRoute(pathname)) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--background)] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-[var(--flag-amber)] border-4 border-[var(--border)] shadow-[var(--shadow-brutal)] flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">
          {t('title')}
        </h1>

        <div className="p-6 bg-[var(--muted)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)] space-y-4">
          <p className="text-lg text-[var(--foreground)] font-medium">
            {t('message')}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] font-medium">
            {t('exemptNote')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`/${locale}/metodologia`}
            className="px-6 py-3 bg-[var(--primary)] text-white font-black uppercase tracking-wide border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] transition-all"
          >
            {t('viewMethodology')}
          </a>
          <a
            href={`/${locale}/docs`}
            className="px-6 py-3 bg-[var(--background)] text-[var(--foreground)] font-black uppercase tracking-wide border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] transition-all"
          >
            {t('viewDocs')}
          </a>
        </div>

        <p className="text-xs text-[var(--muted-foreground)] font-medium">
          {t('legalRef')}
        </p>
      </div>
    </div>
  )
}
