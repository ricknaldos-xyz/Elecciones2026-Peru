'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/share/ShareButton'
import { useCandidates } from '@/hooks/useCandidates'
import {
  FRANKENSTEIN_CATEGORIES,
  getCandidateOptions,
  buildFrankenstein,
  buildFrankensteinShareText,
  loadFrankensteinStats,
  saveFrankensteinStats,
  type FrankensteinSelection,
  type FrankensteinResult,
} from '@/lib/juegos/frankenstein'
import type { CandidateWithScores } from '@/types/database'

type GamePhase = 'intro' | 'selecting' | 'result'

export function FrankensteinContent() {
  const t = useTranslations('games')
  const { candidates, loading } = useCandidates({ cargo: 'presidente' })

  const [phase, setPhase] = useState<GamePhase>('intro')
  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState<FrankensteinSelection[]>([])
  const [options, setOptions] = useState<CandidateWithScores[]>([])
  const [result, setResult] = useState<FrankensteinResult | null>(null)
  const [totalPlayed, setTotalPlayed] = useState(0)

  useEffect(() => {
    const stats = loadFrankensteinStats()
    setTotalPlayed(stats.totalPlayed)
  }, [])

  const startGame = () => {
    setSelections([])
    setCurrentStep(0)
    setResult(null)
    const opts = getCandidateOptions(candidates, 5)
    setOptions(opts)
    setPhase('selecting')
  }

  const handleSelect = (candidate: CandidateWithScores) => {
    const category = FRANKENSTEIN_CATEGORIES[currentStep]
    const newSelections = [...selections, { categoryId: category.id, candidate }]
    setSelections(newSelections)

    if (currentStep + 1 >= FRANKENSTEIN_CATEGORIES.length) {
      // Build result
      const frankResult = buildFrankenstein(newSelections, candidates)
      setResult(frankResult)

      const stats = loadFrankensteinStats()
      saveFrankensteinStats({ totalPlayed: stats.totalPlayed + 1 })
      setTotalPlayed(stats.totalPlayed + 1)

      setPhase('result')
    } else {
      // Next step with new options
      setCurrentStep(currentStep + 1)
      setOptions(getCandidateOptions(candidates, 5))
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
          <Badge variant="primary" size="md" className="mb-4">{t('frankenstein.badge')}</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-4">
            {t('frankenstein.title')}
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-xl mx-auto">
            {t('frankenstein.subtitle')}
          </p>
        </div>

        <Card className="p-6 max-w-md mx-auto text-left space-y-3">
          {FRANKENSTEIN_CATEGORIES.map((cat, i) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="w-8 h-8 bg-[var(--score-medium)] text-white font-black flex items-center justify-center border-2 border-[var(--border)] text-sm shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-[var(--foreground)]">{cat.label}</p>
            </div>
          ))}
        </Card>

        {totalPlayed > 0 && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Has creado {totalPlayed} Frankenstein{totalPlayed > 1 ? 's' : ''}
          </p>
        )}

        <Button size="lg" onClick={startGame} className="text-lg px-8">
          {t('frankenstein.badge')} →
        </Button>
      </div>
    )
  }

  // ========== RESULT ==========
  if (phase === 'result' && result) {
    return (
      <div className="text-center space-y-8">
        <div>
          <Badge variant="primary" size="md" className="mb-4">{t('frankenstein.badge')}</Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-2">
            {t('frankenstein.result')}
          </h2>
          <p className="text-xl font-black text-[var(--primary)] uppercase">
            &ldquo;{result.name}&rdquo;
          </p>
        </div>

        {/* Frankenstein photo grid */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-0 border-3 border-[var(--border)] overflow-hidden w-fit">
            {result.selections.slice(0, 3).map((s, i) => (
              <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--muted)] overflow-hidden">
                {s.candidate.photo_url ? (
                  <Image
                    src={s.candidate.photo_url}
                    alt={s.candidate.full_name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-black text-[var(--muted-foreground)]">
                    {s.candidate.full_name.charAt(0)}
                  </div>
                )}
              </div>
            ))}
            {result.selections.length > 3 && result.selections.slice(3, 5).map((s, i) => (
              <div key={i + 3} className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--muted)] overflow-hidden">
                {s.candidate.photo_url ? (
                  <Image
                    src={s.candidate.photo_url}
                    alt={s.candidate.full_name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-black text-[var(--muted-foreground)]">
                    {s.candidate.full_name.charAt(0)}
                  </div>
                )}
              </div>
            ))}
            {result.selections.length === 4 && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--muted)] flex items-center justify-center text-2xl">🧟</div>
            )}
          </div>
        </div>

        {/* Score */}
        <Card className="p-6 max-w-md mx-auto">
          <div className="text-center mb-4">
            <div className={cn(
              'text-5xl font-black',
              result.combinedScore >= 70 ? 'text-[var(--score-excellent)]' :
              result.combinedScore >= 50 ? 'text-[var(--score-good)]' :
              result.combinedScore >= 30 ? 'text-[var(--score-medium)]' :
              'text-[var(--score-low)]'
            )}>
              {result.combinedScore}
            </div>
            <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('frankenstein.score')}</p>
          </div>

          <p className="text-sm text-[var(--foreground)] font-bold text-center mb-4">
            {t('frankenstein.beatsCount', {
              count: result.totalCandidates - result.rank,
              total: result.totalCandidates,
            })}
          </p>

          {/* Category breakdown */}
          <div className="space-y-2 border-t-2 border-[var(--border)] pt-4">
            {result.selections.map(s => {
              const cat = FRANKENSTEIN_CATEGORIES.find(c => c.id === s.categoryId)
              const value = cat ? cat.getValue(s.candidate) : 0
              return (
                <div key={s.categoryId} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[var(--muted-foreground)]">{cat?.label}</span>
                  <span className="font-black text-[var(--foreground)]">
                    {cat?.format(s.candidate)} — {s.candidate.full_name.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Verdict */}
        <p className="text-sm text-[var(--muted-foreground)] italic max-w-md mx-auto">
          &ldquo;{result.verdict}&rdquo;
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <ShareButton
            title={buildFrankensteinShareText(result)}
            variant="full"
            platforms={['whatsapp', 'twitter', 'copy']}
          />
        </div>

        <Button size="lg" onClick={startGame}>
          {t('frankenstein.playAgain')}
        </Button>
      </div>
    )
  }

  // ========== SELECTING ==========
  const currentCategory = FRANKENSTEIN_CATEGORIES[currentStep]

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" size="sm">
          {t('frankenstein.step', { current: currentStep + 1, total: FRANKENSTEIN_CATEGORIES.length })}
        </Badge>
        <div className="flex gap-1">
          {FRANKENSTEIN_CATEGORIES.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 border border-[var(--border)]',
                i < currentStep ? 'bg-[var(--score-good)]' :
                i === currentStep ? 'bg-[var(--primary)]' :
                'bg-[var(--muted)]'
              )}
            />
          ))}
        </div>
      </div>

      {/* Category prompt */}
      <Card className="p-4 sm:p-6 text-center bg-[var(--score-medium)] text-white border-[var(--border)]">
        <p className="text-xs font-bold uppercase mb-1 opacity-80">{t('frankenstein.select')}</p>
        <p className="text-lg sm:text-xl font-black uppercase">
          {currentCategory.label}
        </p>
      </Card>

      {/* Already selected */}
      {selections.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {selections.map(s => {
            const cat = FRANKENSTEIN_CATEGORIES.find(c => c.id === s.categoryId)
            return (
              <Badge key={s.categoryId} variant="secondary" size="sm">
                {cat?.label}: {s.candidate.full_name.split(' ')[0]}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Candidate options */}
      <div className="space-y-3">
        {options.map((candidate) => {
          const value = currentCategory.getValue(candidate)
          const detail = currentCategory.detail(candidate)

          return (
            <button
              key={candidate.slug}
              onClick={() => handleSelect(candidate)}
              className={cn(
                'w-full border-3 border-[var(--border)] bg-[var(--card)] p-4 text-left',
                'flex items-center gap-4 transition-all duration-100',
                'hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0',
                'cursor-pointer'
              )}
            >
              {/* Photo */}
              <div className="w-12 h-12 border-2 border-[var(--border)] bg-[var(--muted)] overflow-hidden shrink-0">
                {candidate.photo_url ? (
                  <Image
                    src={candidate.photo_url}
                    alt={candidate.full_name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-black text-[var(--muted-foreground)]">
                    {candidate.full_name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[var(--foreground)] uppercase truncate">
                  {candidate.full_name}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {candidate.party?.short_name || candidate.party?.name || ''}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {detail}
                </p>
              </div>

              {/* Score */}
              <div className={cn(
                'text-lg font-black shrink-0',
                value >= 70 ? 'text-[var(--score-excellent)]' :
                value >= 50 ? 'text-[var(--score-good)]' :
                value >= 30 ? 'text-[var(--score-medium)]' :
                'text-[var(--score-low)]'
              )}>
                {currentCategory.format(candidate)}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
