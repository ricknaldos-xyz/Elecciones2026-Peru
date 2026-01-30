'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/share/ShareButton'
import { useCandidates } from '@/hooks/useCandidates'
import {
  selectProposals,
  calculateMatches,
  getRevealComment,
  buildSwipeShareText,
  loadSwipeStats,
  saveSwipeStats,
  CATEGORY_LABELS,
  type SwipeProposal,
  type SwipeResult,
} from '@/lib/juegos/swipe'

type GamePhase = 'intro' | 'loading' | 'playing' | 'results'

export function SwipeContent() {
  const t = useTranslations('games')
  const { candidates, loading: candidatesLoading } = useCandidates({ cargo: 'presidente' })

  const [phase, setPhase] = useState<GamePhase>('intro')
  const [proposals, setProposals] = useState<SwipeProposal[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipes, setSwipes] = useState<Record<string, 'agree' | 'disagree'>>({})
  const [results, setResults] = useState<SwipeResult[]>([])
  const [revealComment, setRevealComment] = useState('')
  const [swipeAnim, setSwipeAnim] = useState<'left' | 'right' | null>(null)
  const [totalPlayed, setTotalPlayed] = useState(0)
  const touchStartX = useRef(0)
  const touchDelta = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stats = loadSwipeStats()
    setTotalPlayed(stats.totalPlayed)
  }, [])

  const fetchProposals = useCallback(async () => {
    if (candidates.length === 0) return

    setPhase('loading')

    try {
      // Fetch all proposals for all presidential candidates
      const candidateIds = candidates.map(c => c.id).join(',')
      const res = await fetch(`/api/proposals?candidateIds=${candidateIds}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()

      if (!data.candidates) {
        setPhase('intro')
        return
      }

      // Flatten all proposals
      const allProposals: SwipeProposal[] = []
      for (const cand of data.candidates) {
        for (const prop of cand.proposals) {
          allProposals.push({
            id: prop.id,
            candidateId: cand.candidateId,
            candidateName: cand.candidateName,
            candidateSlug: cand.candidateSlug,
            candidatePhoto: cand.photoUrl,
            category: prop.category,
            title: prop.title,
            description: prop.description,
          })
        }
      }

      if (allProposals.length < 5) {
        setPhase('intro')
        return
      }

      const selected = selectProposals(allProposals, 10)
      setProposals(selected)
      setCurrentIndex(0)
      setSwipes({})
      setPhase('playing')
    } catch {
      setPhase('intro')
    }
  }, [candidates])

  const handleSwipe = (direction: 'agree' | 'disagree') => {
    const current = proposals[currentIndex]
    if (!current) return

    setSwipeAnim(direction === 'agree' ? 'right' : 'left')

    setTimeout(() => {
      const newSwipes = { ...swipes, [current.id]: direction }
      setSwipes(newSwipes)
      setSwipeAnim(null)

      if (currentIndex + 1 >= proposals.length) {
        // Calculate results
        const candidateIntegrity: Record<string, number> = {}
        for (const c of candidates) {
          candidateIntegrity[c.id] = c.scores?.integrity ?? 50
        }
        const matchResults = calculateMatches(newSwipes, proposals, candidateIntegrity)
        setResults(matchResults)
        setRevealComment(getRevealComment(matchResults))

        const stats = loadSwipeStats()
        saveSwipeStats({
          totalPlayed: stats.totalPlayed + 1,
          lastMatches: matchResults.slice(0, 3),
        })
        setTotalPlayed(stats.totalPlayed + 1)

        setPhase('results')
      } else {
        setCurrentIndex(currentIndex + 1)
      }
    }, 300)
  }

  // Touch handlers for swipe gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDelta.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDelta.current = e.touches[0].clientX - touchStartX.current
    if (cardRef.current) {
      const rotation = touchDelta.current * 0.1
      cardRef.current.style.transform = `translateX(${touchDelta.current}px) rotate(${rotation}deg)`
      cardRef.current.style.transition = 'none'
    }
  }

  const handleTouchEnd = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = ''
      cardRef.current.style.transition = ''
    }

    if (Math.abs(touchDelta.current) > 80) {
      handleSwipe(touchDelta.current > 0 ? 'agree' : 'disagree')
    }
    touchDelta.current = 0
  }

  if (candidatesLoading) {
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
          <Badge variant="primary" size="md" className="mb-4">{t('swipe.badge')}</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-4">
            {t('swipe.title')}
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-xl mx-auto">
            {t('swipe.subtitle')}
          </p>
        </div>

        <Card className="p-6 max-w-md mx-auto text-left space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-[var(--score-good)] text-white font-black flex items-center justify-center border-2 border-[var(--border)]">1</span>
            <p className="text-sm text-[var(--foreground)]">Verás propuestas REALES de planes de gobierno</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-[var(--score-good)] text-white font-black flex items-center justify-center border-2 border-[var(--border)]">2</span>
            <p className="text-sm text-[var(--foreground)]">NO sabrás de quién es cada propuesta</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-[var(--score-good)] text-white font-black flex items-center justify-center border-2 border-[var(--border)]">3</span>
            <p className="text-sm text-[var(--foreground)]">Desliza → de acuerdo, ← en contra</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-[var(--primary)] text-white font-black flex items-center justify-center border-2 border-[var(--border)]">!</span>
            <p className="text-sm text-[var(--foreground)] font-bold">Al final descubrirás con quién matcheas</p>
          </div>
        </Card>

        {totalPlayed > 0 && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Has jugado {totalPlayed} {totalPlayed === 1 ? 'vez' : 'veces'}
          </p>
        )}

        <Button size="lg" onClick={fetchProposals} className="text-lg px-8">
          {t('swipe.badge')} →
        </Button>
      </div>
    )
  }

  // ========== LOADING ==========
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--score-good)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-[var(--muted-foreground)] uppercase">Cargando propuestas...</p>
        </div>
      </div>
    )
  }

  // ========== RESULTS ==========
  if (phase === 'results') {
    return (
      <div className="text-center space-y-8">
        <div>
          <Badge variant="primary" size="md" className="mb-4">{t('swipe.badge')}</Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-2">
            {t('swipe.results')}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] italic max-w-md mx-auto">
            &ldquo;{revealComment}&rdquo;
          </p>
        </div>

        {/* Match results */}
        <div className="space-y-3 max-w-md mx-auto">
          {results.map((match, i) => (
            <Card
              key={match.candidateId}
              className={cn(
                'p-4 flex items-center gap-4',
                i === 0 && 'ring-4 ring-[var(--score-good)] bg-[var(--score-good)]/10'
              )}
            >
              {/* Rank */}
              <div className={cn(
                'w-8 h-8 font-black flex items-center justify-center border-2 border-[var(--border)] text-sm shrink-0',
                i === 0 ? 'bg-[var(--score-good)] text-white' : 'bg-[var(--muted)]'
              )}>
                {i + 1}
              </div>

              {/* Photo */}
              <div className="w-10 h-10 border-2 border-[var(--border)] bg-[var(--muted)] overflow-hidden shrink-0">
                {match.candidatePhoto ? (
                  <Image
                    src={match.candidatePhoto}
                    alt={match.candidateName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-black text-[var(--muted-foreground)]">
                    {match.candidateName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name and bar */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-black text-[var(--foreground)] uppercase truncate">
                  {match.candidateName}
                </p>
                <div className="mt-1 h-3 bg-[var(--muted)] border border-[var(--border)] w-full">
                  <div
                    className={cn(
                      'h-full transition-all duration-1000',
                      match.matchPercent >= 70 ? 'bg-[var(--score-good)]' :
                      match.matchPercent >= 40 ? 'bg-[var(--score-medium)]' :
                      'bg-[var(--score-low)]'
                    )}
                    style={{ width: `${match.matchPercent}%` }}
                  />
                </div>
              </div>

              {/* Percentage */}
              <div className={cn(
                'text-lg font-black shrink-0',
                match.matchPercent >= 70 ? 'text-[var(--score-good)]' :
                match.matchPercent >= 40 ? 'text-[var(--score-medium)]' :
                'text-[var(--score-low)]'
              )}>
                {match.matchPercent}%
              </div>
            </Card>
          ))}
        </div>

        {/* Share + play again */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <ShareButton
            title={buildSwipeShareText(results)}
            variant="full"
            platforms={['whatsapp', 'twitter', 'copy']}
          />
        </div>

        <Button size="lg" onClick={fetchProposals}>
          {t('swipe.playAgain')}
        </Button>
      </div>
    )
  }

  // ========== PLAYING ==========
  const current = proposals[currentIndex]
  if (!current) return null

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" size="sm">
          {t('swipe.proposalOf', { current: currentIndex + 1, total: proposals.length })}
        </Badge>
        <div className="flex gap-1">
          {proposals.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 border border-[var(--border)]',
                i < currentIndex ? 'bg-[var(--score-good)]' :
                i === currentIndex ? 'bg-[var(--primary)]' :
                'bg-[var(--muted)]'
              )}
            />
          ))}
        </div>
      </div>

      {/* Proposal card */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'transition-all duration-300',
          swipeAnim === 'right' && 'translate-x-[120%] rotate-12 opacity-0',
          swipeAnim === 'left' && '-translate-x-[120%] -rotate-12 opacity-0',
        )}
      >
        <Card className="p-6 sm:p-8 min-h-[280px] flex flex-col">
          {/* Category badge */}
          <Badge variant="secondary" size="sm" className="self-start mb-4">
            {CATEGORY_LABELS[current.category] || current.category}
          </Badge>

          {/* Proposal content */}
          <h3 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase leading-tight mb-3">
            {current.title}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] flex-1">
            {current.description}
          </p>

          {/* Mystery candidate hint */}
          <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase text-center">
              ¿De quién es esta propuesta? 🤔
            </p>
          </div>
        </Card>
      </div>

      {/* Swipe buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSwipe('disagree')}
          className={cn(
            'flex items-center justify-center gap-2 px-6 py-4',
            'border-3 border-[var(--border)] bg-[var(--card)] font-black uppercase text-sm',
            'hover:bg-[var(--score-low)] hover:text-white transition-colors',
            'active:translate-y-0.5'
          )}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t('swipe.disagree')}
        </button>
        <button
          onClick={() => handleSwipe('agree')}
          className={cn(
            'flex items-center justify-center gap-2 px-6 py-4',
            'border-3 border-[var(--border)] bg-[var(--card)] font-black uppercase text-sm',
            'hover:bg-[var(--score-good)] hover:text-white transition-colors',
            'active:translate-y-0.5'
          )}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {t('swipe.agree')}
        </button>
      </div>

      {/* Swipe hint (mobile) */}
      <p className="text-xs text-center text-[var(--muted-foreground)] sm:hidden">
        ← Desliza para votar →
      </p>
    </div>
  )
}
