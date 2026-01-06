import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE_NAME = 'admin_session'

function isAuthenticated(request: NextRequest): boolean {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  return !!sessionToken && /^[a-z0-9]+_[a-z0-9]+$/.test(sessionToken)
}

// Type definitions for query results
interface CandidateRow { id: string; cargo: string; is_active: boolean }
interface NewsRow { id: string; status: string; sentiment: string }
interface FlagRow { id: string; status: string; severity: string }
interface QuizRow { id: string; created_at: string }
interface SyncLogRow { id: string; source: string; status: string; started_at: string }

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Fetch all stats in parallel
    const [
      candidatesResult,
      partiesResult,
      newsResult,
      flagsResult,
      quizResult,
      syncLogsResult,
    ] = await Promise.all([
      // Candidates stats
      sb.from('candidates').select('id, cargo, is_active', { count: 'exact' }) as Promise<{ data: CandidateRow[] | null; count: number | null }>,

      // Parties stats
      sb.from('parties').select('id', { count: 'exact' }) as Promise<{ data: unknown[] | null; count: number | null }>,

      // News stats
      sb.from('news_mentions').select('id, status, sentiment', { count: 'exact' }) as Promise<{ data: NewsRow[] | null; count: number | null }>,

      // Flags stats
      sb.from('flags').select('id, status, severity', { count: 'exact' }) as Promise<{ data: FlagRow[] | null; count: number | null }>,

      // Quiz stats
      sb.from('quiz_responses').select('id, created_at', { count: 'exact' }) as Promise<{ data: QuizRow[] | null; count: number | null }>,

      // Sync logs (last 24h)
      sb
        .from('sync_logs')
        .select('id, source, status, started_at')
        .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('started_at', { ascending: false }) as Promise<{ data: SyncLogRow[] | null }>,
    ])

    const candidates = candidatesResult.data || []
    const news = newsResult.data || []
    const flags = flagsResult.data || []
    const quizResponses = quizResult.data || []
    const syncLogs = syncLogsResult.data || []

    // Calculate stats
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
      candidates: {
        total: candidates.length,
        active: candidates.filter(c => c.is_active).length,
        byCargo: {
          presidente: candidates.filter(c => c.cargo === 'presidente').length,
          vicepresidente: candidates.filter(c => c.cargo === 'vicepresidente').length,
          senador: candidates.filter(c => c.cargo === 'senador').length,
          diputado: candidates.filter(c => c.cargo === 'diputado').length,
          parlamento_andino: candidates.filter(c => c.cargo === 'parlamento_andino').length,
        },
      },
      parties: {
        total: partiesResult.count || 0,
      },
      news: {
        total: news.length,
        pending: news.filter(n => !n.status || n.status === 'pending').length,
        approved: news.filter(n => n.status === 'approved').length,
        rejected: news.filter(n => n.status === 'rejected').length,
        featured: news.filter(n => n.status === 'featured').length,
        bySentiment: {
          positive: news.filter(n => n.sentiment === 'positive').length,
          neutral: news.filter(n => n.sentiment === 'neutral').length,
          negative: news.filter(n => n.sentiment === 'negative').length,
        },
      },
      flags: {
        total: flags.length,
        pending: flags.filter(f => !f.status || f.status === 'pending').length,
        verified: flags.filter(f => f.status === 'verified').length,
        rejected: flags.filter(f => f.status === 'rejected').length,
        bySeverity: {
          red: flags.filter(f => f.severity === 'RED').length,
          amber: flags.filter(f => f.severity === 'AMBER').length,
          gray: flags.filter(f => f.severity === 'GRAY').length,
        },
      },
      quiz: {
        total: quizResponses.length,
        last24h: quizResponses.filter(q => new Date(q.created_at) >= oneDayAgo).length,
        last7d: quizResponses.filter(q => new Date(q.created_at) >= sevenDaysAgo).length,
      },
      sync: {
        last24h: syncLogs.length,
        successful: syncLogs.filter(s => s.status === 'completed').length,
        failed: syncLogs.filter(s => s.status === 'failed').length,
        lastBySource: Object.entries(
          syncLogs.reduce((acc, log) => {
            if (!acc[log.source]) {
              acc[log.source] = log
            }
            return acc
          }, {} as Record<string, SyncLogRow>)
        ).map(([source, log]) => ({
          source,
          status: log.status,
          time: log.started_at,
        })),
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
