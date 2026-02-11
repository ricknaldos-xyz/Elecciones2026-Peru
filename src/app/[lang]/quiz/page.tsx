import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { QuizContent } from './QuizContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Quiz: ¿Quién Piensa Como Tú? | Ranking Electoral Perú 2026',
    description: 'Responde 10 preguntas sobre temas políticos clave y descubre qué candidatos presidenciales tienen posiciones más cercanas a las tuyas.',
    openGraph: {
      title: 'Quiz: ¿Quién Piensa Como Tú?',
      description: 'Descubre qué candidatos tienen posiciones similares a las tuyas en las elecciones Perú 2026',
      images: ['/api/og?type=quiz'],
    },
  }
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
