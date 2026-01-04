import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Header } from '@/components/layout/Header'
import { ElectionCountdown } from '@/components/viral/ElectionCountdown'
import { DailyFact } from '@/components/viral/DailyFact'
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

      {/* Hero Bento Grid - NEO BRUTAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[140px] md:auto-rows-[180px]">

          {/* Main Hero Card - NEO BRUTAL */}
          <div className="md:col-span-2 md:row-span-2 bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-xl)] overflow-hidden relative">
            <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between text-white">
              <div>
                <Badge variant="warning" size="md" className="mb-4">
                  Elecciones 12 de Abril 2026
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3 uppercase tracking-tight">
                  Elige con datos,<br />
                  no con slogans.
                </h1>
                <p className="text-white/80 text-sm sm:text-base max-w-md font-medium">
                  Ranking transparente de candidatos basado en mérito,
                  integridad y evidencia verificable.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
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

          {/* Stats Card - Candidatos - NEO BRUTAL */}
          <Card className="flex flex-col justify-center items-center text-center p-6">
            <span className="text-5xl sm:text-6xl font-black text-[var(--foreground)] score-display">
              {stats.totalCandidates}
            </span>
            <span className="text-sm font-bold text-[var(--muted-foreground)] mt-2 uppercase tracking-wide">
              Candidatos evaluados
            </span>
          </Card>

          {/* Stats Card - Partidos - NEO BRUTAL */}
          <Card className="flex flex-col justify-center items-center text-center p-6">
            <span className="text-5xl sm:text-6xl font-black text-[var(--foreground)] score-display">
              {stats.totalParties}
            </span>
            <span className="text-sm font-bold text-[var(--muted-foreground)] mt-2 uppercase tracking-wide">
              Partidos políticos
            </span>
          </Card>

          {/* Cargos Card - NEO BRUTAL */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-sm font-bold text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">
              Cargos a elegir
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/ranking?cargo=presidente" className="flex items-center gap-2 p-3 bg-[var(--muted)] border-2 border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100">
                <div className="w-8 h-8 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center">
                  <span className="text-white font-black text-xs">P</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--foreground)] uppercase">Presidente</div>
                </div>
              </Link>
              <Link href="/ranking?cargo=senador" className="flex items-center gap-2 p-3 bg-[var(--muted)] border-2 border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100">
                <div className="w-8 h-8 bg-[var(--score-good)] border-2 border-[var(--border)] flex items-center justify-center">
                  <span className="text-white font-black text-xs">S</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--foreground)] uppercase">Senadores</div>
                </div>
              </Link>
              <Link href="/ranking?cargo=diputado" className="flex items-center gap-2 p-3 bg-[var(--muted)] border-2 border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100">
                <div className="w-8 h-8 bg-[var(--score-excellent)] border-2 border-[var(--border)] flex items-center justify-center">
                  <span className="text-white font-black text-xs">D</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--foreground)] uppercase">Diputados</div>
                </div>
              </Link>
              <Link href="/ranking?cargo=parlamento_andino" className="flex items-center gap-2 p-3 bg-[var(--muted)] border-2 border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100">
                <div className="w-8 h-8 bg-[var(--score-medium)] border-2 border-[var(--border)] flex items-center justify-center">
                  <span className="text-black font-black text-xs">A</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--foreground)] uppercase">Parlamento Andino</div>
                </div>
              </Link>
            </div>
          </Card>

        </div>
      </section>

      {/* Election Countdown + Daily Fact + Quiz CTA - NEO BRUTAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Countdown */}
          <Card className="lg:col-span-2 p-6 sm:p-8 flex flex-col items-center justify-center">
            <h2 className="text-lg font-black text-[var(--muted-foreground)] mb-4 uppercase tracking-wide text-center">
              Faltan
            </h2>
            <ElectionCountdown />
          </Card>

          {/* Quiz CTA */}
          <div className="bg-gradient-to-br from-[var(--primary)] to-[#8B0000] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-lg)] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <Badge variant="warning" size="sm" className="mb-3">
                Nuevo
              </Badge>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase leading-tight mb-2">
                Quien piensa como tu?
              </h3>
              <p className="text-white/80 text-sm font-medium mb-4">
                Responde 10 preguntas y descubre que candidatos tienen posiciones similares a las tuyas.
              </p>
            </div>
            <Link href="/quiz">
              <Button className="w-full bg-white text-[var(--primary)] hover:bg-[var(--muted)] border-[var(--border)]">
                Hacer el Quiz
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>

        {/* Daily Fact */}
        <div className="mt-4">
          <DailyFact />
        </div>
      </section>

      {/* Scoring Methodology - NEO BRUTAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight">
            Sistema de Scoring
          </h2>
          <Link href="/metodologia">
            <Button variant="ghost" size="sm">
              Ver metodología
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[var(--score-good)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-black text-white">C</span>
              </div>
              <div>
                <h3 className="font-black text-[var(--foreground)] mb-1 uppercase">
                  Competencia
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed font-medium">
                  Educación, experiencia profesional, experiencia relevante al cargo y liderazgo.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[var(--score-excellent)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-black text-white">I</span>
              </div>
              <div>
                <h3 className="font-black text-[var(--foreground)] mb-1 uppercase">
                  Integridad
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed font-medium">
                  Historial legal limpio. Penalizaciones por sentencias firmes declaradas.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[var(--score-medium)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-black text-black">T</span>
              </div>
              <div>
                <h3 className="font-black text-[var(--foreground)] mb-1 uppercase">
                  Transparencia
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed font-medium">
                  Completitud y consistencia de información declarada en la Hoja de Vida.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Districts Quick Access - NEO BRUTAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-[var(--foreground)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-xl)] p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-[var(--background)] mb-1 uppercase tracking-tight">
                Diputados por Distrito
              </h2>
              <p className="text-sm font-medium text-[var(--background)]/70">
                Selecciona tu distrito para ver candidatos a diputado
              </p>
            </div>
            <Link href="/ranking?cargo=diputado">
              <Button variant="outline" size="sm" className="bg-transparent border-[var(--background)] text-[var(--background)] hover:bg-[var(--background)]/10">
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
                  className="cursor-pointer bg-[var(--background)]/10 hover:bg-[var(--background)]/20 text-[var(--background)] border-[var(--background)]/30 transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  {district.name}
                </Badge>
              </Link>
            ))}
            {DISTRICTS.length > 15 && (
              <Link href="/ranking?cargo=diputado">
                <Badge variant="primary" size="md" className="cursor-pointer">
                  +{DISTRICTS.length - 15} más
                </Badge>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trust Badges - NEO BRUTAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="w-12 h-12 bg-[var(--score-excellent)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-sm font-black text-[var(--foreground)] uppercase">Fuentes oficiales</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)]">DJHV, JNE, ONPE</div>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-12 h-12 bg-[var(--score-good)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-sm font-black text-[var(--foreground)] uppercase">Metodología pública</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)]">100% verificable</div>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-12 h-12 bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="text-sm font-black text-[var(--foreground)] uppercase">Sin afiliación</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)]">100% independiente</div>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-12 h-12 bg-[var(--score-medium)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="text-sm font-black text-[var(--foreground)] uppercase">Derecho a réplica</div>
            <div className="text-xs font-bold text-[var(--muted-foreground)]">Corrección garantizada</div>
          </Card>
        </div>
      </section>

      {/* Footer - NEO BRUTAL */}
      <footer className="border-t-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center">
                <span className="text-white font-black text-sm">PE</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-[var(--foreground)] uppercase">Ranking Electoral</span>
                <span className="text-xs text-[var(--primary)] font-bold uppercase tracking-widest">Perú 2026</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/metodologia" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide">
                Metodología
              </Link>
              <Link href="/ranking" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide">
                Rankings
              </Link>
              <Link href="/comparar" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide">
                Comparar
              </Link>
            </div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">
              Datos actualizados: Enero 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
