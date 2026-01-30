import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to mock the DB before importing matcher
vi.mock('@/lib/db', () => ({
  sql: vi.fn(),
}))

import { matchNewsToEntities, clearMatcherCache, type NewsItem } from '../matcher'
import { sql } from '@/lib/db'

const mockSql = vi.mocked(sql)

// ============================================
// Test data
// ============================================

const MOCK_CANDIDATES = [
  {
    id: '1',
    full_name: 'ACUÑA PERALTA CESAR ABRAHAM',
    party_name: 'Alianza Para el Progreso',
    party_id: 'p1',
  },
  {
    id: '2',
    full_name: 'FUJIMORI HIGUCHI KEIKO SOFIA',
    party_name: 'Fuerza Popular',
    party_id: 'p2',
  },
  {
    id: '3',
    full_name: 'LOPEZ ALIAGA GONZALES RAFAEL BERNARDO',
    party_name: 'Renovación Popular',
    party_id: 'p3',
  },
  {
    id: '4',
    full_name: 'DE LA CRUZ MARTINEZ LUIS MIGUEL',
    party_name: null,
    party_id: null,
  },
]

const MOCK_PARTIES = [
  { id: 'p1', name: 'Alianza Para el Progreso', short_name: 'APP' },
  { id: 'p2', name: 'Fuerza Popular', short_name: null },
  { id: 'p3', name: 'Renovación Popular', short_name: 'RP' },
  { id: 'p4', name: 'Partido Politico Nacional Peru Libre', short_name: 'Peru Libre' },
]

function makeNews(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    title: 'Generic political news article',
    url: 'https://example.com/news/1',
    source: 'rpp',
    ...overrides,
  }
}

// ============================================
// Setup
// ============================================

beforeEach(() => {
  clearMatcherCache()
  // Mock DB queries for candidates and parties
  mockSql.mockImplementation((strings: any, ..._args: any[]) => {
    const query = typeof strings === 'string' ? strings : strings.join('')
    if (query.includes('FROM candidates')) {
      return Promise.resolve(MOCK_CANDIDATES) as any
    }
    if (query.includes('FROM parties')) {
      return Promise.resolve(MOCK_PARTIES) as any
    }
    return Promise.resolve([]) as any
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ============================================
// Candidate name matching
// ============================================

describe('candidate name matching', () => {
  it('matches full name', async () => {
    const matches = await matchNewsToEntities(
      makeNews({ title: 'ACUÑA PERALTA CESAR ABRAHAM lidera encuestas' })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].candidateId).toBe('1')
  })

  it('matches reverse-order consecutive name parts (surname2 surname1)', async () => {
    // JNE name: ACUÑA PERALTA CESAR ABRAHAM
    // Consecutive pair: acuna+peralta, reverse: peralta+acuna
    const matches = await matchNewsToEntities(
      makeNews({ title: 'Peralta Acuña lidera las encuestas presidenciales' })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].candidateId).toBe('1')
  })

  it('matches two consecutive distinctive name parts', async () => {
    // JNE name: FUJIMORI HIGUCHI KEIKO SOFIA
    // Consecutive distinctive pair: fujimori+higuchi (both likely surnames)
    const matches = await matchNewsToEntities(
      makeNews({ title: 'Fujimori Higuchi se pronunció sobre el caso' })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].candidateId).toBe('2')
  })

  it('matches Lopez Aliaga (compound surname)', async () => {
    const matches = await matchNewsToEntities(
      makeNews({ title: 'Rafael Lopez Aliaga propone nuevo plan' })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].candidateId).toBe('3')
  })

  it('does NOT match common given names alone', async () => {
    // "Luis Miguel" are both common given names, should not match DE LA CRUZ MARTINEZ
    const matches = await matchNewsToEntities(
      makeNews({ title: 'Luis Miguel ofrece concierto en Lima' })
    )
    // Should not match any candidate
    const candidateMatch = matches.find(m => m.candidateId === '4')
    expect(candidateMatch).toBeUndefined()
  })

  it('does NOT match single stopwords', async () => {
    const matches = await matchNewsToEntities(
      makeNews({ title: 'El progreso del país depende de la acción popular' })
    )
    // Should not match any candidate
    expect(matches.filter(m => m.candidateId !== null).length).toBe(0)
  })

  it('matches in excerpt when not in title', async () => {
    const matches = await matchNewsToEntities(
      makeNews({
        title: 'Elecciones 2026: últimas noticias',
        excerpt: 'En una entrevista, Fujimori Higuchi declaró que...',
      })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].candidateId).toBe('2')
  })
})

// ============================================
// Party name matching
// ============================================

