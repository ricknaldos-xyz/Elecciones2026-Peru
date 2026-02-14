'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#FAFAF5' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 900,
              color: '#D52B1E',
              margin: '0 0 0.5rem',
              textTransform: 'uppercase',
            }}>
              Error
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: '#333',
              marginBottom: '1.5rem',
            }}>
              Ocurrió un error inesperado. Por favor, intenta de nuevo.
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '1rem' }}>
                Código: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 2rem',
                background: '#111',
                color: '#fff',
                border: '3px solid #111',
                fontWeight: 700,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
