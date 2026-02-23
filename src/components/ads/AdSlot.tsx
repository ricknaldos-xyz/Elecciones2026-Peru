'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { getSponsor, type AdSlotId } from '@/lib/ads/sponsors'
import { cn } from '@/lib/utils'

interface AdSlotProps {
  slotId: AdSlotId
  size: '728x90' | '970x250' | '300x250' | '300x600' | '320x100' | 'responsive'
  className?: string
  adsenseSlot?: string
}

const SIZE_MAP = {
  '728x90': { width: 728, height: 90 },
  '970x250': { width: 970, height: 250 },
  '300x250': { width: 300, height: 250 },
  '300x600': { width: 300, height: 600 },
  '320x100': { width: 320, height: 100 },
  'responsive': { width: 970, height: 250 },
}

export function AdSlot({ slotId, size, className, adsenseSlot }: AdSlotProps) {
  // TODO: Re-enable after AdSense approval
  return null
}
