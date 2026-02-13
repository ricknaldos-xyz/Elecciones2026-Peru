'use client'

import Link from 'next/link'
import { ChevronRight } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  linkHref?: string
  linkText?: string
  accentColor?: string      // CSS class for border/bg, e.g., 'border-[var(--score-low)]'
  headerBg?: string          // CSS class for header bg, e.g., 'bg-red-50 dark:bg-red-950/30'
  iconBg?: string            // CSS class for icon box bg
  titleColor?: string        // CSS class for title text color
  linkColor?: string         // CSS class for link text color
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  linkHref,
  linkText,
  accentColor = 'border-[var(--border)]',
  headerBg = 'bg-[var(--card)]',
  iconBg = 'bg-[var(--primary)]',
  titleColor = 'text-[var(--foreground)]',
  linkColor = 'text-[var(--primary)]',
}: SectionHeaderProps) {
  return (
    <div className={cn('p-4 sm:p-5 border-b-3', accentColor, headerBg)}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 border-2 border-[var(--border)] flex items-center justify-center text-white flex-shrink-0',
            iconBg
          )}>
            {icon}
          </div>
          <div>
            <h2 className={cn(
              'text-lg sm:text-xl font-black uppercase tracking-tight',
              titleColor
            )}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)] font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {linkHref && linkText && (
          <Link
            href={linkHref}
            className={cn(
              'text-xs font-bold hover:underline uppercase flex items-center gap-1 min-h-[44px] py-2',
              linkColor
            )}
          >
            {linkText}
            <ChevronRight />
          </Link>
        )}
      </div>
    </div>
  )
}
