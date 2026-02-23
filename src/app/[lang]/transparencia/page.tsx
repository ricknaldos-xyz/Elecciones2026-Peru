import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { TransparencyContent } from './TransparencyContent'

interface PageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params
  setRequestLocale(lang)
  const t = await getTranslations({ locale: lang, namespace: 'transparency' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function TransparenciaPage({ params }: PageProps) {
  const { lang } = await params
  setRequestLocale(lang)
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/transparencia" />
      <main id="main-content">
        <TransparencyContent />
      </main>
    </div>
  )
}
