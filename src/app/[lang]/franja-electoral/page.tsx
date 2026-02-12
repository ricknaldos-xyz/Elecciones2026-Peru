import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { locales } from '@/i18n/config'
import { FRANJA_ELECTORAL, PARTY_ALLOCATIONS, formatSoles } from '@/lib/data/franja-electoral'

interface PageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'franjaElectoral' })
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://eleccionesperu2026.xyz'

  return {
    title: `${t('title')} - Ranking Electoral 2026`,
    description: t('subtitle'),
    openGraph: {
      title: `${t('title')} - Ranking Electoral 2026`,
      description: t('subtitle'),
      images: ['/api/og?type=ranking'],
    },
    alternates: {
      canonical: `${BASE_URL}/es/franja-electoral`,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/franja-electoral`])
        ),
        'x-default': `${BASE_URL}/es/franja-electoral`,
      },
    },
  }
}

function getStatusBadge(status: string, t: (key: string) => string) {
  switch (status) {
    case 'renounced_full':
      return <Badge variant="warning">{t('renounced')}</Badge>
    case 'renounced_partial':
      return <Badge variant="warning">{t('renouncedPartial')}</Badge>
    case 'withdrawn':
      return <Badge variant="danger">{t('withdrawn')}</Badge>
    default:
      return null
  }
}

function getBarColor(status: string, underInvestigation: boolean): string {
  if (underInvestigation) return 'bg-[var(--score-low)]'
  if (status === 'renounced_full' || status === 'withdrawn') return 'bg-gray-400 dark:bg-gray-600'
  if (status === 'renounced_partial') return 'bg-amber-400 dark:bg-amber-600'
  return 'bg-[var(--primary)]'
}

export default async function FranjaElectoralPage({ params }: PageProps) {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'franjaElectoral' })

  const maxAllocation = PARTY_ALLOCATIONS[0].totalAllocation
  const rtvPercent = Math.round((FRANJA_ELECTORAL.radioTvBudget / FRANJA_ELECTORAL.totalBudget) * 100)
  const digitalPercent = 100 - rtvPercent

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] mb-3 uppercase tracking-tight">
            {t('title')}
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted-foreground)] font-medium max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* ========== OVERVIEW CARDS ========== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Card className="p-4">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-1">{t('totalBudget')}</div>
            <div className="text-2xl sm:text-3xl font-black text-[var(--primary)]">
              {formatSoles(FRANJA_ELECTORAL.totalBudget)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{t('publicFunds')}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-1">{t('parties')}</div>
            <div className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
              {FRANJA_ELECTORAL.totalParties}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{t('organizations')}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-1">{t('period')}</div>
            <div className="text-lg sm:text-xl font-black text-[var(--foreground)]">
              {FRANJA_ELECTORAL.broadcastDays} {t('days')}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">11 feb — 9 abr 2026</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-1">{t('mediaOutlets')}</div>
            <div className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
              {FRANJA_ELECTORAL.mediaOutlets}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{t('mediaDesc')}</div>
          </Card>
        </div>

        {/* ========== DISTRIBUTION ========== */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Segmented bar: Radio/TV vs Digital */}
            <div className="mb-6">
              <div className="h-8 border-2 border-[var(--border)] flex overflow-hidden mb-3">
                <div
                  className="flex items-center justify-center text-xs font-black text-white bg-[var(--primary)]"
                  style={{ width: `${rtvPercent}%` }}
                >
                  {t('radioTv')} ({rtvPercent}%)
                </div>
                <div
                  className="flex items-center justify-center text-xs font-black text-white bg-[var(--score-good)]"
                  style={{ width: `${digitalPercent}%` }}
                >
                  {digitalPercent}%
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[var(--primary)] border-2 border-[var(--border)]" />
                  <div>
                    <span className="text-sm font-black text-[var(--foreground)]">{formatSoles(FRANJA_ELECTORAL.radioTvBudget)}</span>
                    <span className="text-xs text-[var(--muted-foreground)] ml-1">{t('radioTv')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[var(--score-good)] border-2 border-[var(--border)]" />
                  <div>
                    <span className="text-sm font-black text-[var(--foreground)]">{formatSoles(FRANJA_ELECTORAL.digitalBudget)}</span>
                    <span className="text-xs text-[var(--muted-foreground)] ml-1">{t('digital')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formula */}
            <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-4">
              <h3 className="text-sm font-black text-[var(--foreground)] uppercase mb-2">{t('formula')}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">{t('formulaDesc')}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('minAllocation')}</div>
                  <div className="text-lg font-black text-[var(--foreground)]">{formatSoles(FRANJA_ELECTORAL.minAllocation)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('maxAllocation')}</div>
                  <div className="text-lg font-black text-[var(--score-low)]">{formatSoles(FRANJA_ELECTORAL.maxAllocation)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('disparity')}</div>
                  <div className="text-lg font-black text-[var(--score-low)]">{FRANJA_ELECTORAL.disparityRatio}x</div>
                </div>
              </div>
            </div>

            {/* Acción Popular note */}
            <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-3 mt-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                <span className="font-black text-[var(--foreground)]">{t('accionPopularNote')}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ========== ALLOCATION BY PARTY ========== */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('allocationByParty')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {PARTY_ALLOCATIONS.map((party) => (
                <div key={party.shortName} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                  {/* Party name */}
                  <div className="w-36 sm:w-48 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-black text-[var(--foreground)] uppercase truncate block">
                      {party.partyName}
                    </span>
                    {party.congressionalSeats2021 > 0 && (
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {party.congressionalSeats2021} {t('seats2021')}
                      </span>
                    )}
                  </div>

                  {/* Bar */}
                  <div className="flex-1 h-5 bg-[var(--muted)] border border-[var(--border)]">
                    <div
                      className={`h-full transition-all ${getBarColor(party.status, party.underInvestigation)}`}
                      style={{ width: `${(party.totalAllocation / maxAllocation) * 100}%` }}
                    />
                  </div>

                  {/* Amount */}
                  <div className="w-24 sm:w-28 text-right flex-shrink-0">
                    <span className="text-xs sm:text-sm font-black text-[var(--foreground)]">
                      {formatSoles(party.totalAllocation)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="w-28 flex-shrink-0 text-right">
                    {party.underInvestigation && (
                      <Badge variant="danger">{t('underInvestigation')}</Badge>
                    )}
                    {!party.underInvestigation && getStatusBadge(party.status, t)}
                    {!party.underInvestigation && party.status === 'active' && (
                      <span className="text-xs text-[var(--muted-foreground)]">{t('active')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ========== SCANDALS ========== */}
        <Card className="mb-8 border-[var(--score-low)]">
          <CardHeader className="bg-red-50 dark:bg-red-950/20">
            <CardTitle className="flex items-center gap-2 text-[var(--score-low)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
              </svg>
              {t('alerts')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="border-l-4 border-[var(--score-low)] pl-4">
              <h3 className="text-sm font-black text-[var(--foreground)] uppercase">{t('alertNativa')}</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('alertNativaDesc')}</p>
            </div>
            <div className="border-l-4 border-[var(--score-low)] pl-4">
              <h3 className="text-sm font-black text-[var(--foreground)] uppercase">{t('alertAutocontract')}</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('alertAutocontractDesc')}</p>
            </div>
            <div className="border-l-4 border-amber-400 pl-4">
              <h3 className="text-sm font-black text-[var(--foreground)] uppercase">{t('alertRenounced')}</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('alertRenouncedDesc')}</p>
            </div>
            <div className="border-l-4 border-gray-400 pl-4">
              <h3 className="text-sm font-black text-[var(--foreground)] uppercase">{t('alertWithdrawn')}</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('alertWithdrawnDesc')}</p>
            </div>
          </CardContent>
        </Card>

        {/* ========== LEGAL FRAMEWORK ========== */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('legalFramework')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline">ART. 35</Badge>
              <p className="text-sm text-[var(--muted-foreground)]">{t('legalArt35')}</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">LEY 28094</Badge>
              <p className="text-sm text-[var(--muted-foreground)]">{t('legalLey28094')}</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">RJ 000011</Badge>
              <p className="text-sm text-[var(--muted-foreground)]">{t('legalRJ')}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-[var(--border)] p-3 mt-4">
              <p className="text-xs font-bold text-[var(--foreground)]">{t('legalNote')}</p>
            </div>
          </CardContent>
        </Card>

        {/* ========== SOURCES ========== */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sources')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li className="flex items-center gap-2">
                <Badge variant="outline">ONPE</Badge>
                <span>Resolución Jefatural N° 000011-2026-JN/ONPE — Plan de Medios</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline">ONPE</Badge>
                <span>Resolución Jefatural N° 000020-2026-JN/ONPE — Modificaciones</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline">JNE</Badge>
                <span>Resolución N° 0602-2021-JNE — Distribución de escaños 2021</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline">LEY</Badge>
                <span>Ley N° 28094 — Ley de Organizaciones Políticas</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline">LEY</Badge>
                <span>Artículo 35 — Constitución Política del Perú</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-bold text-[var(--primary)] hover:underline uppercase"
          >
            &larr; {t('backToHome')}
          </Link>
        </div>
      </main>
    </div>
  )
}
