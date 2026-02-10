/**
 * Schema.org JSON-LD generators for SEO structured data
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://rankingelectoral.pe'

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ranking Electoral Peru 2026',
    url: BASE_URL,
    description: 'Plataforma de inteligencia electoral con ranking transparente de candidatos basado en mérito, integridad y evidencia.',
    inLanguage: ['es', 'qu', 'ay'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/es/ranking?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ranking Electoral Peru',
    url: BASE_URL,
    description: 'Plataforma independiente de transparencia electoral para las elecciones generales de Peru 2026.',
  }
}

export function generatePersonSchema(candidate: {
  full_name: string
  slug: string
  photo_url: string | null
  cargo: string
  party?: { name: string; short_name?: string | null } | null
}) {
  const cargoLabels: Record<string, string> = {
    presidente: 'Candidato a la Presidencia de la República',
    vicepresidente: 'Candidato a la Vicepresidencia',
    senador: 'Candidato al Senado',
    diputado: 'Candidato a la Cámara de Diputados',
    parlamento_andino: 'Candidato al Parlamento Andino',
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: candidate.full_name,
    url: `${BASE_URL}/es/candidato/${candidate.slug}`,
    image: candidate.photo_url || undefined,
    jobTitle: cargoLabels[candidate.cargo] || candidate.cargo,
    memberOf: candidate.party ? {
      '@type': 'Organization',
      name: candidate.party.name,
      alternateName: candidate.party.short_name || undefined,
    } : undefined,
  }
}

export function generatePoliticalPartySchema(party: {
  name: string
  short_name?: string | null
  logo_url?: string | null
}, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: party.name,
    alternateName: party.short_name || undefined,
    url: `${BASE_URL}/es/partido/${slug}`,
    logo: party.logo_url || undefined,
  }
}

export function generateNewsListSchema(items: {
  title: string
  url: string
  source: string
  published_at: string
  excerpt: string | null
}[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'NewsArticle',
        headline: item.title,
        url: item.url,
        datePublished: item.published_at,
        description: item.excerpt || undefined,
        publisher: {
          '@type': 'Organization',
          name: item.source,
        },
      },
    })),
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
