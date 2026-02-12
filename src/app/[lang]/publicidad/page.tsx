import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export async function generateMetadata(): Promise<Metadata> {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://eleccionesperu2026.xyz'
  return {
    title: 'Publicidad - Ranking Electoral Perú 2026',
    description: 'Anuncia tu marca en la plataforma electoral más transparente del Perú. Espacios publicitarios para empresas y organizaciones responsables.',
    alternates: {
      canonical: `${BASE_URL}/es/publicidad`,
    },
  }
}

const AD_SLOTS = [
  {
    name: 'Banner Principal',
    slot: 'home-header',
    location: 'Top del homepage',
    sizes: '970x250 (desktop) / 728x90 (tablet) / 320x100 (mobile)',
    impressions: 'Todas las visitas al homepage',
    highlight: true,
  },
  {
    name: 'Banner Central',
    slot: 'home-mid',
    location: 'Entre secciones del homepage',
    sizes: '970x250 / 728x90 / 320x100',
    impressions: 'Alto scroll engagement',
    highlight: false,
  },
  {
    name: 'Sidebar Noticias',
    slot: 'home-sidebar',
    location: 'Junto a noticias trending',
    sizes: '300x250',
    impressions: 'Visitas al homepage (desktop)',
    highlight: false,
  },
  {
    name: 'Banner Páginas Internas',
    slot: 'internal-header',
    location: 'Top de ranking, candidatos, comparar',
    sizes: '970x250 / 728x90 / 320x100',
    impressions: 'Todas las páginas internas',
    highlight: true,
  },
  {
    name: 'Sidebar Candidato',
    slot: 'internal-sidebar',
    location: 'Perfil de candidato y ranking',
    sizes: '300x250 / 300x600',
    impressions: 'Páginas más visitadas',
    highlight: false,
  },
]

export default function PublicidadPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">ESPACIOS PUBLICITARIOS</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
            Anuncia en Ranking Electoral
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] font-medium max-w-2xl mx-auto">
            Conecta tu marca con cientos de miles de ciudadanos peruanos informados durante las elecciones generales 2026.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {[
            { label: 'Candidatos', value: '44+' },
            { label: 'Partidos', value: '36+' },
            { label: 'Páginas', value: '200+' },
            { label: 'Distritos', value: '27' },
          ].map((stat) => (
            <div key={stat.label} className="border-3 border-[var(--border)] bg-[var(--card)] p-4 text-center shadow-[var(--shadow-brutal)]">
              <div className="text-2xl sm:text-3xl font-black text-[var(--primary)]">{stat.value}</div>
              <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Por qué anunciar */}
        <Card className="mb-12 shadow-[var(--shadow-brutal-lg)]">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6">
              ¿Por qué anunciar con nosotros?
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  title: 'Audiencia comprometida',
                  desc: 'Ciudadanos que buscan activamente información electoral. Alto engagement y tiempo en página.',
                },
                {
                  title: 'Contexto de confianza',
                  desc: 'Tu marca junto a datos verificados y transparentes. Asociación positiva con la democracia.',
                },
                {
                  title: 'Tráfico orgánico explosivo',
                  desc: 'Las búsquedas electorales se multiplican x100 en época de elecciones. Abril 2026 será pico.',
                },
                {
                  title: 'Multi-plataforma',
                  desc: 'Diseño responsive. Tu anuncio se ve perfecto en desktop, tablet y móvil.',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-8 h-8 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--foreground)] uppercase">{item.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Espacios disponibles */}
        <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6">
          Espacios disponibles
        </h2>
        <div className="space-y-3 mb-12">
          {AD_SLOTS.map((slot) => (
            <div
              key={slot.slot}
              className={`border-3 border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 ${slot.highlight ? 'shadow-[var(--shadow-brutal)]' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-black text-[var(--foreground)] uppercase">{slot.name}</h3>
                  {slot.highlight && <Badge variant="primary" size="sm">POPULAR</Badge>}
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">{slot.location}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="font-bold text-[var(--muted-foreground)] uppercase">Tamaños</span>
                  <div className="font-bold text-[var(--foreground)] mt-0.5">{slot.sizes}</div>
                </div>
                <div>
                  <span className="font-bold text-[var(--muted-foreground)] uppercase">Alcance</span>
                  <div className="font-bold text-[var(--foreground)] mt-0.5">{slot.impressions}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Política editorial */}
        <Card className="mb-12 border-orange-600 shadow-[var(--shadow-brutal)]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-600 border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H1.345c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l8.354 14.498zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight mb-3">
                  Política editorial de publicidad
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Ranking Electoral es una plataforma independiente y transparente. Para mantener nuestra credibilidad, aplicamos las siguientes políticas:
                </p>
                <ul className="space-y-2">
                  {[
                    'No aceptamos publicidad de partidos políticos, candidatos ni organizaciones políticas.',
                    'No aceptamos publicidad de casas de apuestas, contenido para adultos ni productos ilegales.',
                    'No aceptamos publicidad engañosa, discriminatoria o que promueva desinformación.',
                    'Toda publicidad se identifica claramente como "Publicidad" o "Patrocinado".',
                    'Los anunciantes no tienen influencia sobre nuestro contenido editorial, scores ni rankings.',
                    'Nos reservamos el derecho de rechazar cualquier anuncio que no cumpla con estos criterios.',
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                      <svg className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formatos aceptados */}
        <Card className="mb-12">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
              Formatos aceptados
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { format: 'Imagen estática', types: 'PNG, JPG, WebP', note: 'Max 150KB' },
                { format: 'GIF animado', types: 'GIF', note: 'Max 300KB, sin flash' },
                { format: 'HTML5', types: 'HTML/CSS/JS', note: 'Previa aprobación' },
              ].map((f) => (
                <div key={f.format} className="border-2 border-[var(--border)] p-4">
                  <div className="text-sm font-black text-[var(--foreground)] uppercase">{f.format}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">{f.types}</div>
                  <div className="text-xs font-bold text-[var(--primary)] mt-1">{f.note}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA - Contacto */}
        <div className="border-3 border-[var(--border)] bg-[var(--primary)] p-8 sm:p-10 text-center shadow-[var(--shadow-brutal-lg)]">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
            ¿Quieres anunciar?
          </h2>
          <p className="text-white/80 font-medium mb-6 max-w-lg mx-auto">
            Escríbenos para recibir nuestro media kit con tarifas actualizadas, métricas de tráfico y opciones de patrocinio.
          </p>
          <a
            href="mailto:publicidad@eleccionesperu2026.xyz"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--primary)] font-black text-sm uppercase border-3 border-[var(--border)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] transition-all duration-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            publicidad@eleccionesperu2026.xyz
          </a>
          <p className="text-white/60 text-xs font-medium mt-4 uppercase">
            Respuesta en menos de 24 horas
          </p>
        </div>
      </main>
    </div>
  )
}
