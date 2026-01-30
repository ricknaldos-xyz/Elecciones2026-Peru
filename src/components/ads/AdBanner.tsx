import { AdSlot } from './AdSlot'
import type { AdSlotId } from '@/lib/ads/sponsors'

interface AdBannerProps {
  slotId: AdSlotId
  adsenseSlot?: string
  className?: string
}

/**
 * Full-width horizontal ad banner.
 * Responsive: 728x90 on desktop, 320x100 on mobile.
 * Hidden on very small screens to avoid layout issues.
 */
export function AdBanner({ slotId, adsenseSlot, className = '' }: AdBannerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 ${className}`}>
      {/* Desktop: 728x90 */}
      <div className="hidden sm:flex justify-center">
        <AdSlot slotId={slotId} size="responsive" adsenseSlot={adsenseSlot} />
      </div>
      {/* Mobile: 320x100 */}
      <div className="flex sm:hidden justify-center">
        <AdSlot slotId={slotId} size="320x100" adsenseSlot={adsenseSlot} />
      </div>
    </div>
  )
}
