'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ProposalsList } from './ProposalsList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ProposalCategory } from '@/lib/sync/plans/extractor'

interface Proposal {
  id: string
  category: ProposalCategory
  title: string
  description: string
  source_quote?: string
  page_reference?: string
}

interface CandidateProposalsProps {
  candidateId: string
  planUrl?: string | null
}

export function CandidateProposals({ candidateId, planUrl }: CandidateProposalsProps) {
  const t = useTranslations('proposals')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null)
  const [remotePlanUrl, setRemotePlanUrl] = useState<string | null>(planUrl || null)

  useEffect(() => {
    async function fetchProposals() {
      try {
        setLoading(true)
        const response = await fetch(`/api/proposals?candidateId=${candidateId}`)
        const data = await response.json()

        if (response.ok) {
          setProposals(data.proposals || [])
          setLocalPdfUrl(data.planPdfLocal || null)
          setRemotePlanUrl(data.planUrl || planUrl || null)
        } else {
          setError(data.error || t('errorLoading'))
        }
      } catch (err) {
        setError(t('connectionError'))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [candidateId, planUrl])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('governmentPlan')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('governmentPlan')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <p>{error}</p>
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Plan de Gobierno
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProposalsList
          proposals={proposals}
          planUrl={remotePlanUrl}
          localPdfUrl={localPdfUrl}
          showSource={true}
          compact={false}
        />
      </CardContent>
    </Card>
  )
}
