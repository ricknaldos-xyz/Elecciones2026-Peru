import { Suspense } from 'react'
import { CompareContent } from './CompareContent'
import { Header } from '@/components/layout/Header'

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/comparar" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-64 bg-[var(--muted)] border-2 border-[var(--border)] animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)] p-6"
            >
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-[var(--muted)] border-2 border-[var(--border)] animate-pulse mb-4" />
                <div className="h-5 w-32 bg-[var(--muted)] border border-[var(--border)] animate-pulse mb-2" />
                <div className="h-4 w-24 bg-[var(--muted)] border border-[var(--border)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default function CompararPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CompareContent />
    </Suspense>
  )
}
