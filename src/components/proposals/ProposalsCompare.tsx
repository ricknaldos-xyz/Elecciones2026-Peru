'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/Badge'
import { CategoryBadge, PROPOSAL_CATEGORIES, type ProposalCategory } from './CategoryBadge'
import styles from './ProposalsCompare.module.css'

interface Proposal {
  id: string
  category: string
  title: string
  description: string | null
  source_quote: string | null
  page_reference: string | null
}

interface CandidateProposals {
  candidate_id: string
  candidate_name: string
  candidate_slug: string
  party_name: string | null
  photo_url: string | null
  plan_gobierno_url: string | null
  proposals: Proposal[]
}

interface ProposalsCompareProps {
  candidateIds: string[]
  lang: string
}

export function ProposalsCompare({ candidateIds, lang }: ProposalsCompareProps) {
  const t = useTranslations()
  const [data, setData] = useState<CandidateProposals[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ProposalCategory | 'all'>('all')

  useEffect(() => {
    async function fetchProposals() {
      if (candidateIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('candidateIds', candidateIds.join(','))
        if (selectedCategory !== 'all') {
          params.set('category', selectedCategory)
        }

        const response = await fetch(`/api/proposals?${params.toString()}`)
        if (!response.ok) throw new Error('Error al cargar propuestas')

        const result = await response.json()
        setData(result.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [candidateIds, selectedCategory])

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Cargando propuestas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span>{error}</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay candidatos seleccionados para comparar</p>
      </div>
    )
  }

  // Get all unique categories from all candidates
  const allCategories = new Set<ProposalCategory>()
  data.forEach((candidate) => {
    candidate.proposals.forEach((p) => {
      if (PROPOSAL_CATEGORIES.includes(p.category as ProposalCategory)) {
        allCategories.add(p.category as ProposalCategory)
      }
    })
  })

  // Group proposals by category for comparison view
  const categoriesWithProposals = Array.from(allCategories).sort()

  return (
    <div className={styles.container}>
      {/* Category filter */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterButton} ${selectedCategory === 'all' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          Todas
        </button>
        {PROPOSAL_CATEGORIES.map((category) => (
          <button
            key={category}
            className={`${styles.filterButton} ${selectedCategory === category ? styles.active : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            <CategoryBadge category={category} size="sm" />
          </button>
        ))}
      </div>

      {/* Comparison grid */}
      <div className={styles.compareGrid} style={{ '--cols': data.length } as React.CSSProperties}>
        {/* Header row with candidate info */}
        {data.map((candidate) => (
          <div key={candidate.candidate_id} className={styles.candidateHeader}>
            {candidate.photo_url ? (
              <img
                src={candidate.photo_url}
                alt={candidate.candidate_name}
                className={styles.candidatePhoto}
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex') }}
              />
            ) : null}
            <div className={styles.candidatePhotoPlaceholder} style={{ display: candidate.photo_url ? 'none' : 'flex' }}>
              {candidate.candidate_name.charAt(0)}
            </div>
            <h3 className={styles.candidateName}>{candidate.candidate_name}</h3>
            {candidate.party_name && (
              <span className={styles.partyName}>{candidate.party_name}</span>
            )}
            {candidate.plan_gobierno_url && (
              <a
                href={candidate.plan_gobierno_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.pdfLink}
              >
                📄 Ver Plan de Gobierno
              </a>
            )}
            <Badge variant={candidate.proposals.length > 0 ? 'success' : 'default'} size="sm">
              {candidate.proposals.length} propuestas
            </Badge>
          </div>
        ))}
      </div>

      {/* Proposals by category */}
      {categoriesWithProposals.length === 0 ? (
        <div className={styles.noProposals}>
          <p>No hay propuestas extraídas para estos candidatos.</p>
          <p className={styles.hint}>Las propuestas se extraen automáticamente de los planes de gobierno cuando están disponibles.</p>
        </div>
      ) : (
        categoriesWithProposals.map((category) => (
          <div key={category} className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <CategoryBadge category={category} size="lg" />
            </div>
            <div className={styles.proposalsRow} style={{ '--cols': data.length } as React.CSSProperties}>
              {data.map((candidate) => {
                const categoryProposals = candidate.proposals.filter((p) => p.category === category)
                return (
                  <div key={candidate.candidate_id} className={styles.proposalCell}>
                    {categoryProposals.length === 0 ? (
                      <div className={styles.noProposalCell}>
                        <span>Sin propuestas en esta categoría</span>
                      </div>
                    ) : (
                      categoryProposals.map((proposal) => (
                        <div key={proposal.id} className={styles.proposalCard}>
                          <h4 className={styles.proposalTitle}>{proposal.title}</h4>
                          {proposal.description && (
                            <p className={styles.proposalDescription}>{proposal.description}</p>
                          )}
                          {proposal.source_quote && (
                            <blockquote className={styles.sourceQuote}>
                              &ldquo;{proposal.source_quote}&rdquo;
                              {proposal.page_reference && (
                                <cite className={styles.pageRef}> — {proposal.page_reference}</cite>
                              )}
                            </blockquote>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
