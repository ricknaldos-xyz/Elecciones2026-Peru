import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'


export const metadata: Metadata = {
  title: 'Para Medios y Partners | EleccionesPerú2026',
  description: 'Embebe los widgets de EleccionesPerú2026 en tu sitio web. Información electoral verificada y actualizada para tus lectores.',
}

interface PageProps {
  params: Promise<{ lang: string }>
}

export default async function PartnersPage({ params }: PageProps) {
  const { lang } = await params
  setRequestLocale(lang)
  const t = await getTranslations({ locale: lang, namespace: 'partners' })
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/partners" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="primary" size="md" className="mb-4">
            {t('forMedia')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-4">
            {t('embeddableWidgets')}
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
            {t('heroDesc')}
          </p>
        </div>

        {/* Widget Types */}
        <div className="grid gap-6 mb-12">
          {/* Candidate Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center">
                  <span className="text-white font-black text-sm">C</span>
                </div>
                {t('candidateWidget')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)] mb-4">
                {t('candidateWidgetDesc')}
              </p>

              <div className="bg-[var(--muted)] p-4 border-2 border-[var(--border)] mb-4 overflow-x-auto">
                <pre className="text-sm text-[var(--foreground)]">
{`<iframe
  src="https://eleccionesperu2026.xyz/embed/candidate/keiko-fujimori"
  width="400"
  height="220"
  frameborder="0"
  style="border: none; max-width: 100%;"
></iframe>`}
                </pre>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/embed/candidate/keiko-fujimori" target="_blank">
                  <Button variant="secondary" size="sm">
                    {t('viewExample')}
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Ranking Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--score-good)] border-2 border-[var(--border)] flex items-center justify-center">
                  <span className="text-white font-black text-sm">R</span>
                </div>
                {t('rankingWidget')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)] mb-4">
                {t('rankingWidgetDesc')}
              </p>

              <div className="bg-[var(--muted)] p-4 border-2 border-[var(--border)] mb-4 overflow-x-auto">
                <pre className="text-sm text-[var(--foreground)]">
{`<iframe
  src="https://eleccionesperu2026.xyz/embed/ranking?cargo=presidente&limit=5"
  width="450"
  height="500"
  frameborder="0"
  style="border: none; max-width: 100%;"
></iframe>`}
                </pre>
              </div>

              <h4 className="font-bold text-[var(--foreground)] mb-2 uppercase text-sm">{t('parameters')}</h4>
              <ul className="text-sm text-[var(--muted-foreground)] space-y-1 mb-4">
                <li><code className="bg-[var(--muted)] px-1">cargo</code>: {t('paramCargoDesc')}</li>
                <li><code className="bg-[var(--muted)] px-1">limit</code>: {t('paramLimitDesc')}</li>
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link href="/embed/ranking?cargo=presidente&limit=5" target="_blank">
                  <Button variant="secondary" size="sm">
                    {t('viewExamplePresidents')}
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/embed/ranking?cargo=senador&limit=5" target="_blank">
                  <Button variant="outline" size="sm">
                    {t('viewExampleSenators')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>{t('benefits')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--score-excellent)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">{t('free')}</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">{t('freeDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--score-good)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">{t('autoUpdate')}</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">{t('autoUpdateDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">{t('officialSources')}</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">{t('officialSourcesDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--score-medium)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">{t('responsive')}</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">{t('responsiveDesc')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-[var(--foreground)] text-[var(--background)]">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-black uppercase mb-2">{t('customQuestion')}</h3>
            <p className="text-[var(--background)]/70 mb-4">
              {t('customDesc')}
            </p>
            <a href="mailto:contacto@eleccionesperu2026.xyz">
              <Button className="bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]">
                {t('contact')}
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
