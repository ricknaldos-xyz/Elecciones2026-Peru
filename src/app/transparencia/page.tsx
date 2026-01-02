import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { TransparencyContent } from './TransparencyContent'

export const metadata: Metadata = {
  title: 'Transparencia Financiera | Ranking Electoral Peru 2026',
  description: 'Información sobre el financiamiento de partidos políticos en Perú. Aportes, donantes, gastos de campaña y financiamiento público.',
}

export default function TransparenciaPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header currentPath="/transparencia" />
      <TransparencyContent />
    </div>
  )
}
