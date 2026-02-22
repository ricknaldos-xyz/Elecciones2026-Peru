'use client'

import Link from 'next/link'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header-like bar so crawler sees navigation */}
      <div className="border-b-3 border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center">
            <span className="text-white font-black text-sm">EP</span>
          </div>
          <span className="text-lg font-black text-[var(--foreground)] uppercase">
            EleccionesPerú2026
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="border-3 border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-brutal)] p-6 sm:p-8">
          <h1 className="text-2xl font-black uppercase text-[var(--foreground)] mb-3">
            Estamos actualizando los datos
          </h1>
          <p className="text-[var(--muted-foreground)] font-medium mb-2">
            EleccionesPerú2026 es la plataforma de ranking transparente de candidatos
            para las Elecciones Generales del 12 de abril de 2026, basada en mérito,
            historial legal y evidencia de fuentes oficiales.
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Estamos procesando datos. Esta página estará disponible en unos momentos.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-[var(--primary)] text-white font-bold uppercase border-2 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] transition-all"
            >
              Reintentar
            </button>
            <Link
              href="/ranking"
              className="px-6 py-3 bg-[var(--card)] text-[var(--foreground)] font-bold uppercase border-2 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] transition-all"
            >
              Ver Ranking
            </Link>
          </div>

          {/* Content for crawlers - shows this is a real site with real sections */}
          <div className="border-t-2 border-[var(--border)] pt-6">
            <h2 className="text-sm font-black uppercase text-[var(--muted-foreground)] mb-3">
              Secciones disponibles
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Link href="/ranking" className="px-3 py-2 text-xs font-bold uppercase bg-[var(--muted)] border-2 border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                Ranking de candidatos
              </Link>
              <Link href="/comparar" className="px-3 py-2 text-xs font-bold uppercase bg-[var(--muted)] border-2 border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                Comparar candidatos
              </Link>
              <Link href="/noticias" className="px-3 py-2 text-xs font-bold uppercase bg-[var(--muted)] border-2 border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                Noticias electorales
              </Link>
              <Link href="/quiz" className="px-3 py-2 text-xs font-bold uppercase bg-[var(--muted)] border-2 border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                Quiz electoral
              </Link>
              <Link href="/transparencia" className="px-3 py-2 text-xs font-bold uppercase bg-[var(--muted)] border-2 border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                Transparencia financiera
              </Link>
              <Link href="/metodologia" className="px-3 py-2 text-xs font-bold uppercase bg-[var(--muted)] border-2 border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                Metodología
              </Link>
            </div>
          </div>

          {/* Legal links for crawlers - critical for AdSense */}
          <div className="border-t-2 border-[var(--border)] pt-4 mt-4">
            <div className="flex flex-wrap gap-4 text-xs font-bold text-[var(--muted-foreground)] uppercase">
              <Link href="/privacidad" className="hover:text-[var(--foreground)] hover:underline transition-colors">
                Política de Privacidad
              </Link>
              <Link href="/terminos" className="hover:text-[var(--foreground)] hover:underline transition-colors">
                Términos de Uso
              </Link>
              <Link href="/sobre-nosotros" className="hover:text-[var(--foreground)] hover:underline transition-colors">
                Sobre Nosotros
              </Link>
              <Link href="/publicidad" className="hover:text-[var(--foreground)] hover:underline transition-colors">
                Publicidad
              </Link>
              <a href="mailto:contacto@eleccionesperu2026.xyz" className="hover:text-[var(--foreground)] hover:underline transition-colors">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
