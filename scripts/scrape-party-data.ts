/**
 * Complete party/organization data from JNE
 * Ensures all parties have proper names, logos, and are linked to candidates
 */

import {
  createDb,
  setupBrowser,
  delay,
  VOTO_INFORMADO_BASE,
} from './lib/scraper-utils'
import * as fs from 'fs'
import * as path from 'path'
import { CHECKPOINTS_DIR, ensureCheckpointsDir } from './lib/scraper-utils'

const sql = createDb()

async function main() {
  console.log('='.repeat(70))
  console.log(' COMPLETAR DATOS DE PARTIDOS')
  console.log('='.repeat(70))

  // Load manifest if available
  const manifestPath = path.join(CHECKPOINTS_DIR, 'candidate-manifest.json')
  let manifest: any[] = []

  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    console.log(`\nManifiesto cargado: ${manifest.length} candidatos`)
  } else {
    console.log('\nNo se encontro manifiesto. Usando datos de BD.')
  }

  // Extract unique parties from manifest
  const partyMap = new Map<string, { orgId: number; name: string; count: number }>()

  if (manifest.length > 0) {
    for (const c of manifest) {
      if (!c.party) continue
      const existing = partyMap.get(c.party)
      if (existing) {
        existing.count++
      } else {
        partyMap.set(c.party, { orgId: c.orgId, name: c.party, count: 1 })
      }
    }
    console.log(`Partidos unicos en manifiesto: ${partyMap.size}`)
  }

  // Get existing parties from DB
  const existingParties = await sql`
    SELECT id, name, short_name, logo_url, color
    FROM parties
    ORDER BY name
  `

  console.log(`Partidos en BD: ${existingParties.length}`)

  // Create missing parties
  let created = 0
  let updated = 0

  for (const [name, info] of partyMap) {
    const existing = existingParties.find(
      p => p.name?.toLowerCase() === name.toLowerCase()
    )

    if (!existing) {
      try {
        await sql`
          INSERT INTO parties (name)
          VALUES (${name})
        `
        created++
        console.log(`  + Creado: ${name}`)
      } catch (e) {
        // May already exist
      }
    }
  }

  // Link candidates to parties
  console.log('\nVinculando candidatos a partidos...')

  const unlinked = await sql`
    SELECT c.id, c.full_name, c.jne_org_id
    FROM candidates c
    WHERE c.party_id IS NULL
    AND c.is_active = true
  `

  console.log(`Candidatos sin partido: ${unlinked.length}`)

  if (manifest.length > 0) {
    // Build org -> party name map
    const orgToParty = new Map<number, string>()
    for (const c of manifest) {
      if (c.orgId && c.party) {
        orgToParty.set(c.orgId, c.party)
      }
    }

    for (const candidate of unlinked) {
      if (!candidate.jne_org_id) continue

      const partyName = orgToParty.get(candidate.jne_org_id)
      if (!partyName) continue

      const party = await sql`
        SELECT id FROM parties WHERE LOWER(name) = LOWER(${partyName}) LIMIT 1
      `

      if (party.length > 0) {
        await sql`
          UPDATE candidates SET party_id = ${party[0].id}::uuid
          WHERE id = ${candidate.id}::uuid
        `
        updated++
      }
    }
  }

  // Report
  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70))
  console.log(`  Partidos creados: ${created}`)
  console.log(`  Candidatos vinculados: ${updated}`)

  // Final party list
  const finalParties = await sql`
    SELECT p.name, COUNT(c.id) as candidates
    FROM parties p
    LEFT JOIN candidates c ON c.party_id = p.id AND c.is_active = true
    GROUP BY p.id, p.name
    ORDER BY candidates DESC
  `

  console.log('\nPartidos y candidatos:')
  for (const p of finalParties) {
    console.log(`  ${p.name?.padEnd(50)} ${p.candidates} candidatos`)
  }
}

main().catch(console.error)
