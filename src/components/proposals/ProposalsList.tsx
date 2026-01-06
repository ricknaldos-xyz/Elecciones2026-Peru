'use client'

import { useState } from 'react'
import { CategoryBadge, CATEGORY_CONFIG } from './CategoryBadge'
import { ProposalCategory } from '@/lib/sync/plans/extractor'

interface Proposal {
  id?: string
  category: ProposalCategory
  title: string
  description: string
  source_quote?: string
  page_reference?: string
}

interface ProposalsListProps {
  proposals: Proposal[]
  planUrl?: string | null
  showSource?: boolean
  compact?: boolean
}

export function ProposalsList({
  proposals,
  planUrl,
  showSource = false,
  compact = false,
}: ProposalsListProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProposalCategory | 'all'>('all')
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null)

  // Group proposals by category
  const byCategory = proposals.reduce(
    (acc, proposal) => {
      if (!acc[proposal.category]) {
        acc[proposal.category] = []
      }
      acc[proposal.category].push(proposal)
      return acc
    },
    {} as Record<ProposalCategory, Proposal[]>
  )

  const categories = Object.keys(byCategory) as ProposalCategory[]
  const filteredProposals =
    selectedCategory === 'all'
      ? proposals
      : byCategory[selectedCategory] || []

  if (proposals.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        <p>No hay propuestas extraidas para este candidato.</p>
        {planUrl && (
          <a
            href={planUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline mt-2 inline-block"
          >
            Ver Plan de Gobierno (PDF)
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with PDF link */}
      {planUrl && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            {proposals.length} propuestas extraidas con IA
          </p>
          <a
            href={planUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Ver PDF completo
          </a>
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'bg-[var(--muted)] hover:bg-[var(--muted)]/80'
          }`}
        >
          Todas ({proposals.length})
        </button>
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat]
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--muted)] hover:bg-[var(--muted)]/80'
              }`}
            >
              {config.icon} {config.label} ({byCategory[cat].length})
            </button>
          )
        })}
      </div>

      {/* Proposals list */}
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {filteredProposals.map((proposal, index) => {
          const proposalKey = proposal.id || `${proposal.category}-${index}`
          const isExpanded = expandedProposal === proposalKey

          return (
            <div
              key={proposalKey}
              className={`border-2 border-[var(--border)] rounded-lg ${
                compact ? 'p-3' : 'p-4'
              } bg-[var(--card)]`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CategoryBadge category={proposal.category} size="sm" />
                    {proposal.page_reference && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        p. {proposal.page_reference}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-[var(--foreground)]">
                    {proposal.title}
                  </h4>
                  <p
                    className={`text-sm text-[var(--muted-foreground)] mt-1 ${
                      compact && !isExpanded ? 'line-clamp-2' : ''
                    }`}
                  >
                    {proposal.description}
                  </p>

                  {/* Source quote */}
                  {showSource && proposal.source_quote && isExpanded && (
                    <blockquote className="mt-3 pl-3 border-l-2 border-[var(--muted)] text-sm italic text-[var(--muted-foreground)]">
                      &ldquo;{proposal.source_quote}&rdquo;
                    </blockquote>
                  )}
                </div>

                {/* Expand button for compact mode */}
                {(compact || proposal.source_quote) && (
                  <button
                    onClick={() =>
                      setExpandedProposal(isExpanded ? null : proposalKey)
                    }
                    className="p-1 hover:bg-[var(--muted)] rounded"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
