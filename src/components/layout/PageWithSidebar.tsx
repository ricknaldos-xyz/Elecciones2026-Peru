import { AdSidebar } from '@/components/ads/AdSidebar'
import { AdBanner } from '@/components/ads/AdBanner'
import type { ReactNode } from 'react'

interface PageWithSidebarProps {
  children: ReactNode
  showHeaderAd?: boolean
  showFooterAd?: boolean
  showSidebar?: boolean
}

/**
 * Layout wrapper that adds ad sidebar and optional header/footer banners.
 * Sidebar only visible on lg+ (1024px+).
 */
export function PageWithSidebar({
  children,
  showHeaderAd = true,
  showFooterAd = true,
  showSidebar = true,
}: PageWithSidebarProps) {
  return (
    <>
      {showHeaderAd && (
        <AdBanner slotId="internal-header" className="py-2" />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={showSidebar ? 'lg:flex lg:gap-6' : ''}>
          <div className="flex-1 min-w-0">
            {children}
          </div>
          {showSidebar && (
            <AdSidebar
              topSlotId="internal-sidebar-top"
              bottomSlotId="internal-sidebar-bottom"
            />
          )}
        </div>
      </div>
      {showFooterAd && (
        <AdBanner slotId="internal-footer" className="py-2" />
      )}
    </>
  )
}
