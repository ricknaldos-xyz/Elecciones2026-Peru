import Link from 'next/link'

export const metadata = {
  title: 'Página no encontrada - EleccionesPerú2026',
  description: 'La página que buscas no existe.',
  robots: 'noindex',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="text-center border-3 border-[var(--border)] bg-[var(--card)] p-8 shadow-[var(--shadow-brutal)] max-w-md">
        <h1 className="text-6xl font-black text-[var(--primary)] mb-4">404</h1>
        <h2 className="text-xl font-black uppercase text-[var(--foreground)] mb-4">
          Página no encontrada
        </h2>
        <p className="text-[var(--muted-foreground)] font-medium mb-6">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/es/ranking"
          className="inline-block px-6 py-3 bg-[var(--primary)] text-white font-bold uppercase border-2 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] transition-all"
        >
          Ir al Ranking
        </Link>
      </div>
    </div>
  )
}
