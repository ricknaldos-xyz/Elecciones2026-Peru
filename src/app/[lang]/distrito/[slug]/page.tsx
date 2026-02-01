import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Link } from '@/i18n/routing'
import { getCandidates, getDistricts } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
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
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge variant="outline" className="mb-2">{district.type}</Badge>
          <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">
            {district.name}
          </h1>
          <p className="text-[var(--muted-foreground)] font-medium mt-2">
            {senators.length} senadores - {deputies.length} diputados
          </p>
        </div>

        {senators.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
              Candidatos a Senador
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {senators.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 1}
                  mode="balanced"
                />
              ))}
            </div>
          </section>
        )}

        {deputies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
              Candidatos a Diputado
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {deputies.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 1}
                  mode="balanced"
                />
              ))}
            </div>
          </section>
        )}

        {candidates.length === 0 && (
          <div className="text-center py-12 bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)]">
            <p className="text-[var(--muted-foreground)] font-medium">
              No hay candidatos registrados para este distrito.
            </p>
            <Link href="/ranking">
              <Button variant="primary" className="mt-4">
                VER TODOS LOS CANDIDATOS
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
