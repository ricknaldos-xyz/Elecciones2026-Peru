'use client'

import { cn } from '@/lib/utils'
import { QuizQuestion as QuizQuestionType, QuizOption } from '@/lib/quiz/questions'

interface QuizQuestionProps {
  question: QuizQuestionType
  selectedOption?: string
  onSelect: (optionId: string, value: number) => void
  className?: string
}

export function QuizQuestion({
  question,
  selectedOption,
  onSelect,
  className,
}: QuizQuestionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <span className="inline-block text-xs font-black text-[var(--primary)] uppercase tracking-widest px-3 py-1 bg-[var(--primary)]/10 border-2 border-[var(--primary)]">
          {question.topic}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] leading-tight">
          {question.question}
        </h2>
        {question.description && (
          <p className="text-[var(--muted-foreground)] font-medium">
            {question.description}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id, option.value)}
            className={cn(
              'w-full text-left p-4 sm:p-5',
              'border-3 border-[var(--border)]',
              'transition-all duration-100',
              'group',
              selectedOption === option.id
                ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-brutal)]'
                : 'bg-[var(--card)] hover:bg-[var(--muted)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal)]'
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-8 h-8 flex-shrink-0 flex items-center justify-center',
                'border-2 font-black text-sm',
                selectedOption === option.id
                  ? 'bg-white text-[var(--primary)] border-white'
                  : 'bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)] group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]'
              )}>
                {option.id.toUpperCase()}
              </div>
              <span className={cn(
                'font-bold text-base sm:text-lg leading-snug',
                selectedOption === option.id
                  ? 'text-white'
                  : 'text-[var(--foreground)]'
              )}>
                {option.text}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
