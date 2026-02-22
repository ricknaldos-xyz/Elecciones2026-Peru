import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Link } from '@/i18n/routing'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sobre Nosotros - EleccionesPerú2026',
    description: 'Conoce la misión, metodología y equipo detrás de EleccionesPerú2026, la plataforma de transparencia electoral más completa del Perú.',
    openGraph: {
      title: 'Sobre Nosotros - EleccionesPerú2026',
      description: 'Conoce la misión, metodología y equipo detrás de EleccionesPerú2026.',
    },
  }
}

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/sobre-nosotros" />

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
            Sobre Nosotros
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] font-medium max-w-2xl mx-auto">
            Elige con datos, no con promesas.
          </p>
        </div>

        {/* Misión */}
        <Card className="mb-8 border-[var(--primary)] shadow-[var(--shadow-brutal)]">
          <CardHeader>
            <CardTitle>NUESTRA MISIÓN</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              EleccionesPerú2026 nació con una misión clara: empoderar a los ciudadanos peruanos
              con información verificable y transparente para tomar decisiones informadas en las
              Elecciones Generales del 12 de abril de 2026.
            </p>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              En un contexto donde la desinformación y la falta de transparencia debilitan la democracia,
              creemos que el acceso a datos objetivos sobre los candidatos es un derecho de todo ciudadano.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
                <div className="text-2xl font-black text-[var(--primary)]">44+</div>
                <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">
                  Candidatos presidenciales
                </div>
              </div>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
                <div className="text-2xl font-black text-[var(--primary)]">7,000+</div>
                <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">
                  Candidatos analizados
                </div>
              </div>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
                <div className="text-2xl font-black text-[var(--primary)]">10+</div>
                <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">
                  Fuentes de datos oficiales
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qué hacemos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>QUÉ HACEMOS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'Recopilamos datos de fuentes oficiales',
                  desc: 'Hojas de vida del JNE, registros judiciales del Poder Judicial, datos de la Contraloría, SUNAT, ONPE, MEF, INDECOPI, SUNAFIL, OEFA y otras entidades públicas.',
                },
                {
                  title: 'Analizamos planes de gobierno con IA',
                  desc: 'Extraemos y evaluamos las propuestas de los planes de gobierno de cada candidato presidencial usando inteligencia artificial, analizando viabilidad fiscal, legal, coherencia y precedentes históricos.',
                },
                {
                  title: 'Calculamos scores transparentes',
                  desc: 'Nuestro sistema de puntuación evalúa a cada candidato en competencia, integridad, transparencia y calidad del plan de gobierno, con una metodología pública y verificable.',
                },
                {
                  title: 'Monitoreamos noticias electorales',
                  desc: 'Recopilamos y organizamos noticias de más de 10 medios peruanos para mantener a los ciudadanos informados sobre la cobertura mediática de cada candidato.',
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

        {/* Modelo de financiamiento */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>MODELO DE FINANCIAMIENTO</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              EleccionesPerú2026 es un proyecto independiente que se financia a través de publicidad digital
              para mantener el acceso gratuito a toda la información electoral:
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <h4 className="font-black text-[var(--foreground)] uppercase mb-1">Google AdSense</h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  Utilizamos Google AdSense para mostrar anuncios no intrusivos que nos permiten cubrir
                  los costos de servidores, bases de datos y desarrollo. Los anuncios no influyen en
                  nuestros rankings ni contenido editorial.
                </p>
              </div>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <h4 className="font-black text-[var(--foreground)] uppercase mb-1">Patrocinios directos</h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  Aceptamos patrocinios de empresas y organizaciones que compartan nuestros valores de
                  transparencia. No aceptamos patrocinios de partidos políticos ni candidatos. Consulta nuestra{' '}
                  <Link href="/publicidad" className="underline font-bold text-[var(--foreground)]">página de publicidad</Link>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Independencia editorial */}
        <Card className="mb-8 border-orange-600 shadow-[var(--shadow-brutal)]">
          <CardHeader>
            <CardTitle>INDEPENDENCIA EDITORIAL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-600 border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)] font-medium mb-4">
                  La independencia editorial es nuestro principio fundamental. Garantizamos que:
                </p>
                <ul className="space-y-2 text-sm text-[var(--foreground)] font-medium">
                  <li className="flex items-start gap-2">
                    <span className="font-black text-orange-600 flex-shrink-0">1.</span>
                    <span>No tenemos afiliación con ningún partido político, candidato ni organización política.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-orange-600 flex-shrink-0">2.</span>
                    <span>Ningún anunciante influye en nuestros rankings, scores o contenido editorial.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-orange-600 flex-shrink-0">3.</span>
                    <span>No aceptamos financiamiento de partidos políticos ni candidatos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-orange-600 flex-shrink-0">4.</span>
                    <span>Nuestra metodología es pública y cualquier ciudadano puede verificar los datos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-orange-600 flex-shrink-0">5.</span>
                    <span>Aplicamos los mismos criterios a todos los candidatos, sin excepción.</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fuentes de datos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>FUENTES DE DATOS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Toda nuestra información proviene de fuentes oficiales y públicas:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { name: 'JNE', desc: 'Hojas de vida, trayectoria política, declaraciones juradas' },
                { name: 'ONPE', desc: 'Datos electorales, sanciones, infracciones' },
                { name: 'Poder Judicial', desc: 'Sentencias penales, civiles y laborales' },
                { name: 'Contraloría', desc: 'Informes de control, declaraciones patrimoniales' },
                { name: 'SUNAT', desc: 'Estado tributario, deudas coactivas' },
                { name: 'MEF', desc: 'Ejecución presupuestal de funcionarios' },
                { name: 'INDECOPI', desc: 'Sanciones por competencia desleal' },
                { name: 'SUNAFIL', desc: 'Infracciones laborales empresariales' },
                { name: 'OEFA', desc: 'Infracciones ambientales' },
                { name: 'Congreso', desc: 'Registros de votación en leyes controversiales' },
              ].map((source) => (
                <div key={source.name} className="p-3 border-2 border-[var(--border)]">
                  <span className="font-black text-[var(--foreground)] text-sm uppercase">{source.name}</span>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{source.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-4">
              La lista completa de fuentes y la metodología de recopilación están disponibles en nuestra{' '}
              <Link href="/transparencia" className="underline font-bold text-[var(--foreground)]">
                página de transparencia
              </Link>{' '}
              y{' '}
              <Link href="/metodologia" className="underline font-bold text-[var(--foreground)]">
                metodología
              </Link>.
            </p>
          </CardContent>
        </Card>

        {/* Tecnología */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>TECNOLOGÍA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              La plataforma está construida con tecnología moderna para garantizar rendimiento,
              accesibilidad y transparencia:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <div className="font-black text-[var(--foreground)] uppercase mb-1">Multilingüe</div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">
                  Disponible en Español, Quechua, Aymara y Asháninka para inclusión de pueblos originarios.
                </p>
              </div>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <div className="font-black text-[var(--foreground)] uppercase mb-1">Accesible</div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">
                  Diseñada siguiendo estándares de accesibilidad web (WCAG) con soporte para lectores de pantalla.
                </p>
              </div>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <div className="font-black text-[var(--foreground)] uppercase mb-1">IA Responsable</div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">
                  Usamos IA para análisis de planes de gobierno con total transparencia sobre las limitaciones del modelo.
                </p>
              </div>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <div className="font-black text-[var(--foreground)] uppercase mb-1">Datos abiertos</div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">
                  Toda la información es verificable y proviene de fuentes públicas oficiales del Estado peruano.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <div className="border-3 border-[var(--border)] bg-[var(--primary)] p-8 sm:p-10 text-center shadow-[var(--shadow-brutal-lg)]">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
            Contáctanos
          </h2>
          <p className="text-white/80 font-medium mb-6 max-w-lg mx-auto">
            ¿Tienes preguntas, sugerencias o encontraste un error? Estamos aquí para ayudarte.
          </p>
          <a
            href="mailto:contacto@eleccionesperu2026.xyz"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--primary)] font-black text-sm uppercase border-3 border-[var(--border)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] transition-all duration-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            contacto@eleccionesperu2026.xyz
          </a>
          <p className="text-white/60 text-xs font-medium mt-4 uppercase">
            Respondemos en menos de 24 horas
          </p>
        </div>
      </main>
    </div>
  )
}
