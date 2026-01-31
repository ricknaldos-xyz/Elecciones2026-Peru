import type { Lane, SpawnEvent, ObjectType, GameConfig } from './types'

// ============================================
// SEEDED PRNG — Mulberry32
// ============================================

export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function dateToSeed(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getTodaySeed(): number {
  return dateToSeed(getTodayString())
}

// ============================================
// SPAWN EVENT GENERATION
// ============================================

const OBSTACLE_TYPES: ObstacleType[] = ['cono', 'hueco', 'prensa', 'fiscalia']
const PICKUP_TYPES: PickupType[] = ['promesa', 'fuente']
type ObstacleType = 'cono' | 'hueco' | 'prensa' | 'fiscalia'
type PickupType = 'promesa' | 'fuente'

/**
 * Pre-generate all spawn events for a full 20-second run.
 * Uses seeded RNG so same seed = same map.
 */
export function generateSpawnEvents(seed: number, config: GameConfig): SpawnEvent[] {
  const rng = mulberry32(seed)
  const events: SpawnEvent[] = []

  // Estimate total scroll distance for the run:
  // Average speed ~6 px/frame, 60fps, 20s = ~7200 scroll pixels
  const totalScroll = 7200
  let scrollPos = 200 // first spawn at scroll 200

  while (scrollPos < totalScroll) {
    // Difficulty phase based on scroll position
    const progress = scrollPos / totalScroll // 0 to 1
    const difficulty = Math.min(progress * 1.5, 1) // ramps to 1

    // Spacing between spawns: wider early, tighter later
    const spacing = 140 - difficulty * 60 // 140 → 80

    // Decide: obstacle or pickup?
    const roll = rng()
    if (roll < 0.35 + difficulty * 0.15) {
      // Obstacle (35% early → 50% late)
      const lane = Math.floor(rng() * 3) as Lane

      // Type: early = cono/hueco only, later = prensa/fiscalia too
      let typeIdx: number
      if (progress < 0.25) {
        typeIdx = Math.floor(rng() * 2) // cono or hueco
      } else {
        typeIdx = Math.floor(rng() * OBSTACLE_TYPES.length)
      }
      events.push({ scrollThreshold: scrollPos, type: OBSTACLE_TYPES[typeIdx], lane })

      // Double obstacle in late game (2 obstacles at once, different lanes)
      if (difficulty > 0.5 && rng() < difficulty * 0.4) {
        let lane2 = Math.floor(rng() * 3) as Lane
        if (lane2 === lane) lane2 = ((lane + 1) % 3) as Lane
        // Never block all 3 lanes
        const typeIdx2 = Math.floor(rng() * Math.min(2 + Math.floor(difficulty * 2), OBSTACLE_TYPES.length))
        events.push({ scrollThreshold: scrollPos + 10, type: OBSTACLE_TYPES[typeIdx2], lane: lane2 })
      }
    } else {
      // Pickup
      const lane = Math.floor(rng() * 3) as Lane
      // Promesas more common early, fuentes more common later
      const pickupRoll = rng()
      const type: ObjectType = pickupRoll < 0.6 - difficulty * 0.2 ? 'promesa' : 'fuente'
      events.push({ scrollThreshold: scrollPos, type, lane })
    }

    scrollPos += spacing + rng() * 40 // add some variance
  }

  return events
}
