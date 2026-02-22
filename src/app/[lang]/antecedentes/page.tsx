import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CandidateImage } from '@/components/candidate/CandidateImage'
import { displayPartyName, formatName } from '@/lib/utils'
import { locales } from '@/i18n/config'
import { sql } from '@/lib/db'
import type { FlagType, FlagSeverity } from '@/types/database'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ lang: string }>
}

interface FlaggedCandidate {
  id: string
  full_name: string
  slug: string
  photo_url: string | null
  cargo: string
  integrity_score: number
  party_name: string | null
  party_short_name: string | null
  party_color: string | null
  flag_count: number
  red_count: number
  amber_count: number
  flag_types: string[]
}

interface TypeDistribution {
  type: string
  severity: string
  candidate_count: number
}

interface CargoDistribution {
  cargo: string
  total_candidates: number
  flagged_candidates: number
}

async function getData() {
  try {
    const [candidatesResult, typeDistResult, cargoDistResult, totalsResult] = await Promise.all([
      sql`
        SELECT
          c.id, c.full_name, c.slug, c.photo_url, c.cargo,
          COALESCE(s.integrity, 50) as integrity_score,
          p.name as party_name, p.short_name as party_short_name, p.color as party_color,
          COUNT(DISTINCT f.id) as flag_count,
          COUNT(CASE WHEN f.severity = 'RED' THEN 1 END) as red_count,
          COUNT(CASE WHEN f.severity = 'AMBER' THEN 1 END) as amber_count,
          ARRAY_AGG(DISTINCT f.type) FILTER (WHERE f.type IS NOT NULL) as flag_types
        FROM candidates c
        JOIN flags f ON c.id = f.candidate_id AND f.severity IN ('RED', 'AMBER')
        LEFT JOIN scores s ON c.id = s.candidate_id
        LEFT JOIN parties p ON c.party_id = p.id
        WHERE c.is_active = true
        GROUP BY c.id, c.full_name, c.slug, c.photo_url, c.cargo,
                 s.integrity, p.name, p.short_name, p.color
        ORDER BY red_count DESC, flag_count DESC, c.full_name
      `,
      sql`
        SELECT f.type, f.severity, COUNT(DISTINCT f.candidate_id) as candidate_count
        FROM flags f
        JOIN candidates c ON f.candidate_id = c.id AND c.is_active = true
        WHERE f.severity IN ('RED', 'AMBER')
        GROUP BY f.type, f.severity
        ORDER BY candidate_count DESC
      `,
      sql`
        SELECT c.cargo,
          COUNT(DISTINCT c.id) as total_candidates,
          COUNT(DISTINCT CASE WHEN f.id IS NOT NULL THEN c.id END) as flagged_candidates
        FROM candidates c
        LEFT JOIN flags f ON c.id = f.candidate_id AND f.severity IN ('RED', 'AMBER')
        WHERE c.is_active = true
        GROUP BY c.cargo
      `,
      sql`
        SELECT
          COUNT(DISTINCT c.id) as total_active,
          COUNT(DISTINCT CASE WHEN f.id IS NOT NULL THEN c.id END) as total_flagged
        FROM candidates c
        LEFT JOIN flags f ON c.id = f.candidate_id AND f.severity IN ('RED', 'AMBER')
        WHERE c.is_active = true
      `,
    ])

    const candidates: FlaggedCandidate[] = candidatesResult.map(r => ({
      id: r.id as string,
      full_name: formatName(r.full_name as string),
      slug: r.slug as string,
      photo_url: r.photo_url as string | null,
      cargo: r.cargo as string,
      integrity_score: Number(r.integrity_score) || 50,
      party_name: r.party_name as string | null,
      party_short_name: r.party_short_name as string | null,
      party_color: r.party_color as string | null,
      flag_count: Number(r.flag_count) || 0,
      red_count: Number(r.red_count) || 0,
      amber_count: Number(r.amber_count) || 0,
      flag_types: (r.flag_types as string[]) || [],
    }))

    const typeDistribution: TypeDistribution[] = typeDistResult.map(r => ({
      type: r.type as string,
      severity: r.severity as string,
      candidate_count: Number(r.candidate_count) || 0,
    }))

    const cargoDistribution: CargoDistribution[] = cargoDistResult.map(r => ({
      cargo: r.cargo as string,
      total_candidates: Number(r.total_candidates) || 0,
      flagged_candidates: Number(r.flagged_candidates) || 0,
    }))

    const totalActive = Number(totalsResult[0]?.total_active) || 0
    const totalFlagged = Number(totalsResult[0]?.total_flagged) || 0

    // Aggregate type distribution: merge RED and AMBER counts per type
    const typeMap = new Map<string, { red: number; amber: number; total: number }>()
    for (const td of typeDistribution) {
      const existing = typeMap.get(td.type) || { red: 0, amber: 0, total: 0 }
      if (td.severity === 'RED') existing.red += td.candidate_count
      if (td.severity === 'AMBER') existing.amber += td.candidate_count
      existing.total = existing.red + existing.amber
      typeMap.set(td.type, existing)
    }
    const aggregatedTypes = [...typeMap.entries()]
      .map(([type, counts]) => ({ type, ...counts }))
      .sort((a, b) => b.total - a.total)

    // Count specific types for summary cards
    const penalCount = typeMap.get('PENAL_SENTENCE')?.total || 0
    const violenceCount = typeMap.get('VIOLENCE')?.total || 0

    return {
      candidates,
      aggregatedTypes,
      cargoDistribution,
      totalActive,
      totalFlagged,
      penalCount,
      violenceCount,
    }
  } catch {
    return {
      candidates: [],
      aggregatedTypes: [],
      cargoDistribution: [],
      totalActive: 0,
      totalFlagged: 0,
      penalCount: 0,
      violenceCount: 0,
    }
  }
}

