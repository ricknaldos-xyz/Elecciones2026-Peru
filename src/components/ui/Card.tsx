'use client'

import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'accent' | 'gold' | 'silver' | 'bronze'
}

export function Card({
  children,
  className,
  hover = false,
  onClick,
  padding = 'none',
  variant = 'default'
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const variantStyles = {
    default: 'bg-[var(--card)]',
    accent: 'bg-[var(--background-accent)]',
    gold: 'bg-[var(--rank-gold-bg)]',
    silver: 'bg-[var(--rank-silver-bg)]',
    bronze: 'bg-[var(--rank-bronze-bg)]',
  }

  return (
    <div
      className={cn(
        // Base - NEO BRUTAL
        variantStyles[variant],
        'border-3 border-[var(--border)]',
        'shadow-[var(--shadow-brutal-lg)]',
        // Hover effect
        hover && [
          'cursor-pointer',
          'transition-all duration-150 ease-out',
          'hover:-translate-x-1 hover:-translate-y-1',
          'hover:shadow-[var(--shadow-brutal-xl)]',
          'active:translate-x-0.5 active:translate-y-0.5',
          'active:shadow-[var(--shadow-brutal-sm)]',
        ],
        paddingStyles[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'px-6 py-4',
      'border-b-3 border-[var(--border)]',
      'bg-[var(--background-secondary)]',
      className
    )}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'px-6 py-4',
      'border-t-3 border-[var(--border)]',
      'bg-[var(--muted)]',
      className
    )}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn(
      'text-lg font-bold text-[var(--foreground)]',
      'tracking-tight',
      className
    )}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn(
      'text-sm text-[var(--muted-foreground)] mt-1',
      'font-medium',
      className
    )}>
      {children}
    </p>
  )
}
