import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CARGOS, DISTRICTS } from '@/lib/constants'

const cargoOptions = [
  {
    key: CARGOS.PRESIDENTE,
    label: 'Presidente',
    description: 'Jefe de Estado y Gobierno',
    icon: '🏛️',
  },
  {
    key: CARGOS.SENADOR,
    label: 'Senadores',
    description: '60 representantes nacionales',
    icon: '📜',
  },
  {
    key: CARGOS.DIPUTADO,
    label: 'Diputados',
    description: '130 representantes por distrito',
    icon: '🗳️',
  },
  {
    key: CARGOS.PARLAMENTO_ANDINO,
    label: 'Parlamento Andino',
    description: 'Integración regional',
    icon: '🌎',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗳️</span>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                Ranking Electoral 2026
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/metodologia"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Metodología
              </Link>
              <Badge variant="info">Beta</Badge>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-800 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="warning" className="mb-4">
            Elecciones 12 de Abril 2026
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Elige con datos, no con slogans
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Ranking transparente de candidatos basado en mérito, integridad y evidencia.
            Cada puntaje tiene su fuente. Sin afiliaciones políticas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ranking?cargo=presidente">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Ver Ranking Presidencial
              </Button>
            </Link>
            <Link href="/comparar">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Comparar Candidatos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">36</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Candidatos Presidenciales</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">60</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Senadores a elegir</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">130</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Diputados a elegir</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">27</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Distritos electorales</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cargo Selection */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            ¿Qué vas a elegir?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cargoOptions.map((cargo) => (
              <Link key={cargo.key} href={`/ranking?cargo=${cargo.key}`}>
                <Card hover className="h-full">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{cargo.icon}</div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {cargo.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cargo.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* District Quick Select */}
      <section className="py-12 sm:py-16 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Busca por tu distrito
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            Para Diputados, el voto es por distrito electoral
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DISTRICTS.slice(0, 12).map((district) => (
              <Link
                key={district.slug}
                href={`/ranking?cargo=diputado&distrito=${district.slug}`}
              >
                <Badge variant="default" className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                  {district.name}
                </Badge>
              </Link>
            ))}
            <Link href="/ranking?cargo=diputado">
              <Badge variant="info" className="cursor-pointer">
                Ver todos →
              </Badge>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            ¿Cómo funciona el scoring?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <span className="text-xl font-bold">C</span>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Competencia
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Educación, experiencia laboral, experiencia relevante al cargo, y liderazgo.
                  Basado en la Hoja de Vida del JNE.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                  <span className="text-xl font-bold">I</span>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Integridad
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Historial limpio vs. sentencias firmes declaradas.
                  Solo hechos verificables con fuente oficial.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                  <span className="text-xl font-bold">T</span>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Transparencia
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Completitud y consistencia de la información declarada.
                  Sin penalizar riqueza o pobreza.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Link href="/metodologia">
              <Button variant="outline">
                Ver metodología completa
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-12 sm:py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Transparencia total
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Cada puntaje tiene su fuente. Cada regla es pública.
            No aceptamos pagos de campañas. Ofrecemos mecanismo de corrección.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="success">Fuentes oficiales (DJHV, JNE)</Badge>
            <Badge variant="success">Metodología pública</Badge>
            <Badge variant="success">Sin afiliación política</Badge>
            <Badge variant="success">Derecho de rectificación</Badge>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🗳️</span>
              <span className="font-bold text-gray-900 dark:text-white">
                Ranking Electoral 2026
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/metodologia" className="hover:text-gray-900 dark:hover:text-white">
                Metodología
              </Link>
              <Link href="/ranking?cargo=presidente" className="hover:text-gray-900 dark:hover:text-white">
                Rankings
              </Link>
              <Link href="/comparar" className="hover:text-gray-900 dark:hover:text-white">
                Comparar
              </Link>
            </div>
            <div className="text-sm text-gray-400">
              Datos de fuentes oficiales. Actualizado: Enero 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
