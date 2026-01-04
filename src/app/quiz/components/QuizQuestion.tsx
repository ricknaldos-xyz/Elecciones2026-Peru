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
    <div className={cn('space-y-6 sm:space-y-8', className)}>
      <div className="space-y-3">
        <span className="inline-block text-xs sm:text-sm font-black text-[var(--primary)] uppercase tracking-widest px-3 py-1.5 bg-[var(--primary)]/10 border-2 border-[var(--primary)]">
          {question.topic}
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--foreground)] leading-tight">
          {question.question}
        </h2>
        {question.description && (
          <p className="text-base text-[var(--muted-foreground)] font-medium leading-relaxed">
            {question.description}
          </p>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id, option.value)}
            className={cn(
              'w-full text-left p-5 sm:p-6',
              'border-3 border-[var(--border)]',
              'transition-all duration-100',
              'group',
              'min-h-[64px]',
              selectedOption === option.id
                ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-brutal)]'
                : 'bg-[var(--card)] hover:bg-[var(--muted)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal)]'
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center',
                'border-2 font-black text-base sm:text-lg',
                selectedOption === option.id
                  ? 'bg-white text-[var(--primary)] border-white'
                  : 'bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)] group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]'
              )}>
                {option.id.toUpperCase()}
              </div>
              <span className={cn(
                'font-bold text-base sm:text-lg leading-relaxed flex-1',
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
