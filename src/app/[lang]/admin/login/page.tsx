import { Metadata } from 'next'
import { Suspense } from 'react'
import { AdminLoginForm } from './AdminLoginForm'

export const metadata: Metadata = {
  title: 'Admin Login - Voto Informado',
  robots: 'noindex, nofollow',
}

function LoginFormFallback() {
  return (
    <div className="space-y-6">
      <div className="h-12 bg-[var(--muted)] animate-pulse"></div>
      <div className="h-12 bg-[var(--muted)] animate-pulse"></div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--card)] border-3 border-[var(--border)] shadow-brutal p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
              Admin Panel
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Acceso restringido
            </p>
          </div>
          <Suspense fallback={<LoginFormFallback />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
