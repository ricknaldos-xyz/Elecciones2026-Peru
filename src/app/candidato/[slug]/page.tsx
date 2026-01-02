import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { MOCK_PRESIDENTIAL_CANDIDATES, getMockCandidates } from '@/lib/mock-data'
import { CandidateProfileContent } from './CandidateProfileContent'

interface PageProps {
  params: Promise<{ slug: string }>
}

function getCandidate(slug: string) {
  // Try presidential candidates first
  let candidate = MOCK_PRESIDENTIAL_CANDIDATES.find((c) => c.slug === slug)
  if (candidate) return candidate

  // Try other cargos
  const cargos = ['vicepresidente', 'senador', 'diputado', 'parlamento_andino'] as const
  for (const cargo of cargos) {
    const candidates = getMockCandidates(cargo)
    candidate = candidates.find((c) => c.slug === slug)
    if (candidate) return candidate
  }

  return null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const candidate = getCandidate(slug)

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
  const candidate = getCandidate(slug)

  if (!candidate) {
    notFound()
  }

  return <CandidateProfileContent candidate={candidate} />
}
