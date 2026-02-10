/**
 * Fix negative asset values in the database.
 * Some entries have negative real_estate_total or vehicle_total
 * (error sentinels from the scraper like -1, -3, -9).
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

async function main() {
  console.log('Finding candidates with negative asset values...\n')

  const candidates = await sql`
    SELECT id, full_name, assets_declaration
    FROM candidates
    WHERE assets_declaration IS NOT NULL
      AND (
        (assets_declaration->>'real_estate_total')::numeric < 0
        OR (assets_declaration->>'vehicle_total')::numeric < 0
      )
  `

  console.log(`Found ${candidates.length} candidates with negative values:\n`)

  for (const c of candidates) {
    const ad = c.assets_declaration as Record<string, unknown>
    const rTotal = Number(ad.real_estate_total) || 0
    const vTotal = Number(ad.vehicle_total) || 0
    console.log(`  ${c.full_name}: real_estate=${rTotal}, vehicles=${vTotal}`)

    // Clamp negative values to 0
    if (rTotal < 0) ad.real_estate_total = 0
    if (vTotal < 0) ad.vehicle_total = 0

    await sql`
      UPDATE candidates
      SET assets_declaration = ${JSON.stringify(ad)}::jsonb
      WHERE id = ${c.id}
    `
  }

  console.log(`\nFixed ${candidates.length} candidates.`)
}

main().catch(console.error)
