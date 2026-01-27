/**
 * Descarga todos los PDFs de planes de gobierno de los candidatos presidenciales
 * Lee de planes-gobierno.json y guarda en public/planes/
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

// Load DATABASE_URL from .env.local
function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
    if (match) return match[1]
  }
  return ''
}

const sql = neon(loadEnv())

interface PlanGobierno {
  candidato: string
  partido: string
  cargo: string
  foto_url: string
  plan_url: string
}

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'planes')
const DELAY_MS = 1000

async function delay(ms: number): Promise<void> {
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
      return { success: false, size: 0, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      return { success: false, size: 0, error: `Invalid content-type: ${contentType}` }
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length < 1000) {
      return { success: false, size: buffer.length, error: 'File too small, probably an error page' }
    }

    // Verify PDF magic bytes
    const header = buffer.slice(0, 5).toString()
    if (!header.startsWith('%PDF')) {
      return { success: false, size: buffer.length, error: 'Not a valid PDF file' }
    }

    fs.writeFileSync(outputPath, buffer)
    return { success: true, size: buffer.length }
  } catch (error) {
    return { success: false, size: 0, error: String(error) }
  }
}

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' DESCARGA DE PLANES DE GOBIERNO '.padStart(45).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Read planes-gobierno.json
  const planesPath = path.join(process.cwd(), 'planes-gobierno.json')
  if (!fs.existsSync(planesPath)) {
    console.error('❌ No se encontró planes-gobierno.json')
    console.log('   Ejecuta primero: npx tsx scripts/scrape-planes-gobierno.ts')
    process.exit(1)
  }

  const allPlanes: PlanGobierno[] = JSON.parse(fs.readFileSync(planesPath, 'utf-8'))

  // Filter only presidential candidates
  const presidentes = allPlanes.filter(p => p.cargo === 'PRESIDENTE DE LA REPÚBLICA')
  console.log(`\n📋 Candidatos presidenciales: ${presidentes.length}`)

  // Get unique plans (by party, since plan is shared within formula)
  const uniquePlans = new Map<string, PlanGobierno>()
  for (const p of presidentes) {
    if (p.plan_url && !uniquePlans.has(p.plan_url)) {
      uniquePlans.set(p.plan_url, p)
    }
  }

  console.log(`📄 Planes únicos a descargar: ${uniquePlans.size}`)
  console.log(`📁 Directorio: ${OUTPUT_DIR}\n`)

  const stats = {
    total: uniquePlans.size,
    downloaded: 0,
    skipped: 0,
    failed: 0,
    totalSize: 0,
  }

  const results: Array<{
    candidato: string
    partido: string
    url: string
    localPath: string
    status: 'downloaded' | 'skipped' | 'failed'
    size?: number
    error?: string
  }> = []

  let index = 0
  for (const [planUrl, plan] of uniquePlans) {
    index++
    const slug = slugify(plan.partido)
    const filename = `${slug}.pdf`
    const outputPath = path.join(OUTPUT_DIR, filename)
    const localPath = `/planes/${filename}`

    console.log(`[${index}/${uniquePlans.size}] ${plan.partido}`)
    console.log(`  URL: ${planUrl}`)

    // Check if already downloaded
    if (fs.existsSync(outputPath)) {
      const existingSize = fs.statSync(outputPath).size
      if (existingSize > 10000) {
        console.log(`  ⏭ Ya existe (${(existingSize / 1024 / 1024).toFixed(2)} MB)`)
        stats.skipped++
        results.push({
          candidato: plan.candidato,
          partido: plan.partido,
          url: planUrl,
          localPath,
          status: 'skipped',
          size: existingSize,
        })
        continue
      }
    }

    // Download
    const result = await downloadPdf(planUrl, outputPath)

    if (result.success) {
      console.log(`  ✓ Descargado (${(result.size / 1024 / 1024).toFixed(2)} MB)`)
      stats.downloaded++
      stats.totalSize += result.size
      results.push({
        candidato: plan.candidato,
        partido: plan.partido,
        url: planUrl,
        localPath,
        status: 'downloaded',
        size: result.size,
      })
    } else {
      console.log(`  ✗ Error: ${result.error}`)
      stats.failed++
      results.push({
        candidato: plan.candidato,
        partido: plan.partido,
        url: planUrl,
        localPath,
        status: 'failed',
        error: result.error,
      })
    }

    await delay(DELAY_MS)
  }

  // Print summary
  console.log('\n' + '═'.repeat(70))
  console.log('RESUMEN')
  console.log('═'.repeat(70))
  console.log(`Total planes: ${stats.total}`)
  console.log(`Descargados: ${stats.downloaded}`)
  console.log(`Ya existían: ${stats.skipped}`)
  console.log(`Fallidos: ${stats.failed}`)
  console.log(`Tamaño total: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`)

  // Save results
  fs.writeFileSync('planes-download-results.json', JSON.stringify(results, null, 2))
  console.log('\nResultados guardados en: planes-download-results.json')

  // Update database with local paths
  console.log('\n' + '═'.repeat(70))
  console.log('ACTUALIZANDO BASE DE DATOS')
  console.log('═'.repeat(70))

  let dbUpdated = 0
  for (const result of results) {
    if (result.status === 'downloaded' || result.status === 'skipped') {
      try {
        // Find candidates from this party and update their plan_gobierno_url
        const updated = await sql`
          UPDATE candidates
          SET
            plan_gobierno_url = ${result.url},
            data_source = 'jne',
            last_updated = NOW()
          WHERE LOWER(party_name) LIKE ${`%${result.partido.toLowerCase().split(' ')[0]}%`}
          AND cargo = 'presidente'
          RETURNING id, full_name
        `

        if (updated.length > 0) {
          console.log(`✓ ${updated[0].full_name} -> ${result.localPath}`)
          dbUpdated++
        }
      } catch (error) {
        // Silent continue
      }
    }
  }

  console.log(`\nCandidatos actualizados en BD: ${dbUpdated}`)

  // List files in output directory
  console.log('\n' + '═'.repeat(70))
  console.log('ARCHIVOS EN public/planes/')
  console.log('═'.repeat(70))

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.pdf'))
  let totalSize = 0
  for (const file of files) {
    const size = fs.statSync(path.join(OUTPUT_DIR, file)).size
    totalSize += size
    console.log(`  ${file.padEnd(50)} ${(size / 1024 / 1024).toFixed(2)} MB`)
  }
  console.log(`\nTotal: ${files.length} archivos, ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
}

main().catch(console.error)
