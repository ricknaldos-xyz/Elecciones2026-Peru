'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('partyFinance')
  const totalIncome = publicFunding + privateFunding
  const balance = totalIncome - totalExpenses
  const publicPercentage = totalIncome > 0 ? (publicFunding / totalIncome) * 100 : 0

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-[var(--primary)] text-white border-b-3 border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white uppercase">{partyName}</CardTitle>
            <CardDescription className="text-white/80">
              {t('funding', { year })}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30 font-black">
            {year}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Income Section */}
        <div className="p-5 border-b-2 border-[var(--border)]">
          <h4 className="text-sm font-black uppercase text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('totalIncome')}
          </h4>
          <div className="text-2xl font-black text-[var(--foreground)] mb-4">
            {formatCurrency(totalIncome)}
          </div>

          {/* Public vs Private breakdown */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-bold text-[var(--muted-foreground)]">{t('publicFunding')}</span>
                <span className="font-black text-[var(--score-excellent-text)]">{formatCurrency(publicFunding)}</span>
              </div>
              <div className="h-2 bg-[var(--muted)] border border-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--score-high)] transition-all duration-500"
                  style={{ width: `${publicPercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-bold text-[var(--muted-foreground)]">{t('privateFunding')}</span>
                <span className="font-black text-[var(--score-competence-text)]">{formatCurrency(privateFunding)}</span>
              </div>
              <div className="h-2 bg-[var(--muted)] border border-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--score-competence)] transition-all duration-500"
                  style={{ width: `${100 - publicPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 divide-x-2 divide-[var(--border)]">
          <div className="p-4 text-center">
            <div className="text-sm text-[var(--muted-foreground)] font-bold uppercase mb-1">{t('expenses')}</div>
            <div className="text-lg font-black text-[var(--flag-red-text)]">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-sm text-[var(--muted-foreground)] font-bold uppercase mb-1">{t('donors')}</div>
            <div className="text-lg font-black text-[var(--foreground)]">{formatNumber(donorCount)}</div>
          </div>
        </div>

        {/* Balance */}
        <div className={cn(
          'p-4 text-center border-t-2 border-[var(--border)]',
          balance >= 0 ? 'bg-[var(--score-excellent-bg)]' : 'bg-[var(--flag-red-bg)]'
        )}>
          <div className="text-sm text-[var(--muted-foreground)] font-bold uppercase mb-1">{t('balance')}</div>
          <div className={cn(
            'text-xl font-black',
            balance >= 0 ? 'text-[var(--score-excellent-text)]' : 'text-[var(--flag-red-text)]'
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
  const t = useTranslations('partyFinance')
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
          <h4 className="font-black text-[var(--foreground)] uppercase">{partyName}</h4>
          <p className="text-sm text-[var(--muted-foreground)] font-medium">{year}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-[var(--foreground)]">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-xs text-[var(--muted-foreground)] font-bold">
            {t('donorCount', { count: donorCount })}
          </div>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-3 bg-[var(--muted)] border border-[var(--border)] overflow-hidden flex">
        <div
          className="h-full bg-[var(--score-high)] transition-all duration-500"
          style={{ width: `${publicPercentage}%` }}
          title={`${t('publicPercentage', { percentage: publicPercentage.toFixed(0) })}`}
        />
        <div
          className="h-full bg-[var(--score-competence)] transition-all duration-500"
          style={{ width: `${100 - publicPercentage}%` }}
          title={`${t('privatePercentage', { percentage: (100 - publicPercentage).toFixed(0) })}`}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-[var(--muted-foreground)] font-bold">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-[var(--score-high)] border border-[var(--border)]" />
          {t('publicPercentage', { percentage: publicPercentage.toFixed(0) })}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-[var(--score-competence)] border border-[var(--border)]" />
          {t('privatePercentage', { percentage: (100 - publicPercentage).toFixed(0) })}
        </span>
      </div>
    </Card>
  )
}
