import { notFound } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { getCandidateBySlug } from '@/lib/db/queries'
import { cn } from '@/lib/utils'
import { CandidateImage } from '@/components/candidate/CandidateImage'

interface PageProps {
  params: Promise<{ slug: string }>
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--score-excellent)'
  if (score >= 60) return 'var(--score-good)'
  if (score >= 40) return 'var(--score-medium)'
  return 'var(--score-low)'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Bueno'
  if (score >= 40) return 'Regular'
  return 'Bajo'
}

const cargoLabels: Record<string, string> = {
  presidente: 'Presidente',
  vicepresidente: 'Vicepresidente',
  senador: 'Senador',
  diputado: 'Diputado',
  parlamento_andino: 'Parlamento Andino',
}

export default async function EmbedCandidatePage({ params }: PageProps) {
  const { slug } = await params
  const candidate = await getCandidateBySlug(slug)

  if (!candidate) {
    notFound()
  }

  const score = candidate.scores.score_balanced_p ?? candidate.scores.score_balanced

  return (
    <div className="p-4 bg-[var(--background)] min-h-screen flex items-center justify-center">
      <div className={cn(
        'w-full max-w-sm',
        'bg-[var(--card)]',
        'border-3 border-[var(--border)]',
        'shadow-[var(--shadow-brutal)]',
        'overflow-hidden'
      )}>
        {/* Header */}
        <div className="p-4 border-b-3 border-[var(--border)]">
          <div className="flex items-start gap-3">
            {/* Photo */}
            <div className="w-16 h-16 border-2 border-[var(--border)] bg-[var(--muted)] overflow-hidden flex-shrink-0 relative">
              <CandidateImage src={candidate.photo_url} name={candidate.full_name} fill sizes="64px" containerClassName="text-lg" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-[var(--foreground)] uppercase leading-tight truncate">
                {candidate.full_name}
              </h2>
              <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase">
                {cargoLabels[candidate.cargo] || candidate.cargo}
              </p>
              {candidate.party && (
                <p className="text-xs font-medium text-[var(--muted-foreground)] truncate">
                  {candidate.party.name}
                </p>
              )}
            </div>

            {/* Score */}
            <div
              className={cn(
                'w-14 h-14 flex-shrink-0',
                'flex flex-col items-center justify-center',
                'border-2 border-[var(--border)]',
                'shadow-[2px_2px_0_var(--border)]'
              )}
              style={{ backgroundColor: getScoreColor(score) }}
            >
              <span className="text-xl font-black text-white leading-none">
                {score.toFixed(0)}
              </span>
              <span className="text-[8px] font-bold text-white/80 uppercase">
                {getScoreLabel(score)}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="p-3 bg-[var(--muted)] grid grid-cols-3 gap-2">
          <div className="text-center">
            <span className="block text-lg font-black text-[var(--score-good)]">
              {candidate.scores.competence.toFixed(0)}
            </span>
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
              Competencia
            </span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-black text-[var(--score-excellent)]">
              {candidate.scores.integrity.toFixed(0)}
            </span>
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
              H. Legal
            </span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-black text-[var(--score-medium)]">
              {candidate.scores.transparency.toFixed(0)}
            </span>
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
              Transparencia
            </span>
          </div>
        </div>

        {/* Footer */}
        <Link
          href={`/candidato/${candidate.slug}`}
          target="_blank"
          className={cn(
            'block p-2 text-center',
            'bg-[var(--primary)] text-white',
            'text-xs font-bold uppercase tracking-wide',
            'hover:bg-[var(--primary)]/90 transition-colors'
          )}
        >
          Ver perfil completo en Ranking Electoral
        </Link>
      </div>
    </div>
  )
}
