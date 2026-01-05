import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { TransparencyContent } from './TransparencyContent'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('transparency')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default function TransparenciaPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/transparencia" />
      <TransparencyContent />
    </div>
  )
}
