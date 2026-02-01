/**
 * Check FP candidate photo URLs to see if they're accessible
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('./.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : ''
const sql = neon(DATABASE_URL)

async function checkUrl(url: string): Promise<{ ok: boolean; status: number; contentType: string }> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
    }
  } catch (error: any) {
    return { ok: false, status: 0, contentType: error.message }
  }
}

async function main() {
  // Get FP candidates with photo URLs, focusing on the ones the user mentioned
  const candidates = await sql`
    SELECT c.id, c.full_name, c.cargo, c.photo_url
    FROM candidates c
    JOIN parties p ON c.party_id = p.id
    WHERE (p.short_name = 'FP' OR p.name = 'Fuerza Popular')
      AND c.is_active = true
      AND c.photo_url IS NOT NULL
    ORDER BY c.full_name
  `

  console.log(`Total FP candidates with photo_url: ${candidates.length}\n`)

  // Check specific candidates mentioned by user
  const priority = ['TORRES MORALES', 'GALARRETA']
  const priorityCandidates = candidates.filter((c: any) =>
    priority.some(name => (c.full_name as string).includes(name))
  )

  console.log('=== Priority candidates (user reported broken) ===')
  for (const c of priorityCandidates) {
    const result = await checkUrl(c.photo_url as string)
    console.log(`${c.full_name} (${c.cargo}):`)
    console.log(`  URL: ${c.photo_url}`)
    console.log(`  Status: ${result.status} | OK: ${result.ok} | Type: ${result.contentType}`)
  }

  // Sample check 10 random FP candidates
  console.log('\n=== Random sample of 10 FP candidates ===')
  const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, 10)

  let working = 0
  let broken = 0

  for (const c of shuffled) {
    const result = await checkUrl(c.photo_url as string)
    const status = result.ok ? 'OK' : 'BROKEN'
    console.log(`${status}: ${c.full_name} -> ${result.status} ${result.contentType}`)
    if (result.ok) working++
    else broken++
  }

  console.log(`\nSample results: ${working} working, ${broken} broken out of 10`)

  // Check how many have null photo_url
  const noPhoto = await sql`
    SELECT COUNT(*) as cnt
    FROM candidates c
    JOIN parties p ON c.party_id = p.id
    WHERE (p.short_name = 'FP' OR p.name = 'Fuerza Popular')
      AND c.is_active = true
      AND c.photo_url IS NULL
  `
  console.log(`\nFP candidates with NULL photo_url: ${noPhoto[0].cnt}`)

  // Check photo URL patterns
  const patterns = await sql`
    SELECT
      CASE
        WHEN c.photo_url LIKE '%mpesije.jne%' THEN 'mpesije.jne'
        WHEN c.photo_url LIKE '%votoinformado%' THEN 'votoinformado'
        WHEN c.photo_url LIKE '%plataformaelectoral%' THEN 'plataformaelectoral'
        WHEN c.photo_url LIKE '%wikimedia%' THEN 'wikimedia'
        ELSE 'other'
      END as pattern,
      COUNT(*) as cnt
    FROM candidates c
    JOIN parties p ON c.party_id = p.id
    WHERE (p.short_name = 'FP' OR p.name = 'Fuerza Popular')
      AND c.is_active = true
      AND c.photo_url IS NOT NULL
    GROUP BY pattern
  `
  console.log('\nPhoto URL patterns:')
  for (const row of patterns) {
    console.log(`  ${row.pattern}: ${row.cnt}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
