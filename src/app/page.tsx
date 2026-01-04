import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Header } from '@/components/layout/Header'
import { ElectionCountdown } from '@/components/viral/ElectionCountdown'
import { DailyFact } from '@/components/viral/DailyFact'
import { TrendingNews } from '@/components/news/TrendingNews'
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

export default async function Home() {
  const stats = await getStats()
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/" />

      {/* Hero Bento Grid - NEO BRUTAL - Mobile Optimized */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[minmax(160px,auto)] md:auto-rows-[180px]">

          {/* Main Hero Card - NEO BRUTAL - Mobile First */}
          <div className="md:col-span-2 md:row-span-2 bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-xl)] overflow-hidden relative">
            <div className="relative h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-between text-white">
              <div>
                <Badge variant="warning" size="md" className="mb-3 sm:mb-4">
                  Elecciones 12 de Abril 2026
                </Badge>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight mb-2 sm:mb-3 uppercase tracking-tight">
                  Elige con datos,<br />
                  no con promesas vacías.
                </h1>
                <p className="text-white/80 text-sm sm:text-base max-w-md font-medium leading-relaxed">
                  Ranking transparente de candidatos.
                  Basado en hechos, no en promesas.
                </p>
              </div>
              <div className="flex flex-col xs:flex-row flex-wrap gap-2 sm:gap-3 mt-4">
                <Link href="/ranking" className="flex-1 xs:flex-initial">
                  <Button size="lg" className="w-full xs:w-auto bg-white text-[var(--primary)] hover:bg-[var(--muted)] border-[var(--border)]">
                    Ver Ranking
                  </Button>
                </Link>
                <Link href="/comparar" className="flex-1 xs:flex-initial">
                  <Button size="lg" variant="outline" className="w-full xs:w-auto bg-transparent border-white text-white hover:bg-white/10">
                    Comparar Candidatos
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Card - Candidatos - NEO BRUTAL - Mobile Optimized */}
          <Card className="flex flex-col justify-center items-center text-center p-4 sm:p-6">
            <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--foreground)] score-display">
              {stats.totalCandidates}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[var(--muted-foreground)] mt-2 uppercase tracking-wide">
              Candidatos evaluados
            </span>
          </Card>

          {/* Stats Card - Partidos - NEO BRUTAL - Mobile Optimized */}
          <Card className="flex flex-col justify-center items-center text-center p-4 sm:p-6">
            <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--foreground)] score-display">
              {stats.totalParties}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[var(--muted-foreground)] mt-2 uppercase tracking-wide">
              Partidos políticos
            </span>
          </Card>

          {/* Cargos Card - NEO BRUTAL - Mobile Adaptive Grid */}
          <Card className="lg:col-span-2 p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-bold text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">
              Cargos a elegir
            </h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
              <Link href="/ranking?cargo=presidente" className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 min-h-[48px] bg-[var(--muted)] border-2 border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-xs sm:text-sm">P</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-bold text-[var(--foreground)] uppercase">Presidente</div>
                </div>
              </Link>
              <Link href="/ranking?cargo=senador" className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 min-h-[48px] bg-[var(--muted)] border-2 border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--score-good)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-xs sm:text-sm">S</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-bold text-[var(--foreground)] uppercase">Senadores</div>
                </div>
              </Link>
              <Link href="/ranking?cargo=diputado" className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 min-h-[48px] bg-[var(--muted)] border-2 border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--score-excellent)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-xs sm:text-sm">D</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-bold text-[var(--foreground)] uppercase">Diputados</div>
                </div>
              </Link>
              <Link href="/ranking?cargo=parlamento_andino" className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 min-h-[48px] bg-[var(--muted)] border-2 border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--score-medium)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-black text-xs sm:text-sm">A</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-bold text-[var(--foreground)] uppercase truncate">Parlamento Andino</div>
                </div>
              </Link>
            </div>
          </Card>

        </div>
      </section>

      {/* Election Countdown + Daily Fact + Quiz CTA - NEO BRUTAL - Mobile Optimized */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Countdown */}
          <Card className="lg:col-span-2 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[200px]">
            <h2 className="text-base sm:text-lg font-black text-[var(--muted-foreground)] mb-3 sm:mb-4 uppercase tracking-wide text-center">
              Quedan
            </h2>
            <ElectionCountdown />
          </Card>

          {/* Quiz CTA - Mobile Optimized */}
          <div className="bg-gradient-to-br from-[var(--primary)] to-[#8B0000] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-lg)] p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-[200px]">
            <div>
              <Badge variant="warning" size="sm" className="mb-2 sm:mb-3">
                Nuevo
              </Badge>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white uppercase leading-tight mb-2">
                ¿Quién piensa como tú?
              </h3>
              <p className="text-white/80 text-sm font-medium mb-3 sm:mb-4 leading-relaxed">
                Responde 10 preguntas y descubre qué candidatos comparten tu visión.
              </p>
            </div>
            <Link href="/quiz">
              <Button className="w-full bg-white text-[var(--primary)] hover:bg-[var(--muted)] border-[var(--border)]">
                Responder el Quiz
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>

        {/* Daily Fact Banner + Full-width News */}
        <div className="mt-4 space-y-4">
          <DailyFact variant="banner" />
          <TrendingNews limit={6} variant="grid" />
        </div>
      </section>

      {/* Scoring Methodology - NEO BRUTAL - Mobile Optimized */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--foreground)] uppercase tracking-tight">
            Cómo evaluamos
          </h2>
          <Link href="/metodologia">
            <Button variant="ghost" size="sm" className="w-full sm:w-auto">
              Ver metodología
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--score-good)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl font-black text-white">C</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-[var(--foreground)] mb-1 uppercase">
                  Competencia
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed font-medium">
                  Educación, experiencia profesional, experiencia en el cargo y capacidad de liderazgo.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--score-excellent)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl font-black text-white">I</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-[var(--foreground)] mb-1 uppercase">
                  Integridad
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed font-medium">
                  Historial limpio. Sin sentencias ni investigaciones activas.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--score-medium)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl font-black text-black">T</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-[var(--foreground)] mb-1 uppercase">
                  Transparencia
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed font-medium">
                  Información completa y consistente en su Hoja de Vida.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Districts Quick Access - NEO BRUTAL - Mobile Optimized */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="bg-[var(--foreground)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-xl)] p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[var(--background)] mb-1 uppercase tracking-tight">
                Diputados por Distrito
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[var(--background)]/70">
                Encuentra a quiénes compiten por representar tu zona
              </p>
            </div>
            <Link href="/ranking?cargo=diputado" className="w-full md:w-auto">
              <Button variant="outline" size="sm" className="w-full md:w-auto bg-transparent border-[var(--background)] text-[var(--background)] hover:bg-[var(--background)]/10">
                Ver todos los distritos
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {DISTRICTS.slice(0, 15).map((district) => (
              <Link
                key={district.slug}
                href={`/distrito/${district.slug}`}
              >
                <Badge
                  variant="secondary"
                  size="md"
                  className="cursor-pointer bg-[var(--background)]/10 hover:bg-[var(--background)]/20 text-[var(--background)] border-[var(--background)]/30 transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 text-xs sm:text-sm min-h-[32px]"
                >
                  {district.name}
                </Badge>
              </Link>
            ))}
            {DISTRICTS.length > 15 && (
              <Link href="/ranking?cargo=diputado">
                <Badge variant="primary" size="md" className="cursor-pointer min-h-[32px]">
                  +{DISTRICTS.length - 15} más
                </Badge>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trust Badges - NEO BRUTAL - Mobile Optimized */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--score-excellent)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-xs sm:text-sm font-black text-[var(--foreground)] uppercase leading-tight">Fuentes oficiales</div>
            <div className="text-[10px] sm:text-xs font-bold text-[var(--muted-foreground)] mt-1">DJHV, JNE, ONPE</div>
          </Card>

          <Card className="p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--score-good)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-xs sm:text-sm font-black text-[var(--foreground)] uppercase leading-tight">Metodología pública</div>
            <div className="text-[10px] sm:text-xs font-bold text-[var(--muted-foreground)] mt-1">100% verificable</div>
          </Card>

          <Card className="p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="text-xs sm:text-sm font-black text-[var(--foreground)] uppercase leading-tight">Sin afiliación</div>
            <div className="text-[10px] sm:text-xs font-bold text-[var(--muted-foreground)] mt-1">100% independiente</div>
          </Card>

          <Card className="p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--score-medium)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="text-xs sm:text-sm font-black text-[var(--foreground)] uppercase leading-tight">Derecho a réplica</div>
            <div className="text-[10px] sm:text-xs font-bold text-[var(--muted-foreground)] mt-1">Puedes corregir tu información</div>
          </Card>
        </div>
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
