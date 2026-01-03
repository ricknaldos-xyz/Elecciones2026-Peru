'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface PartyWithFinance {
  party: {
    id: string
    name: string
    short_name: string | null
    logo_url: string | null
    color: string | null
  }
  latestFinance: {
    year: number
    public_funding: number
    private_funding_total: number
    donor_count: number
    total_income: number
    total_expenses: number
  } | null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function TransparencyContent() {
  const router = useRouter()
  const [parties, setParties] = useState<PartyWithFinance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/parties/finances')
        if (!response.ok) throw new Error('Error fetching data')
        const data = await response.json()
        setParties(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate totals
  const totals = parties.reduce((acc, p) => {
    if (p.latestFinance) {
      acc.publicFunding += p.latestFinance.public_funding
      acc.privateFunding += p.latestFinance.private_funding_total
      acc.totalDonors += p.latestFinance.donor_count
    }
    return acc
  }, { publicFunding: 0, privateFunding: 0, totalDonors: 0 })

  const partiesWithFinance = parties.filter(p => p.latestFinance !== null)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-[var(--border)] bg-[var(--score-high)] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">
              Transparencia Financiera
            </h1>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] font-medium">
              Financiamiento de partidos - Elecciones 2026
            </p>
          </div>
        </div>

        <div className="bg-[var(--score-competence)]/10 border-2 border-[var(--score-competence)] p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--score-competence)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs sm:text-sm text-[var(--score-competence)] font-medium">
            <strong>Fuente oficial:</strong> Portal CLARIDAD de la ONPE. Los datos son declaraciones públicas de los partidos.
            <span className="hidden sm:inline"> El financiamiento público directo para 2026 asciende a S/ 8,881,057.39 a distribuir entre 10 partidos.</span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card className="p-3 sm:p-5 bg-[var(--score-high)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white truncate">{formatCurrency(totals.publicFunding)}</div>
              <div className="text-white/80 text-xs sm:text-sm font-bold uppercase">Público</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-[var(--score-competence)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white truncate">{formatCurrency(totals.privateFunding)}</div>
              <div className="text-white/80 text-xs sm:text-sm font-bold uppercase">Privado</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-[var(--score-transparency)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white">{totals.totalDonors.toLocaleString()}</div>
              <div className="text-white/80 text-xs sm:text-sm font-bold uppercase">Donantes</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-[var(--score-medium)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white">{partiesWithFinance.length}</div>
              <div className="text-white/80 text-xs sm:text-sm font-bold uppercase">Partidos</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Parties List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FINANCIAMIENTO POR PARTIDO</CardTitle>
              <CardDescription>
                Ordenado por ingresos totales declarados
              </CardDescription>
            </div>
            <Badge variant="outline">{partiesWithFinance.length} partidos</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 bg-[var(--muted)] border border-[var(--border)]" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-[var(--flag-red)]">
              <svg className="w-12 h-12 mx-auto mb-3 text-[var(--flag-red)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-bold">Error: {error}</p>
            </div>
          ) : partiesWithFinance.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted-foreground)]">
              <svg className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold">No hay datos de financiamiento disponibles</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-[var(--border)]">
              {partiesWithFinance.map((item, index) => (
                <div
                  key={item.party.id}
                  className="p-4 hover:bg-[var(--muted)] transition-colors cursor-pointer"
                  onClick={() => router.push(`/partido/${item.party.id}/financiamiento`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-8 h-8 border-2 border-[var(--border)] bg-[var(--muted)] flex items-center justify-center text-sm font-black text-[var(--foreground)]">
                      {index + 1}
                    </div>

                    {/* Party info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 border border-[var(--border)]"
                          style={{ backgroundColor: item.party.color || '#ef4444' }}
                        />
                        <span className="font-black text-[var(--foreground)] truncate uppercase">
                          {item.party.name}
                        </span>
                        {item.party.short_name && (
                          <Badge variant="outline" size="sm">{item.party.short_name}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)] font-medium mt-1">
                        {item.latestFinance!.donor_count} donantes - Año {item.latestFinance!.year}
                      </div>
                    </div>

                    {/* Financial breakdown - hidden on mobile, shown on sm+ */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-[var(--muted-foreground)] font-bold uppercase">Público</div>
                        <div className="font-black text-[var(--score-high)]">
                          {formatCurrency(item.latestFinance!.public_funding)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[var(--muted-foreground)] font-bold uppercase">Privado</div>
                        <div className="font-black text-[var(--score-competence)]">
                          {formatCurrency(item.latestFinance!.private_funding_total)}
                        </div>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <div className="text-sm text-[var(--muted-foreground)] font-bold uppercase">Total</div>
                      <div className="text-lg font-black text-[var(--foreground)]">
                        {formatCurrency(item.latestFinance!.total_income)}
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source Footer */}
      <div className="mt-8 p-4 bg-[var(--muted)] border-2 border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
        <p className="font-medium">
          Datos obtenidos del{' '}
          <a
            href="https://claridad.onpe.gob.pe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] font-bold hover:underline"
          >
            Portal CLARIDAD - ONPE
          </a>
          {' '}y{' '}
          <a
            href="https://datosabiertos.gob.pe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] font-bold hover:underline"
          >
            Datos Abiertos
          </a>
        </p>
        <p className="mt-1 text-xs font-medium">
          Última actualización: Enero 2026 - Los datos pueden variar según declaraciones actualizadas de los partidos
        </p>
      </div>
    </main>
  )
}
