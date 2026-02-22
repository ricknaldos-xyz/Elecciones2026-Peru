import Link from 'next/link'

export const metadata = {
  title: 'Página no encontrada - EleccionesPerú2026',
  description: 'La página que buscas no existe.',
  robots: 'noindex',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center border-3 border-[var(--border)] bg-[var(--card)] p-8 shadow-[var(--shadow-brutal)] max-w-md">
          <h1 className="text-6xl font-black text-[var(--primary)] mb-4">404</h1>
          <h2 className="text-xl font-black uppercase text-[var(--foreground)] mb-4">
            Página no encontrada
          </h2>
          <p className="text-[var(--muted-foreground)] font-medium mb-6">
            La página que buscas no existe o fue movida.
          </p>
          <Link
            href="/ranking"
            className="inline-block px-6 py-3 bg-[var(--primary)] text-white font-bold uppercase border-2 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] transition-all"
          >
            Ir al Ranking
          </Link>

          {/* Navigation links for crawlers */}
          <div className="mt-6 pt-4 border-t-2 border-[var(--border)]">
            <div className="flex flex-wrap justify-center gap-3 text-xs font-bold text-[var(--muted-foreground)] uppercase">
              <Link href="/ranking" className="hover:text-[var(--foreground)] hover:underline">Ranking</Link>
              <Link href="/comparar" className="hover:text-[var(--foreground)] hover:underline">Comparar</Link>
              <Link href="/noticias" className="hover:text-[var(--foreground)] hover:underline">Noticias</Link>
              <Link href="/quiz" className="hover:text-[var(--foreground)] hover:underline">Quiz</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with legal links - critical for AdSense crawlers */}
      <div className="border-t-2 border-[var(--border)] bg-[var(--card)] py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-4 text-xs font-bold text-[var(--muted-foreground)] uppercase">
          <Link href="/privacidad" className="hover:text-[var(--foreground)] hover:underline">Política de Privacidad</Link>
          <Link href="/terminos" className="hover:text-[var(--foreground)] hover:underline">Términos de Uso</Link>
          <Link href="/sobre-nosotros" className="hover:text-[var(--foreground)] hover:underline">Sobre Nosotros</Link>
          <Link href="/publicidad" className="hover:text-[var(--foreground)] hover:underline">Publicidad</Link>
          <a href="mailto:contacto@eleccionesperu2026.xyz" className="hover:text-[var(--foreground)] hover:underline">Contacto</a>
        </div>
      </div>
    </div>
  )
}
