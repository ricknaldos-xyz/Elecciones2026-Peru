'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const adminNavItems = [
  { href: '/admin/noticias', label: 'Noticias', icon: '📰' },
  { href: '/admin/flags', label: 'Alertas', icon: '🚩' },
  { href: '/admin/candidatos', label: 'Candidatos', icon: '👤' },
  { href: '/admin/sync', label: 'Sync', icon: '🔄' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)

  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'es'

  // Don't show layout on login page
  const isLoginPage = pathname.includes('/admin/login')
  if (isLoginPage) {
    return <>{children}</>
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      router.push(`/${locale}/admin/login`)
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Admin Header */}
      <header className="bg-[var(--card)] border-b-3 border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/admin`}
                className="flex items-center gap-2 font-black text-xl uppercase tracking-tight hover:opacity-80 transition-opacity"
              >
                <span className="text-2xl">⚙️</span>
                <span>Admin Panel</span>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-1 ml-8">
                {adminNavItems.map((item) => {
                  const isActive = pathname.includes(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={`/${locale}${item.href}`}
                      className={`px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                        isActive
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : 'hover:bg-[var(--muted)]'
                      }`}
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Back to site */}
              <Link
                href={`/${locale}`}
                className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al sitio
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-4 py-2 text-sm font-bold uppercase border-2 border-[var(--border)] bg-[var(--muted)] hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {loggingOut ? 'Saliendo...' : 'Cerrar Sesión'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[var(--border)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-[var(--muted-foreground)] text-center">
            Panel de Administración - Voto Informado
          </p>
        </div>
      </footer>
    </div>
  )
}
