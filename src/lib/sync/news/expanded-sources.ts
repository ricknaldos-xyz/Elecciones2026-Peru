/**
 * Expanded RSS News Sources for Peru 2026 Elections
 *
 * This module extends the existing news sources with additional
 * Peruvian media outlets for comprehensive coverage.
 */

export interface RSSSource {
  id: string
  name: string
  url: string
  category: 'mainstream' | 'official' | 'regional' | 'tv' | 'digital'
  language: 'es'
  priority: number // 1-10, higher = more important
  politicalSection?: string // Specific politics section if available
}

/**
 * Original sources (already implemented in rss-fetcher.ts)
 */
export const ORIGINAL_SOURCES: RSSSource[] = [
  {
    id: 'elcomercio',
    name: 'El Comercio',
    url: 'https://elcomercio.pe/arc/outboundfeeds/rss/category/politica/?outputType=xml',
    category: 'mainstream',
    language: 'es',
    priority: 10,
  },
  {
    id: 'rpp',
    name: 'RPP Noticias',
    url: 'https://rpp.pe/feed/politica',
    category: 'mainstream',
    language: 'es',
    priority: 9,
  },
  {
    id: 'gestion',
    name: 'Gestión',
    url: 'https://gestion.pe/arc/outboundfeeds/rss/?outputType=xml',
    category: 'mainstream',
    language: 'es',
    priority: 8,
  },
  {
    id: 'peru21',
    name: 'Peru21',
    url: 'https://peru21.pe/feed/politica/',
    category: 'mainstream',
    language: 'es',
    priority: 8,
  },
]

/**
 * New expanded sources
 */
export const EXPANDED_SOURCES: RSSSource[] = [
  // Official Agency
  {
    id: 'andina',
    name: 'Agencia Andina',
    url: 'https://andina.pe/agencia/rss/noticia-politica-5.rss',
    category: 'official',
    language: 'es',
    priority: 10,
  },

  // Digital Media - Infobae política
  {
    id: 'infobae',
    name: 'Infobae Perú',
    url: 'https://www.infobae.com/arc/outboundfeeds/rss/category/peru/politica-peru/?outputType=xml',
    category: 'digital',
    language: 'es',
    priority: 9,
  },

  // IDL Reporteros - investigación
  {
    id: 'idl',
    name: 'IDL Reporteros',
    url: 'https://www.idl-reporteros.pe/feed/',
    category: 'digital',
    language: 'es',
    priority: 9,
  },

  // Exitosa
  {
    id: 'exitosa',
    name: 'Exitosa Noticias',
    url: 'https://exitosanoticias.pe/feed/',
    category: 'digital',
    language: 'es',
    priority: 7,
  },

  // Congrezoo - Periodismo y Transparencia parlamentaria
  {
    id: 'congrezoo',
    name: 'Congrezoo',
    url: 'https://congrezoo.pe/feed/',
    category: 'digital',
    language: 'es',
    priority: 8,
  },
]

/**
 * All sources combined
 */
export const ALL_RSS_SOURCES: RSSSource[] = [
  ...ORIGINAL_SOURCES,
  ...EXPANDED_SOURCES,
].sort((a, b) => b.priority - a.priority)

/**
 * Get sources by category
 */
export function getSourcesByCategory(category: RSSSource['category']): RSSSource[] {
  return ALL_RSS_SOURCES.filter((s) => s.category === category)
}

/**
 * Get sources by minimum priority
 */
export function getSourcesByPriority(minPriority: number): RSSSource[] {
  return ALL_RSS_SOURCES.filter((s) => s.priority >= minPriority)
}

/**
 * Alternative/Backup RSS URLs for sources that may change
 */
export const BACKUP_URLS: Record<string, string[]> = {
  andina: [
    'https://andina.pe/agencia/rss/noticia-politica-5.rss',
    'https://andina.pe/agencia/rss/noticias-politica.rss',
  ],
  infobae: [
    'https://www.infobae.com/feeds/rss/peru/',
    'https://www.infobae.com/peru/feed/',
  ],
  americatv: [
    'https://www.americatv.com.pe/noticias/rss/politica',
    'https://www.americatv.com.pe/noticias/feed/',
  ],
}

/**
 * Keywords to filter political content
 */
export const POLITICAL_KEYWORDS = [
  // Elections
  'elecciones',
  'elección',
  'electoral',
  'votación',
  'voto',
  'urna',
  'cédula',
  'sufragio',

  // Candidates/Parties
  'candidato',
  'candidata',
  'candidatura',
  'partido',
  'alianza',
  'movimiento',
  'plancha',

  // Institutions
  'congreso',
  'jne',
  'onpe',
  'reniec',
  'ejecutivo',
  'legislativo',

  // Positions
  'presidente',
  'presidencial',
  'vicepresidente',
  'congresista',
  'senador',
  'diputado',
  'parlamentario',

  // Process
  'campaña',
  'encuesta',
  'debate',
  'mitin',
  'inscripción',
  'proclamación',

  // 2026 specific
  '2026',
  'peru 2026',
  'elecciones 2026',

  // Investigative / corruption
  'minería ilegal',
  'economías ilegales',
  'territorio tomado',
  'reinfo',
  'lavado de activos',
  'crimen organizado',
]

/**
 * Check if content is politically relevant
 */
export function isPoliticallyRelevant(
  title: string,
  content?: string
): boolean {
  const text = `${title} ${content || ''}`.toLowerCase()
  return POLITICAL_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()))
}

/**
 * Rate limiting configuration per source
 */
export const RATE_LIMITS: Record<string, { requestsPerMinute: number; delayMs: number }> = {
  default: { requestsPerMinute: 10, delayMs: 6000 },
  andina: { requestsPerMinute: 20, delayMs: 3000 }, // Official source, more lenient
  infobae: { requestsPerMinute: 5, delayMs: 12000 }, // More restrictive
  idl: { requestsPerMinute: 5, delayMs: 12000 }, // Small site, be gentle
  congrezoo: { requestsPerMinute: 5, delayMs: 12000 }, // Small site, be gentle
}

/**
 * Get rate limit for source
 */
export function getRateLimit(sourceId: string) {
  return RATE_LIMITS[sourceId] || RATE_LIMITS.default
}
