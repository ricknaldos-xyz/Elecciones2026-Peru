'use client'

export default function CandidateError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Error al cargar candidato
        </h2>
        <p className="text-gray-600 mb-6">
          No pudimos cargar la información del candidato. Puede que la página no exista o haya un problema temporal.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">
            Código: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
          <a
            href="/es/ranking"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ver ranking
          </a>
        </div>
      </div>
    </div>
  )
}
