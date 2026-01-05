import { Suspense } from 'react'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { NoticiasContent } from './NoticiasContent'

export const metadata: Metadata = {
  title: 'Noticias Electorales | Ranking Electoral Peru 2026',
  description: 'Las ultimas noticias de las elecciones Peru 2026. Cobertura de candidatos presidenciales, congresales y partidos politicos de los principales medios.',
  openGraph: {
    title: 'Noticias Electorales Peru 2026',
    description: 'Las ultimas noticias de las elecciones Peru 2026 de los principales medios de comunicacion.',
  },
}

function LoadingFallback() {
  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6 animate-pulse">
        <div className="h-10 bg-[var(--muted)] mb-4" />
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-[var(--muted)]" />
          ))}
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-12 bg-[var(--muted)]" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-[var(--muted)] w-3/4" />
              <div className="h-4 bg-[var(--muted)] w-full" />
              <div className="h-4 bg-[var(--muted)] w-1/2" />
            </div>
            <div className="h-8 bg-[var(--muted)]" />
          </Card>
        ))}
      </div>
    </div>
  )
}

export default async function NoticiasPage() {
  const t = await getTranslations('news')

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/noticias" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <Badge variant="primary" size="md" className="mb-4">
            {t('live')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-3">
            {t('title')}
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* News sources banner */}
        <div className="mb-8 p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
          <p className="text-xs text-center text-[var(--muted-foreground)]">
            <span className="font-bold text-[var(--foreground)]">{t('sources')}:</span>{' '}
            {t('sourcesList')}
          </p>
        </div>

        {/* Content */}
        <Suspense fallback={<LoadingFallback />}>
          <NoticiasContent />
        </Suspense>
      </main>
    </div>
  )
}
