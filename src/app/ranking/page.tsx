import { Suspense } from 'react'
import { RankingContent } from './RankingContent'
import { Header } from '@/components/layout/Header'

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header currentPath="/ranking" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-6">
          <aside className="hidden lg:block w-72">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
              <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="space-y-3">
                <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
              </div>
            </div>
          </aside>
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5"
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                  <div className="w-16 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
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