const FLAG_TYPE_ICONS: Record<string, string> = {
  PENAL_SENTENCE: '⚖️',
  CIVIL_SENTENCE: '📋',
  VIOLENCE: '🚨',
  ALIMENTOS: '👶',
  LABORAL: '👷',
  CONTRACTUAL: '📄',
  MULTIPLE_RESIGNATIONS: '🔄',
  REINFO: '🏗️',
  OTHER: '📌',
}

const CARGO_ORDER = ['presidente', 'vicepresidente', 'senador', 'diputado', 'parlamento_andino']

function getIntegrityColor(score: number): string {
  if (score >= 80) return 'text-[var(--score-high)]'
  if (score >= 60) return 'text-[var(--score-medium)]'
  return 'text-[var(--score-low)]'
}

function getIntegrityBg(score: number): string {
  if (score >= 80) return 'bg-[var(--score-high)]'
  if (score >= 60) return 'bg-[var(--score-medium)]'
  return 'bg-[var(--score-low)]'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'antecedentes' })
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://eleccionesperu2026.xyz'

  return {
    title: `${t('title')} - EleccionesPerú2026`,
    description: t('subtitle'),
    openGraph: {
      title: `${t('title')} - EleccionesPerú2026`,
      description: t('subtitle'),
      images: ['/api/og?type=ranking'],
    },
    alternates: {
      canonical: `${BASE_URL}/antecedentes`,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/antecedentes`])
        ),
        'x-default': `${BASE_URL}/es/antecedentes`,
      },
    },
  }
}

export default async function AntecedentesPage({ params }: PageProps) {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'antecedentes' })
  const tCandidate = await getTranslations({ locale: lang, namespace: 'candidate' })
  const tRanking = await getTranslations({ locale: lang, namespace: 'ranking' })

  const {
    candidates,
    aggregatedTypes,
    cargoDistribution,
    totalActive,
    totalFlagged,
    penalCount,
    violenceCount,
  } = await getData()

  const flaggedPct = totalActive > 0 ? ((totalFlagged / totalActive) * 100).toFixed(1) : '0'
  const maxTypeCount = aggregatedTypes.length > 0 ? aggregatedTypes[0].total : 1
  const sortedCargo = [...cargoDistribution].sort(
    (a, b) => CARGO_ORDER.indexOf(a.cargo) - CARGO_ORDER.indexOf(b.cargo)
  )

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-[var(--score-low)] border-2 border-[var(--border)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <Badge variant="danger" size="sm">{t('title')}</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--foreground)] mb-3 uppercase tracking-tight">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-[var(--muted-foreground)] font-medium max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Card className="p-4 text-center border-[var(--score-low)]">
            <div className="text-2xl sm:text-3xl font-black text-[var(--score-low)]">{totalFlagged}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">{t('totalFlagged')}</div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{flaggedPct}% {t('ofTotal')}</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">{totalActive}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">{t('totalCandidates')}</div>
          </Card>
          <Card className="p-4 text-center border-[var(--flag-red)]">
            <div className="text-2xl sm:text-3xl font-black text-[var(--score-low)]">{penalCount}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">{t('penalRecords')}</div>
          </Card>
          <Card className="p-4 text-center border-[var(--flag-amber)]">
            <div className="text-2xl sm:text-3xl font-black text-[var(--flag-amber-text)]">{violenceCount}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">{t('violenceRecords')}</div>
          </Card>
        </div>

        {/* Distribution by Type */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('byType')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aggregatedTypes.map(({ type, red, amber, total }) => {
              const barWidth = maxTypeCount > 0 ? (total / maxTypeCount) * 100 : 0
              const redWidth = total > 0 ? (red / total) * 100 : 0

              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-6 text-center flex-shrink-0" aria-hidden="true">
                    {FLAG_TYPE_ICONS[type] || '📌'}
                  </div>
                  <div className="w-36 sm:w-48 flex-shrink-0 min-w-0">
                    <span className="text-xs font-black text-[var(--foreground)] uppercase truncate block">
                      {tCandidate.has(`flagTypes.${type}`) ? tCandidate(`flagTypes.${type}` as Parameters<typeof tCandidate>[0]) : type}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-5 border border-[var(--border)] bg-[var(--muted)] flex overflow-hidden">
                      {redWidth > 0 && (
                        <div
                          className="bg-[var(--score-low)] h-full"
                          style={{ width: `${(red / maxTypeCount) * 100}%` }}
                        />
                      )}
                      {amber > 0 && (
                        <div
                          className="bg-[var(--flag-amber)] h-full"
                          style={{ width: `${(amber / maxTypeCount) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="w-12 text-right flex-shrink-0">
                    <span className="text-sm font-black text-[var(--foreground)]">{total}</span>
                  </div>
                </div>
              )
            })}
            {aggregatedTypes.length > 0 && (
              <div className="flex items-center gap-4 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-[var(--score-low)] border border-[var(--border)]" />
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{t('redFlags')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-[var(--flag-amber)] border border-[var(--border)]" />
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{t('amberFlags')}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution by Cargo */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('byCargo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {sortedCargo.map(({ cargo, total_candidates, flagged_candidates }) => {
                const pct = total_candidates > 0 ? ((flagged_candidates / total_candidates) * 100).toFixed(0) : '0'
                return (
                  <div key={cargo} className="border-2 border-[var(--border)] p-3 text-center">
                    <div className="text-xs font-black text-[var(--foreground)] uppercase mb-2">
                      {tRanking.has(`cargo.${cargo}`) ? tRanking(`cargo.${cargo}` as Parameters<typeof tRanking>[0]) : cargo}
                    </div>
                    <div className="text-xl font-black text-[var(--score-low)]">{flagged_candidates}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)] font-bold">
                      / {total_candidates} ({pct}%)
                    </div>
                    <div className="mt-2 h-1.5 bg-[var(--muted)] border border-[var(--border)]">
                      <div
                        className="h-full bg-[var(--score-low)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)] mt-1">{t('flagged')}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Candidate List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('candidateList')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.map((candidate) => (
              <Link
                key={candidate.id}
                href={`/candidato/${candidate.slug}`}
                className="flex items-center gap-3 p-3 border-2 border-[var(--border)] bg-[var(--background)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100"
              >
                {/* Photo */}
                <div className="w-10 h-10 border-2 border-[var(--border)] overflow-hidden flex-shrink-0 relative">
                  <CandidateImage
                    src={candidate.photo_url}
                    name={candidate.full_name}
                    fill
                    sizes="40px"
                    containerClassName="text-xs"
                  />
                </div>

                {/* Name + Party + Cargo */}
                <div className="w-32 sm:w-48 flex-shrink-0 min-w-0">
                  <div className="text-xs font-black text-[var(--foreground)] uppercase truncate">
                    {candidate.full_name}
                  </div>
                  {candidate.party_name && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <div
                        className="w-2 h-2 border border-[var(--border)] flex-shrink-0"
                        style={{ backgroundColor: candidate.party_color || '#6B7280' }}
                      />
                      <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase truncate">
                        {displayPartyName(candidate.party_name)}
                      </span>
                    </div>
                  )}
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase mt-0.5">
                    {tRanking.has(`cargo.${candidate.cargo}`) ? tRanking(`cargo.${candidate.cargo}` as Parameters<typeof tRanking>[0]) : candidate.cargo}
                  </div>
                </div>

                {/* Flag badges */}
                <div className="flex-1 min-w-0 flex flex-wrap gap-1">
                  {candidate.red_count > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-[var(--flag-red-bg)] text-[var(--flag-red-text)] border border-[var(--flag-red)]">
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                      </svg>
                      {candidate.red_count} {t('redFlags')}
                    </span>
                  )}
                  {candidate.amber_count > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-[var(--flag-amber-bg)] text-[var(--flag-amber-text)] border border-[var(--flag-amber)]">
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                      </svg>
                      {candidate.amber_count} {t('amberFlags')}
                    </span>
                  )}
                  {/* Show flag types as tiny labels */}
                  <div className="hidden sm:flex flex-wrap gap-1">
                    {candidate.flag_types.slice(0, 3).map((ft) => (
                      <span
                        key={ft}
                        className="text-[9px] font-bold text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 border border-[var(--border)] uppercase"
                      >
                        {tCandidate.has(`flagTypes.${ft}`) ? tCandidate(`flagTypes.${ft}` as Parameters<typeof tCandidate>[0]) : ft}
                      </span>
                    ))}
                    {candidate.flag_types.length > 3 && (
                      <span className="text-[9px] font-bold text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 border border-[var(--border)]">
                        +{candidate.flag_types.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Integrity score */}
                <div className="text-center flex-shrink-0">
                  <div className={`text-sm font-black ${getIntegrityColor(candidate.integrity_score)}`}>
                    {candidate.integrity_score}
                  </div>
                  <div className="text-[10px] text-[var(--muted-foreground)] font-bold hidden sm:block uppercase">
                    {t('integrityScore')}
                  </div>
                </div>
              </Link>
            ))}
            {candidates.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
                {t('noCandidates')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer / Sources */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <p className="text-xs text-[var(--muted-foreground)] mb-2">{t('disclaimer')}</p>
            <p className="text-xs text-[var(--muted-foreground)] italic">{t('sourceNote')}</p>
            <div className="mt-3">
              <Link
                href="/metodologia"
                className="text-xs font-bold text-[var(--primary)] hover:underline uppercase"
              >
                {t('viewMethodology')}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="text-center">
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
