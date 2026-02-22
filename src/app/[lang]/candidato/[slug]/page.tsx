import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCandidateBySlug, getScoreBreakdown, getCandidateDetails, getVicePresidents, getSiblingCargos } from '@/lib/db/queries'
import { CandidateProfileContent } from './CandidateProfileContent'
import { generatePersonSchema, generateBreadcrumbSchema } from '@/lib/schema'
import { displayPartyName } from '@/lib/utils'
import { locales } from '@/i18n/config'
import type { CargoType } from '@/types/database'

export const revalidate = 86400

// Priority order: higher priority cargo is the canonical profile
const CARGO_PRIORITY: Record<CargoType, number> = {
  presidente: 1,
  vicepresidente: 2,
  senador: 3,
  diputado: 4,
  parlamento_andino: 5,
}

interface PageProps {
  params: Promise<{ slug: string; lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'candidate' })
  const tMeta = await getTranslations({ locale: lang, namespace: 'meta' })
  const candidate = await getCandidateBySlug(slug)

  if (!candidate) {
    return {
      title: t('notFound'),
    }
  }

  const effectiveScore = candidate.scores.score_balanced_p ?? candidate.scores.score_balanced

  const ogParams = new URLSearchParams({
    name: candidate.full_name,
    party: displayPartyName(candidate.party?.name) || candidate.party?.short_name || '',
    cargo: candidate.cargo,
    score: effectiveScore.toFixed(1),
    c: candidate.scores.competence.toFixed(0),
    i: candidate.scores.integrity.toFixed(0),
    t: candidate.scores.transparency.toFixed(0),
  })

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://eleccionesperu2026.xyz'

  return {
    title: `${candidate.full_name} - ${tMeta('title')}`,
    description: t('metaDescription', {
      name: candidate.full_name,
      score: effectiveScore.toFixed(1)
    }),
    openGraph: {
      title: `${candidate.full_name} - ${tMeta('title')}`,
      description: t('metaOgDescription', {
        score: effectiveScore.toFixed(1)
      }),
      images: [`/api/og?${ogParams.toString()}`],
    },
    alternates: {
      canonical: `${BASE_URL}/candidato/${slug}`,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/candidato/${slug}`])
        ),
        'x-default': `${BASE_URL}/es/candidato/${slug}`,
      },
    },
  }
}

export default async function CandidatePage({ params }: PageProps) {
  const { slug, lang } = await params
  const candidate = await getCandidateBySlug(slug)

  if (!candidate) {
    notFound()
  }

  // Check if a higher-priority sibling exists → redirect to canonical profile
  const siblingCargos = await getSiblingCargos(candidate.id, candidate.full_name, candidate.party?.id || null)
  const higherPrioritySibling = siblingCargos.find(
    (s) => CARGO_PRIORITY[s.cargo] < CARGO_PRIORITY[candidate.cargo]
  )
  if (higherPrioritySibling) {
    redirect(`/${lang}/candidato/${higherPrioritySibling.slug}`)
  }

  const [breakdown, details, vicePresidents] = await Promise.all([
    getScoreBreakdown(candidate.id),
    getCandidateDetails(candidate.id),
    candidate.cargo === 'presidente' && candidate.party?.id
      ? getVicePresidents(candidate.party.id)
      : Promise.resolve([]),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://eleccionesperu2026.xyz'
  const personSchema = generatePersonSchema(candidate)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Ranking', url: `${baseUrl}/es/ranking` },
    { name: candidate.full_name, url: `${baseUrl}/es/candidato/${candidate.slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <CandidateProfileContent candidate={candidate} breakdown={breakdown} details={details} vicePresidents={vicePresidents} siblingCargos={siblingCargos} />
    </>
  )
}
