import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Header } from '@/components/layout/Header'
import { CountdownBanner } from '@/components/viral/CountdownBanner'
import { DailyFact } from '@/components/viral/DailyFact'
import { TrendingNews } from '@/components/news/TrendingNews'
import { CandidateCardMini } from '@/components/candidate/CandidateCardMini'
import { DISTRICTS } from '@/lib/constants'
import { sql } from '@/lib/db'

async function getStats() {
  try {
    const [candidatesResult, partiesResult] = await Promise.all([
      sql`SELECT COUNT(*) as total FROM candidates`,
      sql`SELECT COUNT(*) as total FROM parties`
    ])

    return {
      totalCandidates: Number(candidatesResult[0].total),
      totalParties: Number(partiesResult[0].total)
    }
  } catch {
    return { totalCandidates: 44, totalParties: 36 }
  }
}

interface TopCandidate {
  id: string
  full_name: string
  slug: string
  photo_url: string | null
  score_balanced: number
  party_name: string | null
  party_short_name: string | null
  party_color: string | null
}

async function getTopPresidentialCandidates(): Promise<TopCandidate[]> {
  try {
    const result = await sql`
      SELECT
        c.id,
        c.full_name,
        c.slug,
        c.photo_url,
        s.score_balanced,
        p.name as party_name,
        p.short_name as party_short_name,
        p.color as party_color
      FROM candidates c
      LEFT JOIN scores s ON c.id = s.candidate_id
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.cargo = 'presidente' AND c.is_active = true
      ORDER BY s.score_balanced DESC NULLS LAST
      LIMIT 3
    `
    return result.map(row => ({
      id: row.id as string,
      full_name: row.full_name as string,
      slug: row.slug as string,
      photo_url: row.photo_url as string | null,
      score_balanced: Number(row.score_balanced) || 0,
      party_name: row.party_name as string | null,
      party_short_name: row.party_short_name as string | null,
      party_color: row.party_color as string | null,
    }))
  } catch (error) {
    console.error('Error fetching top candidates:', error)
    return []
  }
}

