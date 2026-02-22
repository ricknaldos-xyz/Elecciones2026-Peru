'use client'

export default function CandidateError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-black uppercase text-[var(--foreground)] mb-4">
          Error al cargar candidato
        </h2>
        <p className="text-[var(--muted-foreground)] font-medium mb-2">
          No pudimos cargar la información del candidato. Puede que la página no exista o haya un problema temporal.
        </p>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          EleccionesPerú2026 analiza más de 7,000 candidatos con datos de fuentes oficiales como el JNE, Poder Judicial, Contraloría, SUNAT y más.
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Código: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center mb-6">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[var(--primary)] text-white font-bold uppercase border-2 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] transition-all"
          >
            Intentar de nuevo
          </button>
          <a
            href="/ranking"
            className="px-6 py-3 bg-[var(--card)] text-[var(--foreground)] font-bold uppercase border-2 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] transition-all"
          >
            Ver ranking
          </a>
        </div>

        {/* Legal links for crawlers */}
        <div className="pt-4 border-t-2 border-[var(--border)]">
          <div className="flex flex-wrap justify-center gap-3 text-xs font-bold text-[var(--muted-foreground)] uppercase">
            <a href="/privacidad" className="hover:text-[var(--foreground)] hover:underline">Privacidad</a>
            <a href="/terminos" className="hover:text-[var(--foreground)] hover:underline">Términos</a>
            <a href="/sobre-nosotros" className="hover:text-[var(--foreground)] hover:underline">Sobre Nosotros</a>
            <a href="mailto:contacto@eleccionesperu2026.xyz" className="hover:text-[var(--foreground)] hover:underline">Contacto</a>
          </div>
        </div>
      </div>
    </div>
  )
}
