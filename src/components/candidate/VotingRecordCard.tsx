'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface VotingSummary {
  totalVotes: number
  votesInFavor: number
  votesAgainst: number
  abstentions: number
  absences: number
  proCrimeVotesInFavor: number
  proCrimeVotesAgainst: number
  antiDemocraticVotes: number
  integrityPenalty: number
  integrityBonus: number
}

interface VotingRecordCardProps {
  candidateId: string
}

export function VotingRecordCard({ candidateId }: VotingRecordCardProps) {
  const [data, setData] = useState<VotingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/voting-record`)
        if (!res.ok) {
          if (res.status === 404) {
            setData(null)
            return
          }
          throw new Error('Failed to fetch voting record')
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
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
            Historial de Votaciones
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

  if (error || !data) {
    return null // No voting record available - don't show card
  }

  if (data.totalVotes === 0) {
    return null // No congressional voting history
  }

  const hasProblematicVotes = data.proCrimeVotesInFavor > 0 || data.antiDemocraticVotes > 0
  const hasGoodVotes = data.proCrimeVotesAgainst > 0

  return (
    <Card className={cn(
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
          Historial de Votaciones en Congreso
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
            <div className="text-2xl font-black text-[var(--foreground)]">{data.totalVotes}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Total Votos</div>
          </div>
          <div className="p-3 bg-green-100 border-2 border-green-500 text-center">
            <div className="text-2xl font-black text-green-700">{data.votesInFavor}</div>
            <div className="text-xs font-bold text-green-600 uppercase">A Favor</div>
          </div>
          <div className="p-3 bg-red-100 border-2 border-red-500 text-center">
            <div className="text-2xl font-black text-red-700">{data.votesAgainst}</div>
            <div className="text-xs font-bold text-red-600 uppercase">En Contra</div>
          </div>
          <div className="p-3 bg-gray-100 border-2 border-gray-400 text-center">
            <div className="text-2xl font-black text-gray-600">{data.abstentions + data.absences}</div>
            <div className="text-xs font-bold text-gray-500 uppercase">Ausencias</div>
          </div>
        </div>

        {/* Pro-crime votes warning */}
        {hasProblematicVotes && (
          <div className="p-4 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[var(--flag-red-bg)] border-2 border-[var(--flag-red)]">
                <svg className="w-5 h-5 text-[var(--flag-red-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-black text-[var(--flag-red-text)] uppercase mb-1">
                  Votos Controversiales Detectados
                </h4>
                <div className="space-y-1 text-sm">
                  {data.proCrimeVotesInFavor > 0 && (
                    <p className="text-[var(--flag-red-text)]">
                      • <strong>{data.proCrimeVotesInFavor}</strong> voto(s) a favor de leyes pro-crimen
                    </p>
                  )}
                  {data.antiDemocraticVotes > 0 && (
                    <p className="text-[var(--flag-red-text)]">
                      • <strong>{data.antiDemocraticVotes}</strong> voto(s) contra la democracia/prensa
                    </p>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="destructive">
                    Penalización: -{data.integrityPenalty} pts
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Good votes bonus */}
        {hasGoodVotes && (
          <div className="p-4 bg-green-100 border-2 border-green-500">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-200 border-2 border-green-500">
                <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-black text-green-700 uppercase mb-1">
                  Votos Positivos
                </h4>
                <p className="text-sm text-green-600">
                  Votó <strong>en contra</strong> de {data.proCrimeVotesAgainst} ley(es) pro-crimen
                </p>
                <div className="mt-2">
                  <Badge variant="success">
                    Bonificación: +{data.integrityBonus} pts
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
