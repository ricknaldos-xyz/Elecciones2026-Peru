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
  localPdfUrl?: string | null
  showSource?: boolean
  compact?: boolean
}

export function ProposalsList({
  proposals,
  planUrl,
  localPdfUrl,
  showSource = false,
  compact = false,
}: ProposalsListProps) {
  // Use local PDF if available, otherwise use remote URL
  const pdfUrl = localPdfUrl || planUrl
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
        <p>No hay propuestas extraídas para este candidato.</p>
        {pdfUrl && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline"
            >
              Ver Plan de Gobierno (PDF)
            </a>
            {localPdfUrl && (
              <a
                href={localPdfUrl}
                download
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar
              </a>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with PDF links */}
      {pdfUrl && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-[var(--muted-foreground)]">
            {proposals.length} propuestas extraídas con IA
          </p>
          <div className="flex items-center gap-3">
            <a
              href={pdfUrl}
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Ver PDF
            </a>
            {localPdfUrl && (
              <a
                href={localPdfUrl}
                download
                className="inline-flex items-center gap-2 text-sm px-3 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Descargar PDF
              </a>
            )}
          </div>
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
