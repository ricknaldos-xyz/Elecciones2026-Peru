'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface ElectionCountdownProps {
  electionDate?: Date
  className?: string
}

const ELECTION_DATE = new Date('2026-04-12T07:00:00-05:00') // 12 de Abril 2026, 7am Peru time

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

function TimeUnit({ value, label, size = 'default' }: { value: number; label: string; size?: 'default' | 'large' | 'small' }) {
  const sizeClasses = {
    large: 'w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-4xl',
    default: 'w-12 h-12 sm:w-16 sm:h-16 text-xl sm:text-2xl',
    small: 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl',
  }

  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        sizeClasses[size],
        'bg-[var(--foreground)]',
        'border-2 sm:border-3 border-[var(--border)]',
        'shadow-[var(--shadow-brutal-sm)] sm:shadow-[var(--shadow-brutal)]',
        'flex items-center justify-center'
      )}>
        <span className="font-black text-[var(--background)] tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs font-bold text-[var(--muted-foreground)] mt-1 sm:mt-2 uppercase tracking-wide">
        {label}
      </span>
    </div>
  )
}

export function ElectionCountdown({ electionDate = ELECTION_DATE, className }: ElectionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTimeLeft(calculateTimeLeft(electionDate))

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(electionDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [electionDate])

  if (!mounted) {
    return (
      <div className={cn('flex items-center justify-center gap-2 sm:gap-3', className)}>
        <TimeUnit value={0} label="Días" size="large" />
        <TimeUnit value={0} label="Horas" size="small" />
        <TimeUnit value={0} label="Min" size="small" />
      </div>
    )
  }

  const isElectionDay = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  if (isElectionDay) {
    return (
      <div className={cn(
        'text-center p-4 sm:p-6',
        'bg-[var(--primary)]',
        'border-3 border-[var(--border)]',
        'shadow-[var(--shadow-brutal)]',
        className
      )}>
        <span className="text-xl sm:text-2xl font-black text-white uppercase">
          ¡Hoy votamos!
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2 sm:space-y-3', className)}>
      <div className="flex items-end justify-center gap-1.5 sm:gap-2">
        {/* Days - Prominente */}
        <TimeUnit value={timeLeft.days} label="Días" size="large" />
        <span className="text-lg sm:text-xl font-black text-[var(--muted-foreground)] mb-6 sm:mb-8">:</span>
        <TimeUnit value={timeLeft.hours} label="Horas" size="small" />
        <span className="text-lg sm:text-xl font-black text-[var(--muted-foreground)] mb-6 sm:mb-8">:</span>
        <TimeUnit value={timeLeft.minutes} label="Min" size="small" />
        {/* Seconds only on larger screens */}
        <span className="text-lg font-black text-[var(--muted-foreground)] mb-6 sm:mb-8 hidden md:block">:</span>
        <div className="hidden md:block">
          <TimeUnit value={timeLeft.seconds} label="Seg" size="small" />
        </div>
      </div>
      <p className="text-center text-[10px] sm:text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">
        Elecciones Generales 2026
      </p>
    </div>
  )
}
