'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

interface ExperienceOverlapBadgeProps {
  rawYears: number
  uniqueYears: number
  hasOverlap: boolean
  className?: string
}

export function ExperienceOverlapBadge({
  rawYears,
  uniqueYears,
  hasOverlap,
  className
}: ExperienceOverlapBadgeProps) {
  if (!hasOverlap) return null
  if (isNaN(rawYears) || isNaN(uniqueYears)) return null

  const deduplicatedYears = rawYears - uniqueYears

  const tooltipContent = (
    <div className="space-y-1 whitespace-normal max-w-xs">
      <p className="font-black uppercase text-xs">Periodos superpuestos detectados</p>
      <div className="text-xs font-medium space-y-0.5">
        <p>Experiencia declarada: {rawYears.toFixed(1)} años</p>
        <p>Experiencia única: {uniqueYears.toFixed(1)} años</p>
        <p className="text-[var(--muted-foreground)]">
          Se deduplicaron {deduplicatedYears.toFixed(1)} años de periodos que se solapaban para evitar doble conteo.
        </p>
      </div>
    </div>
  )

  return (
    <Tooltip content={tooltipContent} position="bottom">
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-black uppercase border-2 cursor-help',
        'bg-[var(--score-medium-bg)] text-[var(--score-medium-text)] border-[var(--score-medium)]',
        className
      )}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="square" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        AJUSTADO
      </span>
    </Tooltip>
  )
}
