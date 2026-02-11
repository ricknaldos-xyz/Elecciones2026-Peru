import { Link } from '@/i18n/routing'
import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { generateFAQSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Metodología - Ranking Electoral 2026',
  description: 'Conoce cómo calculamos los puntajes de los candidatos. Metodología transparente y verificable.',
}

const FAQ_ITEMS = [
  {
    question: '¿Cómo se calcula el puntaje de cada candidato?',
    answer: 'El puntaje se calcula combinando tres dimensiones: Competencia (educación, experiencia, liderazgo), Historial Legal (antecedentes judiciales, fiscales, patrimoniales) y Transparencia (accesibilidad de información y coherencia). Cada dimensión tiene sub-indicadores con pesos específicos.',
  },
  {
    question: '¿Qué son los modos de ranking (Equilibrado, Mérito, Historial Legal)?',
    answer: 'Son diferentes perspectivas para ver el ranking. Equilibrado pondera las tres dimensiones por igual. Mérito prioriza la competencia profesional. Historial Legal prioriza la ausencia de problemas legales y la transparencia. Puedes cambiar entre modos según lo que más valores.',
  },
  {
    question: '¿De dónde vienen los datos?',
    answer: 'Los datos provienen de fuentes oficiales públicas: JNE (hojas de vida), ONPE (finanzas partidarias), Poder Judicial (sentencias), SUNAT (deudas tributarias), Contraloría (sanciones), MEF (presupuestos), y Congreso (votaciones). También se monitorean medios de comunicación y redes sociales.',
  },
  {
    question: '¿Qué significa la "confianza de datos"?',
    answer: 'Es un indicador de cuánta información verificada tenemos sobre un candidato. Una confianza alta significa que tenemos datos completos de múltiples fuentes. Una confianza baja indica que faltan datos importantes, lo que hace el puntaje menos confiable.',
  },
  {
    question: '¿Los planes de gobierno son evaluados?',
    answer: 'Sí. Para candidatos presidenciales, el plan de gobierno es analizado por IA en cuatro dimensiones: viabilidad fiscal, viabilidad legal, coherencia interna y comparación histórica. Cada propuesta individual también es evaluada en especificidad, viabilidad, impacto y evidencia.',
  },
  {
    question: '¿Es posible manipular el ranking?',
    answer: 'No. El ranking se basa exclusivamente en datos objetivos y verificables de fuentes oficiales. No aceptamos pagos ni influencias para modificar puntajes. La metodología es pública y cualquier persona puede verificar cómo se calculan los scores.',
  },
  {
    question: '¿Con qué frecuencia se actualizan los datos?',
    answer: 'Los datos se actualizan de forma automatizada: las fuentes oficiales (JNE, ONPE, Poder Judicial) se sincronizan diariamente, las noticias cada pocas horas, y las redes sociales varias veces al día. El indicador de frescura en la página principal muestra la última actualización de cada fuente.',
  },
]

