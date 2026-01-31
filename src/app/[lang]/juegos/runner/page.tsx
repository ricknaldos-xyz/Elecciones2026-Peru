import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import type { Locale } from '@/i18n/config'
import { RunnerContent } from './RunnerContent'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'games' })
  return {
    title: t('runner.metaTitle'),
    description: t('runner.metaDescription'),
  }
}

export default async function RunnerPage({ params }: Props) {
  const { lang } = await params
  setRequestLocale(lang as Locale)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/juegos" />
      <main id="main-content" className="max-w-md mx-auto px-4 py-4 sm:py-8">
        <RunnerContent />
      </main>
    </div>
  )
}
