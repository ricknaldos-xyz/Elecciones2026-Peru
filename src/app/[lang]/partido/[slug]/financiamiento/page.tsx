import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { getPartyFinanceSummary } from '@/lib/db/queries'
import { PartyFinanceContent } from './PartyFinanceContent'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getPartyFinanceSummary(slug)

  if (!data) {
    return { title: 'Partido no encontrado' }
  }

  return {
    title: `Financiamiento ${data.party.name} - Ranking Electoral 2026`,
    description: `Información financiera de ${data.party.name}. Aportes públicos, donantes privados, gastos y transparencia.`,
  }
}

export default async function PartyFinancePage({ params }: PageProps) {
  const { slug } = await params
  const data = await getPartyFinanceSummary(slug)

  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/transparencia" />
      <PartyFinanceContent initialData={data} />
    </div>
  )
}
