'use client'

export default function Error({
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
          Algo salió mal
        </h2>
        <p className="text-gray-600 mb-6">
          Ocurrió un error inesperado. Por favor, intenta de nuevo.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">
            Código: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
