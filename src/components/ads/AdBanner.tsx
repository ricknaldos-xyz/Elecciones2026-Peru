import { AdSlot } from './AdSlot'
import type { AdSlotId } from '@/lib/ads/sponsors'

interface AdBannerProps {
  slotId: AdSlotId
  adsenseSlot?: string
  className?: string
}

/**
 * Full-width horizontal ad banner.
 * Responsive: 970x250 on large desktop, 728x90 on tablet, 320x100 on mobile.
 */
export function AdBanner({ slotId, adsenseSlot, className = '' }: AdBannerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 ${className}`}>
      {/* Large desktop: 970x250 */}
      <div className="hidden lg:flex justify-center">
        <AdSlot slotId={slotId} size="970x250" adsenseSlot={adsenseSlot} />
      </div>
      {/* Tablet: 728x90 */}
      <div className="hidden sm:flex lg:hidden justify-center">
        <AdSlot slotId={slotId} size="728x90" adsenseSlot={adsenseSlot} />
      </div>
      {/* Mobile: 320x100 with max-width constraint */}
      <div className="flex sm:hidden justify-center overflow-hidden">
        <AdSlot slotId={slotId} size="320x100" adsenseSlot={adsenseSlot} />
      </div>
    </div>
  )
}
