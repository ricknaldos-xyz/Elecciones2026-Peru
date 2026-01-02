import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PartyFinanceContent } from './PartyFinanceContent'
import { getPartyById, getPartyFinanceSummary } from '@/lib/db/queries'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const party = await getPartyById(slug)

  if (!party) {
    return {
      title: 'Partido no encontrado | Ranking Electoral Peru 2026',
    }
  }

  return {
    title: `Financiamiento de ${party.name} | Ranking Electoral Peru 2026`,
    description: `Información sobre aportes, donantes y gastos de campaña de ${party.name}. Datos oficiales de transparencia financiera.`,
  }
}

export default async function PartyFinancePage({ params }: Props) {
  const { slug } = await params
  const financeSummary = await getPartyFinanceSummary(slug)

  if (!financeSummary) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header currentPath="/transparencia" />
      <PartyFinanceContent initialData={financeSummary} />
    </div>
  )
}
