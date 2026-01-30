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

// Common Spanish words that should not count as distinctive name parts
const STOPWORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'en', 'al', 'por', 'con', 'para',
  'y', 'e', 'o', 'a', 'un', 'una', 'su', 'se', 'no', 'si', 'que', 'es',
  // Common given names that are also regular words
  'flor', 'luz', 'rosa', 'sol', 'cruz', 'paz', 'fe', 'pilar',
  // Common particles in compound names
  'san', 'santa', 'santo', 'maria', 'juan', 'jose', 'ana',
  // Political/generic terms that cause party false positives
  'partido', 'politico', 'politica', 'nacional', 'popular', 'peru',
  'alianza', 'electoral', 'democratico', 'democratica', 'integridad',
  'accion', 'frente', 'pueblo', 'nacion', 'pais', 'social',
  'libertad', 'progreso', 'union', 'unidad', 'nuevo', 'nueva',
  'primero', 'ahora', 'avanza', 'juntos', 'fuerza', 'renovacion',
  'cooperacion', 'ciudadanos', 'trabajadores',
])

// Very common given names in Peru - these alone don't make a distinctive match
const COMMON_GIVEN_NAMES = new Set([
  'luis', 'carlos', 'jorge', 'miguel', 'angel', 'alberto',
  'enrique', 'fernando', 'daniel', 'victor', 'marco', 'david',
  'oscar', 'cesar', 'hugo', 'pedro', 'manuel', 'raul', 'ivan',
  'edgar', 'henry', 'sergio', 'walter', 'mario', 'julio', 'pablo',
  'eduardo', 'roberto', 'andres', 'gustavo', 'arturo', 'ricardo',
  'ernesto', 'francisco', 'antonio', 'alejandro', 'guillermo',
  'patricia', 'carmen', 'elizabeth', 'jessica', 'teresa',
  'gloria', 'martha', 'norma', 'silvia', 'olga', 'julia',
  'diana', 'claudia', 'roxana', 'gladys', 'milagros', 'liliana',
  'keiko', 'dina', 'martin', 'jaime', 'judith', 'laura',
])

/**
 * Check if a word is a distinctive name part (not a stopword, long enough)
 */
function isDistinctive(word: string): boolean {
  return word.length >= 3 && !STOPWORDS.has(word)
}

/**
 * Check if a word is likely a surname (not a common given name)
 */
function isLikelySurname(word: string): boolean {
  return isDistinctive(word) && !COMMON_GIVEN_NAMES.has(word)
}

/**
 * Checks if text contains a candidate name.
 * Peruvian candidate names are formatted: SURNAME1 SURNAME2 GIVENNAME1 [GIVENNAME2...]
 * or display format: GIVENNAME1 SURNAME1 SURNAME2
 *
 * Requires two consecutive distinctive name parts to appear as a PHRASE in the text
 * (adjacent words), to avoid false positives from common names appearing independently.
 * Also checks the reverse order (e.g. "cesar acuña" matches both "César Acuña" and "ACUÑA ... CESAR").
 */
function containsCandidateName(text: string, name: string): boolean {
  const normalizedText = normalizeText(text)
  const normalizedName = normalizeText(name)

  // Full name match
  if (normalizedText.includes(normalizedName)) {
    return true
  }

  const nameParts = normalizedName.split(' ').filter(p => p.length >= 2)
  if (nameParts.length < 2) return false

  // Try all consecutive 2-word combos as phrases
  for (let i = 0; i < nameParts.length - 1; i++) {
    const word1 = nameParts[i]
    const word2 = nameParts[i + 1]

    // Both words must be distinctive (not stopwords)
    if (!isDistinctive(word1) || !isDistinctive(word2)) continue

    // At least one word must be a likely surname (not a common given name)
    // This prevents "luis enrique", "jorge daniel", "miguel angel" from matching
    if (!isLikelySurname(word1) && !isLikelySurname(word2)) continue

    // Check forward: "word1 word2"
    const phrase = `${word1} ${word2}`
    if (phrase.length >= 10 && normalizedText.includes(phrase)) {
      return true
    }

    // Check reverse: "word2 word1" (handles JNE vs display name order)
    const reversePhrase = `${word2} ${word1}`
    if (reversePhrase.length >= 10 && normalizedText.includes(reversePhrase)) {
      return true
    }
  }

  return false
}

// Generic prefixes to strip from party legal names to get the recognizable portion
const PARTY_PREFIXES = [
  'partido politico nacional',
  'partido politico',
  'partido democratico',
  'partido democrata',
  'partido de los',
  'partido',
  'alianza electoral',
]

/**
 * Get recognizable phrases for a party.
 * Strips generic legal prefixes to extract the distinctive name portion.
 * Returns phrases that should be matched as-is in text.
 */
function getPartyMatchPhrases(fullName: string, shortName: string | null): string[] {
  const phrases: string[] = []
  const normalized = normalizeText(fullName)

  // 1. Short name as whole word (>= 4 chars to avoid "AN", "AP", "SP" etc.)
  if (shortName) {
    const normalizedShort = normalizeText(shortName)
    if (normalizedShort.length >= 4) {
      phrases.push(normalizedShort)
    }
  }

  // 2. Full name (exact match)
  phrases.push(normalized)

  // 3. Strip generic prefix to get distinctive portion
  for (const prefix of PARTY_PREFIXES) {
    if (normalized.startsWith(prefix + ' ')) {
      const distinctive = normalized.slice(prefix.length + 1).trim()
      // Only use if the remaining part is distinctive enough (>= 2 words or >= 8 chars)
      if (distinctive.length >= 8) {
        phrases.push(distinctive)
      }
      break
    }
  }

  // 4. Handle "NAME - ACRONYM" format (e.g. "AHORA NACION - AN")
  const dashParts = fullName.split(' - ')
  if (dashParts.length > 1) {
    const beforeDash = normalizeText(dashParts[0])
    if (beforeDash.length >= 8) {
      phrases.push(beforeDash)
    }
  }

  return phrases
}

/**
 * Checks if text contains a party name.
 * Uses recognizable party identifiers, not generic legal prefixes.
 */
function containsPartyName(text: string, party: PartyInfo): boolean {
  const normalizedText = normalizeText(text)
  const phrases = getPartyMatchPhrases(party.name, party.short_name)

  for (const phrase of phrases) {
    // For short names (acronyms), require word boundary match
    if (phrase.length <= 6) {
      const regex = new RegExp(`\\b${phrase}\\b`)
      if (regex.test(normalizedText)) return true
    } else {
      // For longer phrases, substring match is fine
      if (normalizedText.includes(phrase)) return true
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
 * Matches a news item to candidates and/or parties.
 * Candidates are matched first; if no candidate matches, tries party matching.
 */
export async function matchNewsToEntities(item: NewsItem): Promise<NewsMatch[]> {
  await loadCache()

  const matches: NewsMatch[] = []
  const fullText = `${item.title} ${item.excerpt || ''}`

  // Analyze sentiment once for the whole article
  const { sentiment, keywords } = analyzeSentiment(fullText)

  // Match against candidates
  for (const candidate of candidatesCache) {
    if (containsCandidateName(fullText, candidate.full_name)) {
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

  // If no candidate matched, try party matching
  if (matches.length === 0) {
    for (const party of partiesCache) {
      if (containsPartyName(fullText, party)) {
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
