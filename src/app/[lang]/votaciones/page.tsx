import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CandidateImage } from '@/components/candidate/CandidateImage'
import { displayPartyName, formatName } from '@/lib/utils'
import { locales } from '@/i18n/config'
import { sql } from '@/lib/db'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ lang: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  pro_crimen: 'Modifica sanciones penales',
  anti_colaboracion: 'Modifica colaboración eficaz',
  pro_impunidad: 'Modifica prescripción',
  anti_fiscalia: 'Modifica competencias fiscales',
  anti_prensa: 'Regula medios de comunicación',
  pro_evasion: 'Modifica normativa tributaria',
  anti_transparencia: 'Modifica acceso a información',
  clientelismo: 'Gestión de recursos públicos',
}

const CATEGORY_COLORS: Record<string, string> = {
  pro_crimen: 'bg-red-100 text-red-800 border-red-300',
  anti_colaboracion: 'bg-orange-100 text-orange-800 border-orange-300',
  pro_impunidad: 'bg-rose-100 text-rose-800 border-rose-300',
  anti_fiscalia: 'bg-purple-100 text-purple-800 border-purple-300',
  anti_prensa: 'bg-amber-100 text-amber-800 border-amber-300',
  pro_evasion: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  anti_transparencia: 'bg-slate-100 text-slate-800 border-slate-300',
  clientelismo: 'bg-pink-100 text-pink-800 border-pink-300',
}

interface Law {
  id: string
  project_id: string
  title: string
  description: string | null
  category: string
  penalty_points: number
  bonus_points: number
  favor_count: number
  contra_count: number
}

interface CandidateVoteRow {
  id: string
  full_name: string
  slug: string
  photo_url: string | null
  cargo: string
  party_name: string | null
  party_short_name: string | null
  party_color: string | null
  favor_count: number
  contra_count: number
  absent_count: number
  total_votes: number
}

async function getData() {
  try {
    const [lawsResult, candidatesResult, totalCandidates] = await Promise.all([
      sql`
        SELECT cl.*,
          COUNT(CASE WHEN cv.vote_type = 'favor' THEN 1 END) as favor_count,
          COUNT(CASE WHEN cv.vote_type = 'contra' THEN 1 END) as contra_count
        FROM controversial_laws cl
        LEFT JOIN congressional_votes cv ON cl.project_id = cv.project_id
        GROUP BY cl.id, cl.project_id, cl.title, cl.description, cl.category,
                 cl.penalty_points, cl.bonus_points, cl.approval_date, cl.is_approved,
                 cl.source_url, cl.created_at
        ORDER BY cl.penalty_points DESC
      `,
      sql`
        SELECT
          c.id, c.full_name, c.slug, c.photo_url, c.cargo,
          p.name as party_name, p.short_name as party_short_name, p.color as party_color,
          COUNT(CASE WHEN cv.vote_type = 'favor' THEN 1 END) as favor_count,
          COUNT(CASE WHEN cv.vote_type = 'contra' THEN 1 END) as contra_count,
          COUNT(CASE WHEN cv.vote_type IN ('ausente', 'abstencion', 'licencia') THEN 1 END) as absent_count,
          COUNT(*) as total_votes
        FROM candidates c
        JOIN congressional_votes cv ON c.id = cv.candidate_id
        JOIN controversial_laws cl ON cv.project_id = cl.project_id
        LEFT JOIN parties p ON c.party_id = p.id
        GROUP BY c.id, c.full_name, c.slug, c.photo_url, c.cargo,
                 p.name, p.short_name, p.color
        ORDER BY favor_count DESC, c.full_name
      `,
      sql`
        SELECT COUNT(DISTINCT candidate_id) as total
        FROM congressional_votes cv
        JOIN controversial_laws cl ON cv.project_id = cl.project_id
      `,
    ])

    const laws: Law[] = lawsResult.map(r => ({
      id: r.id as string,
      project_id: r.project_id as string,
      title: r.title as string,
      description: r.description as string | null,
      category: r.category as string,
      penalty_points: Number(r.penalty_points) || 0,
      bonus_points: Number(r.bonus_points) || 0,
      favor_count: Number(r.favor_count) || 0,
      contra_count: Number(r.contra_count) || 0,
    }))

    const candidates: CandidateVoteRow[] = candidatesResult.map(r => ({
      id: r.id as string,
      full_name: formatName(r.full_name as string),
      slug: r.slug as string,
      photo_url: r.photo_url as string | null,
      cargo: r.cargo as string,
      party_name: r.party_name as string | null,
      party_short_name: r.party_short_name as string | null,
      party_color: r.party_color as string | null,
      favor_count: Number(r.favor_count) || 0,
      contra_count: Number(r.contra_count) || 0,
      absent_count: Number(r.absent_count) || 0,
      total_votes: Number(r.total_votes) || 0,
    }))

    const categories = [...new Set(laws.map(l => l.category))]

    return {
      laws,
      candidates,
      totalCandidates: Number(totalCandidates[0]?.total) || 0,
      categories,
    }
  } catch {
    return { laws: [], candidates: [], totalCandidates: 0, categories: [] }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params
  setRequestLocale(lang)
  const t = await getTranslations({ locale: lang, namespace: 'votaciones' })
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
      canonical: `${BASE_URL}/votaciones`,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, l === 'es' ? `${BASE_URL}/votaciones` : `${BASE_URL}/${l}/votaciones`])
        ),
        'x-default': `${BASE_URL}/votaciones`,
      },
    },
  }
}

