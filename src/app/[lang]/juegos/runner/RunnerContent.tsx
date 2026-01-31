'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/share/ShareButton'
import { createGame, type GameInstance } from '@/lib/juegos/runner/engine'
import { getTodaySeed, getTodayString } from '@/lib/juegos/runner/spawner'
import { loadRunnerStats, updateStatsAfterRun, getTodayBest } from '@/lib/juegos/runner/storage'
import { generateShareCard, buildRunnerShareText } from '@/lib/juegos/runner/share'
import { getRunnerComment } from '@/lib/juegos/comentarios'
import type { GameResult, RunnerStats } from '@/lib/juegos/runner/types'
import { DEFAULT_CONFIG } from '@/lib/juegos/runner/types'

type GamePhase = 'intro' | 'playing' | 'gameover'

export function RunnerContent() {
  const t = useTranslations('games')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameInstance | null>(null)

  const [phase, setPhase] = useState<GamePhase>('intro')
  const [result, setResult] = useState<GameResult | null>(null)
  const [stats, setStats] = useState<RunnerStats>({ bestScore: 0, totalRuns: 0, dailyBest: {}, lastPlayDate: '' })
  const [shareCardUrl, setShareCardUrl] = useState<string | null>(null)
  const [todayBest, setTodayBest] = useState(0)
  const [comment, setComment] = useState('')

  useEffect(() => {
    setStats(loadRunnerStats())
    setTodayBest(getTodayBest())
  }, [])

  const handleGameOver = useCallback((gameResult: GameResult) => {
    const newStats = updateStatsAfterRun(gameResult.score)
    setStats(newStats)
    setTodayBest(getTodayBest())
    setResult(gameResult)
    setComment(getRunnerComment(gameResult.role.id))
    setPhase('gameover')

    // Generate share card async
    generateShareCard(gameResult).then(url => {
      setShareCardUrl(url)
    }).catch(() => {
      setShareCardUrl(null)
    })
  }, [])

  const startGame = useCallback(() => {
    setPhase('playing')
    setResult(null)
    setShareCardUrl(null)

    // Small delay to let canvas mount
    requestAnimationFrame(() => {
      if (!canvasRef.current) return

      // Cleanup previous game
      if (gameRef.current) {
        gameRef.current.cleanup()
      }

      const seed = getTodaySeed()
      const game = createGame(canvasRef.current, seed, {
        onGameOver: handleGameOver,
      })
      gameRef.current = game
      game.start()
    })
  }, [handleGameOver])

  useEffect(() => {
    return () => {
      if (gameRef.current) {
        gameRef.current.cleanup()
      }
    }
  }, [])

  // ========== INTRO ==========
  if (phase === 'intro') {
    return (
      <div className="text-center space-y-6">
        <div>
          <Badge variant="primary" size="md" className="mb-4">{t('runner.badge')}</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-3">
            {t('runner.title')}
          </h1>
          <p className="text-base text-[var(--muted-foreground)] max-w-sm mx-auto">
            {t('runner.subtitle')}
          </p>
        </div>

        {/* Daily challenge */}
        <Card className="p-4 bg-[var(--score-medium)]/10 border-[var(--score-medium)]">
          <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-1">{t('runner.daily')}</p>
          <p className="text-sm font-bold text-[var(--foreground)]">{getTodayString()}</p>
        </Card>

        {/* Stats */}
        <div className="flex justify-center gap-3">
          <Card className="px-4 py-3 text-center flex-1">
            <div className="text-2xl font-black text-[var(--primary)]">{stats.bestScore.toLocaleString()}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('runner.bestScore')}</div>
          </Card>
          <Card className="px-4 py-3 text-center flex-1">
            <div className="text-2xl font-black text-[var(--score-medium)]">{todayBest.toLocaleString()}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('runner.dailyBest')}</div>
          </Card>
          <Card className="px-4 py-3 text-center flex-1">
            <div className="text-2xl font-black text-[var(--foreground)]">{stats.totalRuns}</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('runner.runs')}</div>
          </Card>
        </div>

        {/* How to play */}
        <Card className="p-4 text-left space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚌</span>
            <p className="text-sm text-[var(--foreground)]">{t('runner.swipeHint')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <p className="text-sm text-[var(--foreground)]">Recoge promesas (+HUMO +puntos) o fuentes (+CRED +estabilidad)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <p className="text-sm text-[var(--foreground)]">Mas HUMO = mas puntos pero mas dificil</p>
          </div>
        </Card>

        <Button size="lg" onClick={startGame} className="text-lg px-8 w-full">
          {t('runner.play')}
        </Button>
      </div>
    )
  }

  // ========== GAME OVER ==========
  if (phase === 'gameover' && result) {
    return (
      <div className="text-center space-y-6">
        <div>
          <Badge variant="primary" size="md" className="mb-3">{t('runner.badge')}</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--primary)] uppercase mb-1">
            {t('runner.gameOver')}
          </h2>
        </div>

        {/* Role reveal */}
        <Card className="p-6">
          <div className="text-5xl mb-2">{result.role.emoji}</div>
          <h3 className="text-xl font-black text-[var(--foreground)] uppercase mb-2">
            {result.role.name}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] italic">
            &ldquo;{result.role.description}&rdquo;
          </p>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 text-center">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('runner.score')}</div>
            <div className="text-2xl font-black text-[var(--primary)]">{result.score.toLocaleString()}</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('runner.combo')}</div>
            <div className="text-2xl font-black text-[var(--score-medium)]">x{result.maxCombo}</div>
          </Card>
          <Card className={cn('p-3 text-center', result.humo >= 60 && 'bg-[var(--score-low)]/10')}>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('runner.humo')}</div>
            <div className={cn('text-2xl font-black', result.humo >= 60 ? 'text-[var(--score-low)]' : 'text-[var(--score-medium)]')}>
              {result.humo}%
            </div>
          </Card>
          <Card className={cn('p-3 text-center', result.cred >= 60 && 'bg-[var(--score-good)]/10')}>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('runner.cred')}</div>
            <div className={cn('text-2xl font-black', result.cred >= 60 ? 'text-[var(--score-excellent)]' : 'text-[var(--score-good)]')}>
              {result.cred}%
            </div>
          </Card>
        </div>

        {/* Satirical comment */}
        <p className="text-sm text-[var(--muted-foreground)] italic">
          &ldquo;{comment}&rdquo;
        </p>

        {/* Share card preview */}
        {shareCardUrl && (
          <div className="border-3 border-[var(--border)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shareCardUrl} alt="Share card" className="w-full" />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <ShareButton
            title={buildRunnerShareText(result)}
            variant="full"
            platforms={['whatsapp', 'twitter', 'copy']}
          />
        </div>

        <Button size="lg" onClick={startGame} className="w-full">
          {t('runner.playAgain')}
        </Button>
      </div>
    )
  }

  // ========== PLAYING ==========
  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        className="border-3 border-[var(--border)] touch-none"
        style={{
          width: `${DEFAULT_CONFIG.canvasW}px`,
          maxWidth: '100%',
          aspectRatio: `${DEFAULT_CONFIG.canvasW}/${DEFAULT_CONFIG.canvasH}`,
          height: 'auto',
        }}
      />
    </div>
  )
}
