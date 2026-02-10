import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { AssetsDeclaration } from '@/lib/db/queries'

interface AssetsDeclarationCardProps {
  assets: AssetsDeclaration
}

const TYPE_COLORS: Record<string, string> = {
  'Inmuebles': 'bg-blue-500',
  'Vehículos': 'bg-green-500',
  'Patrimonio': 'bg-purple-500',
}
const DEFAULT_COLOR = 'bg-gray-400'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function AssetsDeclarationCard({ assets }: AssetsDeclarationCardProps) {
  const t = useTranslations('candidate')
  const maxValue = assets.assets.length > 0
    ? Math.max(...assets.assets.map(a => a.value))
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M3 6l9-4 9 4M3 6v12l9 4 9-4V6M3 6l9 4m0 0l9-4m-9 4v12" />
          </svg>
          {t('assetsDeclaration')}
          {assets.declaration_year && (
            <Badge variant="secondary" className="ml-auto">{assets.declaration_year}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className={cn('grid gap-3', assets.total_liabilities != null ? 'grid-cols-3' : 'grid-cols-2')}>
          <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
            <div className="text-2xl font-black text-[var(--foreground)]">
              {formatCurrency(assets.total_value)}
            </div>
            <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
              {t('totalAssets')}
            </div>
          </div>
          <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
            <div className="text-2xl font-black text-[var(--foreground)]">
              {assets.income ? formatCurrency(assets.income.annual_income) : '—'}
            </div>
            <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
              {t('annualIncome')}
            </div>
          </div>
          {assets.total_liabilities != null && assets.total_liabilities > 0 && (
            <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
              <div className="text-2xl font-black text-[var(--flag-red-text)]">
                {formatCurrency(assets.total_liabilities)}
              </div>
              <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
                {t('totalLiabilities')}
              </div>
            </div>
          )}
        </div>

        {/* Asset distribution bar */}
        {assets.assets.length > 0 && assets.total_value > 0 && (
          <div>
            <div className="h-6 border-2 border-[var(--border)] flex overflow-hidden">
              {assets.assets.map((asset, idx) => {
                const pct = (asset.value / assets.total_value) * 100
                if (pct < 1) return null
                return (
                  <div
                    key={idx}
                    className={cn('h-full', TYPE_COLORS[asset.type] || DEFAULT_COLOR)}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                    title={`${asset.type}: ${pct.toFixed(0)}%`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {assets.assets.map((asset, idx) => {
                const pct = ((asset.value / assets.total_value) * 100).toFixed(0)
                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className={cn('w-3 h-3', TYPE_COLORS[asset.type] || DEFAULT_COLOR)} />
                    <span className="text-[10px] font-bold text-[var(--muted-foreground)]">
                      {asset.type} ({pct}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Assets list with proportional bars */}
        {assets.assets.length > 0 && (
          <div className="space-y-2">
            {assets.assets.map((asset, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 flex-shrink-0', TYPE_COLORS[asset.type] || DEFAULT_COLOR)} />
                    <div>
                      <span className="text-sm font-bold text-[var(--foreground)]">{asset.type}</span>
                      <span className="text-xs text-[var(--muted-foreground)] ml-2">{asset.description}</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-[var(--foreground)] flex-shrink-0">
                    {formatCurrency(asset.value)}
                  </span>
                </div>
                {maxValue > 0 && (
                  <div className="h-2 border border-[var(--border)] bg-[var(--muted)] overflow-hidden ml-5">
                    <div
                      className={cn('h-full', TYPE_COLORS[asset.type] || DEFAULT_COLOR)}
                      style={{ width: `${Math.min((asset.value / maxValue) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Income breakdown */}
        {assets.income && (assets.income.public_income > 0 || assets.income.private_income > 0) && (
          <div className="pt-2 border-t-2 border-[var(--border)]">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">
              {t('incomeSource')}
            </div>
            <div className="flex gap-2">
              {assets.income.public_income > 0 && (
                <div className="flex-1 p-2 bg-[var(--score-transparency)]/10 border-2 border-[var(--border)]">
                  <div className="text-sm font-black text-[var(--foreground)]">
                    {formatCurrency(assets.income.public_income)}
                  </div>
                  <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
                    {t('publicIncome')}
                  </div>
                </div>
              )}
              {assets.income.private_income > 0 && (
                <div className="flex-1 p-2 bg-[var(--score-competence)]/10 border-2 border-[var(--border)]">
                  <div className="text-sm font-black text-[var(--foreground)]">
                    {formatCurrency(assets.income.private_income)}
                  </div>
                  <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
                    {t('privateIncome')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Source badge */}
        {assets.income?.source && (
          <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-[var(--border)]">
            <Badge variant="secondary">{assets.income.source}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
