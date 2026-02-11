'use client'

import { useTranslations } from 'next-intl'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface ExpenseCategory {
  category: string
  total_amount: number
  transaction_count: number
}

interface ExpenseBreakdownProps {
  expenses: ExpenseCategory[]
  className?: string
  showHeader?: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const categoryColors: Record<string, string> = {
  publicidad: 'bg-[var(--flag-red)]',
  propaganda: 'bg-[var(--flag-amber)]',
  eventos: 'bg-[var(--score-medium)]',
  personal: 'bg-[var(--score-high)]',
  transporte: 'bg-[var(--score-competence)]',
  alquiler: 'bg-[var(--score-integrity)]',
  materiales: 'bg-[var(--score-transparency)]',
  servicios: 'bg-[var(--score-integrity)]',
  otros: 'bg-[var(--muted-foreground)]',
}

const categoryIcons: Record<string, React.ReactNode> = {
  publicidad: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  propaganda: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  eventos: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  personal: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  transporte: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  alquiler: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  materiales: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  servicios: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  otros: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  ),
}

export function ExpenseBreakdown({
  expenses,
  className,
  showHeader = true,
}: ExpenseBreakdownProps) {
  const t = useTranslations('expenses')

  const categoryLabels: Record<string, string> = {
    publicidad: t('catPublicidad'),
    propaganda: t('catPropaganda'),
    eventos: t('catEventos'),
    personal: t('catPersonal'),
    transporte: t('catTransporte'),
    alquiler: t('catAlquiler'),
    materiales: t('catMateriales'),
    servicios: t('catServicios'),
    otros: t('catOtros'),
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.total_amount, 0)
  const sortedExpenses = [...expenses].sort((a, b) => b.total_amount - a.total_amount)

  if (expenses.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase">
              <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {t('title')}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <svg className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="font-bold">{t('noExpenses')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 uppercase">
              <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {t('title')}
            </CardTitle>
            <div className="text-lg font-black text-[var(--flag-red-text)]">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Visual bar chart */}
        <div className="p-5 border-b-2 border-[var(--border)]">
          <div className="flex h-8 border-2 border-[var(--border)] overflow-hidden">
            {sortedExpenses.map((expense) => {
              const percentage = totalExpenses > 0 ? (expense.total_amount / totalExpenses) * 100 : 0
              if (percentage < 1) return null
              return (
                <div
                  key={expense.category}
                  className={cn(
                    categoryColors[expense.category] || 'bg-[var(--muted-foreground)]',
                    'transition-all duration-500 relative group'
                  )}
                  style={{ width: `${percentage}%` }}
                  title={`${categoryLabels[expense.category] || expense.category}: ${formatCurrency(expense.total_amount)}`}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Category list */}
        <div className="divide-y-2 divide-[var(--border)]">
          {sortedExpenses.map((expense) => {
            const percentage = totalExpenses > 0 ? (expense.total_amount / totalExpenses) * 100 : 0
            return (
              <div
                key={expense.category}
                className="flex items-center gap-4 p-4 hover:bg-[var(--muted)] transition-colors"
              >
                {/* Color dot + icon */}
                <div className={cn(
                  'w-10 h-10 border-2 border-[var(--border)] flex items-center justify-center text-white',
                  categoryColors[expense.category] || 'bg-[var(--muted-foreground)]'
                )}>
                  {categoryIcons[expense.category]}
                </div>

                {/* Category info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[var(--foreground)] uppercase">
                    {categoryLabels[expense.category] || expense.category}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] font-medium">
                    {expense.transaction_count} {expense.transaction_count !== 1 ? t('transactions') : t('transaction')}
                  </div>
                </div>

                {/* Amount and percentage */}
                <div className="text-right">
                  <div className="font-black text-[var(--foreground)]">
                    {formatCurrency(expense.total_amount)}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] font-bold">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
