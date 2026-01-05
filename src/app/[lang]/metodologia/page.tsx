import Link from 'next/link'
import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Metodología - Ranking Electoral 2026',
  description: 'Conoce cómo calculamos los puntajes de los candidatos. Metodología transparente y verificable.',
}

export default function MetodologiaPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/metodologia" />

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
            Metodología de Scoring
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] font-medium max-w-2xl mx-auto">
            Nuestro sistema evalúa candidatos basándose en datos objetivos y verificables.
            Conoce exactamente cómo calculamos cada puntaje.
          </p>
        </div>

        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>RESUMEN DEL MODELO</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              El score final se calcula combinando tres dimensiones principales:
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--score-competence)]/10 border-2 border-[var(--score-competence)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-[var(--score-competence)]" />
                  <span className="font-black text-[var(--score-competence-text)] uppercase">Competencia</span>
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Educación, experiencia profesional y capacidad de liderazgo demostrada.
                </p>
              </div>
              <div className="p-4 bg-[var(--score-integrity)]/10 border-2 border-[var(--score-integrity)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-[var(--score-integrity)]" />
                  <span className="font-black text-[var(--score-integrity-text)] uppercase">Integridad</span>
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Ausencia de sentencias penales, civiles y comportamiento ético verificable.
                </p>
              </div>
              <div className="p-4 bg-[var(--score-transparency)]/10 border-2 border-[var(--score-transparency)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-[var(--score-transparency)]" />
                  <span className="font-black text-[var(--score-transparency-text)] uppercase">Transparencia</span>
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Calidad y completitud de la información declarada en el DJHV.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formula */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>FÓRMULA GENERAL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-4 font-mono text-center text-sm mb-4">
              Score = (wC × Competencia) + (wI × Integridad) + (wT × Transparencia)
            </div>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Donde los pesos (w) varían según el modo seleccionado:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-3 border-[var(--border)]">
                    <th className="text-left py-2 font-black text-[var(--foreground)] uppercase">Modo</th>
                    <th className="text-center py-2 font-black text-[var(--foreground)] uppercase">wC</th>
                    <th className="text-center py-2 font-black text-[var(--foreground)] uppercase">wI</th>
                    <th className="text-center py-2 font-black text-[var(--foreground)] uppercase">wT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b-2 border-[var(--border)]">
                    <td className="py-2 text-[var(--foreground)]">
                      <Badge variant="default">EQUILIBRADO</Badge>
                    </td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">45%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">45%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">10%</td>
                  </tr>
                  <tr className="border-b-2 border-[var(--border)]">
                    <td className="py-2 text-[var(--foreground)]">
                      <Badge variant="secondary">MÉRITO</Badge>
                    </td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">60%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">30%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">10%</td>
                  </tr>
                  <tr className="border-b-2 border-[var(--border)]">
                    <td className="py-2 text-[var(--foreground)]">
                      <Badge variant="outline">INTEGRIDAD</Badge>
                    </td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">30%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">60%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">10%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[var(--foreground)]">
                      <Badge>PERSONALIZADO</Badge>
                    </td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">20-75%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">20-75%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">5-20%</td>
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
              <div className="w-3 h-3 bg-[var(--score-competence)]" />
              COMPETENCIA (0-100)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Mide la preparación profesional del candidato para ejercer el cargo.
            </p>

            <div className="space-y-6">
              {/* Education */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-2 uppercase">
                  Educación (máx. 30 pts)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[var(--border)]">
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Nivel</th>
                        <th className="text-center py-2 font-bold text-[var(--foreground)]">Puntos</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--muted-foreground)]">
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Doctorado</td>
                        <td className="text-center font-bold">22</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Maestría</td>
                        <td className="text-center font-bold">18</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Título profesional</td>
                        <td className="text-center font-bold">16</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Universitario completo</td>
                        <td className="text-center font-bold">14</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Técnico completo</td>
                        <td className="text-center font-bold">10</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-medium">Secundaria completa</td>
                        <td className="text-center font-bold">6</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2 font-medium">
                  + Hasta 8 puntos adicionales por profundidad (especializaciones, certificaciones)
                </p>
              </div>

              {/* Experience */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-2 uppercase">
                  Experiencia Total (máx. 25 pts)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[var(--border)]">
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Años</th>
                        <th className="text-center py-2 font-bold text-[var(--foreground)]">Puntos</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--muted-foreground)]">
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">15+ años</td>
                        <td className="text-center font-bold">25</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">11-14 años</td>
                        <td className="text-center font-bold">20</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">8-10 años</td>
                        <td className="text-center font-bold">16</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">5-7 años</td>
                        <td className="text-center font-bold">12</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">2-4 años</td>
                        <td className="text-center font-bold">6</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-medium">0-1 años</td>
                        <td className="text-center font-bold">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relevant Experience */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-2 uppercase">
                  Experiencia Relevante (máx. 25 pts)
                </h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium mb-2">
                  Se pondera según el tipo de cargo y la relevancia de los roles previos.
                  Por ejemplo, para Presidente/Vicepresidente:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[var(--border)]">
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Tipo de Rol</th>
                        <th className="text-center py-2 font-bold text-[var(--foreground)]">pts/año</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--muted-foreground)]">
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Electivo alto / Ejecutivo público alto</td>
                        <td className="text-center font-bold">3.0</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Ejecutivo privado alto</td>
                        <td className="text-center font-bold">2.8</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Ejecutivo público medio</td>
                        <td className="text-center font-bold">2.0</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Internacional/diplomacia</td>
                        <td className="text-center font-bold">1.8</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-medium">Técnico/profesional</td>
                        <td className="text-center font-bold">1.2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leadership */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-2 uppercase">
                  Liderazgo (máx. 20 pts)
                </h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
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
              <div className="w-3 h-3 bg-[var(--score-integrity)]" />
              INTEGRIDAD (0-100)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Comienza en 100 y se restan penalidades por antecedentes verificados.
            </p>

            <h4 className="font-black text-[var(--foreground)] mb-2 uppercase">
              Penalidades
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[var(--border)]">
                    <th className="text-left py-2 font-bold text-[var(--foreground)]">Tipo</th>
                    <th className="text-center py-2 font-bold text-[var(--foreground)]">Penalidad</th>
                    <th className="text-center py-2 font-bold text-[var(--foreground)]">Severidad</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--muted-foreground)]">
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Sentencia penal firme (1)</td>
                    <td className="text-center text-[var(--flag-red-text)] font-bold">-70</td>
                    <td className="text-center"><Badge variant="destructive" size="sm">RED</Badge></td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Sentencias penales (2+)</td>
                    <td className="text-center text-[var(--flag-red-text)] font-bold">-85 (cap)</td>
                    <td className="text-center"><Badge variant="destructive" size="sm">RED</Badge></td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Violencia familiar</td>
                    <td className="text-center text-[var(--flag-amber-text)] font-bold">-50</td>
                    <td className="text-center"><Badge variant="warning" size="sm">AMBER</Badge></td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Omisión alimentaria</td>
                    <td className="text-center text-[var(--flag-amber-text)] font-bold">-35</td>
                    <td className="text-center"><Badge variant="warning" size="sm">AMBER</Badge></td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Sentencia laboral</td>
                    <td className="text-center text-[var(--flag-amber-text)] font-bold">-25</td>
                    <td className="text-center"><Badge variant="warning" size="sm">AMBER</Badge></td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Sentencia contractual</td>
                    <td className="text-center font-bold">-15</td>
                    <td className="text-center"><Badge size="sm">GRAY</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-medium">Renuncias a partidos (1 / 2-3 / 4+)</td>
                    <td className="text-center font-bold">-5 / -10 / -15</td>
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
              <div className="w-3 h-3 bg-[var(--score-transparency)]" />
              TRANSPARENCIA (0-100)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Evalúa la calidad de la información declarada por el candidato.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-1 uppercase">
                  Completitud (máx. 35 pts)
                </h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  ¿Llenó todos los campos del DJHV? ¿Hay vacíos inexplicables?
                </p>
              </div>
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-1 uppercase">
                  Consistencia (máx. 35 pts)
                </h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  ¿Los datos son coherentes entre sí? ¿Coinciden las fechas?
                </p>
              </div>
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-1 uppercase">
                  Calidad Patrimonial (máx. 30 pts)
                </h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  ¿La declaración de bienes es detallada y verificable?
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confidence */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>CONFIANZA DE DATOS (0-100)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Indica qué tan completa y verificable es la información que tenemos del candidato.
              No afecta el score, pero sí su interpretación.
            </p>

            <div className="flex gap-4">
              <div className="flex-1 p-3 bg-[var(--score-excellent-bg)] border-2 border-[var(--score-excellent)] text-center">
                <div className="font-black text-[var(--score-excellent-text)]">70-100</div>
                <div className="text-xs font-bold text-[var(--score-excellent-text)] uppercase">Alta confianza</div>
              </div>
              <div className="flex-1 p-3 bg-[var(--score-medium-bg)] border-2 border-[var(--score-medium)] text-center">
                <div className="font-black text-[var(--score-medium-text)]">40-69</div>
                <div className="text-xs font-bold text-[var(--score-medium-text)] uppercase">Media</div>
              </div>
              <div className="flex-1 p-3 bg-[var(--score-low-bg)] border-2 border-[var(--score-low)] text-center">
                <div className="font-black text-[var(--score-low-text)]">0-39</div>
                <div className="text-xs font-bold text-[var(--score-low-text)] uppercase">Baja</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>FUENTES DE DATOS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Toda la información proviene de fuentes oficiales y públicas:
            </p>
            <ul className="space-y-2 text-[var(--muted-foreground)]">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium"><strong>DJHV del JNE</strong> - Declaración Jurada de Hoja de Vida</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium"><strong>Infogob</strong> - Portal de información electoral del JNE</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium"><strong>Poder Judicial</strong> - Consulta de sentencias firmes</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium"><strong>SUNEDU</strong> - Verificación de grados académicos</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="mb-8 border-[var(--flag-amber)] bg-[var(--flag-amber)]/10">
          <CardContent className="p-6">
            <h3 className="font-black text-[var(--flag-amber-text)] mb-2 uppercase">
              Disclaimer Importante
            </h3>
            <p className="text-sm text-[var(--foreground)] font-medium">
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
              VER EL RANKING
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
