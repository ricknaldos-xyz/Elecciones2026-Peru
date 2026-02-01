/**
 * Fix broken photo URLs for candidates.
 * Checks all candidate photos and tries to find alternatives for 404s.
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('./.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : ''
const sql = neon(DATABASE_URL)

async function checkUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return response.ok
  } catch {
    return false
  }
}

async function main() {
  // Get ALL candidates with photo URLs
  const candidates = await sql`
    SELECT c.id, c.full_name, c.cargo, c.photo_url, c.dni
    FROM candidates c
    WHERE c.is_active = true
      AND c.photo_url IS NOT NULL
    ORDER BY c.full_name
  `

  console.log(`Total candidates with photo_url: ${candidates.length}\n`)

  // Check all photos in batches
  const BATCH_SIZE = 30
  const broken: any[] = []

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map(async (c: any) => ({
        candidate: c,
        ok: await checkUrl(c.photo_url),
      }))
    )

    for (const r of results) {
      if (!r.ok) {
        broken.push(r.candidate)
      }
    }

    const progress = Math.min(i + BATCH_SIZE, candidates.length)
    process.stdout.write(`\rChecked ${progress} / ${candidates.length} (${broken.length} broken)`)
  }

  console.log(`\n\nTotal broken: ${broken.length} out of ${candidates.length}`)

  if (broken.length === 0) {
    console.log('All photos are accessible!')
    return
  }

  console.log('\nBroken photos:')
  for (const c of broken) {
    console.log(`  ${c.full_name} (${c.cargo}): ${c.photo_url}`)
  }

  // Try alternative URL patterns for broken photos
  // JNE uses different URL patterns:
  // 1. mpesije.jne.gob.pe/apidocs/{guid}.jpg (current)
  // 2. votoinformado.jne.gob.pe/Candidato/GetFoto?IdHojaVida={id}
  // 3. plataformaelectoral.jne.gob.pe (API)

  console.log('\n=== Attempting to find alternative photos ===')

  let fixed = 0
  for (const c of broken) {
    // Try plataformaelectoral with DNI
    if (c.dni) {
      // Try the votoinformado pattern
      const altUrl = `https://votoinformado.jne.gob.pe/assets/fotocandidato/${c.dni}.jpg`
      const ok = await checkUrl(altUrl)
      if (ok) {
        await sql`UPDATE candidates SET photo_url = ${altUrl} WHERE id = ${c.id}::uuid`
        console.log(`  FIXED: ${c.full_name} -> votoinformado pattern`)
        fixed++
        continue
      }
    }

    // Try with different GUID extraction from the original URL
    const guidMatch = (c.photo_url as string).match(/([0-9a-f-]{36})/)
    if (guidMatch) {
      const guid = guidMatch[1]
      // Try alternative domain
      const altUrl2 = `https://plataformaelectoral.jne.gob.pe/Candidato/GetFoto?param=${guid}`
      const ok2 = await checkUrl(altUrl2)
      if (ok2) {
        await sql`UPDATE candidates SET photo_url = ${altUrl2} WHERE id = ${c.id}::uuid`
        console.log(`  FIXED: ${c.full_name} -> plataformaelectoral pattern`)
        fixed++
        continue
      }
    }

    // If we can't find an alternative, set photo_url to null so the UI shows initials cleanly
    // (better than a broken image error)
    console.log(`  UNFIXED: ${c.full_name} - no alternative found, setting to NULL`)
    await sql`UPDATE candidates SET photo_url = NULL WHERE id = ${c.id}::uuid`
  }

  console.log(`\nFixed: ${fixed} | Set to NULL: ${broken.length - fixed}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
