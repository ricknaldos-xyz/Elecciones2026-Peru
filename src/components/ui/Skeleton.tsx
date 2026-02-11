'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circle' | 'text' | 'card'
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn(
        'animate-pulse bg-[var(--muted)] border-2 border-[var(--border)]',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 w-full',
        variant === 'card' && 'h-full w-full',
        className
      )}
    />
  )
}

// Pre-built skeleton components for common use cases

export function CandidateCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border-3 border-[var(--border)] bg-[var(--card)] p-4 sm:p-5', className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
        <div className="flex items-center gap-3">
          {/* Rank */}
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12" />
          {/* Photo */}
          <Skeleton className="w-14 h-14 sm:w-16 sm:h-16" />
        </div>
        {/* Score */}
        <Skeleton className="w-20 h-12 sm:w-24 sm:h-16" />
      </div>

      {/* Name & badges */}
      <div className="mb-3 sm:mb-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 py-3 sm:py-4 border-t-3 border-[var(--border)]">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-3 border-[var(--border)]">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 w-11" />
      </div>
    </div>
  )
}

export function CandidateCardCompactSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border-3 border-[var(--border)] bg-[var(--card)] p-4', className)}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10" />
        <Skeleton className="w-12 h-12" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="w-14 h-10" />
      </div>

      <div className="grid grid-cols-3 gap-2 py-2 border-t-2 border-[var(--border)]">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t-2 border-[var(--border)]">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  )
}

export function ProfileHeroSkeleton() {
  return (
    <div className="border-3 border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mx-auto sm:mx-0" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <Skeleton className="h-8 w-64 mb-3 mx-auto sm:mx-0" />
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>

          {/* Score */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <Skeleton className="w-24 h-24 sm:w-28 sm:h-28" />
            <div className="flex gap-1 mt-3">
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-scores strip */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-[var(--muted)] border-t-3 border-[var(--border)]">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
    </div>
  )
}

export function NewsCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="border-3 border-[var(--border)] bg-[var(--card)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b-2 border-[var(--border)] bg-[var(--muted)]">
        <Skeleton className="w-6 h-6" />
        <Skeleton className="h-4 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-5 w-16" />
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        <Skeleton className={cn('h-6 w-full mb-2', compact ? 'h-5' : 'h-6')} />
        <Skeleton className={cn('h-6 w-3/4', compact ? 'h-5' : 'h-6')} />
        {!compact && (
          <>
            <Skeleton className="h-4 w-full mt-3" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Read more */}
      <Skeleton className="h-12 w-full" />
    </div>
  )
}

export function PartyCardSkeleton() {
  return (
    <div className="border-3 border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-16 h-16" />
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b-2 border-[var(--border)]">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-5 flex-1" />
      ))}
    </div>
  )
}
