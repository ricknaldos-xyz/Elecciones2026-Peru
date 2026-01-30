'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/share/ShareButton'
import { useCandidates } from '@/hooks/useCandidates'
import {
  getRandomPair,
  getRandomCategory,
  processGuess,
  buildBatallaShareText,
  loadBatallaStats,
  saveBatallaStats,
  type BatallaRound,
  type BatallaGuess,
  type BatallaState,
} from '@/lib/juegos/batalla'
import type { CandidateWithScores } from '@/types/database'

type GamePhase = 'intro' | 'question' | 'reveal' | 'gameover'

export function BatallaContent() {
  const t = useTranslations('games')
  const { candidates, loading } = useCandidates({ cargo: 'presidente' })

  const [phase, setPhase] = useState<GamePhase>('intro')
  const [round, setRound] = useState<BatallaRound | null>(null)
  const [lastGuess, setLastGuess] = useState<BatallaGuess | null>(null)
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState<BatallaState>({ streak: 0, bestStreak: 0, totalPlayed: 0, totalCorrect: 0 })
  const [usedPairs, setUsedPairs] = useState<Set<string>>(new Set())
  const [usedCategories, setUsedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    setStats(loadBatallaStats())
  }, [])

  const startNewRound = useCallback(() => {
    if (candidates.length < 2) return

    const pair = getRandomPair(candidates, usedPairs)
    if (!pair) return

    const category = getRandomCategory(usedCategories)

    const pairKey = [pair.a.slug, pair.b.slug].sort().join('|')
    setUsedPairs(prev => new Set(prev).add(pairKey))
    setUsedCategories(prev => {
      const next = new Set(prev).add(category.id)
      if (next.size >= 6) return new Set() // Reset after using most categories
      return next
    })

    setRound({ candidateA: pair.a, candidateB: pair.b, category })
    setPhase('question')
    setLastGuess(null)
  }, [candidates, usedPairs, usedCategories])

  const handleStart = () => {
    setStreak(0)
    setUsedPairs(new Set())
    setUsedCategories(new Set())
    startNewRound()
  }

  const handleGuess = (candidate: CandidateWithScores) => {
    if (!round) return

    const guess = processGuess(round, candidate.slug)
    setLastGuess(guess)
    setPhase('reveal')

    if (guess.correct) {
      const newStreak = streak + 1
      setStreak(newStreak)
      const newStats = {
        ...stats,
        streak: newStreak,
        bestStreak: Math.max(stats.bestStreak, newStreak),
        totalPlayed: stats.totalPlayed + 1,
        totalCorrect: stats.totalCorrect + 1,
      }
      setStats(newStats)
      saveBatallaStats(newStats)
    } else {
      const newStats = {
        ...stats,
        streak: 0,
        totalPlayed: stats.totalPlayed + 1,
      }
      setStats(newStats)
      saveBatallaStats(newStats)
    }
  }

  const handleNext = () => {
    if (lastGuess?.correct) {
      startNewRound()
    } else {
      setPhase('gameover')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-[var(--muted-foreground)] uppercase">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // ========== INTRO ==========
  if (phase === 'intro') {
    return (
      <div className="text-center space-y-8">
        <div>
          <Badge variant="primary" size="md" className="mb-4">{t('batalla.badge')}</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-4">
            {t('batalla.title')}
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-xl mx-auto">
            {t('batalla.subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4">
          <Card className="px-6 py-4 text-center">
            <div className="text-2xl font-black text-[var(--primary)]">{stats.bestStreak}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('batalla.bestStreak')}</div>
          </Card>
          <Card className="px-6 py-4 text-center">
            <div className="text-2xl font-black text-[var(--foreground)]">{stats.totalPlayed}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('batalla.played')}</div>
          </Card>
          <Card className="px-6 py-4 text-center">
            <div className="text-2xl font-black text-[var(--score-good)]">
              {stats.totalPlayed > 0 ? Math.round((stats.totalCorrect / stats.totalPlayed) * 100) : 0}%
            </div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('batalla.accuracy')}</div>
          </Card>
        </div>

        <Button size="lg" onClick={handleStart} className="text-lg px-8">
          {t('batalla.play')}
        </Button>
      </div>
    )
  }

  // ========== GAME OVER ==========
  if (phase === 'gameover') {
    return (
      <div className="text-center space-y-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--primary)] uppercase mb-2">
            {t('batalla.gameOver')}
          </h2>
          <p className="text-lg text-[var(--muted-foreground)]">
            {t('batalla.finalStreak', { count: streak })}
          </p>
        </div>

        {/* Last round reveal */}
        {lastGuess && round && (
          <Card className="p-6 text-left">
            <p className="text-sm font-bold text-[var(--muted-foreground)] uppercase mb-2">{t('batalla.lastRound')}</p>
            <p className="text-base text-[var(--foreground)] mb-2">{round.category.question}</p>
            <div className="flex items-center justify-between gap-4">
              <div className="text-center flex-1">
                <p className="font-bold text-sm">{round.candidateA.full_name}</p>
                <p className={cn('text-lg font-black', lastGuess.valueA >= lastGuess.valueB ? 'text-[var(--score-excellent)]' : 'text-[var(--score-low)]')}>
                  {round.category.format(lastGuess.valueA)}
                </p>
              </div>
              <span className="text-xl font-black text-[var(--muted-foreground)]">vs</span>
              <div className="text-center flex-1">
                <p className="font-bold text-sm">{round.candidateB.full_name}</p>
                <p className={cn('text-lg font-black', lastGuess.valueB >= lastGuess.valueA ? 'text-[var(--score-excellent)]' : 'text-[var(--score-low)]')}>
                  {round.category.format(lastGuess.valueB)}
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] italic mt-3 text-center">
              &ldquo;{lastGuess.comment}&rdquo;
            </p>
          </Card>
        )}

        {/* Score card */}
        <Card className="p-6">
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-black text-[var(--primary)]">{streak}</div>
              <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('batalla.streak')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-[var(--foreground)]">{stats.bestStreak}</div>
              <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('batalla.bestStreak')}</div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <ShareButton
            title={buildBatallaShareText(streak, stats.bestStreak)}
            variant="full"
            platforms={['whatsapp', 'twitter', 'copy']}
          />
        </div>

        <Button size="lg" onClick={handleStart}>
          {t('batalla.playAgain')}
        </Button>
      </div>
    )
  }

  // ========== QUESTION & REVEAL ==========
  if (!round) return null

  return (
    <div className="space-y-6">
      {/* Streak bar */}
      <div className="flex items-center justify-between">
        <Badge variant={streak >= 5 ? 'warning' : 'outline'} size="sm">
          {t('batalla.streak')}: {streak} {streak >= 5 ? '🔥' : ''}
        </Badge>
        <Badge variant="outline" size="sm">
          {t('batalla.bestStreak')}: {stats.bestStreak}
        </Badge>
      </div>

      {/* Category question */}
      <Card className="p-4 sm:p-6 text-center bg-[var(--primary)] text-white border-[var(--border)]">
        <p className="text-base sm:text-lg font-black uppercase">
          {round.category.question}
        </p>
      </Card>

      {/* Candidate cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[round.candidateA, round.candidateB].map((candidate) => {
          const isRevealed = phase === 'reveal'
          const value = round.category.getValue(candidate)
          const otherValue = candidate === round.candidateA
            ? round.category.getValue(round.candidateB)
            : round.category.getValue(round.candidateA)
          const isWinner = isRevealed && Math.abs(value - otherValue) >= 0.5 && value > otherValue
          const isLoser = isRevealed && Math.abs(value - otherValue) >= 0.5 && value < otherValue
          const wasChosen = lastGuess?.chosenSlug === candidate.slug

          return (
            <button
              key={candidate.slug}
              onClick={() => !isRevealed && handleGuess(candidate)}
              disabled={isRevealed}
              className={cn(
                'relative border-3 border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 text-center transition-all duration-200',
                !isRevealed && 'cursor-pointer hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-lg)] active:translate-y-0',
                isRevealed && isWinner && 'ring-4 ring-[var(--score-excellent)] bg-[var(--score-excellent)]/10',
                isRevealed && isLoser && 'opacity-60',
                isRevealed && wasChosen && !lastGuess?.correct && 'ring-4 ring-[var(--score-low)]',
              )}
            >
              {/* Photo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 border-3 border-[var(--border)] bg-[var(--muted)] overflow-hidden">
                {candidate.photo_url ? (
                  <Image
                    src={candidate.photo_url}
                    alt={candidate.full_name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[var(--muted-foreground)]">
                    {candidate.full_name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name & party */}
              <h3 className="text-sm sm:text-base font-black text-[var(--foreground)] uppercase leading-tight mb-1">
                {candidate.full_name}
              </h3>
              {candidate.party && (
                <p className="text-xs font-bold text-[var(--muted-foreground)]">
                  {candidate.party.short_name || candidate.party.name}
                </p>
              )}

              {/* Revealed value */}
              {isRevealed && (
                <div className={cn(
                  'mt-3 py-2 px-3 border-2 border-[var(--border)] font-black text-lg',
                  isWinner ? 'bg-[var(--score-excellent)] text-white' : 'bg-[var(--muted)]'
                )}>
                  {round.category.format(value)}
                </div>
              )}

              {/* Winner/Loser indicator */}
              {isRevealed && isWinner && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[var(--score-excellent)] border-2 border-[var(--border)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* VS divider (mobile) */}
      <div className="text-center -mt-4 -mb-2 relative z-10 sm:hidden">
        <span className="inline-block bg-[var(--foreground)] text-[var(--background)] font-black text-sm px-3 py-1 border-2 border-[var(--border)]">
          VS
        </span>
      </div>

      {/* Satirical comment on reveal */}
      {phase === 'reveal' && lastGuess && (
        <Card className={cn(
          'p-4 text-center',
          lastGuess.correct ? 'bg-[var(--score-excellent)]/10' : 'bg-[var(--score-low)]/10'
        )}>
          <p className={cn(
            'text-sm font-black uppercase mb-2',
            lastGuess.correct ? 'text-[var(--score-excellent)]' : 'text-[var(--score-low)]'
          )}>
            {lastGuess.correct ? (lastGuess.correctSlug === null ? t('batalla.tie') : t('batalla.correct')) : t('batalla.incorrect')}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] italic">
            &ldquo;{lastGuess.comment}&rdquo;
          </p>

          <Button size="lg" onClick={handleNext} className="mt-4">
            {lastGuess.correct ? t('batalla.next') : t('batalla.seeResult')}
          </Button>
        </Card>
      )}
    </div>
  )
}