describe('party name matching', () => {
  it('matches party only when no candidate matches', async () => {
    const matches = await matchNewsToEntities(
      makeNews({ title: 'Fuerza Popular anuncia nueva alianza política' })
    )
    // Should match party, not candidate (Keiko not mentioned by name)
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].partyId).toBe('p2')
    expect(matches[0].candidateId).toBeNull()
  })

  it('prefers candidate match over party match', async () => {
    const matches = await matchNewsToEntities(
      makeNews({ title: 'Fujimori Higuchi y Fuerza Popular en las encuestas' })
    )
    // When candidate matches, party-only matching is skipped entirely
    // The candidate match includes their party info
    expect(matches[0].candidateId).toBe('2')
    expect(matches[0].partyId).toBe('p2') // party from candidate
  })

  it('matches short party name with word boundary', async () => {
    const matches = await matchNewsToEntities(
      makeNews({ title: 'Peru Libre presentó su plan de gobierno' })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].partyId).toBe('p4')
  })

  it('does NOT match very short party acronyms (< 4 chars)', async () => {
    // "RP" is only 2 chars, should not match as short name
    const matches = await matchNewsToEntities(
      makeNews({ title: 'El congresista RP no fue claro en su posición' })
    )
    // Should not match Renovación Popular just from "RP"
    const rpMatch = matches.find(m => m.partyId === 'p3' && m.candidateId === null)
    expect(rpMatch).toBeUndefined()
  })
})

// ============================================
// Sentiment analysis
// ============================================

describe('sentiment analysis', () => {
  it('detects negative sentiment from corruption keywords', async () => {
    const matches = await matchNewsToEntities(
      makeNews({
        title: 'Fujimori Higuchi investigada por corrupción y lavado de activos',
      })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].sentiment).toBe('negative')
    expect(matches[0].keywords).toContain('corrupción')
    expect(matches[0].keywords).toContain('lavado')
  })

  it('detects positive sentiment from proposal keywords', async () => {
    const matches = await matchNewsToEntities(
      makeNews({
        title: 'Acuña Peralta presenta propuesta de mejora para educación',
      })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].sentiment).toBe('positive')
  })

  it('detects mixed sentiment', async () => {
    const matches = await matchNewsToEntities(
      makeNews({
        title: 'Fujimori Higuchi presenta propuesta pero es acusada de irregularidades',
      })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].sentiment).toBe('mixed')
  })

  it('returns neutral for no keyword matches', async () => {
    const matches = await matchNewsToEntities(
      makeNews({
        title: 'Fujimori Higuchi participó en evento público',
      })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].sentiment).toBe('neutral')
  })
})

// ============================================
// Relevance scoring
// ============================================

describe('relevance scoring', () => {
  it('gives higher score when full name is in title', async () => {
    // calculateRelevance checks if the full normalized name is in title/excerpt
    // Full name match in title gets +0.3, in excerpt gets +0.1
    const titleMatch = await matchNewsToEntities(
      makeNews({
        title: 'Fujimori Higuchi Keiko Sofia lidera encuesta',
        excerpt: 'más detalles...',
      })
    )
    const excerptMatch = await matchNewsToEntities(
      makeNews({
        title: 'Fujimori Higuchi en las elecciones 2026',
        excerpt: 'Fujimori Higuchi Keiko Sofia lidera encuesta',
      })
    )
    expect(titleMatch[0].relevanceScore).toBeGreaterThan(excerptMatch[0].relevanceScore)
  })

  it('limits matches to top 3', async () => {
    // Create a news item that mentions many candidates using matchable name pairs
    const matches = await matchNewsToEntities(
      makeNews({
        title: 'Acuña Peralta, Fujimori Higuchi, Rafael Lopez Aliaga y otros debaten',
        excerpt: 'Los candidatos se reunieron para el debate presidencial',
      })
    )
    expect(matches.length).toBeLessThanOrEqual(3)
  })
})

// ============================================
// Edge cases
// ============================================

describe('edge cases', () => {
  it('returns empty for irrelevant news', async () => {
    const matches = await matchNewsToEntities(
      makeNews({ title: 'Clima: se esperan lluvias en la sierra' })
    )
    expect(matches.length).toBe(0)
  })

  it('handles accented characters', async () => {
    // "Acuña Peralta" has accent on ñ; normalizeText strips accents for comparison
    const matches = await matchNewsToEntities(
      makeNews({ title: 'Acuña Peralta lidera las últimas encuestas' })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].candidateId).toBe('1')
  })

  it('handles uppercase text', async () => {
    // FUJIMORI HIGUCHI are consecutive surname parts that match
    const matches = await matchNewsToEntities(
      makeNews({ title: 'FUJIMORI HIGUCHI LIDERA ENCUESTAS' })
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].candidateId).toBe('2')
  })

  it('handles empty title and excerpt', async () => {
    const matches = await matchNewsToEntities(
      makeNews({ title: '', excerpt: '' })
    )
    expect(matches.length).toBe(0)
  })
})
