import { AdSlot } from './AdSlot'
import type { AdSlotId } from '@/lib/ads/sponsors'
import { cn } from '@/lib/utils'

interface AdBannerProps {
  slotId: AdSlotId
  adsenseSlot?: string
  className?: string
}

/**
 * Full-width horizontal ad banner.
 * Responsive: 970x250 on large desktop, 728x90 on tablet, 320x100 on mobile.
 */
export function AdBanner({ slotId, adsenseSlot, className }: AdBannerProps) {
  // TODO: Re-enable after AdSense approval
  return null
}
