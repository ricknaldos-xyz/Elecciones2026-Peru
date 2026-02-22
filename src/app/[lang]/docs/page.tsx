import { Link } from '@/i18n/routing'
import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DocsContent } from './DocsContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Documentación - EleccionesPerú2026',
    description: 'Conoce la metodología, fuentes de datos y funcionamiento del EleccionesPerú2026. Transparencia total en cómo evaluamos candidatos.',
    openGraph: {
      title: 'Documentación - EleccionesPerú2026',
      description: 'Metodología, fuentes de datos y funcionamiento del EleccionesPerú2026.',
      images: ['/api/og?type=ranking'],
    },
  }
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/docs" />

      <DocsContent>
        {/* Hero - Compact for sidebar layout */}
        <div className="mb-10">
          <Badge variant="default" size="md" className="mb-4">DOCUMENTACIÓN</Badge>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
            EleccionesPerú2026
          </h1>
          <p className="text-base text-[var(--muted-foreground)] font-medium max-w-2xl">
            Plataforma de inteligencia electoral que proporciona rankings transparentes y basados en evidencia
            para las Elecciones Generales del 12 de abril de 2026.
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="px-3 py-2 bg-[var(--primary)]/10 border-2 border-[var(--primary)]">
              <span className="text-xs font-bold text-[var(--primary)]">9 SECCIONES</span>
            </div>
            <div className="px-3 py-2 bg-[var(--muted)] border-2 border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--muted-foreground)]">METODOLOGÍA TRANSPARENTE</span>
            </div>
          </div>
        </div>

        {/* Section 1: Vision */}
        <section id="vision" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">1</span>
                VISIÓN Y MISIÓN
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-[var(--primary)]/10 border-2 border-[var(--primary)]">
                <h3 className="font-black text-[var(--primary)] text-xl mb-2 uppercase">
                  "Elige con datos, no con promesas"
                </h3>
                <p className="text-[var(--foreground)] font-medium">
                  Nuestra misión es empoderar a los ciudadanos peruanos con información objetiva y verificable
                  para tomar decisiones electorales informadas.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase">Visión</h4>
                  <p className="text-[var(--muted-foreground)] font-medium">
                    Ser la fuente de referencia más confiable de información electoral en el Perú,
                    promoviendo una democracia más transparente y participativa.
                  </p>
                </div>
                <div>
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase">Valores</h4>
                  <ul className="space-y-1 text-[var(--muted-foreground)] font-medium">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--primary)]" />
                      Transparencia total
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--primary)]" />
                      Neutralidad política
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--primary)]" />
                      Rigor metodológico
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--primary)]" />
                      Acceso abierto
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: El Problema */}
        <section id="problema" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">2</span>
                EL PROBLEMA QUE RESOLVEMOS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-[var(--muted-foreground)] font-medium">
                El proceso electoral en Perú enfrenta múltiples desafíos que dificultan la toma de decisiones informadas:
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
                  <h4 className="font-black text-[var(--flag-red-text)] mb-2 uppercase text-sm">Información Dispersa</h4>
                  <p className="text-sm text-[var(--foreground)] font-medium">
                    Los datos de candidatos están fragmentados en múltiples fuentes oficiales (JNE, ONPE, Poder Judicial)
                    sin un punto único de acceso.
                  </p>
                </div>
                <div className="p-4 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
                  <h4 className="font-black text-[var(--flag-red-text)] mb-2 uppercase text-sm">Falta de Contexto</h4>
                  <p className="text-sm text-[var(--foreground)] font-medium">
                    Los datos crudos no ofrecen contexto comparativo para entender qué significa
                    la experiencia o formación de un candidato.
                  </p>
                </div>
                <div className="p-4 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
                  <h4 className="font-black text-[var(--flag-red-text)] mb-2 uppercase text-sm">Sesgos Mediáticos</h4>
                  <p className="text-sm text-[var(--foreground)] font-medium">
                    La cobertura mediática está influenciada por intereses políticos y económicos,
                    dificultando una evaluación objetiva.
                  </p>
                </div>
                <div className="p-4 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
                  <h4 className="font-black text-[var(--flag-red-text)] mb-2 uppercase text-sm">Complejidad Electoral</h4>
                  <p className="text-sm text-[var(--foreground)] font-medium">
                    Con 5 tipos de cargos y miles de candidatos, es imposible para el ciudadano promedio
                    investigar todos los candidatos.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <h4 className="font-black text-[var(--foreground)] mb-2 uppercase">Datos Duros</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-black text-[var(--primary)]">5</div>
                    <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Tipos de Cargo</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[var(--primary)]">25+</div>
                    <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Partidos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[var(--primary)]">1000+</div>
                    <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Candidatos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[var(--primary)]">26</div>
                    <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Distritos</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 3: Solución */}
        <section id="solucion" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">3</span>
                NUESTRA SOLUCIÓN
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-[var(--muted-foreground)] font-medium">
                EleccionesPerú2026 es una plataforma integral que combina:
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--score-competence)]/10 border-2 border-[var(--score-competence)]">
                  <div className="w-10 h-10 bg-[var(--score-competence)] mb-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <h4 className="font-black text-[var(--score-competence-text)] mb-2 uppercase">Agregación de Datos</h4>
                  <p className="text-sm text-[var(--foreground)] font-medium">
                    Recopilamos y consolidamos datos de múltiples fuentes oficiales en una base de datos unificada.
                  </p>
                </div>
                <div className="p-4 bg-[var(--score-integrity)]/10 border-2 border-[var(--score-integrity)]">
                  <div className="w-10 h-10 bg-[var(--score-integrity)] mb-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-black text-[var(--score-integrity-text)] mb-2 uppercase">Scoring Objetivo</h4>
                  <p className="text-sm text-[var(--foreground)] font-medium">
                    Aplicamos una metodología transparente y verificable para evaluar candidatos en 3 dimensiones.
                  </p>
                </div>
                <div className="p-4 bg-[var(--score-transparency)]/10 border-2 border-[var(--score-transparency)]">
                  <div className="w-10 h-10 bg-[var(--score-transparency)] mb-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="square" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h4 className="font-black text-[var(--score-transparency-text)] mb-2 uppercase">UX Accesible</h4>
                  <p className="text-sm text-[var(--foreground)] font-medium">
                    Presentamos la información de forma clara e intuitiva para cualquier ciudadano.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-[var(--primary)] text-white border-3 border-[var(--border)] shadow-[var(--shadow-brutal)]">
                <h4 className="font-black mb-2 uppercase">Propuesta de Valor Única</h4>
                <p className="font-medium">
                  Somos la única plataforma que combina datos oficiales del JNE/ONPE con análisis de IA
                  para proporcionar scores objetivos y comparables entre todos los candidatos a nivel nacional.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 4: Methodology */}
        <section id="metodologia" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">4</span>
                METODOLOGÍA DE SCORING
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <p className="text-[var(--muted-foreground)] font-medium">
                Nuestro sistema evalúa candidatos en tres dimensiones principales, cada una con múltiples sub-componentes:
              </p>

              {/* Formula Box */}
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)] font-mono text-center">
                <div className="text-sm text-[var(--muted-foreground)] mb-2">Fórmula General</div>
                <div className="text-lg font-bold text-[var(--foreground)]">
                  Score = (wC × Competencia) + (wI × Historial Legal) + (wT × Transparencia)
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mt-2">
                  Los pesos siempre suman 1.0 (wC + wI + wT = 1.0). El sistema valida y normaliza automáticamente.
                </div>
              </div>

              {/* Presets */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-3 border-[var(--border)]">
                      <th className="text-left py-3 font-black text-[var(--foreground)] uppercase">Modo</th>
                      <th className="text-center py-3 font-black text-[var(--foreground)] uppercase">Competencia</th>
                      <th className="text-center py-3 font-black text-[var(--foreground)] uppercase">Historial Legal</th>
                      <th className="text-center py-3 font-black text-[var(--foreground)] uppercase">Transparencia</th>
                      <th className="text-left py-3 font-black text-[var(--foreground)] uppercase">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--muted-foreground)]">
                    <tr className="border-b-2 border-[var(--border)]">
                      <td className="py-3"><Badge variant="default">EQUILIBRADO</Badge></td>
                      <td className="text-center font-bold">45%</td>
                      <td className="text-center font-bold">45%</td>
                      <td className="text-center font-bold">10%</td>
                      <td className="text-sm font-medium">Balance entre capacidad y ética</td>
                    </tr>
                    <tr className="border-b-2 border-[var(--border)]">
                      <td className="py-3"><Badge variant="secondary">MÉRITO</Badge></td>
                      <td className="text-center font-bold">60%</td>
                      <td className="text-center font-bold">30%</td>
                      <td className="text-center font-bold">10%</td>
                      <td className="text-sm font-medium">Prioriza preparación profesional</td>
                    </tr>
                    <tr className="border-b-2 border-[var(--border)]">
                      <td className="py-3"><Badge variant="outline">HISTORIAL LEGAL</Badge></td>
                      <td className="text-center font-bold">30%</td>
                      <td className="text-center font-bold">60%</td>
                      <td className="text-center font-bold">10%</td>
                      <td className="text-sm font-medium">Prioriza historial ético</td>
                    </tr>
                    <tr>
                      <td className="py-3"><Badge>PERSONALIZADO</Badge></td>
                      <td className="text-center font-bold">20-75%</td>
                      <td className="text-center font-bold">20-75%</td>
                      <td className="text-center font-bold">5-20%</td>
                      <td className="text-sm font-medium">Usuario define los pesos</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Competence Breakdown */}
              <div className="p-4 bg-[var(--score-competence)]/10 border-2 border-[var(--score-competence)]">
                <h4 className="font-black text-[var(--score-competence-text)] mb-4 uppercase flex items-center gap-2">
                  <div className="w-4 h-4 bg-[var(--score-competence)]" />
                  COMPETENCIA (0-100 puntos)
                </h4>
                <p className="text-sm text-[var(--foreground)] font-medium mb-4">
                  Mide la preparación profesional del candidato para ejercer el cargo.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-bold text-[var(--foreground)] mb-2 text-sm">Educación (máx. 30 pts)</h5>
                    <ul className="text-xs text-[var(--muted-foreground)] space-y-1 font-medium">
                      <li>• Doctorado: 22 pts</li>
                      <li>• Maestría: 18 pts</li>
                      <li>• Título profesional: 16 pts</li>
                      <li>• Universitario completo: 14 pts</li>
                      <li>• Técnico completo: 10 pts</li>
                      <li>• + Hasta 8 pts por especializaciones</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-bold text-[var(--foreground)] mb-2 text-sm">Experiencia (máx. 50 pts)</h5>
                    <ul className="text-xs text-[var(--muted-foreground)] space-y-1 font-medium">
                      <li>• Experiencia total: 0-25 pts</li>
                      <li>• Experiencia relevante: 0-25 pts</li>
                      <li>• Ponderado por tipo de rol y sector</li>
                      <li>• Detección de períodos solapados (se deduplican)</li>
                    </ul>
                  </div>
                  <div className="sm:col-span-2">
                    <h5 className="font-bold text-[var(--foreground)] mb-2 text-sm">Liderazgo (máx. 20 pts)</h5>
                    <ul className="text-xs text-[var(--muted-foreground)] space-y-1 font-medium">
                      <li>• Seniority máximo alcanzado: 0-14 pts (Individual → Gerencia → Dirección)</li>
                      <li>• Estabilidad en posiciones de liderazgo: 0-6 pts</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Integrity Breakdown */}
              <div className="p-4 bg-[var(--score-integrity)]/10 border-2 border-[var(--score-integrity)]">
                <h4 className="font-black text-[var(--score-integrity-text)] mb-4 uppercase flex items-center gap-2">
                  <div className="w-4 h-4 bg-[var(--score-integrity)]" />
                  HISTORIAL LEGAL (0-100 puntos)
                </h4>
                <p className="text-sm text-[var(--foreground)] font-medium mb-4">
                  Comienza en 100 puntos y se restan penalidades por antecedentes verificados.
                  Las penalidades civiles tienen caps por tipo para evitar acumulación extrema.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[var(--score-integrity)]">
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Tipo de Antecedente</th>
                        <th className="text-center py-2 font-bold text-[var(--foreground)]">Penalidad</th>
                        <th className="text-center py-2 font-bold text-[var(--foreground)]">Cap por Tipo</th>
                        <th className="text-center py-2 font-bold text-[var(--foreground)]">Severidad</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--muted-foreground)]">
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Sentencia penal firme (1)</td>
                        <td className="text-center font-bold text-[var(--flag-red-text)]">-70</td>
                        <td className="text-center font-bold">-85</td>
                        <td className="text-center"><Badge variant="destructive" size="sm">ROJO</Badge></td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Sentencias penales (2+)</td>
                        <td className="text-center font-bold text-[var(--flag-red-text)]">-85 (cap)</td>
                        <td className="text-center font-bold">-85</td>
                        <td className="text-center"><Badge variant="destructive" size="sm">ROJO</Badge></td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Violencia familiar</td>
                        <td className="text-center font-bold text-[var(--flag-amber-text)]">-50</td>
                        <td className="text-center font-bold">-70</td>
                        <td className="text-center"><Badge variant="warning" size="sm">ÁMBAR</Badge></td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Omisión alimentaria (informativo)</td>
                        <td className="text-center font-bold text-[var(--flag-amber-text)]">-35</td>
                        <td className="text-center font-bold">-50</td>
                        <td className="text-center"><Badge variant="warning" size="sm">ÁMBAR</Badge></td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Sentencia laboral</td>
                        <td className="text-center font-bold text-[var(--flag-amber-text)]">-25</td>
                        <td className="text-center font-bold">-40</td>
                        <td className="text-center"><Badge variant="warning" size="sm">ÁMBAR</Badge></td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Sentencia contractual</td>
                        <td className="text-center font-bold">-15</td>
                        <td className="text-center font-bold">-25</td>
                        <td className="text-center"><Badge size="sm">GRIS</Badge></td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Renuncias a partidos (1 / 2-3 / 4+)</td>
                        <td className="text-center font-bold">-5 / -10 / -15</td>
                        <td className="text-center font-bold">-15</td>
                        <td className="text-center"><Badge size="sm">GRIS</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium mt-3">
                  <strong>Nota:</strong> El cap total de penalidades civiles es -85 pts.
                  Múltiples sentencias del mismo tipo aplican retornos decrecientes (100%, 50%, 25% para 1ra, 2da, 3ra+).
                </p>

                {/* Enhanced Integrity Sources */}
                <div className="mt-4 p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
                  <h5 className="font-bold text-[var(--foreground)] mb-2 text-sm uppercase">Fuentes Adicionales de Evaluación</h5>
                  <p className="text-xs text-[var(--muted-foreground)] font-medium mb-2">
                    Para candidatos con historial legislativo o empresarial, evaluamos fuentes adicionales:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-[var(--primary)] mt-1.5 flex-shrink-0" />
                      <span><strong>Votaciones congresales:</strong> Votos pro-impunidad o anti-democráticos</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-[var(--primary)] mt-1.5 flex-shrink-0" />
                      <span><strong>SUNAT:</strong> Condición tributaria y deudas coactivas</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-[var(--primary)] mt-1.5 flex-shrink-0" />
                      <span><strong>Verificación judicial:</strong> Casos no declarados en DJHV</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-[var(--primary)] mt-1.5 flex-shrink-0" />
                      <span><strong>Empresas vinculadas:</strong> Casos penales, laborales o ambientales</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transparency Breakdown */}
              <div className="p-4 bg-[var(--score-transparency)]/10 border-2 border-[var(--score-transparency)]">
                <h4 className="font-black text-[var(--score-transparency-text)] mb-4 uppercase flex items-center gap-2">
                  <div className="w-4 h-4 bg-[var(--score-transparency)]" />
                  TRANSPARENCIA (0-100 puntos)
                </h4>
                <p className="text-sm text-[var(--foreground)] font-medium mb-4">
                  Evalúa la calidad y completitud de la información declarada por el candidato en su DJHV.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-[var(--background)] border-2 border-[var(--border)]">
                    <h5 className="font-bold text-[var(--foreground)] text-sm mb-1">Completitud</h5>
                    <div className="text-2xl font-black text-[var(--score-transparency-text)]">35 pts</div>
                    <p className="text-xs text-[var(--muted-foreground)] font-medium">¿Llenó todos los campos del DJHV?</p>
                  </div>
                  <div className="p-3 bg-[var(--background)] border-2 border-[var(--border)]">
                    <h5 className="font-bold text-[var(--foreground)] text-sm mb-1">Consistencia</h5>
                    <div className="text-2xl font-black text-[var(--score-transparency-text)]">35 pts</div>
                    <p className="text-xs text-[var(--muted-foreground)] font-medium">¿Los datos son coherentes entre sí?</p>
                  </div>
                  <div className="p-3 bg-[var(--background)] border-2 border-[var(--border)]">
                    <h5 className="font-bold text-[var(--foreground)] text-sm mb-1">Calidad Patrimonial</h5>
                    <div className="text-2xl font-black text-[var(--score-transparency-text)]">30 pts</div>
                    <p className="text-xs text-[var(--muted-foreground)] font-medium">¿La declaración de bienes es detallada?</p>
                  </div>
                </div>
              </div>

              {/* Confidence Score */}
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <h4 className="font-black text-[var(--foreground)] mb-4 uppercase">
                  ÍNDICE DE CONFIANZA (0-100)
                </h4>
                <p className="text-sm text-[var(--foreground)] font-medium mb-4">
                  Indica qué tan completa y verificable es la información que tenemos del candidato.
                  <strong> No afecta el score final</strong>, pero ayuda a interpretar los resultados.
                </p>
                <div className="flex gap-4">
                  <div className="flex-1 p-3 bg-[var(--score-excellent-bg)] border-2 border-[var(--score-excellent)] text-center">
                    <div className="font-black text-[var(--score-excellent-text)]">70-100</div>
                    <div className="text-xs font-bold text-[var(--score-excellent-text)] uppercase">Alta</div>
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
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 7: Data Sources */}
        <section id="fuentes" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">5</span>
                FUENTES DE DATOS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-[var(--muted-foreground)] font-medium">
                Toda la información proviene de fuentes oficiales y públicas. Los datos se recopilan, verifican
                y actualizan periódicamente para mantener la información lo más precisa posible.
              </p>

              {/* Source Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <Badge variant="default" size="sm">OFICIAL</Badge>
                    JNE - Jurado Nacional de Elecciones
                  </h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-2 font-medium">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Declaración Jurada de Hoja de Vida (DJHV)
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Datos biográficos y educación
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Experiencia laboral y política
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Declaración de bienes
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Sentencias declaradas
                    </li>
                  </ul>
                </div>

                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <Badge variant="default" size="sm">OFICIAL</Badge>
                    ONPE
                  </h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-2 font-medium">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Financiamiento público de partidos
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Donaciones privadas
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Gastos de campaña
                    </li>
                  </ul>
                </div>

                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <Badge variant="default" size="sm">OFICIAL</Badge>
                    Poder Judicial
                  </h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-2 font-medium">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Sentencias penales firmes
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-excellent-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Procesos civiles
                    </li>
                  </ul>
                </div>

                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <Badge variant="secondary" size="sm">MEDIA</Badge>
                    Medios de Comunicación
                  </h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-2 font-medium">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-medium-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      El Comercio, La República, RPP
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-medium-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Gestión, Peru21, Correo
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[var(--score-medium-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                      Google News (agregador)
                    </li>
                  </ul>
                </div>

                <div className="p-4 border-2 border-[var(--border)] sm:col-span-2">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <Badge variant="secondary" size="sm">SOCIAL</Badge>
                    Redes Sociales
                  </h4>
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-sm font-bold text-[var(--foreground)]">Twitter/X</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Menciones</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--foreground)]">TikTok</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Videos</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--foreground)]">YouTube</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Videos</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--foreground)]">Facebook</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Posts</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--foreground)]">Instagram</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Posts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sync Schedule */}
              <div className="p-4 bg-[var(--primary)]/10 border-2 border-[var(--primary)]">
                <h4 className="font-black text-[var(--primary)] mb-2 uppercase">Frecuencia de Actualización</h4>
                <p className="text-sm text-[var(--foreground)] font-medium">
                  Los datos se actualizan periódicamente de forma automática: las fuentes oficiales (JNE, ONPE) se sincronizan diariamente,
                  mientras que noticias y redes sociales se actualizan varias veces al día para mantener la información lo más vigente posible.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 8: Features */}
        <section id="features" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">6</span>
                FUNCIONALIDADES
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Feature 1 */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--foreground)] uppercase">Ranking Dinámico</h4>
                      <p className="text-sm text-[var(--muted-foreground)] font-medium">
                        Rankings en tiempo real con múltiples modos de scoring y filtros por cargo, distrito y partido.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--foreground)] uppercase">Perfiles Detallados</h4>
                      <p className="text-sm text-[var(--muted-foreground)] font-medium">
                        Información completa de cada candidato: educación, experiencia, antecedentes, bienes y noticias relacionadas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--foreground)] uppercase">Brújula Electoral</h4>
                      <p className="text-sm text-[var(--muted-foreground)] font-medium">
                        10 preguntas para descubrir qué candidatos tienen posiciones más afines a las tuyas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--foreground)] uppercase">Comparador</h4>
                      <p className="text-sm text-[var(--muted-foreground)] font-medium">
                        Compara lado a lado múltiples candidatos en todas sus dimensiones y scores.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--foreground)] uppercase">Noticias en Vivo</h4>
                      <p className="text-sm text-[var(--muted-foreground)] font-medium">
                        Agregación de noticias de múltiples fuentes con análisis de sentimiento por IA.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 6 */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--foreground)] uppercase">Transparencia Financiera</h4>
                      <p className="text-sm text-[var(--muted-foreground)] font-medium">
                        Datos de financiamiento de partidos: ingresos públicos, donantes y gastos de campaña.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 7 */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--foreground)] uppercase">Countdown Electoral</h4>
                      <p className="text-sm text-[var(--muted-foreground)] font-medium">
                        Cuenta regresiva interactiva hasta el 12 de abril de 2026 con datos diarios destacados.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 8 */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--foreground)] uppercase">Widgets Embebibles</h4>
                      <p className="text-sm text-[var(--muted-foreground)] font-medium">
                        Componentes para insertar rankings y perfiles en sitios de terceros (medios, ONGs).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 7: Design System */}
        <section id="design-system" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">7</span>
                SISTEMA DE DISEÑO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-[var(--muted-foreground)] font-medium">
                Diseño NEO-BRUTAL: bordes gruesos, sombras duras, tipografía bold, alto contraste.
              </p>

              {/* Design Principles */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 border-3 border-[var(--border)] shadow-[var(--shadow-brutal)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Bordes Gruesos</h4>
                  <p className="text-xs text-[var(--muted-foreground)] font-medium">
                    Bordes de 2-3px en todos los elementos. Definen claramente los límites y crean jerarquía visual.
                  </p>
                </div>
                <div className="p-4 border-3 border-[var(--border)] shadow-[var(--shadow-brutal)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Sombras Duras</h4>
                  <p className="text-xs text-[var(--muted-foreground)] font-medium">
                    Sombras sin blur (4px-8px offset) que crean profundidad y efecto 3D retro.
                  </p>
                </div>
                <div className="p-4 border-3 border-[var(--border)] shadow-[var(--shadow-brutal)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Tipografía Bold</h4>
                  <p className="text-xs text-[var(--muted-foreground)] font-medium">
                    Space Grotesk para headings, JetBrains Mono para código. Todo en mayúsculas para títulos.
                  </p>
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-3 uppercase">Paleta de Colores</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="h-16 bg-[var(--primary)] border-2 border-[var(--border)] mb-2" />
                    <div className="text-xs font-bold text-[var(--foreground)]">Primary</div>
                    <div className="text-xs font-mono text-[var(--muted-foreground)]">#DC2626</div>
                  </div>
                  <div>
                    <div className="h-16 bg-[var(--score-competence)] border-2 border-[var(--border)] mb-2" />
                    <div className="text-xs font-bold text-[var(--foreground)]">Competencia</div>
                    <div className="text-xs font-mono text-[var(--muted-foreground)]">Blue</div>
                  </div>
                  <div>
                    <div className="h-16 bg-[var(--score-integrity)] border-2 border-[var(--border)] mb-2" />
                    <div className="text-xs font-bold text-[var(--foreground)]">Historial Legal</div>
                    <div className="text-xs font-mono text-[var(--muted-foreground)]">Green</div>
                  </div>
                  <div>
                    <div className="h-16 bg-[var(--score-transparency)] border-2 border-[var(--border)] mb-2" />
                    <div className="text-xs font-bold text-[var(--foreground)]">Transparencia</div>
                    <div className="text-xs font-mono text-[var(--muted-foreground)]">Purple</div>
                  </div>
                </div>
              </div>

              {/* Flag Severities */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-3 uppercase">Severidad de Flags</h4>
                <div className="flex gap-4">
                  <div className="flex-1 p-3 bg-[var(--flag-red)] border-2 border-[var(--border)] text-center">
                    <div className="font-black text-white">ROJO</div>
                    <div className="text-xs text-white/80">Crítico</div>
                  </div>
                  <div className="flex-1 p-3 bg-[var(--flag-amber)] border-2 border-[var(--border)] text-center">
                    <div className="font-black text-black">ÁMBAR</div>
                    <div className="text-xs text-black/80">Moderado</div>
                  </div>
                  <div className="flex-1 p-3 bg-[var(--flag-gray)] border-2 border-[var(--border)] text-center">
                    <div className="font-black text-white">GRIS</div>
                    <div className="text-xs text-white/80">Menor</div>
                  </div>
                </div>
              </div>

              {/* Components */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-3 uppercase">Componentes UI</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-[var(--muted-foreground)] font-medium">
                  <ul className="space-y-1">
                    <li>• Button (primary, secondary, outline, ghost)</li>
                    <li>• Card (con header y content)</li>
                    <li>• Badge (sizes: sm, md, lg)</li>
                    <li>• Tabs (con scroll horizontal mobile)</li>
                  </ul>
                  <ul className="space-y-1">
                    <li>• Progress (barras de score)</li>
                    <li>• Tooltip (información contextual)</li>
                    <li>• Skeleton (loading states)</li>
                    <li>• ScorePill (scores circulares)</li>
                  </ul>
                </div>
              </div>

              {/* Responsive */}
              <div className="p-4 bg-[var(--primary)]/10 border-2 border-[var(--primary)]">
                <h4 className="font-black text-[var(--primary)] mb-2 uppercase">Responsive Design</h4>
                <ul className="text-sm text-[var(--foreground)] font-medium space-y-1">
                  <li>• Breakpoints: 320px (min), 640px (sm), 768px (md), 1024px (lg)</li>
                  <li>• Touch targets: mínimo 44x44px en mobile</li>
                  <li>• Font scaling: text-sm → text-lg responsive</li>
                  <li>• Layout: Column-first, row on desktop</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 12: Security */}
        <section id="seguridad" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">8</span>
                SEGURIDAD Y PRIVACIDAD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Protección de Datos</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-medium">
                    <li>• Endpoints administrativos protegidos con autenticación segura</li>
                    <li>• Infraestructura con certificación SOC 2</li>
                    <li>• Base de datos encriptada en reposo y en tránsito</li>
                    <li>• HTTPS obligatorio en todo el sitio</li>
                  </ul>
                </div>
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Privacidad del Usuario</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-medium">
                    <li>• DNI de donantes: solo últimos 4 dígitos visibles</li>
                    <li>• Datos técnicos mínimos recopilados (sesión, páginas visitadas)</li>
                    <li>• Respuestas del quiz son completamente anónimas</li>
                    <li>• No compartimos datos con terceros</li>
                  </ul>
                </div>
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Neutralidad</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-medium">
                    <li>• Sin afiliación a ningún partido político</li>
                    <li>• Metodología pública y auditable</li>
                    <li>• Canal abierto para reportar errores o sesgos</li>
                    <li>• No aceptamos financiamiento político</li>
                  </ul>
                </div>
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Transparencia</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-medium">
                    <li>• Todas las fuentes de datos son públicas</li>
                    <li>• Metodología de scoring documentada</li>
                    <li>• Código abierto y auditable</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 9: Legal & Compliance */}
        <section id="legal" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">9</span>
                LEGAL Y COMPLIANCE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Terms of Service */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm">Términos de Uso</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-2 font-medium">
                    <li>• La información es <strong>de carácter informativo</strong>, no constituye recomendación de voto</li>
                    <li>• Los datos provienen de <strong>fuentes públicas oficiales</strong> (JNE, ONPE, medios)</li>
                    <li>• La metodología de scoring es <strong>transparente y auditable</strong></li>
                    <li>• El uso comercial requiere <strong>autorización expresa</strong></li>
                    <li>• Nos reservamos el derecho de <strong>modificar contenido</strong> para corregir errores</li>
                  </ul>
                </div>

                {/* Privacy Policy */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm">Política de Privacidad</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-2 font-medium">
                    <li>• Recopilamos <strong>datos técnicos mínimos</strong>: identificador de sesión, páginas visitadas, eventos de compartir</li>
                    <li>• Quiz responses son <strong>anónimas</strong> (solo session ID temporal)</li>
                    <li>• <strong>No usamos cookies publicitarias.</strong> Usamos cookies funcionales para sesiones</li>
                    <li>• No compartimos datos con terceros</li>
                    <li>• DNIs de donantes se muestran <strong>parcialmente ocultos</strong></li>
                    <li>• Consulta nuestra <a href="/privacidad" className="underline font-bold text-[var(--foreground)]">Política de Privacidad completa</a></li>
                  </ul>
                </div>

                {/* Electoral Compliance */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm">Compliance Electoral</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-2 font-medium">
                    <li>• Cumplimos con la <strong>Ley de Organizaciones Políticas</strong> (Ley 28094)</li>
                    <li>• Respetamos la <strong>veda electoral</strong> (no publicamos encuestas en período prohibido)</li>
                    <li>• No somos un <strong>organismo electoral oficial</strong></li>
                    <li>• No recibimos financiamiento de <strong>partidos ni candidatos</strong></li>
                  </ul>
                </div>

                {/* Political Neutrality */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm">Neutralidad Política</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-2 font-medium">
                    <li>• <strong>Sin afiliación</strong> a ningún partido político</li>
                    <li>• Metodología aplicada <strong>igualmente a todos</strong> los candidatos</li>
                    <li>• Equipo <strong>diverso políticamente</strong> para evitar sesgos</li>
                    <li>• <strong>Canal abierto</strong> para reportar sesgos percibidos</li>
                    <li>• Auditorías externas de la metodología</li>
                  </ul>
                </div>
              </div>

              {/* Data Sources Disclaimer */}
              <div className="p-4 bg-[var(--flag-amber)]/10 border-2 border-[var(--flag-amber)]">
                <h4 className="font-black text-[var(--flag-amber-text)] mb-2 uppercase text-sm">Sobre los Datos</h4>
                <p className="text-sm text-[var(--foreground)] font-medium">
                  Toda la información mostrada proviene de fuentes públicas verificables: JNE (hojas de vida),
                  ONPE (financiamiento), Poder Judicial (antecedentes), medios de comunicación (noticias).
                  Nos esforzamos por mantener los datos actualizados, pero pueden existir discrepancias
                  temporales. Si encuentra un error, por favor repórtelo a través de nuestros canales.
                </p>
              </div>

              {/* Contact */}
              <div className="p-4 border-2 border-[var(--primary)] bg-[var(--primary)]/5">
                <h4 className="font-black text-[var(--primary)] mb-2 uppercase text-sm">Contacto Legal</h4>
                <p className="text-sm text-[var(--foreground)] font-medium">
                  Para consultas legales, solicitudes de datos, o reportes de contenido:
                  <br />
                  <strong>Email:</strong> contacto@eleccionesperu2026.xyz
                  <br />
                  <strong>Tiempo de respuesta:</strong> 48-72 horas hábiles
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Disclaimer */}
        <Card className="mb-8 border-[var(--flag-amber)] bg-[var(--flag-amber)]/10">
          <CardContent className="p-6">
            <h3 className="font-black text-[var(--flag-amber-text)] mb-2 uppercase">
              Disclaimer Legal
            </h3>
            <p className="text-sm text-[var(--foreground)] font-medium">
              Este ranking es una herramienta informativa basada en datos públicos. No representa
              una recomendación de voto ni una evaluación completa de las capacidades de un candidato.
              Los usuarios deben complementar esta información con su propio análisis de propuestas
              y valores. La plataforma no tiene afiliación con ningún partido político ni candidato.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-wrap justify-center gap-4 pt-8 border-t-2 border-[var(--border)]">
          <Link href="/ranking">
            <Button variant="primary" size="lg">
              VER EL RANKING
            </Button>
          </Link>
          <Link href="/metodologia">
            <Button variant="outline" size="lg">
              METODOLOGÍA DETALLADA
            </Button>
          </Link>
        </div>
      </DocsContent>
    </div>
  )
}
