/**
 * Congressional Candidates Import API
 *
 * POST /api/sync/congress - Import congressional candidates
 * GET /api/sync/congress - Get import status
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  importFromJSON,
  importCandidates,
  createInitialScores,
  getImportStatus,
  validateImportData,
} from '@/lib/sync/jne/bulk-importer'
import { CongressionalCandidate } from '@/lib/sync/jne/congressional-fetcher'

// Verify cron secret for protected endpoints
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) return true // Allow if no secret configured
  if (!authHeader) return false

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    const status = await getImportStatus()

    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Congress API] Error getting status:', error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { action, cargo, candidates, createScores = true } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action required (import, validate, status)' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'validate': {
        if (!candidates || !Array.isArray(candidates)) {
          return NextResponse.json(
            { success: false, error: 'Candidates array required' },
            { status: 400 }
          )
        }

        const validation = await validateImportData(
          candidates as CongressionalCandidate[]
        )

        return NextResponse.json({
          success: true,
          validation: {
            validCount: validation.valid.length,
            invalidCount: validation.invalid.length,
            errors: validation.invalid.map((i) => ({
              name: i.candidate.fullName,
              errors: i.errors,
            })),
          },
        })
      }

      case 'import': {
        if (!candidates || !Array.isArray(candidates)) {
          return NextResponse.json(
            { success: false, error: 'Candidates array required' },
            { status: 400 }
          )
        }

        if (!cargo) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cargo required (senador, diputado, parlamento_andino)',
            },
            { status: 400 }
          )
        }

        // Validate first
        const typedCandidates = candidates.map((c) => ({
          ...c,
          cargo: cargo as 'senador' | 'diputado' | 'parlamento_andino',
        })) as CongressionalCandidate[]

        const validation = await validateImportData(typedCandidates)

        if (validation.invalid.length > 0) {
          return NextResponse.json({
            success: false,
            error: `${validation.invalid.length} candidatos inválidos`,
            validation: {
              validCount: validation.valid.length,
              invalidCount: validation.invalid.length,
              errors: validation.invalid.slice(0, 10).map((i) => ({
                name: i.candidate.fullName,
                errors: i.errors,
              })),
            },
          })
        }

        // Import valid candidates
        const result = await importCandidates(validation.valid)

        // Create initial scores if requested
        if (createScores && result.inserted > 0) {
          await createInitialScores()
        }

        return NextResponse.json({
          success: result.success,
          result: {
            cargo: result.cargo,
            total: result.total,
            inserted: result.inserted,
            skipped: result.skipped,
            errors: result.errors.slice(0, 20),
            duration: result.duration,
          },
        })
      }

      case 'import-json': {
        // Import from raw JSON data
        if (!candidates || !Array.isArray(candidates)) {
          return NextResponse.json(
            { success: false, error: 'Candidates array required' },
            { status: 400 }
          )
        }

        if (!cargo) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cargo required (senador, diputado, parlamento_andino)',
            },
            { status: 400 }
          )
        }

        const result = await importFromJSON(
          candidates,
          cargo as 'senador' | 'diputado' | 'parlamento_andino'
        )

        // Create initial scores
        if (createScores && result.inserted > 0) {
          await createInitialScores()
        }

        return NextResponse.json({
          success: result.success,
          result: {
            cargo: result.cargo,
            total: result.total,
            inserted: result.inserted,
            skipped: result.skipped,
            errors: result.errors.slice(0, 20),
            duration: result.duration,
          },
        })
      }

      case 'create-scores': {
        const result = await createInitialScores()
        return NextResponse.json({
          success: true,
          result,
        })
      }

      case 'status': {
        const status = await getImportStatus()
        return NextResponse.json({
          success: true,
          data: status,
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Congress API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    )
  }
}
