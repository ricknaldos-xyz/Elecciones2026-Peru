'use client'

import { cn } from '@/lib/utils'

interface QuizProgressProps {
  currentQuestion: number
  totalQuestions: number
  className?: string
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
  className,
}: QuizProgressProps) {
  const progress = ((currentQuestion) / totalQuestions) * 100

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-bold text-[var(--muted-foreground)] uppercase tracking-wide">
          Pregunta {currentQuestion} de {totalQuestions}
        </span>
        <span className="text-base sm:text-lg font-black text-[var(--foreground)]">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-4 sm:h-5 bg-[var(--muted)] border-2 border-[var(--border)] overflow-hidden">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
