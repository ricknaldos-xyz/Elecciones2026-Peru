'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { QUIZ_QUESTIONS } from '@/lib/quiz/questions'
import { calculateMatches, getUserProfile } from '@/lib/quiz/scoring'
import { QuizProgress } from './components/QuizProgress'
import { QuizQuestion } from './components/QuizQuestion'
import { QuizResults } from './components/QuizResults'

type QuizState = 'intro' | 'questions' | 'results'

interface Answers {
  [questionId: string]: {
    optionId: string
    value: number
  }
}

export function QuizContent() {
  const t = useTranslations('quiz')
  const searchParams = useSearchParams()
  const [state, setState] = useState<QuizState>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex]

  // Restore results from shared URL param
  useEffect(() => {
    const encoded = searchParams.get('r')
    if (!encoded) return
    try {
      const decoded = JSON.parse(atob(encoded)) as Record<string, number>
      const restored: Answers = {}
      for (const [questionId, value] of Object.entries(decoded)) {
        const question = QUIZ_QUESTIONS.find(q => q.id === questionId)
        if (question) {
          const option = question.options.reduce((closest, opt) =>
            Math.abs(opt.value - value) < Math.abs(closest.value - value) ? opt : closest
          )
          restored[questionId] = { optionId: option.id, value }
        }
      }
      if (Object.keys(restored).length > 0) {
        setAnswers(restored)
        setState('results')
      }
    } catch {
      // Invalid param, ignore
    }
  }, [searchParams])

  const handleStart = () => {
    setState('questions')
  }

  const handleSelectOption = useCallback((optionId: string, value: number) => {
    if (isTransitioning) return

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { optionId, value },
    }))

    setIsTransitioning(true)

    // Auto-advance after selection
    setTimeout(() => {
      if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        setState('results')
      }
      setIsTransitioning(false)
    }, 300)
  }, [currentQuestionIndex, currentQuestion?.id, isTransitioning])

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleRestart = () => {
    setState('intro')
    setCurrentQuestionIndex(0)
    setAnswers({})
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  // Calculate results
  const userAnswerValues = Object.entries(answers).reduce((acc, [questionId, answer]) => {
    acc[questionId] = answer.value
    return acc
  }, {} as Record<string, number>)

  const matches = calculateMatches(userAnswerValues)
  const profile = getUserProfile(userAnswerValues)

  // Build shareable URL when results are ready
  const shareUrl = useMemo(() => {
    if (state !== 'results' || Object.keys(userAnswerValues).length === 0) return undefined
    const encoded = btoa(JSON.stringify(userAnswerValues))
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?r=${encoded}`
      window.history.replaceState(null, '', url)
      return url
    }
    return undefined
  }, [state, userAnswerValues])

  if (state === 'intro') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-6 sm:p-10 text-center">
          <div className="w-20 h-20 mx-auto bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)] flex items-center justify-center mb-6">
            <svg aria-hidden="true" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-3">
            {t('intro.title')}
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] font-medium mb-6 max-w-md mx-auto">
            {t('intro.description')}
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
            <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-4 text-center">
              <span className="text-3xl font-black text-[var(--foreground)]">10</span>
              <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('intro.questions')}</p>
            </div>
            <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-4 text-center">
              <span className="text-3xl font-black text-[var(--foreground)]">2</span>
              <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('intro.minutes')}</p>
            </div>
          </div>

          <Button size="lg" onClick={handleStart} className="min-w-[200px]">
            {t('start')}
            <svg aria-hidden="true" className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
        </Card>

        <div className="text-center text-sm text-[var(--muted-foreground)] font-medium">
          <p>
            {t('intro.disclaimer')}
            <br />
            {t('intro.disclaimerLine2')}
          </p>
        </div>
      </div>
    )
  }

  if (state === 'results') {
    return (
      <div className="max-w-2xl mx-auto" aria-live="polite">
        <QuizResults
          matches={matches}
          profile={profile}
          onRestart={handleRestart}
          shareUrl={shareUrl}
        />
      </div>
    )
  }

  // Questions state
  return (
    <div className="max-w-3xl mx-auto space-y-6" aria-live="polite" aria-atomic="false">
      <QuizProgress
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={QUIZ_QUESTIONS.length}
      />

      <Card className={cn(
        'p-6 sm:p-10 transition-opacity duration-200',
        isTransitioning && 'opacity-50 pointer-events-none'
      )}>
        <QuizQuestion
          question={currentQuestion}
          selectedOption={answers[currentQuestion.id]?.optionId}
          onSelect={handleSelectOption}
        />
      </Card>

      {currentQuestionIndex > 0 && (
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isTransitioning}
            className="min-h-[48px] px-5"
          >
            <svg aria-hidden="true" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            <span className="font-bold">{t('previous')}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
