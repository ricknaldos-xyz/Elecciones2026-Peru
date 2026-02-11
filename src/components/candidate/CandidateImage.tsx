'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CandidateImageProps {
  src: string | null | undefined
  name: string
  size?: number
  fill?: boolean
  sizes?: string
  priority?: boolean
  className?: string
  containerClassName?: string
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')
}

export function CandidateImage({
  src,
  name,
  size,
  fill,
  sizes,
  priority = false,
  className,
  containerClassName,
}: CandidateImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={name}
        className={cn(
        'w-full h-full flex items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)] font-bold select-none',
        containerClassName
      )}>
        {getInitials(name)}
      </div>
    )
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={name}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', className)}
        loading={priority ? undefined : 'lazy'}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size || 64}
      height={size || 64}
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
      loading={priority ? undefined : 'lazy'}
      onError={() => setFailed(true)}
    />
  )
}
