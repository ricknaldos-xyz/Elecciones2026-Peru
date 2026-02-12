import { Suspense } from 'react'
import type { Metadata } from 'next'
import { RankingContent } from './RankingContent'
import { Header } from '@/components/layout/Header'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Ranking de Candidatos | EleccionesPerú2026',
    description: 'Ranking algorítmico de candidatos a presidente, senador y diputado basado en competencia, historial legal y transparencia. Elecciones Perú 2026.',
    openGraph: {
      title: 'Ranking de Candidatos - Elecciones Perú 2026',
      description: 'Ranking algorítmico de candidatos basado en datos públicos verificables.',
      images: ['/api/og?type=ranking'],
    },
  }
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/ranking" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="h-8 w-64 bg-[var(--muted)] border-2 border-[var(--border)] animate-pulse mb-2" />
          <div className="h-4 w-40 bg-[var(--muted)] border-2 border-[var(--border)] animate-pulse" />
        </div>
        <div className="flex gap-6">
          <aside className="hidden lg:block w-72">
            <div className="bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)] p-6 space-y-4">
              <div className="h-5 w-20 bg-[var(--muted)] border border-[var(--border)] animate-pulse" />
              <div className="space-y-3">
                <div className="h-10 bg-[var(--muted)] border-2 border-[var(--border)] animate-pulse" />
                <div className="h-10 bg-[var(--muted)] border-2 border-[var(--border)] animate-pulse" />
                <div className="h-10 bg-[var(--muted)] border-2 border-[var(--border)] animate-pulse" />
              </div>
            </div>
          </aside>
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)] p-5"
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-[var(--muted)] border-2 border-[var(--border)] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-[var(--muted)] border border-[var(--border)] animate-pulse" />
                    <div className="h-4 w-32 bg-[var(--muted)] border border-[var(--border)] animate-pulse" />
                  </div>
                  <div className="w-16 h-12 bg-[var(--muted)] border-2 border-[var(--border)] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function RankingPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RankingContent />
    </Suspense>
  )
}