export default async function Home() {
  const [stats, topCandidates] = await Promise.all([
    getStats(),
    getTopPresidentialCandidates()
  ])
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/" />

      {/* Countdown Banner - Full Width Urgency */}
      <CountdownBanner />

      {/* Hero Section: CTA + Top 5 Side by Side */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Left: Hero CTA */}
          <div className="bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-xl)] overflow-hidden">
            <div className="h-full p-5 sm:p-6 lg:p-8 flex flex-col justify-between text-white min-h-[300px] sm:min-h-[380px]">
              <div>
                <Badge variant="warning" size="md" className="mb-3">
                  12 de Abril 2026
                </Badge>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-3 uppercase tracking-tight">
                  Elige con datos,<br />
                  no con promesas.
                </h1>
                <p className="text-white/80 text-sm sm:text-base max-w-md font-medium">
                  Ranking transparente de candidatos basado en hechos verificables.
                </p>
              </div>

              {/* Stats inline */}
              <div className="flex items-center gap-4 my-4 py-3 border-t border-b border-white/20">
                <div className="text-center">
                  <span className="text-2xl sm:text-3xl font-black">{stats.totalCandidates}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-white/70 ml-1 uppercase">candidatos</span>
                </div>
                <div className="w-px h-8 bg-white/30" />
                <div className="text-center">
                  <span className="text-2xl sm:text-3xl font-black">{stats.totalParties}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-white/70 ml-1 uppercase">partidos</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Link href="/ranking">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-[var(--muted)] border-[var(--border)]">
                    Ver Ranking
                  </Button>
                </Link>
                <Link href="/comparar">
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    Comparar
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Top 5 Presidenciables */}
          <div className="border-3 border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-brutal-lg)]">
            <div className="p-4 sm:p-5 border-b-3 border-[var(--border)] bg-[var(--muted)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center">
                    <span className="text-white font-black text-xs">P</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-[var(--foreground)] uppercase">
                    Top 3 Presidenciables
                  </h2>
                </div>
                <Link
                  href="/ranking?cargo=presidente"
                  className="text-xs font-bold text-[var(--primary)] hover:underline uppercase flex items-center gap-1"
                >
                  Ver más
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Top 3 Grid */}
            {topCandidates.length > 0 ? (
              <div className="p-3 sm:p-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {topCandidates.map((candidate, index) => (
                    <CandidateCardMini
                      key={candidate.id}
                      rank={index + 1}
                      candidate={candidate}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">Cargando candidatos...</p>
              </div>
            )}

            {/* Otros cargos - Mini links */}
            <div className="px-4 pb-4 pt-2 border-t-2 border-[var(--border)]">
              <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-2">También ver:</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/ranking?cargo=senador" className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold bg-[var(--background)] border-2 border-[var(--border)] hover:bg-[var(--score-good)] hover:text-white transition-colors uppercase">
                  <span className="w-4 h-4 bg-[var(--score-good)] border border-[var(--border)] flex items-center justify-center text-white text-[8px] font-black">S</span>
                  Senadores
                </Link>
                <Link href="/ranking?cargo=diputado" className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold bg-[var(--background)] border-2 border-[var(--border)] hover:bg-[var(--score-excellent)] hover:text-white transition-colors uppercase">
                  <span className="w-4 h-4 bg-[var(--score-excellent)] border border-[var(--border)] flex items-center justify-center text-white text-[8px] font-black">D</span>
                  Diputados
                </Link>
                <Link href="/ranking?cargo=parlamento_andino" className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold bg-[var(--background)] border-2 border-[var(--border)] hover:bg-[var(--score-medium)] hover:text-black transition-colors uppercase">
                  <span className="w-4 h-4 bg-[var(--score-medium)] border border-[var(--border)] flex items-center justify-center text-black text-[8px] font-black">A</span>
                  P. Andino
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Quiz CTA - Full width accent */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        <Link href="/quiz" className="block">
          <div className="bg-gradient-to-r from-[var(--primary)] via-[#8B0000] to-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-xl)] transition-all duration-100">
            <div className="flex items-center gap-3">
              <Badge variant="warning" size="sm">Nuevo</Badge>
              <span className="text-base sm:text-lg font-black text-white uppercase">
                ¿Quién piensa como tú?
              </span>
              <span className="text-white/70 text-sm hidden sm:inline">
                10 preguntas para encontrar tu candidato ideal
              </span>
            </div>
            <Button size="sm" className="bg-white text-[var(--primary)] hover:bg-[var(--muted)] border-[var(--border)] whitespace-nowrap">
              Hacer el Quiz
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>
        </Link>
      </section>

      {/* Daily Fact - Full width */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <DailyFact variant="card" />
      </section>

      {/* Trending News - Full width */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <TrendingNews limit={6} variant="grid" />
      </section>

      {/* Scoring Methodology - Con hover interactivo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight">
            Cómo evaluamos
          </h2>
          <Link href="/metodologia" className="text-sm font-bold text-[var(--primary)] hover:underline uppercase flex items-center gap-1">
            Ver metodología completa
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/metodologia#competencia" className="group">
            <Card className="p-4 h-full hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-lg)] transition-all duration-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--score-competence)] border-3 border-[var(--border)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-lg sm:text-xl font-black text-white">C</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-[var(--foreground)] mb-1 uppercase group-hover:text-[var(--primary)] transition-colors">
                    Competencia
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed font-medium">
                    Educación, experiencia y liderazgo.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/metodologia#integridad" className="group">
            <Card className="p-4 h-full hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-lg)] transition-all duration-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--score-integrity)] border-3 border-[var(--border)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-lg sm:text-xl font-black text-white">I</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-[var(--foreground)] mb-1 uppercase group-hover:text-[var(--primary)] transition-colors">
                    Integridad
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed font-medium">
                    Historial limpio, sin sentencias.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/metodologia#transparencia" className="group">
            <Card className="p-4 h-full hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-lg)] transition-all duration-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--score-transparency)] border-3 border-[var(--border)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-lg sm:text-xl font-black text-black">T</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-[var(--foreground)] mb-1 uppercase group-hover:text-[var(--primary)] transition-colors">
                    Transparencia
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed font-medium">
                    Info completa en Hoja de Vida.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Trust indicators inline - más compacto que sección separada */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-3 border-t-2 border-b-2 border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase">
            <svg className="w-4 h-4 text-[var(--score-excellent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Fuentes oficiales
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase">
            <svg className="w-4 h-4 text-[var(--score-good)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            100% verificable
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase">
            <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Sin afiliación política
          </div>
        </div>
      </section>

      {/* Districts - Más compacto, integrado */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-sm sm:text-base font-black text-[var(--foreground)] uppercase tracking-tight">
              Diputados por Distrito
            </h2>
            <Link href="/ranking?cargo=diputado" className="text-xs font-bold text-[var(--primary)] hover:underline uppercase">
              Ver todos →
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {DISTRICTS.slice(0, 12).map((district) => (
              <Link
                key={district.slug}
                href={`/distrito/${district.slug}`}
              >
                <Badge
                  variant="outline"
                  size="sm"
                  className="cursor-pointer hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all duration-100 text-xs"
                >
                  {district.name}
                </Badge>
              </Link>
            ))}
            {DISTRICTS.length > 12 && (
              <Link href="/ranking?cargo=diputado">
                <Badge variant="primary" size="sm" className="cursor-pointer">
                  +{DISTRICTS.length - 12} más
                </Badge>
              </Link>
            )}
          </div>
        </Card>
      </section>

      {/* Footer - NEO BRUTAL - Mobile Optimized */}
      <footer className="border-t-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center">
                <span className="text-white font-black text-sm">PE</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-black text-[var(--foreground)] uppercase">Ranking Electoral</span>
                <span className="text-xs text-[var(--primary)] font-bold uppercase tracking-widest">Perú 2026</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <Link href="/metodologia" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                Metodología
              </Link>
              <Link href="/ranking" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                Rankings
              </Link>
              <Link href="/comparar" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                Comparar
              </Link>
            </div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide text-center">
              Datos actualizados: Enero 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
