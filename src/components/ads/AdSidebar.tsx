import { AdSlot } from './AdSlot'
import type { AdSlotId } from '@/lib/ads/sponsors'

interface AdSidebarProps {
  topSlotId: AdSlotId
  bottomSlotId: AdSlotId
  topAdsenseSlot?: string
  bottomAdsenseSlot?: string
}

/**
 * Sticky sidebar with two ad slots.
 * Only visible on lg+ screens.
 */
export function AdSidebar({
  topSlotId,
  bottomSlotId,
  topAdsenseSlot,
  bottomAdsenseSlot,
}: AdSidebarProps) {
  return (
    <aside className="hidden lg:block w-[300px] flex-shrink-0">
      <div className="sticky top-20 space-y-4">
        <AdSlot slotId={topSlotId} size="300x250" adsenseSlot={topAdsenseSlot} />
        <AdSlot slotId={bottomSlotId} size="300x600" adsenseSlot={bottomAdsenseSlot} />
      </div>
    </aside>
  )
}
