'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/share/ShareButton'
import { QuizMatch } from '@/lib/quiz/scoring'
import { TOPIC_LABELS } from '@/lib/quiz/questions'

interface QuizResultsProps {
  matches: QuizMatch[]
  profile: {
    label: string
    description: string
    color: string
  }
  onRestart: () => void
}

export function QuizResults({ matches, profile, onRestart }: QuizResultsProps) {
  const top3 = matches.slice(0, 3)
  const rest = matches.slice(3, 8)

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'var(--score-excellent)'
    if (percentage >= 60) return 'var(--score-good)'
    if (percentage >= 40) return 'var(--score-medium)'
    return 'var(--score-low)'
  }

  return (
    <div className="space-y-8">
      {/* Profile Card */}
      <Card className="p-6 sm:p-8 text-center">
        <span className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wide">
          Tu perfil politico
        </span>
        <h2
          className="text-3xl sm:text-4xl font-black uppercase mt-2 mb-3"
          style={{ color: profile.color }}
        >
          {profile.label}
        </h2>
        <p className="text-[var(--muted-foreground)] font-medium max-w-md mx-auto">
          {profile.description}
        </p>
      </Card>

      {/* Top 3 Matches */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight">
          Tus candidatos mas afines
        </h3>

        {top3.map((match, index) => (
          <Card key={match.candidateId} className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Ranking Badge */}
              <div
                className={cn(
                  'w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0',
                  'flex items-center justify-center',
                  'border-3 border-[var(--border)]',
                  'shadow-[var(--shadow-brutal-sm)]',
                  index === 0 && 'bg-[var(--score-medium)]',
                  index === 1 && 'bg-gray-300',
                  index === 2 && 'bg-amber-600'
                )}
              >
                <span className="text-2xl font-black text-black">
                  #{index + 1}
                </span>
              </div>

              {/* Candidate Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/candidato/${match.candidateSlug}`}>
                    <h4 className="font-black text-lg text-[var(--foreground)] hover:text-[var(--primary)] uppercase">
                      {match.candidateName}
                    </h4>
                  </Link>
                  <Badge variant="secondary" size="sm">
                    {match.partyName}
                  </Badge>
                </div>

                {/* Match Percentage Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--muted-foreground)]">
                      Compatibilidad
                    </span>
                    <span
                      className="text-lg font-black"
                      style={{ color: getMatchColor(match.matchPercentage) }}
                    >
                      {match.matchPercentage}%
                    </span>
                  </div>
                  <div className="h-3 bg-[var(--muted)] border-2 border-[var(--border)]">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${match.matchPercentage}%`,
                        backgroundColor: getMatchColor(match.matchPercentage),
                      }}
                    />
                  </div>
                </div>

                {/* Topic Agreements */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {Object.entries(match.agreementsByTopic).map(([topic, agreement]) => (
                    <span
                      key={topic}
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 border',
                        agreement === 'agree' && 'bg-green-100 text-green-800 border-green-300',
                        agreement === 'neutral' && 'bg-yellow-100 text-yellow-800 border-yellow-300',
                        agreement === 'disagree' && 'bg-red-100 text-red-800 border-red-300'
                      )}
                    >
                      {TOPIC_LABELS[topic] || topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Other Matches */}
      {rest.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-black text-[var(--muted-foreground)] uppercase tracking-wide">
            Otros candidatos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rest.map((match) => (
              <Link key={match.candidateId} href={`/candidato/${match.candidateSlug}`}>
                <Card className="p-4 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] transition-all duration-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[var(--foreground)]">
                        {match.candidateName}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {match.partyName}
                      </div>
                    </div>
                    <div
                      className="text-lg font-black"
                      style={{ color: getMatchColor(match.matchPercentage) }}
                    >
                      {match.matchPercentage}%
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <ShareButton
          title={`Mi perfil politico es ${profile.label}`}
          description={`Mis candidatos mas afines: ${top3.map(m => m.candidateName).join(', ')}`}
          className="flex-1"
          variant="full"
          platforms={['whatsapp', 'twitter', 'facebook', 'copy']}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          onClick={onRestart}
          className="flex-1"
        >
          Volver a empezar
        </Button>
        <Link href="/comparar" className="flex-1">
          <Button variant="outline" className="w-full">
            Comparar candidatos
          </Button>
        </Link>
      </div>
    </div>
  )
}
