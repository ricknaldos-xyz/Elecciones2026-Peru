import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import type { Locale } from '@/i18n/config'
import { BatallaContent } from './BatallaContent'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'games' })
  return {
    title: t('batalla.metaTitle'),
    description: t('batalla.metaDescription'),
  }
}

export default async function BatallaPage({ params }: Props) {
  const { lang } = await params
  setRequestLocale(lang as Locale)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/juegos" />
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BatallaContent />
      </main>
    </div>
  )
}
