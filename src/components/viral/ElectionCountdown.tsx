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

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        'w-16 h-16 sm:w-20 sm:h-20',
        'bg-[var(--foreground)]',
        'border-3 border-[var(--border)]',
        'shadow-[var(--shadow-brutal)]',
        'flex items-center justify-center'
      )}>
        <span className="text-2xl sm:text-3xl font-black text-[var(--background)] tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs sm:text-sm font-bold text-[var(--muted-foreground)] mt-2 uppercase tracking-wide">
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
      <div className={cn('flex items-center justify-center gap-3 sm:gap-4', className)}>
        <TimeUnit value={0} label="Días" />
        <TimeUnit value={0} label="Horas" />
        <TimeUnit value={0} label="Minutos" />
        <TimeUnit value={0} label="Segundos" />
      </div>
    )
  }

  const isElectionDay = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  if (isElectionDay) {
    return (
      <div className={cn(
        'text-center p-6',
        'bg-[var(--primary)]',
        'border-3 border-[var(--border)]',
        'shadow-[var(--shadow-brutal)]',
        className
      )}>
        <span className="text-2xl sm:text-3xl font-black text-white uppercase">
          Hoy son las elecciones
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <TimeUnit value={timeLeft.days} label="Días" />
        <span className="text-2xl font-black text-[var(--muted-foreground)] mt-[-20px]">:</span>
        <TimeUnit value={timeLeft.hours} label="Horas" />
        <span className="text-2xl font-black text-[var(--muted-foreground)] mt-[-20px]">:</span>
        <TimeUnit value={timeLeft.minutes} label="Minutos" />
        <span className="text-2xl font-black text-[var(--muted-foreground)] mt-[-20px] hidden sm:block">:</span>
        <div className="hidden sm:block">
          <TimeUnit value={timeLeft.seconds} label="Segundos" />
        </div>
      </div>
      <p className="text-center text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wide">
        Para las Elecciones Generales 2026
      </p>
    </div>
  )
}
