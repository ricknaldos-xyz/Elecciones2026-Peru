import { cn } from '@/lib/utils'

interface NewsSentimentBadgeProps {
  sentiment: string | null
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

const SENTIMENT_CONFIG = {
  positive: {
    color: 'bg-[var(--score-good)]',
    textColor: 'text-white',
    icon: '+',
    label: 'Positivo',
  },
  neutral: {
    color: 'bg-[var(--score-medium)]',
    textColor: 'text-black',
    icon: '~',
    label: 'Neutral',
  },
  negative: {
    color: 'bg-[var(--score-low)]',
    textColor: 'text-white',
    icon: '-',
    label: 'Negativo',
  },
}

export function NewsSentimentBadge({
  sentiment,
  size = 'sm',
  showLabel = false,
  className,
}: NewsSentimentBadgeProps) {
  const config = sentiment ? SENTIMENT_CONFIG[sentiment as keyof typeof SENTIMENT_CONFIG] : null

  if (!config) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        'border-2 border-[var(--border)]',
        'font-bold uppercase',
        config.color,
        config.textColor,
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2 py-1 text-xs',
        className
      )}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </div>
  )
}
