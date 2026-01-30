import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Link } from '@/i18n/routing'
import type { Locale } from '@/i18n/config'

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'donate' })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function DonatePage({ params }: Props) {
  const { lang } = await params
  setRequestLocale(lang as Locale)
  const t = await getTranslations({ locale: lang, namespace: 'donate' })

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/donar" />

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="primary" size="md" className="mb-4">
            {t('badge')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Payment Methods */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {/* Yape */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#742284] border-2 border-[var(--border)] flex items-center justify-center rounded-lg">
                  <span className="text-white font-black text-sm">Y</span>
                </div>
                {t('yapeTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {/* QR Placeholder */}
              <div className="w-48 h-48 mx-auto mb-4 border-3 border-dashed border-[var(--border)] bg-[var(--muted)] flex flex-col items-center justify-center gap-2">
                <svg className="w-12 h-12 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75H16.5v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75H16.5v-.75z" />
                </svg>
                <span className="text-xs text-[var(--muted-foreground)] font-bold uppercase">
                  {t('qrPlaceholder')}
                </span>
              </div>

              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {t('scanQr')}
              </p>

              {/* Steps */}
              <div className="text-left bg-[var(--muted)] border-2 border-[var(--border)] p-4">
                <h4 className="font-bold text-sm uppercase text-[var(--foreground)] mb-2">{t('steps')}</h4>
                <ol className="text-sm text-[var(--muted-foreground)] space-y-1 list-decimal list-inside">
                  <li>{t('step1', { platform: 'Yape' })}</li>
                  <li>{t('step2')}</li>
                  <li>{t('step3')}</li>
                  <li>{t('step4')}</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Plin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00BCD4] border-2 border-[var(--border)] flex items-center justify-center rounded-lg">
                  <span className="text-white font-black text-sm">P</span>
                </div>
                {t('plinTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {/* QR Placeholder */}
              <div className="w-48 h-48 mx-auto mb-4 border-3 border-dashed border-[var(--border)] bg-[var(--muted)] flex flex-col items-center justify-center gap-2">
                <svg className="w-12 h-12 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75H16.5v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75H16.5v-.75z" />
                </svg>
                <span className="text-xs text-[var(--muted-foreground)] font-bold uppercase">
                  {t('qrPlaceholder')}
                </span>
              </div>

              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {t('scanQr')}
              </p>

              {/* Steps */}
              <div className="text-left bg-[var(--muted)] border-2 border-[var(--border)] p-4">
                <h4 className="font-bold text-sm uppercase text-[var(--foreground)] mb-2">{t('steps')}</h4>
                <ol className="text-sm text-[var(--muted-foreground)] space-y-1 list-decimal list-inside">
                  <li>{t('step1', { platform: 'Plin' })}</li>
                  <li>{t('step2')}</li>
                  <li>{t('step3')}</li>
                  <li>{t('step4')}</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Where donations go */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>{t('whereGoes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)] text-sm">{t('use1Title')}</h4>
                  <p className="text-xs text-[var(--muted-foreground)]">{t('use1Desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--score-good)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)] text-sm">{t('use2Title')}</h4>
                  <p className="text-xs text-[var(--muted-foreground)]">{t('use2Desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--score-excellent)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)] text-sm">{t('use3Title')}</h4>
                  <p className="text-xs text-[var(--muted-foreground)]">{t('use3Desc')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transparency CTA */}
        <Card className="bg-[var(--foreground)] text-[var(--background)]">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-black uppercase mb-2">{t('transparencyNote')}</h3>
            <p className="text-[var(--background)]/70 mb-4">
              {t('configureNote')}
            </p>
            <Link href="/transparencia">
              <Button className="bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]">
                {t('viewTransparency')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
