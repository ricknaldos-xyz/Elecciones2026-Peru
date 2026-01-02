import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Header } from '@/components/layout/Header'
import { CARGOS, DISTRICTS } from '@/lib/constants'
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header currentPath="/" />

      {/* Hero Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[140px] md:auto-rows-[180px]">

          {/* Main Hero Card - spans 2 cols, 2 rows */}
          <Card className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-red-600 to-red-700 border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
            <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between text-white">
              <div>
                <Badge variant="warning" size="md" className="mb-4">
                  Elecciones 12 de Abril 2026
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-3">
                  Elige con datos,<br />
                  no con slogans.
                </h1>
                <p className="text-red-100 text-sm sm:text-base max-w-md">
                  Ranking transparente de candidatos basado en mérito,
                  integridad y evidencia verificable.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link href="/ranking">
                  <Button size="lg" className="bg-white text-red-600 hover:bg-red-50 border-0">
                    Ver Ranking
                  </Button>
                </Link>
                <Link href="/comparar">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Comparar
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Stats Card - Candidatos */}
          <Card className="flex flex-col justify-center items-center text-center p-6 bg-white dark:bg-zinc-900">
            <span className="text-5xl sm:text-6xl font-black text-zinc-900 dark:text-white score-display">
              {stats.totalCandidates}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Candidatos evaluados
            </span>
          </Card>

          {/* Stats Card - Partidos */}
          <Card className="flex flex-col justify-center items-center text-center p-6 bg-white dark:bg-zinc-900">
            <span className="text-5xl sm:text-6xl font-black text-zinc-900 dark:text-white score-display">
              {stats.totalParties}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Partidos políticos
            </span>
          </Card>

          {/* Cargos Card */}
          <Card className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
              Cargos a elegir
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/ranking?cargo=presidente" className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 font-bold text-xs">P</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">Presidente</div>
                </div>
              </Link>
              <Link href="/ranking?cargo=senador" className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">S</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">Senadores</div>
                </div>
              </Link>
              <Link href="/ranking?cargo=diputado" className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">D</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">Diputados</div>
                </div>
              </Link>
              <Link href="/ranking?cargo=parlamento_andino" className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">A</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">Parlamento Andino</div>
                </div>
              </Link>
            </div>
          </Card>

        </div>
      </section>

      {/* Scoring Methodology */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Sistema de Scoring
          </h2>
          <Link href="/metodologia">
            <Button variant="ghost" size="sm">
              Ver metodología
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-white dark:bg-zinc-900">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">C</span>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Competencia
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Educación, experiencia profesional, experiencia relevante al cargo y liderazgo.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-zinc-900">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">I</span>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Integridad
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Historial legal limpio. Penalizaciones por sentencias firmes declaradas.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-zinc-900">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">T</span>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Transparencia
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Completitud y consistencia de información declarada en la Hoja de Vida.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Districts Quick Access */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Card className="p-6 sm:p-8 bg-zinc-900 dark:bg-zinc-900 border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Diputados por Distrito
              </h2>
              <p className="text-sm text-zinc-400">
                Selecciona tu distrito para ver candidatos a diputado
              </p>
            </div>
            <Link href="/ranking?cargo=diputado">
              <Button variant="outline" size="sm" className="border-zinc-700 text-white hover:bg-zinc-800">
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
                  className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-0 transition-colors"
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
        </Card>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center bg-white dark:bg-zinc-900">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-xs font-medium text-zinc-900 dark:text-white">Fuentes oficiales</div>
            <div className="text-[10px] text-zinc-500">DJHV, JNE, ONPE</div>
          </Card>

          <Card className="p-4 text-center bg-white dark:bg-zinc-900">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-xs font-medium text-zinc-900 dark:text-white">Metodología pública</div>
            <div className="text-[10px] text-zinc-500">100% verificable</div>
          </Card>

          <Card className="p-4 text-center bg-white dark:bg-zinc-900">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="text-xs font-medium text-zinc-900 dark:text-white">Sin afiliación</div>
            <div className="text-[10px] text-zinc-500">100% independiente</div>
          </Card>

          <Card className="p-4 text-center bg-white dark:bg-zinc-900">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="text-xs font-medium text-zinc-900 dark:text-white">Derecho a réplica</div>
            <div className="text-[10px] text-zinc-500">Corrección garantizada</div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">PE</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-zinc-900 dark:text-white">Ranking Electoral</span>
                <span className="text-xs text-red-600 dark:text-red-400">Perú 2026</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/metodologia" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                Metodología
              </Link>
              <Link href="/ranking" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                Rankings
              </Link>
              <Link href="/comparar" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                Comparar
              </Link>
            </div>
            <div className="text-xs text-zinc-400">
              Datos actualizados: Enero 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
