import Link from 'next/link'
import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Documentación Completa - Ranking Electoral 2026',
  description: 'Documentación técnica completa del Ranking Electoral Perú 2026. Arquitectura, metodología, fuentes de datos, diseño y más.',
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/docs" />

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="default" size="md" className="mb-4">DOCUMENTACIÓN TÉCNICA</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
            Ranking Electoral Perú 2026
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] font-medium max-w-3xl mx-auto">
            Plataforma de inteligencia electoral que proporciona rankings transparentes y basados en evidencia
            para las Elecciones Generales del 12 de abril de 2026.
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>ÍNDICE DE CONTENIDOS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { href: '#vision', label: '1. Visión y Misión' },
                { href: '#problema', label: '2. El Problema' },
                { href: '#solucion', label: '3. Nuestra Solución' },
                { href: '#arquitectura', label: '4. Arquitectura' },
                { href: '#tech-stack', label: '5. Stack Tecnológico' },
                { href: '#metodologia', label: '6. Metodología de Scoring' },
                { href: '#fuentes', label: '7. Fuentes de Datos' },
                { href: '#features', label: '8. Funcionalidades' },
                { href: '#database', label: '9. Base de Datos' },
                { href: '#api', label: '10. API Reference' },
                { href: '#design-system', label: '11. Sistema de Diseño' },
                { href: '#seguridad', label: '12. Seguridad' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-4 py-3 bg-[var(--muted)] border-2 border-[var(--border)] font-bold text-sm text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

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
                Ranking Electoral Perú 2026 es una plataforma integral que combina:
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

        {/* Section 4: Architecture */}
        <section id="arquitectura" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">4</span>
                ARQUITECTURA DEL SISTEMA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-[var(--muted-foreground)] font-medium">
                La arquitectura sigue un modelo de capas con separación clara de responsabilidades:
              </p>

              {/* Architecture Diagram */}
              <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] font-mono text-sm overflow-x-auto">
                <pre className="text-[var(--foreground)]">{`
┌─────────────────────────────────────────────────────────────────┐
│                         CAPA DE PRESENTACIÓN                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Pages   │ │Components│ │   UI     │ │  Hooks   │           │
│  │(Next.js) │ │ (React)  │ │ Library  │ │(Custom)  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          CAPA DE API                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Next.js API Routes                      │  │
│  │  /api/candidates  /api/parties  /api/news  /api/quiz     │  │
│  │  /api/districts   /api/sync/*                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CAPA DE LÓGICA                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │  Scoring   │ │   Quiz     │ │    Sync    │ │     AI     │  │
│  │ Algorithm  │ │  Matcher   │ │  Pipeline  │ │  Analyzer  │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA DE DATOS                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL (Neon Serverless)              │    │
│  │  candidates | scores | parties | news | flags | etc.   │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FUENTES EXTERNAS                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐   │
│  │  JNE   │ │  ONPE  │ │Judicial│ │  RSS   │ │Social Media│   │
│  │(DJHV)  │ │(Financ)│ │(Sents) │ │ (News) │ │(X/TikTok)  │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
`}</pre>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Estructura de Carpetas</h4>
                  <div className="font-mono text-xs text-[var(--muted-foreground)] space-y-1">
                    <div><span className="text-[var(--primary)]">src/</span></div>
                    <div className="ml-4">├── <span className="text-[var(--score-competence-text)]">app/</span> (Pages & API Routes)</div>
                    <div className="ml-4">├── <span className="text-[var(--score-integrity-text)]">components/</span> (React Components)</div>
                    <div className="ml-4">├── <span className="text-[var(--score-transparency-text)]">lib/</span> (Utilities & Logic)</div>
                    <div className="ml-4">├── <span className="text-[var(--primary)]">types/</span> (TypeScript Types)</div>
                    <div className="ml-4">└── <span className="text-[var(--primary)]">hooks/</span> (Custom Hooks)</div>
                    <div><span className="text-[var(--primary)]">supabase/</span></div>
                    <div className="ml-4">└── <span className="text-[var(--primary)]">migrations/</span> (SQL Migrations)</div>
                  </div>
                </div>
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Patrones Arquitectónicos</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] font-medium space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[var(--primary)] mt-1.5 flex-shrink-0" />
                      <span><strong>Server Components:</strong> Rendering del lado del servidor para SEO y performance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[var(--primary)] mt-1.5 flex-shrink-0" />
                      <span><strong>API Routes:</strong> Endpoints serverless con caching inteligente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[var(--primary)] mt-1.5 flex-shrink-0" />
                      <span><strong>Cron Jobs:</strong> Sincronización periódica de datos externos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 5: Tech Stack */}
        <section id="tech-stack" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">5</span>
                STACK TECNOLÓGICO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Frontend */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-[var(--score-competence)]" />
                    Frontend
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Next.js</span>
                      <Badge size="sm">v16.1.1</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">React</span>
                      <Badge size="sm">v19.2.3</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">TypeScript</span>
                      <Badge size="sm">v5</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Tailwind CSS</span>
                      <Badge size="sm">v4</Badge>
                    </li>
                  </ul>
                </div>

                {/* Backend */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-[var(--score-integrity)]" />
                    Backend
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Node.js</span>
                      <Badge size="sm">Runtime</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Next.js API</span>
                      <Badge size="sm">Serverless</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Vercel</span>
                      <Badge size="sm">Hosting</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Cron Jobs</span>
                      <Badge size="sm">Scheduled</Badge>
                    </li>
                  </ul>
                </div>

                {/* Database */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-[var(--score-transparency)]" />
                    Base de Datos
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">PostgreSQL</span>
                      <Badge size="sm">Relacional</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Neon</span>
                      <Badge size="sm">Serverless</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Supabase</span>
                      <Badge size="sm">BaaS</Badge>
                    </li>
                  </ul>
                </div>

                {/* AI */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-[var(--primary)]" />
                    Inteligencia Artificial
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Anthropic Claude</span>
                      <Badge size="sm">NLP</Badge>
                    </li>
                    <li className="text-xs text-[var(--muted-foreground)] font-medium">
                      Usado para: análisis de sentimiento, extracción de entidades, detección de flags en noticias y redes sociales.
                    </li>
                  </ul>
                </div>

                {/* Scraping */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-[var(--primary)]" />
                    Data Collection
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Puppeteer</span>
                      <Badge size="sm">Scraping</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Cheerio</span>
                      <Badge size="sm">HTML Parser</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">RSS Parser</span>
                      <Badge size="sm">News Feeds</Badge>
                    </li>
                  </ul>
                </div>

                {/* DevOps */}
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-[var(--primary)]" />
                    DevOps
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">ESLint</span>
                      <Badge size="sm">v9</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Git</span>
                      <Badge size="sm">VCS</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">Vercel CLI</span>
                      <Badge size="sm">Deploy</Badge>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 6: Methodology */}
        <section id="metodologia" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">6</span>
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
                  Score = (wC × Competencia) + (wI × Integridad) + (wT × Transparencia)
                </div>
              </div>

              {/* Presets */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-3 border-[var(--border)]">
                      <th className="text-left py-3 font-black text-[var(--foreground)] uppercase">Modo</th>
                      <th className="text-center py-3 font-black text-[var(--foreground)] uppercase">Competencia</th>
                      <th className="text-center py-3 font-black text-[var(--foreground)] uppercase">Integridad</th>
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
                      <td className="py-3"><Badge variant="outline">INTEGRIDAD</Badge></td>
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
                  INTEGRIDAD (0-100 puntos)
                </h4>
                <p className="text-sm text-[var(--foreground)] font-medium mb-4">
                  Comienza en 100 puntos y se restan penalidades por antecedentes verificados.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[var(--score-integrity)]">
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Tipo de Antecedente</th>
                        <th className="text-center py-2 font-bold text-[var(--foreground)]">Penalidad</th>
                        <th className="text-center py-2 font-bold text-[var(--foreground)]">Severidad</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--muted-foreground)]">
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Sentencia penal firme (1)</td>
                        <td className="text-center font-bold text-[var(--flag-red-text)]">-70</td>
                        <td className="text-center"><Badge variant="destructive" size="sm">ROJO</Badge></td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Sentencias penales (2+)</td>
                        <td className="text-center font-bold text-[var(--flag-red-text)]">-85 (cap)</td>
                        <td className="text-center"><Badge variant="destructive" size="sm">ROJO</Badge></td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Violencia familiar</td>
                        <td className="text-center font-bold text-[var(--flag-amber-text)]">-50</td>
                        <td className="text-center"><Badge variant="warning" size="sm">ÁMBAR</Badge></td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Omisión alimentaria</td>
                        <td className="text-center font-bold text-[var(--flag-amber-text)]">-35</td>
                        <td className="text-center"><Badge variant="warning" size="sm">ÁMBAR</Badge></td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Sentencia laboral</td>
                        <td className="text-center font-bold text-[var(--flag-amber-text)]">-25</td>
                        <td className="text-center"><Badge variant="warning" size="sm">ÁMBAR</Badge></td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium">Sentencia contractual</td>
                        <td className="text-center font-bold">-15</td>
                        <td className="text-center"><Badge size="sm">GRIS</Badge></td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Renuncias a partidos (1 / 2-3 / 4+)</td>
                        <td className="text-center font-bold">-5 / -10 / -15</td>
                        <td className="text-center"><Badge size="sm">GRIS</Badge></td>
                      </tr>
                    </tbody>
                  </table>
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
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">7</span>
                FUENTES DE DATOS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-[var(--muted-foreground)] font-medium">
                Toda la información proviene de fuentes oficiales y públicas, procesadas mediante pipelines automatizados:
              </p>

              {/* Data Pipeline Diagram */}
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)] font-mono text-xs overflow-x-auto">
                <pre className="text-[var(--foreground)]">{`
┌─────────────────────────────────────────────────────────────────────────┐
│                        PIPELINE DE DATOS                                 │
└─────────────────────────────────────────────────────────────────────────┘

  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
  │   JNE   │    │  ONPE   │    │Judicial │    │   RSS   │    │ Social  │
  │  DJHV   │    │ Financ  │    │ Records │    │  News   │    │  Media  │
  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                         SCRAPERS & PARSERS                          │
  │  jne/scraper.ts  │  onpe/scraper.ts  │  rss-fetcher.ts  │ etc...  │
  └────────────────────────────────────────────────────────────────────┘
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                         AI ANALYZER (Claude)                        │
  │  Sentiment Analysis │ Entity Extraction │ Flag Detection           │
  └────────────────────────────────────────────────────────────────────┘
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                         BASE DE DATOS                               │
  │  candidates │ scores │ flags │ news_mentions │ social_mentions     │
  └────────────────────────────────────────────────────────────────────┘
`}</pre>
              </div>

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
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-bold text-[var(--foreground)]">JNE/ONPE:</span>
                    <span className="text-[var(--muted-foreground)]"> Diario</span>
                  </div>
                  <div>
                    <span className="font-bold text-[var(--foreground)]">Noticias:</span>
                    <span className="text-[var(--muted-foreground)]"> Cada 4 horas</span>
                  </div>
                  <div>
                    <span className="font-bold text-[var(--foreground)]">Redes Sociales:</span>
                    <span className="text-[var(--muted-foreground)]"> Cada 6 horas</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 8: Features */}
        <section id="features" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">8</span>
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
                      <h4 className="font-black text-[var(--foreground)] uppercase">Quiz Electoral</h4>
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

        {/* Section 9: Database */}
        <section id="database" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">9</span>
                ESQUEMA DE BASE DE DATOS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-[var(--muted-foreground)] font-medium">
                PostgreSQL con 15+ tablas organizadas en dominios funcionales:
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Core Tables */}
                <div className="p-4 border-2 border-[var(--score-competence)]">
                  <h4 className="font-black text-[var(--score-competence-text)] mb-3 uppercase text-sm">Core</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-mono">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-competence)]" />
                      candidates
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-competence)]" />
                      scores
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-competence)]" />
                      score_breakdowns
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-competence)]" />
                      flags
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-competence)]" />
                      parties
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-competence)]" />
                      districts
                    </li>
                  </ul>
                </div>

                {/* Finance Tables */}
                <div className="p-4 border-2 border-[var(--score-integrity)]">
                  <h4 className="font-black text-[var(--score-integrity-text)] mb-3 uppercase text-sm">Financiamiento</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-mono">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-integrity)]" />
                      party_finances
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-integrity)]" />
                      party_donors
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-integrity)]" />
                      party_expenses
                    </li>
                  </ul>
                </div>

                {/* Content Tables */}
                <div className="p-4 border-2 border-[var(--score-transparency)]">
                  <h4 className="font-black text-[var(--score-transparency-text)] mb-3 uppercase text-sm">Contenido</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-mono">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-transparency)]" />
                      news_mentions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-transparency)]" />
                      social_mentions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--score-transparency)]" />
                      daily_facts
                    </li>
                  </ul>
                </div>

                {/* Engagement Tables */}
                <div className="p-4 border-2 border-[var(--primary)]">
                  <h4 className="font-black text-[var(--primary)] mb-3 uppercase text-sm">Engagement</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-mono">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--primary)]" />
                      quiz_responses
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--primary)]" />
                      candidate_positions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--primary)]" />
                      users (infraestructura)
                    </li>
                  </ul>
                </div>

                {/* Sync Tables */}
                <div className="p-4 border-2 border-[var(--border)] sm:col-span-2 lg:col-span-2">
                  <h4 className="font-black text-[var(--foreground)] mb-3 uppercase text-sm">Sincronización</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-mono grid grid-cols-2 gap-x-4">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--muted-foreground)]" />
                      sync_jobs
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--muted-foreground)]" />
                      sync_logs
                    </li>
                  </ul>
                </div>
              </div>

              {/* Key Schema Details */}
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)] font-mono text-xs overflow-x-auto">
                <pre className="text-[var(--foreground)]">{`
-- Tabla principal: candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  cargo ENUM('presidente','vicepresidente','senador','diputado','parlamento_andino'),
  party_id UUID REFERENCES parties(id),
  district_id UUID REFERENCES districts(id),

  -- Datos personales
  birth_date DATE,
  dni TEXT,

  -- Educación y experiencia (JSONB para flexibilidad)
  education_level TEXT,
  education_details JSONB,    -- [{level, institution, degree, dates, is_verified}]
  experience_details JSONB,    -- [{position, organization, sector, dates}]
  political_trajectory JSONB,  -- [{position, party, dates, is_elected}]

  -- Declaraciones
  assets_declaration JSONB,    -- {total_income, real_estate[], vehicles[]}
  penal_sentences JSONB,       -- [{type, description, date, status}]
  civil_sentences JSONB,
  party_resignations INT DEFAULT 0,

  -- Metadatos
  djhv_url TEXT,
  jne_id TEXT,
  is_active BOOLEAN DEFAULT true,
  data_verified BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de scores (1:1 con candidates)
CREATE TABLE scores (
  id UUID PRIMARY KEY,
  candidate_id UUID UNIQUE REFERENCES candidates(id),
  competence DECIMAL(5,2) CHECK (competence BETWEEN 0 AND 100),
  integrity DECIMAL(5,2) CHECK (integrity BETWEEN 0 AND 100),
  transparency DECIMAL(5,2) CHECK (transparency BETWEEN 0 AND 100),
  confidence DECIMAL(5,2) CHECK (confidence BETWEEN 0 AND 100),
  score_balanced DECIMAL(5,2) GENERATED ALWAYS AS (
    0.45 * competence + 0.45 * integrity + 0.10 * transparency
  ) STORED,
  score_merit DECIMAL(5,2) GENERATED ALWAYS AS (
    0.60 * competence + 0.30 * integrity + 0.10 * transparency
  ) STORED,
  score_integrity DECIMAL(5,2) GENERATED ALWAYS AS (
    0.30 * competence + 0.60 * integrity + 0.10 * transparency
  ) STORED,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`}</pre>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 10: API */}
        <section id="api" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">10</span>
                API REFERENCE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-[var(--muted-foreground)] font-medium">
                RESTful API con endpoints públicos y protegidos. Los endpoints de sync requieren autenticación.
              </p>

              {/* Public Endpoints */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-3 uppercase flex items-center gap-2">
                  <Badge variant="default" size="sm">PÚBLICO</Badge>
                  Endpoints Públicos
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[var(--border)]">
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Método</th>
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Endpoint</th>
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--muted-foreground)] font-mono text-xs">
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2"><Badge variant="default" size="sm">GET</Badge></td>
                        <td className="py-2">/api/candidates</td>
                        <td className="py-2 font-sans">Lista candidatos con filtros (cargo, distrito, partido)</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2"><Badge variant="default" size="sm">GET</Badge></td>
                        <td className="py-2">/api/candidates/[slug]</td>
                        <td className="py-2 font-sans">Detalle de candidato específico</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2"><Badge variant="default" size="sm">GET</Badge></td>
                        <td className="py-2">/api/parties</td>
                        <td className="py-2 font-sans">Lista de partidos políticos</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2"><Badge variant="default" size="sm">GET</Badge></td>
                        <td className="py-2">/api/parties/finances</td>
                        <td className="py-2 font-sans">Financiamiento de todos los partidos</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2"><Badge variant="default" size="sm">GET</Badge></td>
                        <td className="py-2">/api/news/trending</td>
                        <td className="py-2 font-sans">Noticias trending con actividad</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2"><Badge variant="default" size="sm">GET</Badge></td>
                        <td className="py-2">/api/districts</td>
                        <td className="py-2 font-sans">Lista de distritos electorales</td>
                      </tr>
                      <tr>
                        <td className="py-2"><Badge variant="secondary" size="sm">POST</Badge></td>
                        <td className="py-2">/api/quiz/submit</td>
                        <td className="py-2 font-sans">Enviar respuestas de quiz</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Protected Endpoints */}
              <div>
                <h4 className="font-black text-[var(--foreground)] mb-3 uppercase flex items-center gap-2">
                  <Badge variant="destructive" size="sm">PROTEGIDO</Badge>
                  Endpoints de Sincronización
                </h4>
                <p className="text-xs text-[var(--muted-foreground)] mb-3 font-medium">
                  Requieren header <code className="bg-[var(--muted)] px-1">CRON_SECRET</code> o autenticación de Vercel Cron.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[var(--border)]">
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Método</th>
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Endpoint</th>
                        <th className="text-left py-2 font-bold text-[var(--foreground)]">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--muted-foreground)] font-mono text-xs">
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2"><Badge variant="secondary" size="sm">POST</Badge></td>
                        <td className="py-2">/api/sync/jne</td>
                        <td className="py-2 font-sans">Sincronizar datos de JNE</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2"><Badge variant="secondary" size="sm">POST</Badge></td>
                        <td className="py-2">/api/sync/news</td>
                        <td className="py-2 font-sans">Sincronizar feeds RSS</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2"><Badge variant="secondary" size="sm">POST</Badge></td>
                        <td className="py-2">/api/sync/twitter</td>
                        <td className="py-2 font-sans">Sincronizar menciones Twitter</td>
                      </tr>
                      <tr className="border-b border-[var(--border)]">
                        <td className="py-2"><Badge variant="secondary" size="sm">POST</Badge></td>
                        <td className="py-2">/api/sync/ai-analysis</td>
                        <td className="py-2 font-sans">Ejecutar análisis IA en contenido</td>
                      </tr>
                      <tr>
                        <td className="py-2"><Badge variant="default" size="sm">GET</Badge></td>
                        <td className="py-2">/api/sync/status</td>
                        <td className="py-2 font-sans">Estado de jobs de sync</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Example Response */}
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <h5 className="font-bold text-[var(--foreground)] mb-2 text-sm">Ejemplo de Respuesta: GET /api/candidates/[slug]</h5>
                <pre className="font-mono text-xs text-[var(--foreground)] overflow-x-auto">{`{
  "id": "uuid",
  "slug": "keiko-fujimori",
  "full_name": "KEIKO SOFIA FUJIMORI HIGUCHI",
  "cargo": "presidente",
  "party": { "id": "uuid", "name": "Fuerza Popular", "short_name": "FP" },
  "scores": {
    "competence": 72.5,
    "integrity": 45.0,
    "transparency": 68.0,
    "confidence": 85.0,
    "score_balanced": 58.8,
    "score_merit": 60.3,
    "score_integrity": 57.3
  },
  "flags": [
    { "type": "PENAL_SENTENCE", "severity": "RED", "title": "..." }
  ],
  "education_details": [...],
  "experience_details": [...],
  ...
}`}</pre>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 11: Design System */}
        <section id="design-system" className="mb-12 scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">11</span>
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
                    <div className="text-xs font-bold text-[var(--foreground)]">Integridad</div>
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
                <span className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">12</span>
                SEGURIDAD Y PRIVACIDAD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Autenticación</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-medium">
                    <li>• CRON_SECRET para endpoints de sync</li>
                    <li>• Verificación de Vercel Cron headers</li>
                    <li>• Supabase Auth para usuarios (futuro)</li>
                  </ul>
                </div>
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Privacidad de Datos</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-medium">
                    <li>• DNI de donantes: solo últimos 4 dígitos</li>
                    <li>• No almacenamos datos personales de usuarios</li>
                    <li>• Quiz responses: anónimas con session ID</li>
                  </ul>
                </div>
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Infraestructura</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-medium">
                    <li>• Hosting en Vercel (SOC 2 compliant)</li>
                    <li>• Base de datos en Neon (encriptada)</li>
                    <li>• HTTPS obligatorio</li>
                  </ul>
                </div>
                <div className="p-4 border-2 border-[var(--border)]">
                  <h4 className="font-black text-[var(--foreground)] mb-2 uppercase text-sm">Neutralidad</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1 font-medium">
                    <li>• Sin afiliación política</li>
                    <li>• Metodología pública y auditable</li>
                    <li>• Reportes de errores abiertos</li>
                  </ul>
                </div>
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
        <div className="text-center space-x-4">
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
      </main>
    </div>
  )
}
