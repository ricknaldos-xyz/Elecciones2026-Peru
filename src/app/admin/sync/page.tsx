import { Metadata } from 'next'
import { SyncDashboard } from './SyncDashboard'

export const metadata: Metadata = {
  title: 'Panel de Sincronización - Admin',
  robots: 'noindex, nofollow',
}

export const dynamic = 'force-dynamic'

export default function SyncAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Panel de Sincronización
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Estado de las fuentes de datos y logs de sincronización
              </p>
            </div>
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Volver al sitio
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <SyncDashboard />
      </main>
    </div>
  )
}
