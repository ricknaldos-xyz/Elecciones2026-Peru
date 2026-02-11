'use client'

import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'destructive' | 'info' | 'gray' | 'secondary' | 'outline' | 'primary'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
  style?: CSSProperties
  'aria-label'?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--muted)] text-[var(--foreground)]',
  primary: 'bg-[var(--primary)] text-[var(--primary-foreground)]',
  success: 'bg-[var(--score-excellent)] text-white',
  warning: 'bg-[var(--score-medium-bg)] text-[var(--score-medium-text)] border-[var(--score-medium)]',
  danger: 'bg-[var(--flag-red)] text-white',
  destructive: 'bg-[var(--flag-red)] text-white',
  info: 'bg-[var(--score-good)] text-white',
  gray: 'bg-[var(--muted)] text-[var(--flag-gray-text)]',
  secondary: 'bg-[var(--background-secondary)] text-[var(--foreground)]',
  outline: 'bg-[var(--background)] text-[var(--foreground)]',
}

const sizeStyles = {
  sm: 'text-xs px-2.5 py-1',
  md: 'text-sm px-3 py-1.5',
}

const statusVariants: BadgeVariant[] = ['warning', 'danger', 'success', 'info']

export function Badge({ children, variant = 'default', size = 'sm', className, style, 'aria-label': ariaLabel }: BadgeProps) {
  return (
    <span
      className={cn(
        // Base - NEO BRUTAL
        'inline-flex items-center',
        'font-bold uppercase tracking-wide',
        'border-2 border-[var(--border)]',
        'shadow-[var(--shadow-brutal-sm)]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      style={style}
      role={statusVariants.includes(variant) ? 'status' : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  )
}
