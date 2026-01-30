import { Metadata } from 'next'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Ranking Electoral Perú 2026 - Widget',
  robots: {
    index: false,
    follow: false,
  },
}

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-transparent">
        {children}
      </body>
    </html>
  )
}
