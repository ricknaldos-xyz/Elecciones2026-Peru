import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getCandidateBySlug } from '@/lib/db/queries'
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

  return {
    title: `${candidate.full_name} - Ranking Electoral 2026`,
    description: `Score: ${candidate.scores.score_balanced.toFixed(1)}/100. Ver mérito, integridad y evidencia de ${candidate.full_name}.`,
    openGraph: {
      title: `${candidate.full_name} - Ranking Electoral 2026`,
      description: `Score: ${candidate.scores.score_balanced.toFixed(1)}/100. Ver mérito, integridad y transparencia.`,
    },
  }
}

export default async function CandidatePage({ params }: PageProps) {
  const { slug } = await params
  const candidate = await getCandidateBySlug(slug)

  if (!candidate) {
    notFound()
  }

  return <CandidateProfileContent candidate={candidate} />
}
