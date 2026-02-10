'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ControversialVote {
  projectId: string
  projectTitle: string
  description: string
  category: string
  voteType: 'favor' | 'contra' | 'abstencion' | 'ausente' | 'licencia'
  sessionDate: string
  penaltyPoints: number
  bonusPoints: number
  sourceUrl?: string
}

interface VotingDetails {
  controversialVotes: ControversialVote[]
  totalControversialLaws: number
  votedInFavor: number
  votedAgainst: number
  absent: number
  abstentions: number
}

interface ControversialVotesCardProps {
  candidateId: string
}

const CATEGORY_LABELS: Record<string, string> = {
  pro_crimen: 'Pro-crimen',
  anti_colaboracion: 'Anti-colaboración',
  pro_impunidad: 'Pro-impunidad',
  anti_fiscalia: 'Anti-fiscalía',
  anti_prensa: 'Anti-prensa',
  pro_evasion: 'Pro-evasión',
  anti_transparencia: 'Anti-transparencia',
  clientelismo: 'Clientelismo',
}

const VOTE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  favor: {
    label: 'A FAVOR',
    color: 'text-[var(--flag-red-text)]',
    bgColor: 'bg-[var(--flag-red)]/10',
    borderColor: 'border-[var(--flag-red)]',
  },
  contra: {
    label: 'EN CONTRA',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
  },
  abstencion: {
    label: 'ABSTENCIÓN',
    color: 'text-[var(--muted-foreground)]',
    bgColor: 'bg-[var(--muted)]',
    borderColor: 'border-[var(--border)]',
  },
  ausente: {
    label: 'AUSENTE',
    color: 'text-[var(--muted-foreground)]',
    bgColor: 'bg-[var(--muted)]',
    borderColor: 'border-[var(--border)]',
  },
  licencia: {
    label: 'LICENCIA',
    color: 'text-[var(--muted-foreground)]',
    bgColor: 'bg-[var(--muted)]',
    borderColor: 'border-[var(--border)]',
  },
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function ControversialVotesCard({ candidateId }: ControversialVotesCardProps) {
  const [data, setData] = useState<VotingDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/voting-details`)
        if (!res.ok) {
          setData(null)
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [candidateId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Votaciones en Leyes Controversiales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.controversialVotes.length === 0) {
    return null
  }

  const hasProblematicVotes = data.votedInFavor > 0

  return (
    <Card id="votaciones-controversiales" className={cn(
      'border-2',
      hasProblematicVotes ? 'border-[var(--flag-red)]' : 'border-[var(--border)]'
    )}>
      <CardHeader className={cn(
        hasProblematicVotes && 'bg-[var(--flag-red)]/10'
      )}>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Votaciones en Leyes Controversiales
        </CardTitle>
        <p className="text-xs text-[var(--muted-foreground)] font-bold mt-1">
          {data.controversialVotes.length} de {data.totalControversialLaws} leyes controversiales evaluadas
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className={cn(
            'p-2 text-center border-2',
            data.votedInFavor > 0
              ? 'bg-[var(--flag-red)]/10 border-[var(--flag-red)]'
              : 'bg-[var(--muted)] border-[var(--border)]'
          )}>
            <div className={cn(
              'text-xl font-black',
              data.votedInFavor > 0 ? 'text-[var(--flag-red-text)]' : 'text-[var(--muted-foreground)]'
            )}>
              {data.votedInFavor}
            </div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">A Favor</div>
          </div>
          <div className={cn(
            'p-2 text-center border-2',
            data.votedAgainst > 0
              ? 'bg-green-100 border-green-500'
              : 'bg-[var(--muted)] border-[var(--border)]'
          )}>
            <div className={cn(
              'text-xl font-black',
              data.votedAgainst > 0 ? 'text-green-700' : 'text-[var(--muted-foreground)]'
            )}>
              {data.votedAgainst}
            </div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">En Contra</div>
          </div>
          <div className="p-2 text-center border-2 bg-[var(--muted)] border-[var(--border)]">
            <div className="text-xl font-black text-[var(--muted-foreground)]">
              {data.absent + data.abstentions}
            </div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Ausente</div>
          </div>
        </div>

        {/* Category breakdown */}
        {(() => {
          const categoryCounts = data.controversialVotes
            .filter(v => v.voteType === 'favor')
            .reduce((acc, vote) => {
              acc[vote.category] = (acc[vote.category] || 0) + 1
              return acc
            }, {} as Record<string, number>)
          const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])
          const maxCount = Math.max(...Object.values(categoryCounts), 1)

          if (sortedCategories.length === 0) return null

          return (
            <div className="mb-4 p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
              <h4 className="font-black text-xs uppercase text-[var(--muted-foreground)] mb-2">Votos a favor por categoría</h4>
              <div className="space-y-1.5">
                {sortedCategories.map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold w-24 truncate uppercase">{CATEGORY_LABELS[cat] || cat}</span>
                    <div className="flex-1 h-3 bg-[var(--background)] border-2 border-[var(--border)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--flag-red)]"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-black w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Individual votes */}
        <div className="space-y-3">
          {data.controversialVotes.map((vote) => {
            const config = VOTE_CONFIG[vote.voteType] || VOTE_CONFIG.ausente
            return (
              <div
                key={vote.projectId}
                className={cn(
                  'p-3 sm:p-4 border-2',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className={cn('font-black text-sm sm:text-base', config.color)}>
                    {vote.projectTitle}
                  </h4>
                  {vote.sourceUrl && (
                    <a
                      href={vote.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1 text-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <Badge variant="outline" size="sm" className="text-[10px]">
                    {vote.projectId}
                  </Badge>
                  <Badge variant="outline" size="sm" className="text-[10px]">
                    {CATEGORY_LABELS[vote.category] || vote.category}
                  </Badge>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {formatDate(vote.sessionDate)}
                  </span>
                </div>
                {vote.description && (
                  <p className="text-xs text-[var(--muted-foreground)] mb-2 font-medium">
                    {vote.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge
                    variant={vote.voteType === 'favor' ? 'destructive' : vote.voteType === 'contra' ? 'success' : 'default'}
                    size="sm"
                    className="font-black"
                  >
                    Votó: {config.label}
                  </Badge>
                  {vote.voteType === 'favor' && vote.penaltyPoints > 0 && (
                    <span className="text-xs font-black text-[var(--flag-red-text)]">
                      -{vote.penaltyPoints} pts integridad
                    </span>
                  )}
                  {vote.voteType === 'contra' && vote.bonusPoints > 0 && (
                    <span className="text-xs font-black text-green-700">
                      +{vote.bonusPoints} pts integridad
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-[var(--muted-foreground)] pt-3 mt-3 border-t-2 border-[var(--border)]">
          Fuente: Portal del Congreso de la República. Las leyes controversiales son identificadas
          por organizaciones de sociedad civil y medios de investigación.
        </p>
      </CardContent>
    </Card>
  )
}
