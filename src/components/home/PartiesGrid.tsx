'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { displayPartyName } from '@/lib/utils'

interface PartyWithCount {
  id: string
  name: string
  short_name: string | null
  color: string | null
  logo_url: string | null
  candidate_count: number
}

const INITIAL_COUNT = 8

export function PartiesGrid({ parties }: { parties: PartyWithCount[] }) {
  const [showAll, setShowAll] = useState(false)
  const t = useTranslations('partiesGrid')
  const visible = showAll ? parties : parties.slice(0, INITIAL_COUNT)
  const hasMore = parties.length > INITIAL_COUNT

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {visible.map(party => (
          <Link
            key={party.id}
            href={`/partido/${party.id}`}
            className="group flex items-center gap-3 p-3 bg-[var(--card)] border-3 border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100 cursor-pointer"
          >
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform overflow-hidden"
              style={{ backgroundColor: party.color || 'var(--party-default)' }}
            >
              {party.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={party.logo_url}
                  alt={party.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <span className={`text-white font-black text-xs sm:text-sm ${party.logo_url ? 'hidden' : ''}`}>
                {party.short_name?.slice(0, 3) || party.name.slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-[var(--foreground)] uppercase leading-tight line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                {displayPartyName(party.name)}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] font-medium">
                {party.candidate_count} {t('candidates')}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && !showAll && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setShowAll(true)}
            aria-label={t('viewAllParties', { count: parties.length })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase bg-[var(--card)] border-2 border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100 text-[var(--primary)] min-h-[44px]"
          >
            {t('viewAllParties', { count: parties.length })}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
