'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Company {
  ruc: string
  name: string
  role: string
  ownershipPct: number | null
  isActive: boolean
  hasLegalIssues: boolean
  issuesCount: number
}

interface IssuesSummary {
  totalIssues: number
  byType: {
    penal: number
    laboral: number
    ambiental: number
    consumidor: number
    tributario: number
    other: number
  }
  totalFines: number
  integrityPenalty: number
}

interface CompanyData {
  companies: Company[]
  totalCompanies: number
  companiesWithIssues: number
  issuesSummary: IssuesSummary
}

interface CompanyIssuesCardProps {
  candidateId: string
}

export function CompanyIssuesCard({ candidateId }: CompanyIssuesCardProps) {
  const t = useTranslations('companies')
  const [data, setData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/companies`)
        if (!res.ok) {
          setData(null)
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [candidateId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.totalCompanies === 0) {
    return null // No companies linked - don't show card
  }

  const hasIssues = data.issuesSummary.totalIssues > 0
  const hasSeriousIssues = data.issuesSummary.byType.penal > 0 || data.issuesSummary.byType.laboral > 0

  const roleLabels: Record<string, string> = {
    accionista: t('roleAccionista'),
    director: t('roleDirector'),
    gerente_general: t('roleGerenteGeneral'),
    representante_legal: t('roleRepresentanteLegal'),
    fundador: t('roleFundador'),
  }

  const issueTypeLabels: Record<string, { label: string; color: string }> = {
    penal: { label: t('typePenal'), color: 'text-[var(--flag-red-text)]' },
    laboral: { label: t('typeLaboral'), color: 'text-[var(--flag-amber-text)]' },
    ambiental: { label: t('typeAmbiental'), color: 'text-[var(--flag-amber-text)]' },
    consumidor: { label: t('typeConsumidor'), color: 'text-[var(--muted-foreground)]' },
    tributario: { label: t('typeTributario'), color: 'text-[var(--flag-amber-text)]' },
    other: { label: t('typeOther'), color: 'text-[var(--muted-foreground)]' },
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className={cn(
      'border-2',
      hasSeriousIssues
        ? 'border-[var(--flag-red)]'
        : hasIssues
        ? 'border-[var(--flag-amber)]'
        : 'border-[var(--border)]'
    )}>
      <CardHeader className={cn(
        hasSeriousIssues && 'bg-[var(--flag-red)]/10',
        hasIssues && !hasSeriousIssues && 'bg-[var(--flag-amber)]/10'
      )}>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {t('title')}
          {hasIssues && (
            <Badge variant="destructive" className="ml-auto">
              {data.issuesSummary.totalIssues} {data.issuesSummary.totalIssues !== 1 ? t('problems') : t('problem')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
          <div>
            <div className="text-2xl font-black">{data.totalCompanies}</div>
            <div className="text-xs text-[var(--muted-foreground)]">{t('companiesLabel')}</div>
          </div>
          <div>
            <div className={cn(
              'text-2xl font-black',
              data.companiesWithIssues > 0 && 'text-[var(--flag-amber-text)]'
            )}>
              {data.companiesWithIssues}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">{t('withProblems')}</div>
          </div>
          <div>
            <div className={cn(
              'text-2xl font-black',
              data.issuesSummary.totalFines > 0 && 'text-[var(--flag-red-text)]'
            )}>
              {data.issuesSummary.totalFines > 0
                ? formatCurrency(data.issuesSummary.totalFines).replace('PEN', 'S/')
                : '-'
              }
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">{t('inFines')}</div>
          </div>
        </div>

        {/* Issues by Type */}
        {hasIssues && (
          <div className="space-y-2">
            <h4 className="font-black text-sm uppercase">{t('issuesByType')}</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.issuesSummary.byType).map(([type, count]) => {
                if (count === 0) return null
                const typeInfo = issueTypeLabels[type]
                return (
                  <div
                    key={type}
                    className="px-3 py-1 border-2 border-[var(--border)] bg-[var(--muted)]"
                  >
                    <span className={cn('font-bold', typeInfo.color)}>
                      {count}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] ml-1">
                      {typeInfo.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Company List */}
        <div className="space-y-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-sm font-bold uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <span>{t('companyList')}</span>
            <svg
              className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="space-y-2">
              {data.companies.map((company) => (
                <div
                  key={company.ruc}
                  className={cn(
                    'border-2',
                    company.hasLegalIssues
                      ? 'border-[var(--flag-amber)] bg-[var(--flag-amber)]/5'
                      : 'border-[var(--border)] bg-[var(--muted)]'
                  )}
                >
                  <button
                    className="w-full p-3 text-left"
                    onClick={() => setExpandedCompany(expandedCompany === company.ruc ? null : company.ruc)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{company.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          RUC: {company.ruc}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={company.isActive ? 'success' : 'secondary'}>
                          {company.isActive ? t('active') : t('inactive')}
                        </Badge>
                        {company.hasLegalIssues && (
                          <Badge variant="warning">
                            {company.issuesCount} {company.issuesCount !== 1 ? t('problems') : t('problem')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                  {expandedCompany === company.ruc && (
                    <div className="px-3 pb-3 pt-0 border-t border-[var(--border)] space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-bold text-[var(--muted-foreground)] uppercase">{t('role')}</span>
                          <p className="font-bold">{roleLabels[company.role] || company.role}</p>
                        </div>
                        {company.ownershipPct != null && (
                          <div>
                            <span className="font-bold text-[var(--muted-foreground)] uppercase">{t('ownership')}</span>
                            <p className="font-bold">{company.ownershipPct}%</p>
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-[var(--muted-foreground)] uppercase">{t('status')}</span>
                          <p className={cn('font-bold', company.isActive ? 'text-green-700' : 'text-[var(--muted-foreground)]')}>
                            {company.isActive ? t('active') : t('inactive')}
                          </p>
                        </div>
                        {company.hasLegalIssues && (
                          <div>
                            <span className="font-bold text-[var(--muted-foreground)] uppercase">{t('issuesByType')}</span>
                            <p className="font-bold text-[var(--flag-amber-text)]">
                              {company.issuesCount} {company.issuesCount !== 1 ? t('recordedPlural') : t('recorded')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integrity Penalty */}
        {data.issuesSummary.integrityPenalty > 0 && (
          <div className="p-3 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--flag-red-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-black text-[var(--flag-red-text)]">
                {t('penalty')} -{data.issuesSummary.integrityPenalty} pts historial legal
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {t('legalImpactNote')}
            </p>
          </div>
        )}

        <p className="text-xs text-[var(--muted-foreground)] pt-2 border-t-2 border-[var(--border)]">
          {t('dataSource')}
        </p>
      </CardContent>
    </Card>
  )
}
