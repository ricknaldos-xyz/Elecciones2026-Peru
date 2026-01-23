import { NextRequest, NextResponse } from 'next/server'
import { getCandidateCompanies } from '@/lib/sync/empresas/sunarp'
import { getCandidateCompanyIssuesSummary } from '@/lib/sync/empresas/oefa'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [companies, issuesSummary] = await Promise.all([
      getCandidateCompanies(id),
      getCandidateCompanyIssuesSummary(id),
    ])

    return NextResponse.json({
      ...companies,
      issuesSummary,
    })
  } catch (error) {
    console.error('Error fetching company data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company data' },
      { status: 500 }
    )
  }
}
