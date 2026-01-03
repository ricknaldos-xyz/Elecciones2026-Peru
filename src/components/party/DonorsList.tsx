'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { PartyDonor } from '@/lib/db/queries'

interface DonorsListProps {
  donors: PartyDonor[]
  className?: string
  maxItems?: number
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

function getDonorTypeLabel(type: 'natural' | 'juridica'): string {
  return type === 'natural' ? 'Persona Natural' : 'Persona Jurídica'
}

function getDonorTypeIcon(type: 'natural' | 'juridica') {
  if (type === 'natural') {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

function getDonationTypeLabel(type: 'efectivo' | 'especie' | 'servicios'): string {
  switch (type) {
    case 'efectivo': return 'Efectivo'
    case 'especie': return 'En especie'
    case 'servicios': return 'Servicios'
  }
}

export function DonorsList({
  donors,
  className,
  maxItems,
  showHeader = true,
}: DonorsListProps) {
  const displayDonors = maxItems ? donors.slice(0, maxItems) : donors
  const totalAmount = donors.reduce((sum, d) => sum + d.amount, 0)

  if (donors.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase">
              <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Donantes
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <svg className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold">No hay información de donantes disponible</p>
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
                <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Principales Donantes
            </CardTitle>
            <Badge variant="outline">{donors.length} total</Badge>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="divide-y-2 divide-[var(--border)]">
          {displayDonors.map((donor, index) => (
            <div
              key={donor.id}
              className={cn(
                'flex items-center gap-4 p-4',
                'hover:bg-[var(--muted)] transition-colors'
              )}
            >
              {/* Rank */}
              <div className={cn(
                'w-8 h-8 border-2 border-[var(--border)] flex items-center justify-center text-sm font-black',
                index === 0 && 'bg-[var(--rank-gold)] text-black',
                index === 1 && 'bg-[var(--rank-silver)] text-black',
                index === 2 && 'bg-[var(--rank-bronze)] text-white',
                index > 2 && 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              )}>
                {index + 1}
              </div>

              {/* Icon */}
              <div className={cn(
                'w-10 h-10 border-2 border-[var(--border)] flex items-center justify-center',
                donor.donor_type === 'natural'
                  ? 'bg-[var(--score-competence)]/20 text-[var(--score-competence-text)]'
                  : 'bg-[var(--score-transparency)]/20 text-[var(--score-transparency-text)]'
              )}>
                {getDonorTypeIcon(donor.donor_type)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[var(--foreground)] truncate">
                  {donor.donor_name}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted-foreground)] font-medium">
                  <span className="whitespace-nowrap">{getDonorTypeLabel(donor.donor_type)}</span>
                  <span className="hidden sm:inline">-</span>
                  <span className="whitespace-nowrap">{getDonationTypeLabel(donor.donation_type)}</span>
                  {donor.is_verified && (
                    <>
                      <span className="hidden sm:inline">-</span>
                      <span className="text-[var(--score-excellent-text)] flex items-center gap-1 whitespace-nowrap font-bold">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verificado
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <div className="font-black text-[var(--foreground)]">
                  {formatCurrency(donor.amount)}
                </div>
                <div className="text-xs text-[var(--muted-foreground)] font-bold">
                  {totalAmount > 0 ? ((donor.amount / totalAmount) * 100).toFixed(1) : 0}% del total
                </div>
              </div>
            </div>
          ))}
        </div>

        {maxItems && donors.length > maxItems && (
          <div className="p-4 bg-[var(--muted)] text-center border-t-2 border-[var(--border)]">
            <span className="text-sm text-[var(--muted-foreground)] font-bold">
              +{donors.length - maxItems} donantes más
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
