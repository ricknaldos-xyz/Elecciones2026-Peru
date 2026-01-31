import type { RunnerStats } from './types'
import { getTodayString } from './spawner'

const STORAGE_KEY = 'runner-stats'

export function loadRunnerStats(): RunnerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { bestScore: 0, totalRuns: 0, dailyBest: {}, lastPlayDate: '' }
}

export function saveRunnerStats(stats: RunnerStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch { /* ignore */ }
}

export function updateStatsAfterRun(score: number): RunnerStats {
  const stats = loadRunnerStats()
  const today = getTodayString()

  stats.totalRuns++
  stats.bestScore = Math.max(stats.bestScore, score)
  stats.dailyBest[today] = Math.max(stats.dailyBest[today] || 0, score)
  stats.lastPlayDate = today

  // Clean old daily entries (keep last 7 days)
  const keys = Object.keys(stats.dailyBest).sort().reverse()
  if (keys.length > 7) {
    for (const k of keys.slice(7)) {
      delete stats.dailyBest[k]
    }
  }

  saveRunnerStats(stats)
  return stats
}

export function getTodayBest(): number {
  const stats = loadRunnerStats()
  return stats.dailyBest[getTodayString()] || 0
}
