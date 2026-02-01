/**
 * Find and fix duplicate candidates that have different data
 * (manual entries vs JNE imports)
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('/Users/rick/Development/rowship/test26/.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : ''
const sql = neon(DATABASE_URL)

async function main() {
  console.log('=== Checking for duplicate presidential candidates ===\n')

  // Find all active presidential candidates
  const all = await sql`
    SELECT c.id, c.full_name, c.cargo, c.is_active,
           p.short_name as party,
           jsonb_array_length(COALESCE(c.penal_sentences, '[]'::jsonb)) as penal_count,
           jsonb_array_length(COALESCE(c.civil_sentences, '[]'::jsonb)) as civil_count,
           s.integrity, s.competence, s.score_balanced
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN scores s ON s.candidate_id = c.id
    WHERE c.is_active = true AND c.cargo = 'presidente'
    ORDER BY c.full_name
  `

  // Check for likely duplicates by partial name matching
  const names = [
    'LOPEZ ALIAGA',
    'LUNA GALVEZ',
    'CERRON',
    'ACUÑA',
    'FUJIMORI',
    'VIZCARRA',
    'WILLIAMS',
    'CHIABRA',
    'FORSYTH',
    'DIEZ CANSECO',
    'PEREZ TELLO',
    'LOPEZ CHAU',
  ]

  for (const name of names) {
    const matches = all.filter((c: any) =>
      c.full_name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    )
    if (matches.length > 1) {
      console.log(`\n  DUPLICATES for "${name}" (${matches.length} matches):`)
      for (const m of matches) {
        console.log(`    ID: ${m.id}`)
        console.log(`    Name: ${m.full_name} (${m.party})`)
        console.log(`    Penal: ${m.penal_count} | Civil: ${m.civil_count}`)
        console.log(`    Scores: Balanced=${m.score_balanced} I=${m.integrity} C=${m.competence}`)
        console.log('')
      }
    }
  }

  // Now sync: for duplicates, copy penal/civil/flags from the enriched version to the other
  console.log('\n=== Syncing duplicate data ===\n')

  const syncPairs = [
    { enrichedName: 'LOPEZ ALIAGA CAZORLA RAFAEL BERNARDO', duplicatePattern: 'pez Aliaga' },
    { enrichedName: 'LUNA GALVEZ JOSE LEON', duplicatePattern: 'Luna G' },
    { enrichedName: 'CERRON ROJAS VLADIMIR ROY', duplicatePattern: 'Vladimir' },
    { enrichedName: 'VIZCARRA CORNEJO MARIO ENRIQUE', duplicatePattern: 'Vizcarra' },
    { enrichedName: 'KEIKO SOFÍA FUJIMORI HIGUCHI', duplicatePattern: 'Fujimori' },
    { enrichedName: 'ACUÑA PERALTA CESAR', duplicatePattern: 'Acuña' },
  ]

  for (const pair of syncPairs) {
    // Find enriched version
    const enriched = all.find((c: any) => c.full_name === pair.enrichedName)
    if (!enriched) {
      console.log(`  Skip: ${pair.enrichedName} not found`)
      continue
    }

    // Find duplicate(s)
    const duplicates = all.filter((c: any) =>
      c.full_name !== pair.enrichedName &&
      c.id !== enriched.id &&
      c.full_name.includes(pair.duplicatePattern)
    )

    for (const dup of duplicates) {
      // Check if duplicate has less data or higher integrity (meaning it's missing penalties)
      if (Number(dup.penal_count) < Number(enriched.penal_count) ||
          Number(dup.civil_count) < Number(enriched.civil_count) ||
          Number(dup.integrity) > Number(enriched.integrity) + 10) {

        console.log(`  Syncing: ${dup.full_name} (I=${dup.integrity}) ← ${enriched.full_name} (I=${enriched.integrity})`)

        // Get full data from enriched
        const source = await sql`
          SELECT penal_sentences, civil_sentences FROM candidates WHERE id = ${enriched.id}::uuid
        `
        if (source.length > 0) {
          await sql`
            UPDATE candidates SET
              penal_sentences = ${JSON.stringify(source[0].penal_sentences || [])}::jsonb,
              civil_sentences = ${JSON.stringify(source[0].civil_sentences || [])}::jsonb,
              last_updated = NOW()
            WHERE id = ${dup.id}::uuid
          `

          // Also sync flags: delete old, copy new
          await sql`
            DELETE FROM flags WHERE candidate_id = ${dup.id}::uuid
              AND type IN ('PENAL_SENTENCE', 'CIVIL_SENTENCE', 'VIOLENCE', 'ALIMENTOS', 'LABORAL', 'CONTRACTUAL')
          `

          const sourceFlags = await sql`
            SELECT type, severity, title, description, source, evidence_url
            FROM flags WHERE candidate_id = ${enriched.id}::uuid
              AND type IN ('PENAL_SENTENCE', 'CIVIL_SENTENCE', 'VIOLENCE', 'ALIMENTOS', 'LABORAL', 'CONTRACTUAL')
          `
          for (const f of sourceFlags) {
            await sql`
              INSERT INTO flags (id, candidate_id, type, severity, title, description, source, evidence_url, date_captured)
              VALUES (gen_random_uuid(), ${dup.id}::uuid, ${f.type}, ${f.severity}, ${f.title}, ${f.description}, ${f.source}, ${f.evidence_url}, NOW())
            `
          }

          // Sync incumbent_performance if exists
          const srcPerf = await sql`SELECT * FROM incumbent_performance WHERE candidate_id = ${enriched.id}::uuid`
          if (srcPerf.length > 0) {
            const existingPerf = await sql`SELECT id FROM incumbent_performance WHERE candidate_id = ${dup.id}::uuid`
            if (existingPerf.length === 0) {
              const p = srcPerf[0]
              await sql`
                INSERT INTO incumbent_performance (
                  id, candidate_id, cargo_actual, entidad, period,
                  budget_allocated, budget_executed, budget_execution_pct,
                  contraloria_reports, contraloria_findings, contraloria_recommendations,
                  has_criminal_referral, performance_score, data_sources, notes, last_updated
                ) VALUES (
                  gen_random_uuid(), ${dup.id}::uuid,
                  ${p.cargo_actual}, ${p.entidad}, ${p.period},
                  ${p.budget_allocated}, ${p.budget_executed}, ${p.budget_execution_pct},
                  ${p.contraloria_reports}, ${p.contraloria_findings}, ${p.contraloria_recommendations},
                  ${p.has_criminal_referral}, ${p.performance_score},
                  ${JSON.stringify(p.data_sources)}::jsonb, ${p.notes}, NOW()
                )
              `
              console.log(`    + Copied incumbent_performance`)
            }
          }

          console.log(`    Synced: ${sourceFlags.length} flags, penal=${source[0].penal_sentences?.length || 0}, civil=${source[0].civil_sentences?.length || 0}`)
        }
      } else {
        console.log(`  OK: ${dup.full_name} already has same or more data`)
      }
    }
  }

  console.log('\n  Done!')
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