export default function MetodologiaPage() {
  const faqSchema = generateFAQSchema(FAQ_ITEMS)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
                  <span className="font-black text-[var(--score-integrity-text)] uppercase">Historial Legal</span>
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
              <div>Score = (wC × Competencia) + (wI × Historial Legal) + (wT × Transparencia)</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-2">
                Los pesos siempre suman 1.0 (wC + wI + wT = 1.0). El sistema valida y normaliza automáticamente.
              </div>
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
                      <Badge variant="outline">HISTORIAL LEGAL</Badge>
                    </td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">30%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">60%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">10%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[var(--foreground)]">
                      <Badge>PERSONALIZADO</Badge>
                    </td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">20-55%</td>
                    <td className="text-center py-2 text-[var(--muted-foreground)] font-bold">20-55%</td>
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
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Universitario incompleto</td>
                        <td className="text-center font-bold">9</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Técnico incompleto</td>
                        <td className="text-center font-bold">7</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Secundaria completa</td>
                        <td className="text-center font-bold">6</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Secundaria incompleta</td>
                        <td className="text-center font-bold">4</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-medium">Primaria completa</td>
                        <td className="text-center font-bold">2</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-medium">Sin información</td>
                        <td className="text-center font-bold">0</td>
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
                <p className="text-xs text-[var(--muted-foreground)] mt-2 font-medium">
                  Los períodos de experiencia solapados se deduplican automáticamente para evitar doble conteo.
                </p>
              </div>

              {/* Relevant Experience */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-2 uppercase">
                  Experiencia Relevante (máx. 25 pts)
                </h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium mb-2">
                  Se pondera según el tipo de cargo al que postula y la relevancia de los roles previos.
                  Ejemplo para Presidente/Vicepresidente:
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
                <p className="text-xs text-[var(--muted-foreground)] mt-2 font-medium">
                  <strong>Nota:</strong> Los pesos varían por cargo. Para Senador/Diputado, la experiencia legislativa
                  y técnica pesa más. Para Parlamento Andino, la experiencia internacional tiene máxima relevancia (3.0 pts/año).
                </p>
              </div>

              {/* Leadership */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-2 uppercase">
                  Liderazgo (máx. 20 pts)
                </h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium mb-3">
                  Combina el nivel máximo de seniority alcanzado (0-14 pts) y la estabilidad
                  en posiciones de liderazgo (0-6 pts).
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)] uppercase mb-1">Seniority</p>
                    <div className="text-xs text-[var(--muted-foreground)] space-y-0.5 font-medium">
                      <p>Dirección: 14 pts</p>
                      <p>Gerencia: 10 pts</p>
                      <p>Jefatura: 8 pts</p>
                      <p>Coordinador: 6 pts</p>
                      <p>Individual: 2 pts</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)] uppercase mb-1">Estabilidad</p>
                    <div className="text-xs text-[var(--muted-foreground)] space-y-0.5 font-medium">
                      <p>7+ años en liderazgo: 6 pts</p>
                      <p>4-6 años: 4 pts</p>
                      <p>2-3 años: 2 pts</p>
                      <p>0-1 años: 0 pts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[var(--score-integrity)]" />
              HISTORIAL LEGAL (0-100)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Comienza en 100 y se restan penalidades por antecedentes verificados.
              Las penalidades civiles tienen caps por tipo para evitar acumulación extrema.
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
                    <th className="text-center py-2 font-bold text-[var(--foreground)]">Cap</th>
                    <th className="text-center py-2 font-bold text-[var(--foreground)]">Severidad</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--muted-foreground)]">
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Sentencia penal firme (1)</td>
                    <td className="text-center text-[var(--flag-red-text)] font-bold">-70</td>
                    <td className="text-center font-bold">-85</td>
                    <td className="text-center"><Badge variant="destructive" size="sm">RED</Badge></td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Sentencias penales (2+)</td>
                    <td className="text-center text-[var(--flag-red-text)] font-bold">-85</td>
                    <td className="text-center font-bold">-85</td>
                    <td className="text-center"><Badge variant="destructive" size="sm">RED</Badge></td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Violencia familiar</td>
                    <td className="text-center text-[var(--flag-amber-text)] font-bold">-50</td>
                    <td className="text-center font-bold">-70</td>
                    <td className="text-center"><Badge variant="warning" size="sm">AMBER</Badge></td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Omisión alimentaria (informativo)</td>
                    <td className="text-center text-[var(--flag-amber-text)] font-bold">-35</td>
                    <td className="text-center font-bold">-50</td>
                    <td className="text-center"><Badge variant="warning" size="sm">AMBER</Badge></td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Sentencia laboral</td>
                    <td className="text-center text-[var(--flag-amber-text)] font-bold">-25</td>
                    <td className="text-center font-bold">-40</td>
                    <td className="text-center"><Badge variant="warning" size="sm">AMBER</Badge></td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-1.5 font-medium">Sentencia contractual</td>
                    <td className="text-center font-bold">-15</td>
                    <td className="text-center font-bold">-25</td>
                    <td className="text-center"><Badge size="sm">GRAY</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-medium">Renuncias a partidos (1 / 2-3 / 4+)</td>
                    <td className="text-center font-bold">-5 / -10 / -15</td>
                    <td className="text-center font-bold">-15</td>
                    <td className="text-center"><Badge size="sm">GRAY</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-3 font-medium">
              <strong>Nota:</strong> El cap total de penalidades civiles es -85 pts.
              Múltiples sentencias del mismo tipo aplican retornos decrecientes (100%, 50%, 25% para 1ra, 2da, 3ra+).
            </p>

            {/* Enhanced Sources */}
            <div className="mt-6">
              <h4 className="font-black text-[var(--foreground)] mb-3 uppercase">
                Penalidades Extendidas
              </h4>
              <p className="text-sm text-[var(--muted-foreground)] font-medium mb-3">
                Para candidatos con historial público, evaluamos fuentes adicionales que ajustan
                el score de historial legal:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[var(--border)]">
                      <th className="text-left py-2 font-bold text-[var(--foreground)]">Fuente</th>
                      <th className="text-left py-2 font-bold text-[var(--foreground)]">Detalle</th>
                      <th className="text-center py-2 font-bold text-[var(--foreground)]">Cap</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--muted-foreground)]">
                    <tr className="border-b border-[var(--border)]">
                      <td className="py-1.5 font-medium">Votaciones congresales</td>
                      <td className="py-1.5 text-xs">Votos a favor de leyes pro-impunidad o anti-democráticas. Bonus por votar en contra.</td>
                      <td className="text-center font-bold text-[var(--flag-red-text)]">-85 / +15</td>
                    </tr>
                    <tr className="border-b border-[var(--border)]">
                      <td className="py-1.5 font-medium">SUNAT</td>
                      <td className="py-1.5 text-xs">Condición NO HABIDO (-50), NO HALLADO (-20), deudas coactivas (-20 c/u, máx 3).</td>
                      <td className="text-center font-bold text-[var(--flag-red-text)]">-85</td>
                    </tr>
                    <tr className="border-b border-[var(--border)]">
                      <td className="py-1.5 font-medium">Verificación judicial</td>
                      <td className="py-1.5 text-xs">Casos no declarados en DJHV: crítico (-60), mayor (-40), menor (-20).</td>
                      <td className="text-center font-bold text-[var(--flag-red-text)]">-85</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-medium">Empresas vinculadas</td>
                      <td className="py-1.5 text-xs">Casos penales (-40 c/u), ambientales (-25), laborales (-20), consumidor (-15).</td>
                      <td className="text-center font-bold text-[var(--flag-amber-text)]">-60</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-2 font-medium">
                <strong>Auditoría:</strong> El breakdown muestra cada penalidad con subtotales incrementales
                (base → tradicional → votación → tributario → judicial → empresas → final).
              </p>
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
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-1 uppercase">
                  Sanciones ONPE (penalización)
                </h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  -15 pts por cada sanción de ONPE (no presentar reportes de financiamiento de campaña).
                  Cap: -30 pts.
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
