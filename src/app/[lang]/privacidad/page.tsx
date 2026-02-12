import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Link } from '@/i18n/routing'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Política de Privacidad - Ranking Electoral 2026',
    description: 'Conoce cómo recopilamos, usamos y protegemos tus datos personales en Ranking Electoral.',
    openGraph: {
      title: 'Política de Privacidad - Ranking Electoral 2026',
      description: 'Conoce cómo recopilamos, usamos y protegemos tus datos personales en Ranking Electoral.',
    },
  }
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/privacidad" />

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
            Política de Privacidad
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] font-medium max-w-2xl mx-auto">
            Conforme a la Ley N° 29733 — Ley de Protección de Datos Personales
          </p>
        </div>

        {/* Datos Recopilados */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>DATOS QUE RECOPILAMOS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Recopilamos la mínima cantidad de datos necesarios para operar la plataforma:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[var(--border)]">
                    <th scope="col" className="text-left py-2 font-black text-[var(--foreground)] uppercase">Dato</th>
                    <th scope="col" className="text-left py-2 font-black text-[var(--foreground)] uppercase">Propósito</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--muted-foreground)]">
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-2 font-medium">Session IDs</td>
                    <td className="py-2 font-medium">Identificar sesiones anónimas de navegación</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-2 font-medium">Page views (page_type, page_slug, referrer, UTM)</td>
                    <td className="py-2 font-medium">Análisis de uso y tráfico</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-2 font-medium">Share events</td>
                    <td className="py-2 font-medium">Medir alcance de contenido compartido</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-2 font-medium">Quiz responses (anónimas)</td>
                    <td className="py-2 font-medium">Generar resultados de afinidad electoral</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Direcciones IP (en user_sessions)</td>
                    <td className="py-2 font-medium">Seguridad y prevención de abuso</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-3 font-medium">
              No recopilamos nombres, correos electrónicos, ni datos de identificación personal
              a menos que el usuario los proporcione voluntariamente (por ejemplo, al enviar una solicitud de rectificación).
            </p>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>COOKIES</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Solo utilizamos cookies funcionales estrictamente necesarias para el funcionamiento de la plataforma.
            </p>
            <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
              <ul className="space-y-2 text-sm text-[var(--foreground)] font-medium">
                <li className="flex items-start gap-2">
                  <span className="font-black text-[var(--score-excellent-text)]">SÍ</span>
                  <span>Cookies funcionales para gestión de sesiones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-[var(--flag-red-text)]">NO</span>
                  <span>Cookies publicitarias</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-[var(--flag-red-text)]">NO</span>
                  <span>Cookies de rastreo de terceros</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-[var(--flag-red-text)]">NO</span>
                  <span>Cookies de redes sociales</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Retención */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>RETENCIÓN DE DATOS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Mantenemos los datos por el tiempo mínimo necesario:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <div className="font-black text-[var(--foreground)] uppercase mb-1">Sesiones</div>
                <div className="text-2xl font-black text-[var(--foreground)]">90 días</div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1">
                  Datos de sesión y navegación se eliminan automáticamente después de 90 días.
                </p>
              </div>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <div className="font-black text-[var(--foreground)] uppercase mb-1">Quiz Responses</div>
                <div className="text-2xl font-black text-[var(--foreground)]">30 días</div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1">
                  Las respuestas del quiz se anonimizan completamente a los 30 días.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Derechos ARCO */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>DERECHOS ARCO</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              De acuerdo con la Ley 29733 (Ley de Protección de Datos Personales), tienes los siguientes derechos:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 border-2 border-[var(--border)] bg-[var(--background)]">
                <h4 className="font-black text-[var(--foreground)] uppercase mb-1">Acceso</h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  Solicitar información sobre los datos personales que tenemos sobre ti.
                </p>
              </div>
              <div className="p-4 border-2 border-[var(--border)] bg-[var(--background)]">
                <h4 className="font-black text-[var(--foreground)] uppercase mb-1">Rectificación</h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  Solicitar la corrección de datos inexactos o incompletos.
                </p>
              </div>
              <div className="p-4 border-2 border-[var(--border)] bg-[var(--background)]">
                <h4 className="font-black text-[var(--foreground)] uppercase mb-1">Cancelación</h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  Solicitar la eliminación de tus datos personales de nuestros sistemas.
                </p>
              </div>
              <div className="p-4 border-2 border-[var(--border)] bg-[var(--background)]">
                <h4 className="font-black text-[var(--foreground)] uppercase mb-1">Oposición</h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  Oponerte al tratamiento de tus datos en determinadas circunstancias.
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-4 font-medium">
              Estos derechos están garantizados por la Ley 29733 y su reglamento (D.S. 003-2013-JUS).
            </p>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card className="mb-8 border-[var(--primary)]">
          <CardHeader>
            <CardTitle>CONTACTO</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Para ejercer cualquiera de tus derechos ARCO o si tienes preguntas sobre esta política de privacidad:
            </p>
            <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
              <div className="font-black text-[var(--foreground)] uppercase mb-2">Email</div>
              <a
                href="mailto:contacto@eleccionesperu2026.xyz"
                className="text-[var(--primary)] font-bold text-lg hover:underline"
              >
                contacto@eleccionesperu2026.xyz
              </a>
              <p className="text-sm text-[var(--muted-foreground)] font-medium mt-3">
                Nos comprometemos a responder en un máximo de 10 días hábiles.
              </p>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-4">
              Para correcciones de datos sobre candidatos, consulta nuestra{' '}
              <Link href="/rectificacion" className="underline font-bold text-[var(--foreground)]">
                página de rectificación
              </Link>.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wide">
            Última actualización: Febrero 2026
          </p>
        </div>
      </main>
    </div>
  )
}
