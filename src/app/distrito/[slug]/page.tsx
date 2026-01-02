import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { getCandidates, getDistricts } from '@/lib/db/queries'
import { CandidateCard } from '@/components/candidate/CandidateCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getDistrict(slug: string) {
  const districts = await getDistricts()
  return districts.find((d) => d.slug === slug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const district = await getDistrict(slug)

  if (!district) {
    return { title: 'Distrito no encontrado' }
  }

  return {
    title: `Candidatos de ${district.name} - Ranking Electoral 2026`,
    description: `Ver ranking de candidatos al Congreso por ${district.name}. Compara scores de competencia, integridad y transparencia.`,
  }
}

export default async function DistritoPage({ params }: PageProps) {
  const { slug } = await params
  const district = await getDistrict(slug)

  if (!district) {
    notFound()
  }

  const candidates = await getCandidates({ districtSlug: slug })
  const senators = candidates.filter((c) => c.cargo === 'senador')
  const deputies = candidates.filter((c) => c.cargo === 'diputado')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/ranking" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Ranking Electoral
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge variant="outline" className="mb-2">{district.type}</Badge>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {district.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {senators.length} senadores · {deputies.length} diputados
          </p>
        </div>

        {senators.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Candidatos a Senador
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {senators.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 1}
                  mode="balanced"
                  onCompare={() => {}}
                  onView={() => {}}
                  onShare={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {deputies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Candidatos a Diputado
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {deputies.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 1}
                  mode="balanced"
                  onCompare={() => {}}
                  onView={() => {}}
                  onShare={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {candidates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No hay candidatos registrados para este distrito.
            </p>
            <Link href="/ranking">
              <Button variant="primary" className="mt-4">
                Ver todos los candidatos
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
