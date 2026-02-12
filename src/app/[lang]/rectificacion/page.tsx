import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Link } from '@/i18n/routing'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Solicitud de Rectificación - EleccionesPerú2026',
    description: 'Solicita la corrección de datos inexactos sobre candidatos. Derecho de rectificación conforme a la Ley N° 29733, Art. 20.',
    openGraph: {
      title: 'Solicitud de Rectificación - EleccionesPerú2026',
      description: 'Solicita la corrección de datos inexactos sobre candidatos. Derecho de rectificación conforme a la Ley N° 29733, Art. 20.',
    },
  }
}

export default function RectificacionPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/rectificacion" />

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
            Solicitud de Rectificación
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] font-medium max-w-2xl mx-auto">
            Derecho de rectificación conforme a la Ley N° 29733, Art. 20
          </p>
        </div>

        {/* Paso 1 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>PASO 1: IDENTIFICACIÓN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 flex-shrink-0 bg-[var(--primary)] border-3 border-[var(--border)] flex items-center justify-center">
                <span className="text-white font-black text-lg">1</span>
              </div>
              <div className="flex-1">
                <p className="text-[var(--muted-foreground)] font-medium mb-4">
                  Proporciona los siguientes datos para identificar al solicitante:
                </p>
                <ul className="space-y-2 text-[var(--muted-foreground)]">
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">Nombre completo del solicitante</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">DNI del solicitante</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">Cargo al que postula (si aplica)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">Relación con el candidato (si no es el candidato mismo)</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 2 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>PASO 2: ESPECIFICAR EL ERROR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 flex-shrink-0 bg-[var(--primary)] border-3 border-[var(--border)] flex items-center justify-center">
                <span className="text-white font-black text-lg">2</span>
              </div>
              <div className="flex-1">
                <p className="text-[var(--muted-foreground)] font-medium mb-4">
                  Detalla con precisión el error que deseas corregir:
                </p>
                <ul className="space-y-2 text-[var(--muted-foreground)]">
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">Indicar qué dato específico es incorrecto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">Indicar en qué sección de la plataforma aparece</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">Proporcionar el dato correcto según fuentes oficiales</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 3 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>PASO 3: ADJUNTAR EVIDENCIA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 flex-shrink-0 bg-[var(--primary)] border-3 border-[var(--border)] flex items-center justify-center">
                <span className="text-white font-black text-lg">3</span>
              </div>
              <div className="flex-1">
                <p className="text-[var(--muted-foreground)] font-medium mb-4">
                  Adjunta documentación oficial que sustente la corrección:
                </p>
                <ul className="space-y-2 text-[var(--muted-foreground)]">
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">Documentos oficiales que sustenten la corrección (JNE, Poder Judicial, SUNAT, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">Las capturas de pantalla solas no son suficientes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">Solo se aceptan documentos de fuentes oficiales verificables</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 4 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>PASO 4: ENVIAR SOLICITUD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 flex-shrink-0 bg-[var(--primary)] border-3 border-[var(--border)] flex items-center justify-center">
                <span className="text-white font-black text-lg">4</span>
              </div>
              <div className="flex-1">
                <p className="text-[var(--muted-foreground)] font-medium mb-4">
                  Envía toda la documentación recopilada:
                </p>
                <ul className="space-y-2 text-[var(--muted-foreground)]">
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">
                      Enviar toda la documentación a:{' '}
                      <a
                        href="mailto:contacto@eleccionesperu2026.xyz"
                        className="text-[var(--primary)] font-bold hover:underline"
                      >
                        contacto@eleccionesperu2026.xyz
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black text-[var(--foreground)]">—</span>
                    <span className="font-medium">
                      Asunto del correo: &quot;Solicitud de Rectificación - [Nombre del Candidato]&quot;
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compromiso de Respuesta */}
        <Card className="mb-8 border-[var(--flag-amber)] bg-[var(--flag-amber)]/10">
          <CardContent className="p-6">
            <h3 className="font-black text-[var(--flag-amber-text)] mb-2 uppercase">
              Compromiso de Respuesta
            </h3>
            <ul className="space-y-2 text-sm text-[var(--foreground)] font-medium">
              <li className="flex items-start gap-2">
                <span className="font-black text-[var(--flag-amber-text)]">—</span>
                <span>Plazo máximo: 10 días hábiles desde la recepción</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-[var(--flag-amber-text)]">—</span>
                <span>Se notificará al solicitante sobre la resolución</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-[var(--flag-amber-text)]">—</span>
                <span>Si la corrección procede, se actualizará la plataforma y se recalculará el puntaje</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-[var(--flag-amber-text)]">—</span>
                <span>Referencia: Ley 29733, Art. 20</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card className="mb-8 border-[var(--primary)]">
          <CardHeader>
            <CardTitle>CONTACTO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
              <div className="font-black text-[var(--foreground)] uppercase mb-2">Email</div>
              <a
                href="mailto:contacto@eleccionesperu2026.xyz"
                className="text-[var(--primary)] font-bold text-lg hover:underline"
              >
                contacto@eleccionesperu2026.xyz
              </a>
              <p className="text-sm text-[var(--muted-foreground)] font-medium mt-3">
                Para más información sobre cómo protegemos tus datos, consulta nuestra{' '}
                <Link
                  href="/privacidad"
                  className="text-[var(--primary)] font-bold hover:underline"
                >
                  Política de Privacidad
                </Link>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-sm text-[var(--muted-foreground)] font-medium">
          Este proceso es gratuito y está disponible para cualquier candidato o su representante legal.
        </p>
      </main>
    </div>
  )
}
