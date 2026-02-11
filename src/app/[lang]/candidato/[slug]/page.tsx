import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCandidateBySlug, getScoreBreakdown, getCandidateDetails, getVicePresidents, getSiblingCargos } from '@/lib/db/queries'
import { CandidateProfileContent } from './CandidateProfileContent'
import { generatePersonSchema, generateBreadcrumbSchema } from '@/lib/schema'

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

  const isPresidential = candidate.cargo === 'presidente'
  const effectiveScore = isPresidential && candidate.scores.score_balanced_p != null
    ? candidate.scores.score_balanced_p
    : candidate.scores.score_balanced

  const ogParams = new URLSearchParams({
    name: candidate.full_name,
    party: candidate.party?.short_name || candidate.party?.name || '',
    cargo: candidate.cargo,
    score: effectiveScore.toFixed(1),
    c: candidate.scores.competence.toFixed(0),
    i: candidate.scores.integrity.toFixed(0),
    t: candidate.scores.transparency.toFixed(0),
  })

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
  }
}

export default async function CandidatePage({ params }: PageProps) {
  const { slug } = await params
  const candidate = await getCandidateBySlug(slug)

  if (!candidate) {
    notFound()
  }

  const [breakdown, details, vicePresidents, siblingCargos] = await Promise.all([
    getScoreBreakdown(candidate.id),
    getCandidateDetails(candidate.id),
    candidate.cargo === 'presidente' && candidate.party?.id
      ? getVicePresidents(candidate.party.id)
      : Promise.resolve([]),
    getSiblingCargos(candidate.id, candidate.full_name, candidate.party?.id || null),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rankingelectoral.pe'
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
