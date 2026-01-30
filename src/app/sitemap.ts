import { MetadataRoute } from 'next'
import { sql } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://votainformado.pe'
const LOCALES = ['es', 'qu', 'ay', 'ase']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Static pages
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/ranking', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/comparar', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/noticias', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/transparencia', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/metodologia', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/quiz', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/docs', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/donar', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/juegos', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/juegos/batalla', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/juegos/swipe', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/juegos/frankenstein', priority: 0.8, changeFrequency: 'daily' as const },
  ]

  for (const page of staticPages) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  try {
    // Candidate pages
    const candidates = await sql`
      SELECT slug, created_at
      FROM candidates
      WHERE slug IS NOT NULL
      ORDER BY cargo, full_name
    `

    for (const candidate of candidates) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/candidato/${candidate.slug}`,
          lastModified: candidate.created_at ? new Date(candidate.created_at as string) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }

    // Party pages (derived from candidates' party data)
    const parties = await sql`
      SELECT DISTINCT p.id, p.name
      FROM parties p
      JOIN candidates c ON c.party_id = p.id
      WHERE c.slug IS NOT NULL
    `

    for (const party of parties) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/partido/${party.id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      }
    }

    // District pages (derived from districts table)
    const districts = await sql`
      SELECT DISTINCT d.slug
      FROM districts d
      WHERE d.slug IS NOT NULL
    `

    for (const district of districts) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/distrito/${district.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      }
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return entries
}
