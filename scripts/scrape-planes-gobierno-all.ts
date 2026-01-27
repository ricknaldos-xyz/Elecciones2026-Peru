/**
 * Download government plans (planes de gobierno) for ALL parties
 * Uses direct URL pattern: https://declara.jne.gob.pe/ASSETS/PLANGOBIERNO/FILEPLANGOBIERNO/{orgId}.pdf
 *
 * Usage:
 *   npx tsx scripts/scrape-planes-gobierno-all.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  createDb,
  CHECKPOINTS_DIR,
  ensureCheckpointsDir,
} from './lib/scraper-utils'

const sql = createDb()

const PLANES_DIR = path.join(process.cwd(), 'public', 'planes')
const PDF_BASE_URL = 'https://declara.jne.gob.pe/ASSETS/PLANGOBIERNO/FILEPLANGOBIERNO'
const DELAY_MS = 1000

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function downloadPdf(url: string, outputPath: string): Promise<{ success: boolean; size: number; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/pdf,*/*',
      },
    })

    if (!response.ok) {
      return { success: false, size: 0, error: `HTTP ${response.status}` }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      return { success: false, size: 0, error: `Invalid content-type: ${contentType}` }
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length < 1000) {
      return { success: false, size: buffer.length, error: 'File too small' }
    }

    // Verify PDF magic bytes
    const header = buffer.slice(0, 5).toString()
    if (!header.startsWith('%PDF')) {
      return { success: false, size: buffer.length, error: 'Not a valid PDF' }
    }

    fs.writeFileSync(outputPath, buffer)
    return { success: true, size: buffer.length }
  } catch (error) {
    return { success: false, size: 0, error: String(error) }
  }
}

async function main() {
  console.log('='.repeat(70))
  console.log(' DESCARGA DE PLANES DE GOBIERNO - TODOS LOS PARTIDOS')
  console.log('='.repeat(70))

  // Ensure directories
  if (!fs.existsSync(PLANES_DIR)) {
    fs.mkdirSync(PLANES_DIR, { recursive: true })
  }
  ensureCheckpointsDir()

  // Load manifest to get unique orgIds
  const manifestPath = path.join(CHECKPOINTS_DIR, 'candidate-manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.error('No se encontro candidate-manifest.json')
    console.log('Ejecuta primero: npx tsx scripts/scrape-all-candidates-jne.ts')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

  // Extract unique orgId -> party name mapping
  const orgParties = new Map<number, string>()
  for (const c of manifest) {
    const orgId = c.orgId
    const party = c.party
    if (orgId && !orgParties.has(orgId)) {
      orgParties.set(orgId, party)
    }
  }

  console.log(`\nPartidos unicos: ${orgParties.size}`)

  let downloaded = 0
  let skipped = 0
  let failed = 0
  let index = 0

  const results: Array<{ orgId: number; party: string; filename: string; status: string }> = []

  for (const [orgId, party] of orgParties) {
    index++
    const slug = slugify(party)
    const filename = `${slug}.pdf`
    const outputPath = path.join(PLANES_DIR, filename)
    const pdfUrl = `${PDF_BASE_URL}/${orgId}.pdf`

    console.log(`\n[${index}/${orgParties.size}] ${party} (orgId: ${orgId})`)

    // Check if already exists
    if (fs.existsSync(outputPath)) {
      const size = fs.statSync(outputPath).size
      if (size > 1000) {
        console.log(`  Ya existe (${(size / 1024 / 1024).toFixed(2)} MB)`)
        skipped++
        results.push({ orgId, party, filename, status: 'exists' })
        continue
      }
    }

    // Download
    const result = await downloadPdf(pdfUrl, outputPath)
    if (result.success) {
      console.log(`  Descargado (${(result.size / 1024 / 1024).toFixed(2)} MB)`)
      downloaded++
      results.push({ orgId, party, filename, status: 'downloaded' })
    } else {
      console.log(`  No disponible: ${result.error}`)
      failed++
      results.push({ orgId, party, filename, status: 'failed' })
    }

    await delay(DELAY_MS)
  }

  // Update database: set plan_gobierno_url for ALL candidates by jne_org_id
  console.log('\n' + '='.repeat(70))
  console.log('ACTUALIZANDO BASE DE DATOS')
  console.log('='.repeat(70))

  let totalUpdated = 0

  for (const r of results) {
    if (r.status === 'failed') continue

    const localUrl = `/planes/${r.filename}`
    try {
      const updated = await sql`
        UPDATE candidates SET
          plan_gobierno_url = ${localUrl},
          last_updated = NOW()
        WHERE jne_org_id = ${r.orgId}
        AND (plan_gobierno_url IS NULL OR plan_gobierno_url = '')
      `
      const count = (updated as any).count || 0
      if (count > 0) {
        console.log(`  ${r.party}: ${count} candidatos actualizados`)
        totalUpdated += count
      }
    } catch (e) {
      console.log(`  Error actualizando ${r.party}: ${e}`)
    }
  }

  // Also update candidates that already have a remote URL to use local path
  for (const r of results) {
    if (r.status === 'failed') continue
    const localUrl = `/planes/${r.filename}`
    try {
      const updated = await sql`
        UPDATE candidates SET
          plan_gobierno_url = ${localUrl},
          last_updated = NOW()
        WHERE jne_org_id = ${r.orgId}
        AND plan_gobierno_url IS NOT NULL
        AND plan_gobierno_url <> ${localUrl}
        AND plan_gobierno_url LIKE 'http%'
      `
      const count = (updated as any).count || 0
      if (count > 0) {
        console.log(`  ${r.party}: ${count} URLs remotas -> locales`)
        totalUpdated += count
      }
    } catch (e) {}
  }

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70))
  console.log(`  Partidos: ${orgParties.size}`)
  console.log(`  PDFs descargados: ${downloaded}`)
  console.log(`  Ya existian: ${skipped}`)
  console.log(`  No disponibles: ${failed}`)
  console.log(`  Candidatos actualizados en BD: ${totalUpdated}`)

  // DB stats
  const [stats] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN plan_gobierno_url IS NOT NULL AND plan_gobierno_url <> '' THEN 1 END) as with_plan
    FROM candidates
    WHERE is_active = true
  `
  console.log(`\n  Candidatos activos: ${stats.total}`)
  console.log(`  Con plan de gobierno: ${stats.with_plan} (${((Number(stats.with_plan) / Number(stats.total)) * 100).toFixed(1)}%)`)

  // List files
  const files = fs.readdirSync(PLANES_DIR).filter(f => f.endsWith('.pdf'))
  let totalSize = 0
  for (const file of files) {
    totalSize += fs.statSync(path.join(PLANES_DIR, file)).size
  }
  console.log(`\n  Archivos en public/planes/: ${files.length} (${(totalSize / 1024 / 1024).toFixed(1)} MB total)`)
}

main().catch(console.error)
