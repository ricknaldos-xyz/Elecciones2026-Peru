import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Link } from '@/i18n/routing'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Términos de Uso - EleccionesPerú2026',
    description: 'Términos y condiciones de uso de la plataforma EleccionesPerú2026. Conoce tus derechos y responsabilidades al usar nuestro sitio.',
    openGraph: {
      title: 'Términos de Uso - EleccionesPerú2026',
      description: 'Términos y condiciones de uso de la plataforma EleccionesPerú2026.',
    },
  }
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/terminos" />

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
            Términos de Uso
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] font-medium max-w-2xl mx-auto">
            Al acceder y utilizar EleccionesPerú2026, aceptas estos términos y condiciones.
          </p>
        </div>

        {/* Naturaleza de la plataforma */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>1. NATURALEZA DE LA PLATAFORMA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              EleccionesPerú2026 (accesible en eleccionesperu2026.xyz) es una plataforma informativa
              independiente que recopila, organiza y presenta datos públicos sobre candidatos y partidos
              políticos para las Elecciones Generales del Perú 2026.
            </p>
            <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
              <ul className="space-y-2 text-sm text-[var(--foreground)] font-medium">
                <li className="flex items-start gap-2">
                  <span className="font-black text-[var(--primary)] flex-shrink-0">a.</span>
                  <span>La plataforma es de acceso libre y gratuito para todos los ciudadanos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-[var(--primary)] flex-shrink-0">b.</span>
                  <span>No es un medio de comunicación periodístico ni un organismo electoral oficial.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-[var(--primary)] flex-shrink-0">c.</span>
                  <span>No tiene afiliación con ningún partido político, candidato ni entidad gubernamental.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-[var(--primary)] flex-shrink-0">d.</span>
                  <span>Está operada por EleccionesPerú2026, un proyecto independiente de tecnología cívica.</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Uso del contenido */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>2. USO DEL CONTENIDO</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              El contenido de la plataforma puede ser consultado, compartido y citado bajo las siguientes condiciones:
            </p>
            <div className="space-y-3">
              <div className="p-4 border-2 border-[var(--border)] bg-[var(--background)]">
                <h4 className="font-black text-[var(--foreground)] uppercase mb-1">Uso permitido</h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  Puedes compartir, citar y referenciar nuestro contenido para fines informativos, educativos,
                  periodísticos o de investigación, siempre que atribuyas la fuente como &quot;EleccionesPerú2026&quot;.
                </p>
              </div>
              <div className="p-4 border-2 border-[var(--border)] bg-[var(--background)]">
                <h4 className="font-black text-[var(--foreground)] uppercase mb-1">Uso no permitido</h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  No está permitido reproducir el contenido para fines comerciales sin autorización,
                  alterar los datos o scores presentados, ni utilizar nuestra marca para sugerir
                  respaldo o afiliación.
                </p>
              </div>
              <div className="p-4 border-2 border-[var(--border)] bg-[var(--background)]">
                <h4 className="font-black text-[var(--foreground)] uppercase mb-1">Datos de candidatos</h4>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">
                  Los datos sobre candidatos provienen de fuentes públicas oficiales (JNE, ONPE, Poder Judicial,
                  Contraloría, SUNAT, entre otros). Estos datos son de dominio público y se presentan con fines
                  de transparencia democrática.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descargo de responsabilidad */}
        <Card className="mb-8 border-orange-600">
          <CardHeader>
            <CardTitle>3. DESCARGO DE RESPONSABILIDAD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-[var(--muted-foreground)] font-medium">
              <p>
                <strong className="text-[var(--foreground)]">Información, no recomendación:</strong>{' '}
                La plataforma proporciona información y análisis basados en datos públicos. Los rankings,
                scores y análisis de viabilidad no constituyen una recomendación de voto. Cada ciudadano
                debe formar su propia opinión.
              </p>
              <p>
                <strong className="text-[var(--foreground)]">Exactitud de datos:</strong>{' '}
                Nos esforzamos por mantener la información actualizada y precisa. Sin embargo, no garantizamos
                la exactitud absoluta de todos los datos. Las fuentes oficiales (JNE, ONPE) son la referencia
                definitiva. Si encuentras un error, puedes reportarlo a través de nuestra{' '}
                <Link href="/rectificacion" className="underline font-bold text-[var(--foreground)]">
                  página de rectificación
                </Link>.
              </p>
              <p>
                <strong className="text-[var(--foreground)]">Análisis con IA:</strong>{' '}
                Algunos componentes de la plataforma utilizan inteligencia artificial para análisis de propuestas
                y extracción de datos. Estos análisis son aproximaciones y deben interpretarse como herramientas
                de referencia, no como valoraciones definitivas.
              </p>
              <p>
                <strong className="text-[var(--foreground)]">Disponibilidad:</strong>{' '}
                No garantizamos la disponibilidad ininterrumpida de la plataforma. Podemos realizar
                mantenimientos, actualizaciones o cambios en cualquier momento sin previo aviso.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scores y Metodología */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>4. SCORES Y METODOLOGÍA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              Los puntajes asignados a los candidatos se calculan mediante una metodología transparente y
              verificable:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <div className="font-black text-[var(--foreground)] uppercase mb-1">Competencia</div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">
                  Basada en educación, experiencia profesional y trayectoria política verificada.
                </p>
              </div>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <div className="font-black text-[var(--foreground)] uppercase mb-1">Integridad</div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">
                  Basada en historial legal, sentencias judiciales, sanciones y antecedentes verificados.
                </p>
              </div>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <div className="font-black text-[var(--foreground)] uppercase mb-1">Transparencia</div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">
                  Basada en completitud de declaraciones, consistencia de datos y verificabilidad.
                </p>
              </div>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <div className="font-black text-[var(--foreground)] uppercase mb-1">Plan de Gobierno</div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">
                  Análisis de viabilidad fiscal, legal, coherencia y precedentes históricos.
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-4">
              La metodología completa está disponible en nuestra{' '}
              <Link href="/metodologia" className="underline font-bold text-[var(--foreground)]">
                página de metodología
              </Link>{' '}
              y es de acceso público.
            </p>
          </CardContent>
        </Card>

        {/* Publicidad */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>5. PUBLICIDAD</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              La plataforma puede mostrar publicidad de terceros para financiar su operación. La publicidad:
            </p>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)] font-medium">
              <li className="flex items-start gap-2">
                <span className="font-black text-[var(--primary)] flex-shrink-0">—</span>
                <span>Está claramente identificada y separada del contenido editorial.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-[var(--primary)] flex-shrink-0">—</span>
                <span>No influye en los rankings, scores ni en el contenido de la plataforma.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-[var(--primary)] flex-shrink-0">—</span>
                <span>No incluye publicidad de partidos políticos ni candidatos.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-[var(--primary)] flex-shrink-0">—</span>
                <span>Puede ser gestionada por Google AdSense u otros proveedores de publicidad programática.</span>
              </li>
            </ul>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-4">
              Para más información, consulta nuestra{' '}
              <Link href="/publicidad" className="underline font-bold text-[var(--foreground)]">
                política de publicidad
              </Link>.
            </p>
          </CardContent>
        </Card>

        {/* Privacidad y cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>6. PRIVACIDAD Y COOKIES</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              El tratamiento de datos personales se rige por nuestra{' '}
              <Link href="/privacidad" className="underline font-bold text-[var(--foreground)]">
                Política de Privacidad
              </Link>, conforme a la Ley N° 29733 — Ley de Protección de Datos Personales del Perú.
            </p>
            <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
              <p className="text-sm text-[var(--foreground)] font-medium">
                En resumen: recopilamos datos mínimos y anónimos para estadísticas de uso.
                No recopilamos nombres, correos ni datos de identificación personal.
                Solo usamos cookies funcionales. No usamos cookies de rastreo.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Traducciones a lenguas originarias */}
        <Card className="mb-8 border-[var(--flag-amber)]">
          <CardHeader>
            <CardTitle>7. TRADUCCIONES A LENGUAS ORIGINARIAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-[var(--muted-foreground)] font-medium">
              <p>
                <strong className="text-[var(--foreground)]">Traducciones asistidas por IA:</strong>{' '}
                Las traducciones a quechua (Runasimi), aymara y asháninka han sido generadas con asistencia
                de inteligencia artificial y pueden contener imprecisiones lingüísticas, errores gramaticales
                o traducciones aproximadas.
              </p>
              <p>
                <strong className="text-[var(--foreground)]">Versión oficial:</strong>{' '}
                La versión en español constituye la versión oficial y autoritativa de todo el contenido
                de la plataforma. En caso de discrepancia entre la versión en español y cualquier traducción
                a lengua originaria, prevalecerá la versión en español.
              </p>
              <p>
                <strong className="text-[var(--foreground)]">Sin responsabilidad por imprecisiones:</strong>{' '}
                EleccionesPerú2026 no se hace responsable por decisiones tomadas en base a traducciones
                que pudieran contener errores. Recomendamos a los usuarios verificar información crítica
                en la versión en español.
              </p>
              <p>
                <strong className="text-[var(--foreground)]">Compromiso con las lenguas originarias:</strong>{' '}
                Reconocemos la importancia de las lenguas originarias del Perú conforme a la Ley N° 29735 —
                Ley de Lenguas. Ofrecemos estas traducciones como un esfuerzo de inclusión y accesibilidad,
                e invitamos activamente a hablantes nativos a contribuir con correcciones y mejoras.
              </p>
              <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                <p className="text-sm text-[var(--foreground)] font-medium">
                  Si eres hablante nativo de quechua, aymara o asháninka, puedes enviar correcciones
                  y sugerencias a{' '}
                  <a
                    href="mailto:contacto@eleccionesperu2026.xyz?subject=Corrección de traducción"
                    className="text-[var(--primary)] font-bold underline hover:no-underline"
                  >
                    contacto@eleccionesperu2026.xyz
                  </a>
                  . Toda contribución será revisada y acreditada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Propiedad intelectual */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>8. PROPIEDAD INTELECTUAL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium mb-4">
              El diseño, código fuente, marca, logotipos y la metodología de scoring son propiedad de
              EleccionesPerú2026. Los datos sobre candidatos y partidos son de dominio público y provienen
              de fuentes oficiales.
            </p>
            <p className="text-[var(--muted-foreground)] font-medium">
              El uso no autorizado de nuestra marca o la reproducción de nuestra metodología para
              crear productos que sugieran afiliación con EleccionesPerú2026 está prohibido.
            </p>
          </CardContent>
        </Card>

        {/* Modificaciones */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>9. MODIFICACIONES</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--muted-foreground)] font-medium">
              Nos reservamos el derecho de modificar estos términos en cualquier momento.
              Los cambios se publicarán en esta página con la fecha de última actualización.
              El uso continuado de la plataforma después de cambios constituye aceptación de los
              términos modificados.
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
              Para consultas sobre estos términos de uso:
            </p>
            <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
              <div className="font-black text-[var(--foreground)] uppercase mb-2">Email</div>
              <a
                href="mailto:contacto@eleccionesperu2026.xyz"
                className="text-[var(--primary)] font-bold text-lg hover:underline"
              >
                contacto@eleccionesperu2026.xyz
              </a>
            </div>
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
