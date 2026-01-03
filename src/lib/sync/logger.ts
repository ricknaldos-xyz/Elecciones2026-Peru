import { sql } from '@/lib/db'

export type SyncSource = 'jne' | 'onpe' | 'poder_judicial' | 'news' | 'youtube' | 'google_news' | 'tiktok' | 'twitter' | 'expanded_rss' | 'ai_analysis'
export type SyncStatus = 'started' | 'running' | 'completed' | 'failed'

export interface SyncResult {
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
  metadata?: Record<string, unknown>
}

export interface SyncLogEntry {
  id: string
  source: SyncSource
  status: SyncStatus
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
  error_message: string | null
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  metadata: Record<string, unknown>
}

/**
 * Creates a new sync log entry when starting a sync job
 */
export async function createSyncLog(source: SyncSource): Promise<string> {
  const result = await sql`
    INSERT INTO sync_logs (source, status)
    VALUES (${source}, 'started')
    RETURNING id
  `
  return result[0].id
}

/**
 * Updates a sync log entry to mark it as running
 */
export async function markSyncRunning(logId: string): Promise<void> {
  await sql`
    UPDATE sync_logs
    SET status = 'running'
    WHERE id = ${logId}::uuid
  `
}

/**
 * Completes a sync log entry with results
 */
export async function completeSyncLog(
  logId: string,
  status: 'completed' | 'failed',
  result: SyncResult & { error_message?: string }
): Promise<void> {
  await sql`
    UPDATE sync_logs
    SET
      status = ${status},
      records_processed = ${result.records_processed},
      records_updated = ${result.records_updated},
      records_created = ${result.records_created},
      records_skipped = ${result.records_skipped},
      error_message = ${result.error_message || null},
      completed_at = NOW(),
      metadata = ${JSON.stringify(result.metadata || {})}::jsonb
    WHERE id = ${logId}::uuid
  `
}

/**
 * Gets the latest sync status for all sources
 */
export async function getLatestSyncStatus(): Promise<SyncLogEntry[]> {
  const result = await sql`
    SELECT * FROM latest_sync_status
    ORDER BY started_at DESC
  `
  return result as SyncLogEntry[]
}

/**
 * Gets sync logs for a specific source
 */
export async function getSyncLogs(
  source: SyncSource,
  limit: number = 10
): Promise<SyncLogEntry[]> {
  const result = await sql`
    SELECT *
    FROM sync_logs
    WHERE source = ${source}
    ORDER BY started_at DESC
    LIMIT ${limit}
  `
  return result as SyncLogEntry[]
}

/**
 * Gets all sync logs with optional filtering
 */
export async function getAllSyncLogs(options: {
  limit?: number
  offset?: number
  source?: SyncSource
  status?: SyncStatus
}): Promise<{ logs: SyncLogEntry[]; total: number }> {
  const { limit = 20, offset = 0, source, status } = options

  let whereClause = ''
  const conditions: string[] = []

  if (source) conditions.push(`source = '${source}'`)
  if (status) conditions.push(`status = '${status}'`)

  if (conditions.length > 0) {
    whereClause = `WHERE ${conditions.join(' AND ')}`
  }

  const [logs, countResult] = await Promise.all([
    sql`
      SELECT *
      FROM sync_logs
      ${sql.unsafe(whereClause)}
      ORDER BY started_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*) as total
      FROM sync_logs
      ${sql.unsafe(whereClause)}
    `,
  ])

  return {
    logs: logs as SyncLogEntry[],
    total: Number(countResult[0].total),
  }
}

/**
 * Cleans up old sync logs (keeps last 30 days)
 */
export async function cleanOldSyncLogs(): Promise<number> {
  const result = await sql`
    DELETE FROM sync_logs
    WHERE started_at < NOW() - INTERVAL '30 days'
    RETURNING id
  `
  return result.length
}

/**
 * Helper to create a sync logger instance for a specific job
 */
export function createSyncLogger(source: SyncSource) {
  let logId: string | null = null
  let stats = {
    records_processed: 0,
    records_updated: 0,
    records_created: 0,
    records_skipped: 0,
  }
  const metadata: Record<string, unknown> = {}

  return {
    async start(): Promise<string> {
      logId = await createSyncLog(source)
      console.log(`[${source}] Sync started - Log ID: ${logId}`)
      return logId
    },

    async markRunning(): Promise<void> {
      if (logId) {
        await markSyncRunning(logId)
        console.log(`[${source}] Sync running`)
      }
    },

    incrementProcessed(count: number = 1): void {
      stats.records_processed += count
    },

    incrementUpdated(count: number = 1): void {
      stats.records_updated += count
    },

    incrementCreated(count: number = 1): void {
      stats.records_created += count
    },

    incrementSkipped(count: number = 1): void {
      stats.records_skipped += count
    },

    setMetadata(key: string, value: unknown): void {
      metadata[key] = value
    },

    getStats(): typeof stats {
      return { ...stats }
    },

    async complete(): Promise<SyncResult> {
      if (logId) {
        await completeSyncLog(logId, 'completed', {
          ...stats,
          metadata,
        })
        console.log(`[${source}] Sync completed:`, stats)
      }
      return { ...stats, metadata }
    },

    async fail(error: Error | string): Promise<void> {
      const errorMessage = error instanceof Error ? error.message : error
      if (logId) {
        await completeSyncLog(logId, 'failed', {
          ...stats,
          error_message: errorMessage,
          metadata,
        })
        console.error(`[${source}] Sync failed:`, errorMessage)
      }
    },
  }
}
