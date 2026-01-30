import { sql } from '@/lib/db'

export interface NewsItem {
  title: string
  url: string
  excerpt?: string
  source: string
  published_at?: Date
  author?: string
}

export interface NewsMatch {
  candidateId: string | null
  candidateName?: string
  partyId: string | null
  partyName?: string
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  keywords: string[]
  relevanceScore: number
}

interface CandidateInfo {
  id: string
  full_name: string
  party_name: string | null
  party_id: string | null
}

interface PartyInfo {
  id: string
  name: string
  short_name: string | null
}

// Cache for candidates and parties (refreshed on each sync)
let candidatesCache: CandidateInfo[] = []
let partiesCache: PartyInfo[] = []
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Negative keywords that indicate controversy
const NEGATIVE_KEYWORDS = [
  'corrupción',
  'corrupto',
  'denunciado',
  'detenido',
  'arrestado',
  'investigado',
  'acusado',
  'sentenciado',
  'condena',
  'fraude',
  'lavado',
  'soborno',
  'cohecho',
  'peculado',
  'colusión',
  'escándalo',
  'irregularidades',
  'malversación',
  'nepotismo',
  'tráfico de influencias',
  'plagio',
  'falsificación',
  'mentira',
  'falso',
  'incumplimiento',
  'abandono',
  'inasistencia',
  'fuga',
  'renuncia',
  'expulsado',
]

// Positive keywords
const POSITIVE_KEYWORDS = [
  'propuesta',
  'plan',
  'proyecto',
  'iniciativa',
  'logro',
  'aprobación',
  'consenso',
  'acuerdo',
  'avance',
  'mejora',
  'apoyo',
  'respaldo',
  'reconocimiento',
  'premio',
  'distinción',
  'elogio',
  'transparencia',
  'honestidad',
  'integridad',
  'experiencia',
  'trayectoria',
  'liderazgo',
]

/**
 * Loads candidates and parties into cache
 */
async function loadCache(): Promise<void> {
  const now = Date.now()

  if (now - cacheTimestamp < CACHE_TTL && candidatesCache.length > 0) {
    return // Cache still valid
  }

  // Load candidates
  const candidates = await sql`
    SELECT
      c.id,
      c.full_name,
      p.name as party_name,
      c.party_id
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo IN ('presidente', 'vicepresidente', 'senador', 'diputado', 'parlamento_andino')
  `
  candidatesCache = candidates as CandidateInfo[]

  // Load parties
  const parties = await sql`
    SELECT id, name, short_name
    FROM parties
  `
  partiesCache = parties as PartyInfo[]

  cacheTimestamp = now
  console.log(
    `[News Matcher] Loaded ${candidatesCache.length} candidates and ${partiesCache.length} parties`
  )
}

/**
 * Normalizes text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Checks if text contains a name (handles partial matches)
 */
function containsName(text: string, name: string): boolean {
  const normalizedText = normalizeText(text)
  const normalizedName = normalizeText(name)

  // Exact match
  if (normalizedText.includes(normalizedName)) {
    return true
  }

  // Match by surname + first name
  const nameParts = normalizedName.split(' ')
  if (nameParts.length >= 2) {
    // Try last name + first name combinations
    for (let i = 0; i < nameParts.length - 1; i++) {
      const combo = `${nameParts[i]} ${nameParts[i + 1]}`
      if (normalizedText.includes(combo) && combo.length > 6) {
        return true
      }
    }
  }

  return false
}

/**
 * Analyzes sentiment of text
 */
function analyzeSentiment(
  text: string
): { sentiment: NewsMatch['sentiment']; keywords: string[] } {
  const normalizedText = normalizeText(text)
  const foundKeywords: string[] = []

  let negativeCount = 0
  let positiveCount = 0

  // Check for negative keywords
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (normalizedText.includes(normalizeText(keyword))) {
      negativeCount++
      foundKeywords.push(keyword)
    }
  }

  // Check for positive keywords
  for (const keyword of POSITIVE_KEYWORDS) {
    if (normalizedText.includes(normalizeText(keyword))) {
      positiveCount++
      foundKeywords.push(keyword)
    }
  }

  // Determine sentiment
  let sentiment: NewsMatch['sentiment'] = 'neutral'

  if (negativeCount > 0 && positiveCount > 0) {
    sentiment = 'mixed'
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative'
  } else if (positiveCount > negativeCount) {
    sentiment = 'positive'
  }

  return { sentiment, keywords: foundKeywords }
}

/**
 * Calculates relevance score based on where the name appears
 */
function calculateRelevance(
  item: NewsItem,
  name: string
): number {
  let score = 0.5 // Base score

  const normalizedName = normalizeText(name)
  const normalizedTitle = normalizeText(item.title)
  const normalizedExcerpt = normalizeText(item.excerpt || '')

  // Higher score if in title
  if (normalizedTitle.includes(normalizedName)) {
    score += 0.3
  }

  // Check position in title (earlier = more relevant)
  const titlePosition = normalizedTitle.indexOf(normalizedName)
  if (titlePosition >= 0 && titlePosition < 30) {
    score += 0.1
  }

  // Check if in excerpt
  if (normalizedExcerpt.includes(normalizedName)) {
    score += 0.1
  }

  return Math.min(score, 1.0)
}

/**
 * Matches a news item to candidates and parties
 */
export async function matchNewsToEntities(item: NewsItem): Promise<NewsMatch[]> {
  await loadCache()

  const matches: NewsMatch[] = []
  const fullText = `${item.title} ${item.excerpt || ''}`

  // Analyze sentiment once for the whole article
  const { sentiment, keywords } = analyzeSentiment(fullText)

  // Match against candidates
  for (const candidate of candidatesCache) {
    if (containsName(fullText, candidate.full_name)) {
      const relevance = calculateRelevance(item, candidate.full_name)

      matches.push({
        candidateId: candidate.id,
        candidateName: candidate.full_name,
        partyId: candidate.party_id,
        partyName: candidate.party_name || undefined,
        sentiment,
        keywords,
        relevanceScore: relevance,
      })
    }
  }

  // Match against parties (if no candidate matched)
  if (matches.length === 0) {
    for (const party of partiesCache) {
      const partyMatched =
        containsName(fullText, party.name) ||
        (party.short_name && containsName(fullText, party.short_name))

      if (partyMatched) {
        const relevance = calculateRelevance(
          item,
          party.short_name || party.name
        )

        matches.push({
          candidateId: null,
          partyId: party.id,
          partyName: party.name,
          sentiment,
          keywords,
          relevanceScore: relevance,
        })
      }
    }
  }

  // Sort by relevance and limit to top 3
  return matches
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3)
}

/**
 * Clears the cache (useful for testing)
 */
export function clearMatcherCache(): void {
  candidatesCache = []
  partiesCache = []
  cacheTimestamp = 0
}
