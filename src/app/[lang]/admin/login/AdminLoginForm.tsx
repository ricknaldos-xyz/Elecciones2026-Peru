'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export function AdminLoginForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const redirectTo = searchParams.get('redirect') || '/es/admin/sync'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Login request
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Error de autenticación')
        setLoading(false)
        return
      }

      // 2. Wait for browser to process the cookie
      await new Promise(resolve => setTimeout(resolve, 150))

      // 3. Verify session was created
      const checkAuth = await fetch('/api/admin/auth', {
        credentials: 'include',
      })
      const authData = await checkAuth.json()

      if (!authData.authenticated) {
        setError('Error al crear sesión. Intenta de nuevo.')
        setLoading(false)
        return
      }

      // 4. Full page navigation (avoids Next.js middleware race condition)
      window.location.href = redirectTo
    } catch (err) {
      setError('Error de conexión')
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-500 p-3 text-red-700 dark:text-red-300 text-sm font-medium">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-bold uppercase tracking-wide mb-2">
          Contraseña
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          className="w-full px-4 py-3 border-3 border-[var(--border)] bg-[var(--background)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all"
          placeholder="Ingresa la contraseña"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold uppercase tracking-wide border-3 border-[var(--border)] shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-brutal transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
            Verificando...
          </span>
        ) : (
          'Ingresar'
        )}
      </button>

      <p className="text-xs text-center text-[var(--muted-foreground)]">
        Si no tienes acceso, contacta al administrador del sistema.
      </p>
    </form>
  )
}
