/**
 * Fix score_breakdowns for same-DNI candidates that were synced.
 * When a person runs for presidente AND senador/diputado, their integrity
 * should match. We sync the breakdown penalties from the presidential entry.
 */
import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  if (match) return match[1]
  throw new Error('DATABASE_URL not found')
}

const sql = neon(loadEnv())

async function main() {
  console.log('='.repeat(80))
  console.log(' FIX BREAKDOWNS FOR SAME-DNI CANDIDATES')
  console.log('='.repeat(80))

  // Find same-DNI groups where one is presidente
  const groups = await sql`
    WITH pres AS (
      SELECT c.dni, c.id as pres_id, c.full_name as pres_name,
             sb.integrity_base, sb.penal_penalty, sb.penal_penalties,
             sb.civil_penalties, sb.resignation_penalty, sb.reinfo_penalty,
             sb.company_penalty, sb.voting_penalty, sb.voting_bonus,
             sb.tax_penalty, sb.omission_penalty
      FROM candidates c
      JOIN score_breakdowns sb ON c.id = sb.candidate_id
      WHERE c.cargo = 'presidente' AND c.is_active = true AND c.dni IS NOT NULL
    )
    SELECT p.dni, p.pres_name, p.pres_id,
           p.integrity_base, p.penal_penalty, p.penal_penalties,
           p.civil_penalties, p.resignation_penalty, p.reinfo_penalty,
           p.company_penalty, p.voting_penalty, p.voting_bonus,
           p.tax_penalty, p.omission_penalty,
           c2.id as other_id, c2.full_name as other_name, c2.cargo as other_cargo,
           s2.integrity as other_integrity
    FROM pres p
    JOIN candidates c2 ON c2.dni = p.dni AND c2.id != p.pres_id AND c2.is_active = true
    JOIN scores s2 ON c2.id = s2.candidate_id
    ORDER BY p.dni
  `

  let fixed = 0
  for (const row of groups) {
    // Copy presidential breakdown penalties to the other entry
    await sql`
      UPDATE score_breakdowns SET
        integrity_base = ${row.integrity_base},
        penal_penalty = ${row.penal_penalty},
        penal_penalties = ${row.penal_penalties ? JSON.stringify(row.penal_penalties) : '[]'}::jsonb,
        civil_penalties = ${row.civil_penalties ? JSON.stringify(row.civil_penalties) : '[]'}::jsonb,
        resignation_penalty = ${row.resignation_penalty},
        reinfo_penalty = ${row.reinfo_penalty},
        company_penalty = ${row.company_penalty},
        voting_penalty = ${row.voting_penalty},
        voting_bonus = ${row.voting_bonus},
        tax_penalty = ${row.tax_penalty},
        omission_penalty = ${row.omission_penalty}
      WHERE candidate_id = ${row.other_id}
    `
    console.log(`  ✓ ${row.other_name} (${row.other_cargo}) ← synced from ${row.pres_name} (presidente)`)
    fixed++
  }

  console.log(`\n  Total: ${fixed} breakdowns synced`)

  // Verify
  console.log('\n--- Verification ---\n')
  const mismatches = await sql`
    SELECT c.full_name, c.cargo, s.integrity as score_integrity,
           sb.integrity_base, sb.penal_penalty, sb.civil_penalties,
           sb.resignation_penalty, sb.reinfo_penalty,
           sb.company_penalty, sb.voting_penalty, sb.voting_bonus,
           sb.tax_penalty, sb.omission_penalty
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true
    ORDER BY c.full_name
  `

  let mismatchCount = 0
  for (const row of mismatches) {
    let civilSum = 0
    try {
      const civils = typeof row.civil_penalties === 'string'
        ? JSON.parse(row.civil_penalties)
        : row.civil_penalties || []
      civilSum = civils.reduce((s: number, p: { penalty: number }) => s + (Number(p.penalty) || 0), 0)
    } catch { /* */ }

    const calc = Math.min(100, Math.max(0,
      Number(row.integrity_base || 100)
      - Number(row.penal_penalty || 0)
      - civilSum
      - Number(row.resignation_penalty || 0)
      - Number(row.reinfo_penalty || 0)
      - Number(row.company_penalty || 0)
      - Number(row.voting_penalty || 0)
      + Number(row.voting_bonus || 0)
      - Number(row.tax_penalty || 0)
      - Number(row.omission_penalty || 0)
    ))

    const diff = Math.abs(Number(row.score_integrity) - calc)
    if (diff > 0.5) {
      console.log(`  ⚠ ${row.full_name.substring(0, 38).padEnd(40)} (${row.cargo}) stored=${row.score_integrity} calc=${calc} diff=${diff.toFixed(0)}`)
      mismatchCount++
    }
  }

  if (mismatchCount === 0) {
    console.log('  ✓ ALL SCORES MATCH THEIR BREAKDOWNS — 0 mismatches')
  } else {
    console.log(`\n  ⚠ ${mismatchCount} MISMATCHES REMAINING`)
  }
}

main().catch(console.error)
