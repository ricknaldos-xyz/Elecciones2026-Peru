import { Link } from '@/i18n/routing'
import { sql } from '@/lib/db'
import { cn } from '@/lib/utils'
import { CandidateImage } from '@/components/candidate/CandidateImage'

interface RankingCandidate {
  id: string
  full_name: string
  slug: string
  cargo: string
  photo_url: string | null
  score: number
  party_name: string | null
  party_color: string | null
}

async function getTopCandidates(cargo = 'presidente', limit = 5): Promise<RankingCandidate[]> {
  try {
    const result = await sql`
      SELECT
        c.id,
        c.full_name,
        c.slug,
        c.cargo,
        c.photo_url,
        COALESCE(s.score_balanced_p, s.score_balanced) as score,
        p.name as party_name,
        p.color as party_color
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      LEFT JOIN scores s ON c.id = s.candidate_id
      WHERE c.cargo = ${cargo} AND c.is_active = true
      ORDER BY score DESC NULLS LAST
      LIMIT ${limit}
    `
    return result.map(r => ({ ...r, score: Number(r.score) || 0 })) as RankingCandidate[]
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return []
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--score-excellent)'
  if (score >= 60) return 'var(--score-good)'
  if (score >= 40) return 'var(--score-medium)'
  return 'var(--score-low)'
}

interface PageProps {
  searchParams: Promise<{ cargo?: string; limit?: string }>
}

export default async function EmbedRankingPage({ searchParams }: PageProps) {
  const params = await searchParams
  const cargo = params.cargo || 'presidente'
  const limit = parseInt(params.limit || '5', 10)
  const candidates = await getTopCandidates(cargo, Math.min(limit, 10))

  const cargoLabels: Record<string, string> = {
    presidente: 'Presidenciales',
    senador: 'Senado',
    diputado: 'Diputados',
    parlamento_andino: 'Parlamento Andino',
  }

  return (
    <div className="p-4 bg-[var(--background)] min-h-screen">
      <div className={cn(
        'w-full max-w-md mx-auto',
        'bg-[var(--card)]',
        'border-3 border-[var(--border)]',
        'shadow-[var(--shadow-brutal)]',
        'overflow-hidden'
      )}>
        {/* Header */}
        <div className="p-4 bg-[var(--primary)] text-white border-b-3 border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border-2 border-[var(--border)] flex items-center justify-center">
              <span className="text-[var(--primary)] font-black text-sm">PE</span>
            </div>
            <div>
              <h2 className="font-black uppercase text-lg leading-tight">
                EleccionesPerú2026
              </h2>
              <p className="text-xs font-bold text-white/80 uppercase">
                Top {limit} {cargoLabels[cargo] || cargo}
              </p>
            </div>
          </div>
        </div>

        {/* Candidates */}
        <div>
          {candidates.map((candidate, index) => (
            <Link
              key={candidate.id}
              href={`/candidato/${candidate.slug}`}
              target="_blank"
              className={cn(
                'flex items-center gap-3 p-3',
                'border-b-2 border-[var(--border)] last:border-b-0',
                'hover:bg-[var(--muted)] transition-colors'
              )}
            >
              {/* Rank */}
              <div className={cn(
                'w-8 h-8 flex-shrink-0',
                'flex items-center justify-center',
                'border-2 border-[var(--border)]',
                'font-black text-sm',
                index === 0 && 'bg-[var(--score-medium)] text-black',
                index === 1 && 'bg-gray-300 text-black',
                index === 2 && 'bg-amber-600 text-white',
                index > 2 && 'bg-[var(--muted)] text-[var(--foreground)]'
              )}>
                {index + 1}
              </div>

              {/* Photo */}
              <div className="w-10 h-10 border-2 border-[var(--border)] bg-[var(--muted)] overflow-hidden flex-shrink-0 relative">
                <CandidateImage src={candidate.photo_url} name={candidate.full_name} fill sizes="40px" containerClassName="text-xs" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--foreground)] uppercase truncate">
                  {candidate.full_name}
                </p>
                {candidate.party_name && (
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {candidate.party_name}
                  </p>
                )}
              </div>

              {/* Score */}
              <div
                className={cn(
                  'w-10 h-10 flex-shrink-0',
                  'flex items-center justify-center',
                  'border-2 border-[var(--border)]'
                )}
                style={{ backgroundColor: getScoreColor(candidate.score) }}
              >
                <span className="text-sm font-black text-white">
                  {candidate.score.toFixed(0)}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <Link
          href="/ranking"
          target="_blank"
          className={cn(
            'block p-3 text-center',
            'bg-[var(--foreground)] text-[var(--background)]',
            'text-xs font-bold uppercase tracking-wide',
            'hover:opacity-90 transition-opacity'
          )}
        >
          Ver ranking completo
        </Link>
      </div>
    </div>
  )
}
