'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--primary)] text-white',
    'hover:bg-[var(--primary-hover)]',
    'active:bg-[var(--primary-active)]',
  ].join(' '),
  secondary: [
    'bg-[var(--muted)] text-[var(--foreground)]',
    'hover:bg-[var(--background-accent)]',
  ].join(' '),
  outline: [
    'bg-[var(--background)] text-[var(--foreground)]',
    'hover:bg-[var(--background-secondary)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--foreground)]',
    'border-transparent shadow-none',
    'hover:bg-[var(--muted)] hover:border-[var(--border)] hover:shadow-[var(--shadow-brutal-sm)]',
  ].join(' '),
  danger: [
    'bg-[var(--flag-red)] text-white',
    'hover:brightness-90',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm px-4 py-2 gap-2 min-h-[44px] sm:min-h-0',
  md: 'text-base px-5 py-2.5 gap-2 min-h-[44px] sm:min-h-0',
  lg: 'text-lg px-8 py-3.5 gap-3',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isGhost = variant === 'ghost'

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles - NEO BRUTAL
          'inline-flex items-center justify-center',
          'font-bold uppercase tracking-wide',
          // Border & Shadow
          !isGhost && 'border-3 border-[var(--border)]',
          !isGhost && 'shadow-[var(--shadow-brutal)]',
          // Transitions
          'transition-all duration-100 ease-out',
          // Hover - lift up
          !isGhost && 'hover:-translate-x-0.5 hover:-translate-y-0.5',
          !isGhost && 'hover:shadow-[var(--shadow-brutal-hover)]',
          // Active - press down
          !isGhost && 'active:translate-x-0.5 active:translate-y-0.5',
          !isGhost && 'active:shadow-[var(--shadow-brutal-pressed)]',
          // Focus
          'focus:outline-none focus-visible:ring-3 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'disabled:hover:translate-x-0 disabled:hover:translate-y-0',
          'disabled:hover:shadow-[var(--shadow-brutal)]',
          // Variant & Size
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? true : undefined}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
