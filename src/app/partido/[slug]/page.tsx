import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { getCandidates, getParties, getPartyFinances } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { CandidateCard } from '@/components/candidate/CandidateCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { CargoType } from '@/types/database'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPartyBySlug(slug: string) {
  const parties = await getParties()
  return parties.find((p) =>
    p.short_name?.toLowerCase().replace(/\s+/g, '-') === slug ||
    p.name?.toLowerCase().replace(/\s+/g, '-') === slug
  )
}

const cargoLabels: Record<CargoType, string> = {
  presidente: 'Presidente',
  vicepresidente: 'Vicepresidente',
  senador: 'Senador',
  diputado: 'Diputado',
  parlamento_andino: 'Parlamento Andino',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const party = await getPartyBySlug(slug)

  if (!party) {
    return { title: 'Partido no encontrado' }
  }

  return {
    title: `${party.name} - Ranking Electoral 2026`,
    description: `Ver todos los candidatos de ${party.name}. Compara scores de competencia, integridad y transparencia.`,
  }
}

export default async function PartidoPage({ params }: PageProps) {
  const { slug } = await params
  const party = await getPartyBySlug(slug)

  if (!party) {
    notFound()
  }

  const [candidates, finances] = await Promise.all([
    getCandidates({ partyId: party.id as string }),
    getPartyFinances(party.id as string)
  ])

  const latestFinance = finances.length > 0 ? finances[0] : null

  const groupedByCargo = candidates.reduce((acc, c) => {
    if (!acc[c.cargo]) acc[c.cargo] = []
    acc[c.cargo].push(c)
    return acc
  }, {} as Record<CargoType, typeof candidates>)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 border-3 border-[var(--border)] flex items-center justify-center text-white font-black text-xl"
              style={{ backgroundColor: (party.color as string) || '#6B7280' }}
            >
              {(party.short_name as string)?.slice(0, 2) || (party.name as string)?.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">
                {party.name}
              </h1>
              <p className="text-[var(--muted-foreground)] font-medium">
                {candidates.length} candidatos registrados
              </p>
            </div>
          </div>
          <Link href={`/partido/${party.id}/financiamiento`}>
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              VER FINANCIAMIENTO
            </Button>
          </Link>
        </div>

        {/* Finance Summary Card */}
        {latestFinance && (
          <Link href={`/partido/${party.id}/financiamiento`}>
            <Card className="mb-8 p-5 hover:shadow-[var(--shadow-brutal)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-100 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                  <svg className="w-5 h-5 text-[var(--score-high)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Transparencia Financiera {latestFinance.year}
                </h2>
                <Badge variant="outline">ONPE</Badge>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-[var(--muted-foreground)] font-bold uppercase">Público</div>
                  <div className="text-base sm:text-lg font-black text-[var(--score-high)]">{formatCurrency(latestFinance.public_funding)}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-[var(--muted-foreground)] font-bold uppercase">Privado</div>
                  <div className="text-base sm:text-lg font-black text-[var(--score-competence)]">{formatCurrency(latestFinance.private_funding_total)}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-[var(--muted-foreground)] font-bold uppercase">Total</div>
                  <div className="text-base sm:text-lg font-black text-[var(--foreground)]">{formatCurrency(latestFinance.total_income)}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-[var(--muted-foreground)] font-bold uppercase">Donantes</div>
                  <div className="text-base sm:text-lg font-black text-[var(--foreground)]">{latestFinance.donor_count}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-[var(--primary)] font-bold uppercase">
                Ver detalle completo
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        )}

        {Object.entries(groupedByCargo).map(([cargo, cargoCandidates]) => (
          <section key={cargo} className="mb-8">
            <h2 className="text-xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
              {cargoLabels[cargo as CargoType]}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cargoCandidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 1}
                  mode="balanced"
                />
              ))}
            </div>
          </section>
        ))}

        {candidates.length === 0 && (
          <div className="text-center py-12 bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)]">
            <p className="text-[var(--muted-foreground)] font-medium">
              No hay candidatos registrados para este partido.
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
