import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Para Medios y Partners | Ranking Electoral Peru 2026',
  description: 'Embebe los widgets de Ranking Electoral en tu sitio web. Informacion electoral verificada y actualizada para tus lectores.',
}

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/partners" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="primary" size="md" className="mb-4">
            Para Medios
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase mb-4">
            Widgets Embebibles
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
            Lleva informacion electoral verificada a tus lectores. Nuestros widgets son gratuitos y se actualizan automaticamente.
          </p>
        </div>

        {/* Widget Types */}
        <div className="grid gap-6 mb-12">
          {/* Candidate Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center">
                  <span className="text-white font-black text-sm">C</span>
                </div>
                Widget de Candidato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)] mb-4">
                Muestra el perfil resumido de un candidato con su score, subscores y enlace al perfil completo.
              </p>

              <div className="bg-[var(--muted)] p-4 border-2 border-[var(--border)] mb-4 overflow-x-auto">
                <pre className="text-sm text-[var(--foreground)]">
{`<iframe
  src="https://rankinelectoral.pe/embed/candidate/keiko-fujimori"
  width="400"
  height="220"
  frameborder="0"
  style="border: none; max-width: 100%;"
></iframe>`}
                </pre>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/embed/candidate/keiko-fujimori" target="_blank">
                  <Button variant="secondary" size="sm">
                    Ver ejemplo
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Ranking Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--score-good)] border-2 border-[var(--border)] flex items-center justify-center">
                  <span className="text-white font-black text-sm">R</span>
                </div>
                Widget de Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)] mb-4">
                Muestra el top de candidatos por cargo. Configurable por cantidad y tipo de cargo.
              </p>

              <div className="bg-[var(--muted)] p-4 border-2 border-[var(--border)] mb-4 overflow-x-auto">
                <pre className="text-sm text-[var(--foreground)]">
{`<iframe
  src="https://rankinelectoral.pe/embed/ranking?cargo=presidente&limit=5"
  width="450"
  height="500"
  frameborder="0"
  style="border: none; max-width: 100%;"
></iframe>`}
                </pre>
              </div>

              <h4 className="font-bold text-[var(--foreground)] mb-2 uppercase text-sm">Parametros:</h4>
              <ul className="text-sm text-[var(--muted-foreground)] space-y-1 mb-4">
                <li><code className="bg-[var(--muted)] px-1">cargo</code>: presidente, senador, diputado, parlamento_andino</li>
                <li><code className="bg-[var(--muted)] px-1">limit</code>: 1-10 (cantidad de candidatos)</li>
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link href="/embed/ranking?cargo=presidente&limit=5" target="_blank">
                  <Button variant="secondary" size="sm">
                    Ver ejemplo presidentes
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/embed/ranking?cargo=senador&limit=5" target="_blank">
                  <Button variant="outline" size="sm">
                    Ver ejemplo senadores
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Beneficios para tu medio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--score-excellent)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">100% Gratuito</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">Sin costos ni licencias</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--score-good)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">Actualizacion automatica</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">Datos siempre al dia</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">Fuentes oficiales</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">Datos de JNE, ONPE, DJHV</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[var(--score-medium)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">Responsive</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">Funciona en cualquier dispositivo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-[var(--foreground)] text-[var(--background)]">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-black uppercase mb-2">Necesitas algo personalizado?</h3>
            <p className="text-[var(--background)]/70 mb-4">
              Contactanos para widgets personalizados, APIs o integraciones especiales.
            </p>
            <a href="mailto:contacto@rankinelectoral.pe">
              <Button className="bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]">
                Contactar
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
