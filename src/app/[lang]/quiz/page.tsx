import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { QuizContent } from './QuizContent'

export const metadata: Metadata = {
  title: 'Quiz: Quien Piensa Como Tu? | Ranking Electoral Peru 2026',
  description: 'Responde 10 preguntas sobre temas politicos clave y descubre que candidatos presidenciales tienen posiciones mas cercanas a las tuyas.',
  openGraph: {
    title: 'Quiz: Quien Piensa Como Tu?',
    description: 'Descubre que candidatos tienen posiciones similares a las tuyas en las elecciones Peru 2026',
    images: ['/api/og?type=quiz'],
  },
}

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/quiz" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <QuizContent />
      </main>
    </div>
  )
}
