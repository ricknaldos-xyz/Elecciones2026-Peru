'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PartyFinanceCard } from '@/components/party/PartyFinanceCard'
import { DonorsList } from '@/components/party/DonorsList'
import { ExpenseBreakdown } from '@/components/party/ExpenseBreakdown'
import type { PartyFinanceSummary } from '@/lib/db/queries'

interface PartyFinanceContentProps {
  initialData: PartyFinanceSummary
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function PartyFinanceContent({ initialData }: PartyFinanceContentProps) {
  const { party, finances, topDonors, expensesByCategory, totals } = initialData
  const [selectedYear, setSelectedYear] = useState<number | null>(
    finances.length > 0 ? finances[0].year : null
  )

  const years = [...new Set(finances.map(f => f.year))].sort((a, b) => b - a)
  const selectedFinance = selectedYear
    ? finances.find(f => f.year === selectedYear)
    : finances[0]

  const publicPercentage = totals.totalPublicFunding + totals.totalPrivateFunding > 0
    ? (totals.totalPublicFunding / (totals.totalPublicFunding + totals.totalPrivateFunding)) * 100
    : 0

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] font-bold mb-6">
        <Link href="/transparencia" className="hover:text-[var(--foreground)] uppercase">
          Transparencia
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)] uppercase">{party.name}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6 mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 border-3 border-[var(--border)] flex items-center justify-center text-white text-base sm:text-xl font-black flex-shrink-0"
            style={{ backgroundColor: party.color || '#ef4444' }}
          >
            {party.short_name || party.name.substring(0, 2)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-[var(--foreground)] truncate uppercase tracking-tight">
              {party.name}
            </h1>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] font-medium mt-0.5 sm:mt-1">
              Transparencia Financiera
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/ranking?partido=${party.id}`}>
            <Button variant="outline" size="sm">
              VER CANDIDATOS
            </Button>
          </Link>
          <a
            href="https://claridad.onpe.gob.pe"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <span className="hidden sm:inline">VER EN </span>ONPE
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Button>
          </a>
        </div>
      </div>

      {/* Year Selector */}
      {years.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-[var(--muted-foreground)] font-bold uppercase mr-1 sm:mr-2">Año:</span>
          {years.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-bold uppercase border-2 transition-all duration-100 ${
                selectedYear === year
                  ? 'bg-[var(--primary)] text-white border-[var(--border)] shadow-[var(--shadow-brutal-sm)] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-[var(--background)] text-[var(--foreground)] border-transparent hover:border-[var(--border)]'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card className="p-3 sm:p-5 bg-[var(--score-high)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center text-white flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm text-white/80 font-bold uppercase">Público</div>
              <div className="text-base sm:text-xl font-black text-white truncate">
                {formatCurrency(totals.totalPublicFunding)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-[var(--score-competence)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center text-white flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm text-white/80 font-bold uppercase">Privado</div>
              <div className="text-base sm:text-xl font-black text-white truncate">
                {formatCurrency(totals.totalPrivateFunding)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-[var(--flag-red)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center text-white flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm text-white/80 font-bold uppercase">Gastos</div>
              <div className="text-base sm:text-xl font-black text-white truncate">
                {formatCurrency(totals.totalExpenses)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-[var(--score-transparency)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center text-white flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm text-white/80 font-bold uppercase">Donantes</div>
              <div className="text-base sm:text-xl font-black text-white">
                {totals.donorCount.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Funding Source Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>COMPOSICIÓN DEL FINANCIAMIENTO</CardTitle>
          <CardDescription>
            Distribución entre financiamiento público y aportes privados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-10 border-2 border-[var(--border)] overflow-hidden mb-4">
            <div
              className="bg-[var(--score-high)] flex items-center justify-center text-white text-sm font-black transition-all duration-500"
              style={{ width: `${publicPercentage}%` }}
            >
              {publicPercentage >= 10 && `${publicPercentage.toFixed(0)}%`}
            </div>
            <div
              className="bg-[var(--score-competence)] flex items-center justify-center text-white text-sm font-black transition-all duration-500"
              style={{ width: `${100 - publicPercentage}%` }}
            >
              {100 - publicPercentage >= 10 && `${(100 - publicPercentage).toFixed(0)}%`}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[var(--score-high)] border border-[var(--border)] flex-shrink-0" />
              <span className="text-sm font-bold text-[var(--foreground)]">
                Público: {formatCurrency(totals.totalPublicFunding)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[var(--score-competence)] border border-[var(--border)] flex-shrink-0" />
              <span className="text-sm font-bold text-[var(--foreground)]">
                Privado: {formatCurrency(totals.totalPrivateFunding)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year Finance Details */}
      {selectedFinance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <PartyFinanceCard
            partyName={party.name}
            year={selectedFinance.year}
            publicFunding={selectedFinance.public_funding}
            privateFunding={selectedFinance.private_funding_total}
            totalExpenses={selectedFinance.total_expenses}
            donorCount={selectedFinance.donor_count}
          />
          <div className="lg:col-span-2">
            <DonorsList donors={topDonors} maxItems={5} />
          </div>
        </div>
      )}

      {/* Expense Breakdown */}
      <div className="mb-8">
        <ExpenseBreakdown expenses={expensesByCategory} />
      </div>

      {/* Historical Data */}
      {finances.length > 1 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>HISTORIAL DE FINANCIAMIENTO</CardTitle>
            <CardDescription>
              Evolución del financiamiento por año
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b-3 border-[var(--border)]">
                    <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-black text-[var(--foreground)] uppercase">Año</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm font-black text-[var(--foreground)] uppercase">Público</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm font-black text-[var(--foreground)] uppercase">Privado</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm font-black text-[var(--foreground)] uppercase">Total</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm font-black text-[var(--foreground)] uppercase">Gastos</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm font-black text-[var(--foreground)] uppercase">Balance</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm font-black text-[var(--foreground)] uppercase">Don.</th>
                  </tr>
                </thead>
                <tbody>
                  {finances.map((f) => {
                    const balance = f.total_income - f.total_expenses
                    return (
                      <tr
                        key={f.year}
                        className="border-b-2 border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                      >
                        <td className="py-3 px-3 sm:px-4 font-black text-[var(--foreground)] text-sm">{f.year}</td>
                        <td className="py-3 px-3 sm:px-4 text-right text-[var(--score-excellent-text)] font-bold text-xs sm:text-sm whitespace-nowrap">{formatCurrency(f.public_funding)}</td>
                        <td className="py-3 px-3 sm:px-4 text-right text-[var(--score-good-text)] font-bold text-xs sm:text-sm whitespace-nowrap">{formatCurrency(f.private_funding_total)}</td>
                        <td className="py-3 px-3 sm:px-4 text-right font-black text-[var(--foreground)] text-xs sm:text-sm whitespace-nowrap">
                          {formatCurrency(f.total_income)}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right text-[var(--flag-red-text)] font-bold text-xs sm:text-sm whitespace-nowrap">{formatCurrency(f.total_expenses)}</td>
                        <td className={`py-3 px-3 sm:px-4 text-right font-black text-xs sm:text-sm whitespace-nowrap ${balance >= 0 ? 'text-[var(--score-excellent-text)]' : 'text-[var(--flag-red-text)]'}`}>
                          {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right text-[var(--muted-foreground)] font-bold text-xs sm:text-sm">{f.donor_count}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Footer */}
      <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
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
        </p>
        <p className="mt-1 text-xs font-medium">
          Los datos corresponden a declaraciones oficiales del partido político.
        </p>
      </div>
    </main>
  )
}
