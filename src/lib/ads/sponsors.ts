/**
 * Sponsor configuration for direct ad placements.
 * When a sponsor is active for a slot, it takes priority over AdSense.
 * When no sponsor is active, the slot falls back to AdSense (if configured)
 * or shows a placeholder.
 */

export interface Sponsor {
  imageUrl: string
  linkUrl: string
  altText: string
  label: string
  active: boolean
}

export type AdSlotId =
  | 'home-header'
  | 'home-mid'
  | 'home-sidebar'
  | 'home-footer'
  | 'internal-header'
  | 'internal-sidebar-top'
  | 'internal-sidebar-bottom'
  | 'internal-footer'

/**
 * Configure sponsors here. Set active: true to enable.
 * Images should be placed in /public/ads/
 */
export const SPONSORS: Partial<Record<AdSlotId, Sponsor>> = {
  // Example:
  // 'home-header': {
  //   imageUrl: '/ads/sponsor-header.png',
  //   linkUrl: 'https://sponsor.com',
  //   altText: 'Sponsor Name',
  //   label: 'Patrocinado por Sponsor',
  //   active: true,
  // },
}

export function getSponsor(slotId: AdSlotId): Sponsor | null {
  const sponsor = SPONSORS[slotId]
  if (sponsor && sponsor.active) return sponsor
  return null
}
