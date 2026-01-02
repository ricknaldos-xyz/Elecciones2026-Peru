import Link from 'next/link'
import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Metodología - Ranking Electoral 2026',
  description: 'Conoce cómo calculamos los puntajes de los candidatos. Metodología transparente y verificable.',
}

export default function MetodologiaPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Ranking Electoral
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Perú 2026
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/ranking" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Ranking
              </Link>
              <Link href="/comparar" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Comparar
              </Link>
              <Link href="/metodologia" className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Metodología
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Metodología de Scoring
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Nuestro sistema evalúa candidatos basándose en datos objetivos y verificables.
            Conoce exactamente cómo calculamos cada puntaje.
          </p>
        </div>

        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resumen del Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              El score final se calcula combinando tres dimensiones principales:
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Competencia</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Educación, experiencia profesional y capacidad de liderazgo demostrada.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-semibold text-green-900 dark:text-green-100">Integridad</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Ausencia de sentencias penales, civiles y comportamiento ético verificable.
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="font-semibold text-purple-900 dark:text-purple-100">Transparencia</span>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Calidad y completitud de la información declarada en el DJHV.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formula */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fórmula General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-center text-sm mb-4">
              Score = (wC × Competencia) + (wI × Integridad) + (wT × Transparencia)
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Donde los pesos (w) varían según el modo seleccionado:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 font-medium text-gray-900 dark:text-white">Modo</th>
                    <th className="text-center py-2 font-medium text-gray-900 dark:text-white">wC (Competencia)</th>
                    <th className="text-center py-2 font-medium text-gray-900 dark:text-white">wI (Integridad)</th>
                    <th className="text-center py-2 font-medium text-gray-900 dark:text-white">wT (Transparencia)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      <Badge variant="default">Equilibrado</Badge>
                    </td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">45%</td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">45%</td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">10%</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      <Badge variant="secondary">Mérito</Badge>
                    </td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">60%</td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">30%</td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">10%</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      <Badge variant="outline">Integridad</Badge>
                    </td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">30%</td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">60%</td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">10%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      <Badge>Personalizado</Badge>
                    </td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">20-75%</td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">20-75%</td>
                    <td className="text-center py-2 text-gray-600 dark:text-gray-400">5-20%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Competence */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Competencia (0-100)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Mide la preparación profesional del candidato para ejercer el cargo.
            </p>

            <div className="space-y-6">
              {/* Education */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Educación (máx. 30 pts)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Nivel</th>
                        <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Puntos</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-400">
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">Doctorado</td>
                        <td className="text-center">22</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">Maestría</td>
                        <td className="text-center">18</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">Título profesional</td>
                        <td className="text-center">16</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">Universitario completo</td>
                        <td className="text-center">14</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">Técnico completo</td>
                        <td className="text-center">10</td>
                      </tr>
                      <tr>
                        <td className="py-1.5">Secundaria completa</td>
                        <td className="text-center">6</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  + Hasta 8 puntos adicionales por profundidad (especializaciones, certificaciones)
                </p>
              </div>

              {/* Experience */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Experiencia Total (máx. 25 pts)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Años</th>
                        <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Puntos</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-400">
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">15+ años</td>
                        <td className="text-center">25</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">11-14 años</td>
                        <td className="text-center">20</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">8-10 años</td>
                        <td className="text-center">16</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">5-7 años</td>
                        <td className="text-center">12</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">2-4 años</td>
                        <td className="text-center">6</td>
                      </tr>
                      <tr>
                        <td className="py-1.5">0-1 años</td>
                        <td className="text-center">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relevant Experience */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Experiencia Relevante (máx. 25 pts)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Se pondera según el tipo de cargo y la relevancia de los roles previos.
                  Por ejemplo, para Presidente/Vicepresidente:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Tipo de Rol</th>
                        <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">pts/año</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-400">
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">Electivo alto / Ejecutivo público alto</td>
                        <td className="text-center">3.0</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">Ejecutivo privado alto</td>
                        <td className="text-center">2.8</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">Ejecutivo público medio</td>
                        <td className="text-center">2.0</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5">Internacional/diplomacia</td>
                        <td className="text-center">1.8</td>
                      </tr>
                      <tr>
                        <td className="py-1.5">Técnico/profesional</td>
                        <td className="text-center">1.2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leadership */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Liderazgo (máx. 20 pts)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Combina el nivel máximo de seniority alcanzado (0-14 pts) y la estabilidad
                  en posiciones de liderazgo (0-6 pts).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Integridad (0-100)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comienza en 100 y se restan penalidades por antecedentes verificados.
            </p>

            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Penalidades
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Tipo</th>
                    <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Penalidad</th>
                    <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Severidad</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-400">
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1.5">Sentencia penal firme (1)</td>
                    <td className="text-center text-red-600 dark:text-red-400">-70</td>
                    <td className="text-center"><Badge variant="destructive" size="sm">RED</Badge></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1.5">Sentencias penales (2+)</td>
                    <td className="text-center text-red-600 dark:text-red-400">-85 (cap)</td>
                    <td className="text-center"><Badge variant="destructive" size="sm">RED</Badge></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1.5">Violencia familiar</td>
                    <td className="text-center text-amber-600 dark:text-amber-400">-50</td>
                    <td className="text-center"><Badge variant="warning" size="sm">AMBER</Badge></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1.5">Omisión alimentaria</td>
                    <td className="text-center text-amber-600 dark:text-amber-400">-35</td>
                    <td className="text-center"><Badge variant="warning" size="sm">AMBER</Badge></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1.5">Sentencia laboral</td>
                    <td className="text-center text-amber-600 dark:text-amber-400">-25</td>
                    <td className="text-center"><Badge variant="warning" size="sm">AMBER</Badge></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1.5">Sentencia contractual</td>
                    <td className="text-center">-15</td>
                    <td className="text-center"><Badge size="sm">GRAY</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Renuncias a partidos (1 / 2-3 / 4+)</td>
                    <td className="text-center">-5 / -10 / -15</td>
                    <td className="text-center"><Badge size="sm">GRAY</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Transparency */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              Transparencia (0-100)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Evalúa la calidad de la información declarada por el candidato.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Completitud (máx. 35 pts)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ¿Llenó todos los campos del DJHV? ¿Hay vacíos inexplicables?
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Consistencia (máx. 35 pts)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ¿Los datos son coherentes entre sí? ¿Coinciden las fechas?
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Calidad Patrimonial (máx. 30 pts)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ¿La declaración de bienes es detallada y verificable?
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confidence */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Confianza de Datos (0-100)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Indica qué tan completa y verificable es la información que tenemos del candidato.
              No afecta el score, pero sí su interpretación.
            </p>

            <div className="flex gap-4">
              <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <div className="font-bold text-green-700 dark:text-green-300">70-100</div>
                <div className="text-xs text-green-600 dark:text-green-400">Alta confianza</div>
              </div>
              <div className="flex-1 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                <div className="font-bold text-yellow-700 dark:text-yellow-300">40-69</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">Media</div>
              </div>
              <div className="flex-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <div className="font-bold text-red-700 dark:text-red-300">0-39</div>
                <div className="text-xs text-red-600 dark:text-red-400">Baja</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fuentes de Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Toda la información proviene de fuentes oficiales y públicas:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>DJHV del JNE</strong> - Declaración Jurada de Hoja de Vida</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Infogob</strong> - Portal de información electoral del JNE</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Poder Judicial</strong> - Consulta de sentencias firmes</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>SUNEDU</strong> - Verificación de grados académicos</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="mb-8 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Disclaimer Importante
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Este ranking es una herramienta informativa basada en datos públicos. No representa
              una recomendación de voto ni una evaluación completa de las capacidades de un candidato.
              Los usuarios deben complementar esta información con su propio análisis de propuestas
              y valores. Si encuentras un error en los datos, por favor repórtalo usando el enlace
              en el perfil del candidato.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Link href="/ranking">
            <Button variant="primary" size="lg">
              Ver el Ranking
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
