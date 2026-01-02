'use client'

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface PartyFinanceCardProps {
  partyName: string
  year: number
  publicFunding: number
  privateFunding: number
  totalExpenses: number
  donorCount: number
  className?: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-PE').format(num)
}

export function PartyFinanceCard({
  partyName,
  year,
  publicFunding,
  privateFunding,
  totalExpenses,
  donorCount,
  className,
}: PartyFinanceCardProps) {
  const totalIncome = publicFunding + privateFunding
  const balance = totalIncome - totalExpenses
  const publicPercentage = totalIncome > 0 ? (publicFunding / totalIncome) * 100 : 0

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">{partyName}</CardTitle>
            <CardDescription className="text-red-100">
              Financiamiento {year}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            {year}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Income Section */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ingresos Totales
          </h4>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            {formatCurrency(totalIncome)}
          </div>

          {/* Public vs Private breakdown */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">Financiamiento Público</span>
                <span className="font-medium text-green-600">{formatCurrency(publicFunding)}</span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${publicPercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">Aportes Privados</span>
                <span className="font-medium text-blue-600">{formatCurrency(privateFunding)}</span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${100 - publicPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 divide-x divide-zinc-100 dark:divide-zinc-800">
          <div className="p-4 text-center">
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Gastos</div>
            <div className="text-lg font-semibold text-red-600">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Donantes</div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-white">{formatNumber(donorCount)}</div>
          </div>
        </div>

        {/* Balance */}
        <div className={cn(
          'p-4 text-center border-t border-zinc-100 dark:border-zinc-800',
          balance >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
        )}>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Balance</div>
          <div className={cn(
            'text-xl font-bold',
            balance >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for lists
export function PartyFinanceCardCompact({
  partyName,
  year,
  publicFunding,
  privateFunding,
  totalExpenses,
  donorCount,
  className,
  onClick,
}: PartyFinanceCardProps & { onClick?: () => void }) {
  const totalIncome = publicFunding + privateFunding
  const publicPercentage = totalIncome > 0 ? (publicFunding / totalIncome) * 100 : 0

  return (
    <Card
      className={cn('p-4', className)}
      hover={!!onClick}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-white">{partyName}</h4>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{year}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-xs text-zinc-500">
            {donorCount} donantes
          </div>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${publicPercentage}%` }}
          title={`Público: ${formatCurrency(publicFunding)}`}
        />
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${100 - publicPercentage}%` }}
          title={`Privado: ${formatCurrency(privateFunding)}`}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          Público: {publicPercentage.toFixed(0)}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          Privado: {(100 - publicPercentage).toFixed(0)}%
        </span>
      </div>
    </Card>
  )
}
