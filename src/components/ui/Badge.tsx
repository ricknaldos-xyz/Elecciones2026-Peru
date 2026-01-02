'use client'

import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'destructive' | 'info' | 'gray' | 'secondary' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
  style?: CSSProperties
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  destructive: 'bg-red-500 text-white dark:bg-red-600',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  gray: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent',
}

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
}

export function Badge({ children, variant = 'default', size = 'sm', className, style }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      style={style}
    >
      {children}
    </span>
  )
}
