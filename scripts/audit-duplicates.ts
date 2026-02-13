/**
 * Comprehensive audit for duplicate records and data inconsistencies
 * across the candidates table (Peruvian elections 2026).
 *
 * Checks:
 *   1. Same DNI in multiple cargos - data consistency
 *   2. Duplicate slugs, duplicate DNIs within same cargo
 *   3. Name inconsistencies (same DNI, different full_name)
 *   4. JNE ID inconsistencies (same DNI, different jne_id)
 *   5. Party mismatches (same DNI, different party)
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('/Users/rick/Development/rowship/test26/.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const sql = neon(dbMatch![1])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonStableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null'
  if (Array.isArray(obj)) {
    return '[' + obj.map(jsonStableStringify).join(',') + ']'
  }
  if (typeof obj === 'object') {
    const sorted = Object.keys(obj as Record<string, unknown>).sort()
    return '{' + sorted.map(k => JSON.stringify(k) + ':' + jsonStableStringify((obj as Record<string, unknown>)[k])).join(',') + '}'
  }
  return JSON.stringify(obj)
}

function normalizeForCompare(val: unknown): string {
  if (val === null || val === undefined) return '<NULL>'
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return jsonStableStringify(parsed)
    } catch {
      return val.trim()
    }
  }
  if (typeof val === 'object') return jsonStableStringify(val)
  return String(val)
}

function truncate(s: string, len: number): string {
  if (s.length <= len) return s
  return s.slice(0, len - 3) + '...'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(80))
  console.log(' DATABASE AUDIT: Duplicates & Data Inconsistencies')
  console.log(' Peruvian Elections 2026 Candidates')
  console.log('='.repeat(80))

  // Fetch ALL candidates with party info
  const allCandidates = await sql`
    SELECT
      c.id, c.slug, c.full_name, c.cargo, c.dni, c.jne_id, c.is_active,
      c.party_id, p.name AS party_name, p.short_name AS party_short,
      c.education_level, c.education_details,
      c.experience_details,
      c.political_trajectory,
      c.penal_sentences, c.civil_sentences,
      c.assets_declaration,
      c.birth_date, c.photo_url
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    ORDER BY c.dni NULLS LAST, c.full_name
  `

  console.log(`\nTotal candidate records: ${allCandidates.length}`)

  let totalIssues = 0

  // =========================================================================
  // CHECK 1: Same DNI in multiple cargos - data consistency
  // =========================================================================
  console.log('\n' + '='.repeat(80))
  console.log(' CHECK 1: Same person (DNI) in multiple cargos -- data consistency')
  console.log('='.repeat(80))

  const byDni: Record<string, typeof allCandidates> = {}
  for (const c of allCandidates) {
    if (!c.dni) continue
    const key = c.dni.trim()
    if (!byDni[key]) byDni[key] = []
    byDni[key].push(c)
  }

  const multiCargoDnis = Object.entries(byDni).filter(([, recs]) => recs.length > 1)
  console.log(`\nDNIs appearing in multiple records: ${multiCargoDnis.length}`)

  const dataFields = [
    'education_level', 'education_details', 'experience_details',
    'political_trajectory', 'penal_sentences', 'civil_sentences', 'assets_declaration',
  ]

  let inconsistentDataCount = 0

  for (const [dni, recs] of multiCargoDnis) {
    const cargos = recs.map(r => `${r.cargo}${r.is_active ? '' : ' (inactive)'}`).join(', ')
    const names = [...new Set(recs.map(r => r.full_name))]

    // Compare data fields pairwise
    const diffs: string[] = []
    for (const field of dataFields) {
      const values = recs.map(r => normalizeForCompare(r[field]))
      const unique = [...new Set(values)]
      if (unique.length > 1) {
        diffs.push(field)
      }
    }

    if (diffs.length > 0) {
      inconsistentDataCount++
      totalIssues++
      console.log(`\n  [INCONSISTENCY] DNI ${dni} -- ${names[0]}`)
      console.log(`    Cargos: ${cargos}`)
      console.log(`    Differing fields: ${diffs.join(', ')}`)
      for (const field of diffs) {
        for (const r of recs) {
          const val = normalizeForCompare(r[field])
          console.log(`      ${r.cargo.padEnd(20)} ${field}: ${truncate(val, 120)}`)
        }
      }
    }
  }

  if (inconsistentDataCount === 0) {
    console.log('  No data inconsistencies found across multi-cargo records.')
  } else {
    console.log(`\n  TOTAL multi-cargo data inconsistencies: ${inconsistentDataCount}`)
  }

  // Also list all multi-cargo DNIs (even consistent ones)
  console.log(`\n  --- All multi-cargo candidates (${multiCargoDnis.length}) ---`)
  for (const [dni, recs] of multiCargoDnis) {
    const cargos = recs.map(r => r.cargo).join(' + ')
    console.log(`    DNI ${dni}: ${recs[0].full_name} => ${cargos}`)
  }

  // =========================================================================
  // CHECK 2: Duplicate slugs / duplicate DNIs within same cargo
  // =========================================================================
  console.log('\n' + '='.repeat(80))
  console.log(' CHECK 2: Duplicate slugs and duplicate DNIs within same cargo')
  console.log('='.repeat(80))

  // 2a. Duplicate slugs
  const slugCounts: Record<string, typeof allCandidates> = {}
  for (const c of allCandidates) {
    if (!c.slug) continue
    if (!slugCounts[c.slug]) slugCounts[c.slug] = []
    slugCounts[c.slug].push(c)
  }
  const dupSlugs = Object.entries(slugCounts).filter(([, recs]) => recs.length > 1)
  console.log(`\n  Duplicate slugs found: ${dupSlugs.length}`)
  for (const [slug, recs] of dupSlugs) {
    totalIssues++
    console.log(`\n  [DUPLICATE SLUG] "${slug}"`)
    for (const r of recs) {
      console.log(`    id=${r.id}  name=${r.full_name}  cargo=${r.cargo}  active=${r.is_active}`)
    }
  }

  // 2b. Duplicate DNIs within same cargo
  const dniCargoKey = (c: { dni: string; cargo: string }) => `${c.dni}|${c.cargo}`
  const dniCargoCounts: Record<string, typeof allCandidates> = {}
  for (const c of allCandidates) {
    if (!c.dni) continue
    const key = dniCargoKey(c)
    if (!dniCargoCounts[key]) dniCargoCounts[key] = []
    dniCargoCounts[key].push(c)
  }
  const dupDniCargo = Object.entries(dniCargoCounts).filter(([, recs]) => recs.length > 1)
  console.log(`\n  Duplicate DNI within same cargo: ${dupDniCargo.length}`)
  for (const [key, recs] of dupDniCargo) {
    totalIssues++
    const [dni, cargo] = key.split('|')
    console.log(`\n  [DUPLICATE DNI+CARGO] DNI ${dni} / cargo=${cargo}`)
    for (const r of recs) {
      console.log(`    id=${r.id}  slug=${r.slug}  name=${r.full_name}  active=${r.is_active}`)
    }
  }

  // 2c. Candidates without DNI
  const noDni = allCandidates.filter(c => !c.dni || c.dni.trim() === '')
  console.log(`\n  Candidates without DNI: ${noDni.length}`)
  if (noDni.length > 0 && noDni.length <= 30) {
    for (const c of noDni) {
      console.log(`    ${c.full_name} (cargo=${c.cargo}, slug=${c.slug}, active=${c.is_active})`)
    }
  } else if (noDni.length > 30) {
    for (const c of noDni.slice(0, 30)) {
      console.log(`    ${c.full_name} (cargo=${c.cargo}, slug=${c.slug}, active=${c.is_active})`)
    }
    console.log(`    ... and ${noDni.length - 30} more`)
  }

  // =========================================================================
  // CHECK 3: Name inconsistencies (same DNI, different full_name)
  // =========================================================================
  console.log('\n' + '='.repeat(80))
  console.log(' CHECK 3: Name inconsistencies (same DNI, different full_name)')
  console.log('='.repeat(80))

  let nameIssues = 0
  for (const [dni, recs] of multiCargoDnis) {
    const names = [...new Set(recs.map(r => r.full_name.trim()))]
    if (names.length > 1) {
      nameIssues++
      totalIssues++
      console.log(`\n  [NAME MISMATCH] DNI ${dni}`)
      for (const r of recs) {
        console.log(`    cargo=${r.cargo.padEnd(20)}  name="${r.full_name}"`)
      }
    }
  }
  if (nameIssues === 0) {
    console.log('  No name inconsistencies found.')
  } else {
    console.log(`\n  TOTAL name mismatches: ${nameIssues}`)
  }

  // =========================================================================
  // CHECK 4: JNE ID inconsistencies (same DNI, different jne_id)
  // =========================================================================
  console.log('\n' + '='.repeat(80))
  console.log(' CHECK 4: JNE ID inconsistencies (same DNI, different jne_id)')
  console.log('='.repeat(80))

  let jneIssues = 0
  for (const [dni, recs] of multiCargoDnis) {
    // Filter out null jne_ids for this comparison
    const withJne = recs.filter(r => r.jne_id !== null && r.jne_id !== undefined && r.jne_id !== '')
    if (withJne.length < 2) continue

    const jneIds = [...new Set(withJne.map(r => String(r.jne_id).trim()))]
    if (jneIds.length > 1) {
      jneIssues++
      totalIssues++
      console.log(`\n  [JNE_ID MISMATCH] DNI ${dni} -- ${recs[0].full_name}`)
      for (const r of withJne) {
        console.log(`    cargo=${r.cargo.padEnd(20)}  jne_id=${r.jne_id}`)
      }
    }
  }

  // Also check: same DNI, one has jne_id, another does not
  let jneMissing = 0
  for (const [dni, recs] of multiCargoDnis) {
    const withJne = recs.filter(r => r.jne_id !== null && r.jne_id !== undefined && r.jne_id !== '')
    const withoutJne = recs.filter(r => !r.jne_id || r.jne_id === '')
    if (withJne.length > 0 && withoutJne.length > 0) {
      jneMissing++
      totalIssues++
      console.log(`\n  [JNE_ID PARTIAL] DNI ${dni} -- ${recs[0].full_name}`)
      console.log(`    Records with jne_id: ${withJne.map(r => `${r.cargo}(${r.jne_id})`).join(', ')}`)
      console.log(`    Records WITHOUT jne_id: ${withoutJne.map(r => r.cargo).join(', ')}`)
    }
  }

  if (jneIssues === 0 && jneMissing === 0) {
    console.log('  No JNE ID inconsistencies found.')
  } else {
    console.log(`\n  JNE ID mismatches: ${jneIssues}`)
    console.log(`  JNE ID partially missing: ${jneMissing}`)
  }

  // =========================================================================
  // CHECK 5: Party mismatches (same DNI, different party)
  // =========================================================================
  console.log('\n' + '='.repeat(80))
  console.log(' CHECK 5: Party mismatches (same DNI, different party)')
  console.log('='.repeat(80))

  let partyIssues = 0
  for (const [dni, recs] of multiCargoDnis) {
    const withParty = recs.filter(r => r.party_id)
    if (withParty.length < 2) continue

    const partyIds = [...new Set(withParty.map(r => r.party_id))]
    if (partyIds.length > 1) {
      partyIssues++
      totalIssues++
      console.log(`\n  [PARTY MISMATCH] DNI ${dni} -- ${recs[0].full_name}`)
      for (const r of recs) {
        console.log(`    cargo=${r.cargo.padEnd(20)}  party=${r.party_name || '<NULL>'} (${r.party_short || '?'})`)
      }
    }
  }

  // Also check: same DNI, one has party, another does not
  let partyMissing = 0
  for (const [dni, recs] of multiCargoDnis) {
    const withParty = recs.filter(r => r.party_id)
    const withoutParty = recs.filter(r => !r.party_id)
    if (withParty.length > 0 && withoutParty.length > 0) {
      partyMissing++
      totalIssues++
      console.log(`\n  [PARTY PARTIAL] DNI ${dni} -- ${recs[0].full_name}`)
      console.log(`    With party: ${withParty.map(r => `${r.cargo} => ${r.party_short || r.party_name}`).join(', ')}`)
      console.log(`    Without party: ${withoutParty.map(r => r.cargo).join(', ')}`)
    }
  }

  if (partyIssues === 0 && partyMissing === 0) {
    console.log('  No party mismatches found.')
  } else {
    console.log(`\n  Party mismatches (different parties): ${partyIssues}`)
    console.log(`  Party partially missing: ${partyMissing}`)
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(80))
  console.log(' SUMMARY')
  console.log('='.repeat(80))
  console.log(`  Total candidate records:                  ${allCandidates.length}`)
  console.log(`  Unique DNIs with multiple records:        ${multiCargoDnis.length}`)
  console.log(`  Candidates without DNI:                   ${noDni.length}`)
  console.log(`  Duplicate slugs:                          ${dupSlugs.length}`)
  console.log(`  Duplicate DNI+cargo combos:               ${dupDniCargo.length}`)
  console.log(`  Multi-cargo data inconsistencies:         ${inconsistentDataCount}`)
  console.log(`  Name mismatches:                          ${nameIssues}`)
  console.log(`  JNE ID mismatches:                        ${jneIssues}`)
  console.log(`  JNE ID partially missing:                 ${jneMissing}`)
  console.log(`  Party mismatches (different):              ${partyIssues}`)
  console.log(`  Party partially missing:                  ${partyMissing}`)
  console.log(`  -----------------------------------------`)
  console.log(`  TOTAL ISSUES FLAGGED:                     ${totalIssues}`)
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('FATAL ERROR:', err)
  process.exit(1)
})
