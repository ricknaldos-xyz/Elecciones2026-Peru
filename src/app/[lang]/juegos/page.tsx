import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Link } from '@/i18n/routing'
import type { Locale } from '@/i18n/config'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'games' })
  return {
    title: t('hub.metaTitle'),
    description: t('hub.metaDescription'),
  }
}

export default async function JuegosPage({ params }: Props) {
  const { lang } = await params
  setRequestLocale(lang as Locale)
  const t = await getTranslations({ locale: lang, namespace: 'games' })

  const games = [
    {
      id: 'batalla',
      href: '/juegos/batalla' as const,
      icon: '⚔️',
      color: 'var(--primary)',
      title: t('batalla.title'),
      description: t('batalla.hubDesc'),
      badge: t('batalla.badge'),
    },
    {
      id: 'swipe',
      href: '/juegos/swipe' as const,
      icon: '💘',
      color: 'var(--score-good)',
      title: t('swipe.title'),
      description: t('swipe.hubDesc'),
      badge: t('swipe.badge'),
    },
    {
      id: 'frankenstein',
      href: '/juegos/frankenstein' as const,
      icon: '🧟',
      color: 'var(--score-medium)',
      title: t('frankenstein.title'),
      description: t('frankenstein.hubDesc'),
      badge: t('frankenstein.badge'),
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/juegos" />

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="warning" size="md" className="mb-4">{t('hub.badge')}</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-4">
            {t('hub.title')}
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
            {t('hub.subtitle')}
          </p>
        </div>

        {/* Games grid */}
        <div className="grid gap-6">
          {games.map((game) => (
            <Link key={game.id} href={game.href} className="block group">
              <Card className="p-0 overflow-hidden hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-xl)] transition-all duration-100">
                <div className="flex flex-col sm:flex-row">
                  <div
                    className="sm:w-32 p-6 flex items-center justify-center border-b-3 sm:border-b-0 sm:border-r-3 border-[var(--border)]"
                    style={{ backgroundColor: game.color }}
                  >
                    <span className="text-4xl sm:text-5xl">{game.icon}</span>
                  </div>
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase">
                        {game.title}
                      </h2>
                      <Badge variant="primary" size="sm">{game.badge}</Badge>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4">
                      {game.description}
                    </p>
                    <Button size="sm" variant="secondary" className="group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                      {t('hub.play')}
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
