'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const ELECTION_DATE = new Date('2026-04-12T07:00:00-05:00')

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

interface CountdownBannerProps {
  className?: string
}

export function CountdownBanner({ className }: CountdownBannerProps) {
  const t = useTranslations('countdown')
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTimeLeft(calculateTimeLeft(ELECTION_DATE))

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(ELECTION_DATE))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const isElectionDay = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  if (isElectionDay) {
    return (
      <div className={cn(
        'bg-[var(--primary)] border-b-4 border-[var(--border)]',
        'py-3 px-4',
        className
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <span className="text-lg sm:text-xl font-black text-white uppercase animate-pulse">
            {t('yourVoteMatters')}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-[var(--foreground)] border-b-4 border-[var(--border)]',
      'py-2 sm:py-3 px-4',
      className
    )}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        {/* Label */}
        <span className="text-[10px] sm:text-xs font-black text-[var(--background)] uppercase tracking-widest">
          {t('title')}
        </span>

        {/* Time units - Horizontal compact */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Days */}
          <div className="flex items-center gap-1">
            <span className="bg-[var(--primary)] text-white font-black text-lg sm:text-2xl px-2 sm:px-3 py-1 border-2 border-[var(--background)] tabular-nums">
              {mounted ? String(timeLeft.days).padStart(2, '0') : '00'}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[var(--background)] uppercase">{t('days').charAt(0)}</span>
          </div>

          <span className="text-[var(--background)] font-black text-lg sm:text-xl">:</span>

          {/* Hours */}
          <div className="flex items-center gap-1">
            <span className="bg-[var(--background)] text-[var(--foreground)] font-black text-lg sm:text-2xl px-2 sm:px-3 py-1 border-2 border-[var(--background)] tabular-nums">
              {mounted ? String(timeLeft.hours).padStart(2, '0') : '00'}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[var(--background)] uppercase">{t('hours').charAt(0)}</span>
          </div>

          <span className="text-[var(--background)] font-black text-lg sm:text-xl">:</span>

          {/* Minutes */}
          <div className="flex items-center gap-1">
            <span className="bg-[var(--background)] text-[var(--foreground)] font-black text-lg sm:text-2xl px-2 sm:px-3 py-1 border-2 border-[var(--background)] tabular-nums">
              {mounted ? String(timeLeft.minutes).padStart(2, '0') : '00'}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[var(--background)] uppercase">{t('minutes').charAt(0)}</span>
          </div>

          {/* Seconds - hidden on mobile */}
          <span className="text-[var(--background)] font-black text-lg sm:text-xl hidden sm:block">:</span>
          <div className="hidden sm:flex items-center gap-1">
            <span className="bg-[var(--background)] text-[var(--foreground)] font-black text-lg sm:text-2xl px-2 sm:px-3 py-1 border-2 border-[var(--background)] tabular-nums">
              {mounted ? String(timeLeft.seconds).padStart(2, '0') : '00'}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[var(--background)] uppercase">{t('seconds').charAt(0)}</span>
          </div>
        </div>

        {/* Election label */}
        <span className="text-[10px] sm:text-xs font-black text-[var(--background)] uppercase tracking-widest">
          {t('yourVoteMatters')}
        </span>
      </div>
    </div>
  )
}
