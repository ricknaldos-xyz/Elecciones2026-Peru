import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getCandidateBySlug, getScoreBreakdown, getCandidateDetails } from '@/lib/db/queries'
import { CandidateProfileContent } from './CandidateProfileContent'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const candidate = await getCandidateBySlug(slug)

  if (!candidate) {
    return {
      title: 'Candidato no encontrado',
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
    title: `${candidate.full_name} - Ranking Electoral 2026`,
    description: `Score: ${candidate.scores.score_balanced.toFixed(1)}/100. Ver mérito, integridad y evidencia de ${candidate.full_name}.`,
    openGraph: {
      title: `${candidate.full_name} - Ranking Electoral 2026`,
      description: `Score: ${candidate.scores.score_balanced.toFixed(1)}/100. Ver mérito, integridad y transparencia.`,
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
