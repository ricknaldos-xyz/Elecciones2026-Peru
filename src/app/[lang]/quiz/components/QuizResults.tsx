'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/share/ShareButton'
import { useSuccessToast } from '@/components/ui/Toast'
import { QuizMatch } from '@/lib/quiz/scoring'
import { TOPIC_LABELS } from '@/lib/quiz/questions'

interface QuizResultsProps {
  matches: QuizMatch[]
  profile: {
    label: string
    description: string
    color: string
  }
  onRestart: () => void
  shareUrl?: string
}

export function QuizResults({ matches, profile, onRestart, shareUrl }: QuizResultsProps) {
  const t = useTranslations('quiz')
  const showSuccess = useSuccessToast()
  const top3 = matches.slice(0, 3)
  const rest = matches.slice(3, 8)

  const handleCopyChallenge = () => {
    const text = t('results.challengeText', { profile: profile.label, url: shareUrl || '' })
    navigator.clipboard.writeText(text)
    showSuccess(t('results.copiedChallenge'))
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'var(--score-excellent)'
    if (percentage >= 60) return 'var(--score-good)'
    if (percentage >= 40) return 'var(--score-medium)'
    return 'var(--score-low)'
  }

  return (
    <div className="space-y-8">
      {/* Profile Card */}
      <Card className="p-8 sm:p-10 text-center">
        <span className="text-sm sm:text-base font-bold text-[var(--muted-foreground)] uppercase tracking-wide">
          {t('results.politicalProfile')}
        </span>
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mt-3 mb-4"
          style={{ color: profile.color }}
        >
          {profile.label}
        </h2>
        <p className="text-base sm:text-lg text-[var(--muted-foreground)] font-medium leading-relaxed max-w-lg mx-auto">
          {profile.description}
        </p>
      </Card>

      {/* Top 3 Matches */}
      <div className="space-y-5">
        <h3 className="text-xl sm:text-2xl font-black text-[var(--foreground)] uppercase tracking-tight">
          {t('results.topMatches')}
        </h3>

        {top3.map((match, index) => (
          <Card key={match.candidateId} className="p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Ranking Badge */}
              <div
                className={cn(
                  'w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0',
                  'flex items-center justify-center',
                  'border-3 border-[var(--border)]',
                  'shadow-[var(--shadow-brutal)]',
                  index === 0 && 'bg-[var(--score-medium)]',
                  index === 1 && 'bg-gray-300',
                  index === 2 && 'bg-amber-600'
                )}
              >
                <span className="text-3xl sm:text-4xl font-black text-black">
                  #{index + 1}
                </span>
              </div>

              {/* Candidate Info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                  <Link href={`/candidato/${match.candidateSlug}`}>
                    <h4 className="font-black text-xl sm:text-2xl text-[var(--foreground)] hover:text-[var(--primary)] uppercase leading-tight">
                      {match.candidateName}
                    </h4>
                  </Link>
                  <Badge variant="secondary" className="self-start">
                    {match.partyName}
                  </Badge>
                </div>

                {/* Match Percentage Bar */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-[var(--muted-foreground)]">
                      {t('results.compatibility')}
                    </span>
                    <span
                      className="text-xl sm:text-2xl font-black"
                      style={{ color: getMatchColor(match.matchPercentage) }}
                    >
                      {match.matchPercentage}%
                    </span>
                  </div>
                  <div className="h-4 sm:h-5 bg-[var(--muted)] border-2 border-[var(--border)] overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${match.matchPercentage}%`,
                        backgroundColor: getMatchColor(match.matchPercentage),
                      }}
                    />
                  </div>
                </div>

                {/* Topic Agreements - Limitar en movil */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(match.agreementsByTopic).slice(0, 8).map(([topic, agreement]) => (
                    <span
                      key={topic}
                      className={cn(
                        'text-xs sm:text-sm font-bold px-2.5 py-1 border-2',
                        agreement === 'agree' && 'bg-green-100 text-green-800 border-green-300',
                        agreement === 'neutral' && 'bg-yellow-100 text-yellow-800 border-yellow-300',
                        agreement === 'disagree' && 'bg-red-100 text-red-800 border-red-300'
                      )}
                    >
                      {TOPIC_LABELS[topic] || topic}
                    </span>
                  ))}
                  {Object.keys(match.agreementsByTopic).length > 8 && (
                    <span className="text-xs sm:text-sm font-bold px-2.5 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] border-2 border-[var(--border)]">
                      +{Object.keys(match.agreementsByTopic).length - 8}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Other Matches */}
      {rest.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-base sm:text-lg font-black text-[var(--muted-foreground)] uppercase tracking-wide">
            {t('results.restOfRanking')}
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {rest.map((match) => (
              <Link key={match.candidateId} href={`/candidato/${match.candidateSlug}`}>
                <Card className="p-5 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] transition-all duration-100 min-h-[72px]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base sm:text-lg text-[var(--foreground)] truncate">
                        {match.candidateName}
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)] truncate">
                        {match.partyName}
                      </div>
                    </div>
                    <div
                      className="text-xl sm:text-2xl font-black flex-shrink-0"
                      style={{ color: getMatchColor(match.matchPercentage) }}
                    >
                      {match.matchPercentage}%
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 pt-4">
        <ShareButton
          title={t('results.shareTitle', { profile: profile.label })}
          description={t('results.shareDescription', { candidates: top3.map(m => m.candidateName).join(', ') })}
          url={shareUrl}
          className="w-full min-h-[56px]"
          variant="full"
          platforms={['whatsapp', 'twitter', 'facebook', 'copy']}
        />

        {/* Challenge Friends */}
        <Card className="p-5 sm:p-6 bg-[var(--muted)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-[var(--foreground)] uppercase text-sm mb-1">
                {t('results.challengeFriends')}
              </h4>
              <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
                {t('results.challengeText', { profile: profile.label, url: '' })}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyChallenge}
                className="min-h-[40px]"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('results.copyChallenge')}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          onClick={onRestart}
          className="flex-1 min-h-[48px] text-base font-bold"
        >
          {t('results.retake')}
        </Button>
        <Link href="/comparar" className="flex-1">
          <Button variant="outline" className="w-full min-h-[48px] text-base font-bold">
            {t('results.compareCandidates')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
