'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { getSponsor, type AdSlotId } from '@/lib/ads/sponsors'

interface AdSlotProps {
  slotId: AdSlotId
  size: '728x90' | '300x250' | '300x600' | '320x100' | 'responsive'
  className?: string
  adsenseSlot?: string
}

const SIZE_MAP = {
  '728x90': { width: 728, height: 90 },
  '300x250': { width: 300, height: 250 },
  '300x600': { width: 300, height: 600 },
  '320x100': { width: 320, height: 100 },
  'responsive': { width: 728, height: 90 },
}

export function AdSlot({ slotId, size, className = '', adsenseSlot }: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const sponsor = getSponsor(slotId)
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID
  const resolvedAdsenseSlot = adsenseSlot || process.env.NEXT_PUBLIC_ADSENSE_SLOT
  const dimensions = SIZE_MAP[size]

  useEffect(() => {
    if (!sponsor && adsenseId && resolvedAdsenseSlot && adRef.current) {
      try {
        const w = window as any
        if (w.adsbygoogle) {
          w.adsbygoogle.push({})
        }
      } catch {
        // AdSense not loaded yet
      }
    }
  }, [sponsor, adsenseId, resolvedAdsenseSlot])

  // Priority 1: Direct sponsor
  if (sponsor) {
    return (
      <div className={`relative ${className}`}>
        <a
          href={sponsor.linkUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block border-3 border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-[var(--shadow-brutal-sm)] transition-shadow"
        >
          <Image
            src={sponsor.imageUrl}
            alt={sponsor.altText}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-auto object-contain"
          />
        </a>
        <span className="absolute top-0 right-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--muted)] text-[var(--muted-foreground)] border-l-2 border-b-2 border-[var(--border)]">
          {sponsor.label || 'Publicidad'}
        </span>
      </div>
    )
  }

  // Priority 2: Google AdSense
  if (adsenseId && resolvedAdsenseSlot) {
    return (
      <div className={`relative ${className}`} ref={adRef}>
        <div className="border-3 border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <ins
            className="adsbygoogle"
            style={{
              display: 'block',
              width: size === 'responsive' ? '100%' : `${dimensions.width}px`,
              height: size === 'responsive' ? 'auto' : `${dimensions.height}px`,
            }}
            data-ad-client={adsenseId}
            data-ad-slot={resolvedAdsenseSlot}
            data-ad-format={size === 'responsive' ? 'auto' : undefined}
            data-full-width-responsive={size === 'responsive' ? 'true' : undefined}
          />
        </div>
        <span className="absolute top-0 right-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--muted)] text-[var(--muted-foreground)] border-l-2 border-b-2 border-[var(--border)]">
          Publicidad
        </span>
      </div>
    )
  }

  // Priority 3: Placeholder
  return (
    <div className={`relative ${className}`}>
      <div
        className="border-3 border-dashed border-[var(--border)] bg-[var(--muted)]/50 flex items-center justify-center"
        style={{
          width: size === 'responsive' ? '100%' : undefined,
          height: size === 'responsive' ? '90px' : `${dimensions.height}px`,
          maxWidth: size === 'responsive' ? undefined : `${dimensions.width}px`,
        }}
      >
        <div className="text-center px-4">
          <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
            Espacio publicitario
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)]/60 mt-0.5">
            {dimensions.width}x{dimensions.height}
          </div>
        </div>
      </div>
    </div>
  )
}