export default async function VotacionesPage({ params }: PageProps) {
  const { lang } = await params
  setRequestLocale(lang)
  const t = await getTranslations({ locale: lang, namespace: 'votaciones' })
  const { laws, candidates, totalCandidates, categories } = await getData()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--foreground)] mb-3 uppercase tracking-tight">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-[var(--muted-foreground)] font-medium max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-[var(--score-low)]">{laws.length}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">{t('totalLaws')}</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">{totalCandidates}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">{t('candidatesWithVotes')}</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-[var(--primary)]">{categories.length}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">{t('categories')}</div>
          </Card>
        </div>

        {/* Laws List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('lawsList')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {laws.map((law) => (
              <div
                key={law.id}
                className="border-2 border-[var(--border)] p-3 sm:p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-black text-[var(--muted-foreground)] uppercase">{law.project_id}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${CATEGORY_COLORS[law.category] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                        {CATEGORY_LABELS[law.category] || law.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-[var(--foreground)] uppercase leading-tight">
                      {law.title}
                    </h3>
                    {law.description && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">{law.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-lg font-black text-[var(--score-low)]">{law.favor_count}</div>
                      <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{t('inFavor')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-green-600">{law.contra_count}</div>
                      <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{t('against')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-[var(--muted-foreground)]">-{law.penalty_points}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">{t('penaltyPoints')}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Candidates Vote Matrix */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('voteMatrix')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.map((candidate) => {
              const totalLaws = laws.length
              const favorPct = totalLaws > 0 ? (candidate.favor_count / totalLaws) * 100 : 0
              const contraPct = totalLaws > 0 ? (candidate.contra_count / totalLaws) * 100 : 0

              return (
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

                  {/* Name + Party */}
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
                  </div>

                  {/* Vote bar */}
                  <div className="flex-1 min-w-0">
                    <div className="h-4 border border-[var(--border)] flex overflow-hidden">
                      {favorPct > 0 && (
                        <div
                          className="bg-[var(--score-low)] h-full"
                          style={{ width: `${favorPct}%` }}
                        />
                      )}
                      {contraPct > 0 && (
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${contraPct}%` }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Counts */}
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-sm font-black text-[var(--score-low)]">{candidate.favor_count}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] font-bold hidden sm:block">{t('inFavor')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-black text-green-600">{candidate.contra_count}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] font-bold hidden sm:block">{t('against')}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('howItWorks')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">{t('howItWorksDesc')}</p>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[var(--score-low)] border border-[var(--border)]" />
                <span className="text-xs font-bold text-[var(--muted-foreground)]">{t('inFavor')} = {t('penaltyPoints')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 border border-[var(--border)]" />
                <span className="text-xs font-bold text-[var(--muted-foreground)]">{t('against')} = {t('bonusPoints')}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] italic">{t('sourceNote')}</p>
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
