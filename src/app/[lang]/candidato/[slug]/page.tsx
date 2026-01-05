import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCandidateBySlug, getScoreBreakdown, getCandidateDetails } from '@/lib/db/queries'
import { CandidateProfileContent } from './CandidateProfileContent'

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

  const ogParams = new URLSearchParams({
    name: candidate.full_name,
    party: candidate.party?.short_name || candidate.party?.name || '',
    cargo: candidate.cargo,
    score: candidate.scores.score_balanced.toFixed(1),
    c: candidate.scores.competence.toFixed(0),
    i: candidate.scores.integrity.toFixed(0),
    t: candidate.scores.transparency.toFixed(0),
  })

  return {
    title: `${candidate.full_name} - ${tMeta('title')}`,
    description: t('metaDescription', {
      name: candidate.full_name,
      score: candidate.scores.score_balanced.toFixed(1)
    }),
    openGraph: {
      title: `${candidate.full_name} - ${tMeta('title')}`,
      description: t('metaOgDescription', {
        score: candidate.scores.score_balanced.toFixed(1)
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

  const [breakdown, details] = await Promise.all([
    getScoreBreakdown(candidate.id),
    getCandidateDetails(candidate.id),
  ])

  return <CandidateProfileContent candidate={candidate} breakdown={breakdown} details={details} />
}
