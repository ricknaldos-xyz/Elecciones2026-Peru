/**
 * Simple in-memory rate limiter for serverless environments.
 * Resets on cold starts, but protects against burst abuse.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map())
  }
  return stores.get(name)!
}

// Clean expired entries periodically (every 100 checks)
let cleanupCounter = 0
function maybeCleanup(store: Map<string, RateLimitEntry>) {
  cleanupCounter++
  if (cleanupCounter % 100 === 0) {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key)
    }
  }
}

export interface RateLimitConfig {
  /** Unique name for this limiter */
  name: string
  /** Max requests per window */
  max: number
  /** Window in seconds */
  windowSec: number
}

export interface RateLimitResult {
  limited: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for an IP.
 * Returns { limited, remaining, resetAt }
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): RateLimitResult {
  const store = getStore(config.name)
  maybeCleanup(store)

  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + config.windowSec * 1000 })
    return { limited: false, remaining: config.max - 1, resetAt: now + config.windowSec * 1000 }
  }

  entry.count++
  const remaining = Math.max(0, config.max - entry.count)

  if (entry.count > config.max) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt }
  }

  return { limited: false, remaining, resetAt: entry.resetAt }
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
