import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { getCandidates, getDistricts } from '@/lib/db/queries'
import { locales } from '@/i18n/config'
import { Header } from '@/components/layout/Header'
import { CandidateCard } from '@/components/candidate/CandidateCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const revalidate = 86400

interface PageProps {
  params: Promise<{ slug: string; lang: string }>
}

async function getDistrict(slug: string) {
  const districts = await getDistricts()
  return districts.find((d) => d.slug === slug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lang } = await params
  setRequestLocale(lang)
  const district = await getDistrict(slug)

  if (!district) {
    const t = await getTranslations('district')
    return { title: t('notFound') }
  }

  const candidates = await getCandidates({ districtSlug: slug })
  const ogParams = new URLSearchParams({
    type: 'district',
    name: district.name,
    candidates: candidates.length.toString(),
    dtype: district.type || '',
  })

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://eleccionesperu2026.xyz'
  const t = await getTranslations('district')
  return {
    title: t('metaTitle', { name: district.name }),
    description: t('metaDesc', { name: district.name }),
    openGraph: {
      images: [`/api/og?${ogParams.toString()}`],
    },
    alternates: {
      canonical: `${BASE_URL}/distrito/${slug}`,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, l === 'es' ? `${BASE_URL}/distrito/${slug}` : `${BASE_URL}/${l}/distrito/${slug}`])
        ),
        'x-default': `${BASE_URL}/distrito/${slug}`,
      },
    },
  }
}

export default async function DistritoPage({ params }: PageProps) {
  const { slug, lang } = await params
  setRequestLocale(lang)
  const district = await getDistrict(slug)

  if (!district) {
    notFound()
  }

  const [candidates, t] = await Promise.all([
    getCandidates({ districtSlug: slug }),
    getTranslations('district'),
  ])
  const senators = candidates.filter((c) => c.cargo === 'senador')
  const deputies = candidates.filter((c) => c.cargo === 'diputado')

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge variant="outline" className="mb-2">{district.type}</Badge>
          <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">
            {district.name}
          </h1>
          <p className="text-[var(--muted-foreground)] font-medium mt-2">
            {t('senatorsCount', { count: senators.length })} - {t('deputiesCount', { count: deputies.length })}
          </p>
        </div>

        {senators.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
              {t('candidatesForSenator')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {senators.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 1}
                  mode="balanced"
                />
              ))}
            </div>
          </section>
        )}

        {deputies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
              {t('candidatesForDeputy')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {deputies.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 1}
                  mode="balanced"
                />
              ))}
            </div>
          </section>
        )}

        {candidates.length === 0 && (
          <div className="text-center py-12 bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)]">
            <p className="text-[var(--muted-foreground)] font-medium">
              {t('noCandidates')}
            </p>
            <Link href="/ranking">
              <Button variant="primary" className="mt-4">
                {t('viewAllCandidates')}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
