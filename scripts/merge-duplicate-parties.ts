/**
 * Merge duplicate parties in the database.
 * Duplicates arise from different name formats:
 *   - "Salvemos al Perú" vs "SALVEMOS AL PERU"
 *   - "Podemos Perú" vs "PODEMOS PERU"
 *
 * Usage: npx tsx scripts/merge-duplicate-parties.ts
 */

import { createDb } from './lib/scraper-utils'

const sql = createDb()

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Manual mapping: short presidential names -> official JNE names (normalized)
const SHORT_TO_OFFICIAL: Record<string, string> = {
  'podemos peru': 'podemos peru',
  'somos peru': 'partido democratico somos peru',
  'primero la gente': 'primero la gente comunidad ecologia libertad y progreso',
  'alianza fuerza y libertad': 'fuerza y libertad',
  'partido libertad popular': 'libertad popular',
  'partido de los trabajadores': 'partido de los trabajadores y emprendedores pte peru',
  'alianza unidad nacional': 'unidad nacional',
  'avanza pais': 'avanza pais partido de integracion social',
  'ahora nacion': 'ahora nacion an',
  'cooperacion popular': 'partido politico cooperacion popular',
  'frente de la esperanza': 'partido frente de la esperanza 2021',
  'peru libre': 'partido politico nacional peru libre',
  'peru primero': 'partido politico peru primero',
  'integridad democratica': 'partido politico integridad democratica',
  'pais para todos': 'partido pais para todos',
  'partido patriotico del peru': 'partido patriotico del peru',
  'partido si creo': 'partido sicreo',
  'partido civico obras': 'partido civico obras',
  'partido democrata unido': 'partido democrata unido peru',
  'peru accion': 'partido politico peru accion',
  'alianza venceremos': 'alianza electoral venceremos',
  'partido peru moderno': 'peru moderno',
  'fe en el peru': 'fe en el peru',
  'partido democratico federal': 'partido democratico federal',
  'prin': 'partido politico prin',
  'salvemos al peru': 'salvemos al peru',
  'renovacion popular': 'renovacion popular',
  'juntos por el peru': 'juntos por el peru',
}

function getGroupKey(name: string): string {
  const norm = normalize(name)
  // Check if this is a short name that maps to an official one
  if (SHORT_TO_OFFICIAL[norm]) {
    return SHORT_TO_OFFICIAL[norm]
  }
  // Check if this normalized name matches any official (long) value in the mapping
  for (const official of Object.values(SHORT_TO_OFFICIAL)) {
    if (norm === official) {
      return official
    }
  }
  return norm
}

async function main() {
  console.log('='.repeat(70))
  console.log(' MERGE DUPLICATE PARTIES')
  console.log('='.repeat(70))

  const parties = await sql`
    SELECT p.id, p.name, p.short_name, p.logo_url, p.color,
           COUNT(c.id)::int as candidate_count
    FROM parties p
    LEFT JOIN candidates c ON c.party_id = p.id AND c.is_active = true
    GROUP BY p.id, p.name, p.short_name, p.logo_url, p.color
    ORDER BY candidate_count DESC
  `

  console.log(`\nPartidos en BD: ${parties.length}`)

  // Group by normalized name (using short->official mapping)
  const groups = new Map<string, typeof parties>()
  for (const p of parties) {
    const key = getGroupKey(p.name)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(p)
  }

  const duplicateGroups = [...groups.entries()].filter(([, members]) => members.length > 1)
  console.log(`Grupos con duplicados: ${duplicateGroups.length}`)

  let totalMerged = 0
  let totalDeleted = 0

  for (const [normName, members] of duplicateGroups) {
    // Sort: most candidates first, then prefer one with logo/color
    members.sort((a, b) => {
      if (b.candidate_count !== a.candidate_count) return b.candidate_count - a.candidate_count
      if (b.logo_url && !a.logo_url) return 1
      if (a.logo_url && !b.logo_url) return -1
      return 0
    })

    const keeper = members[0]
    const duplicates = members.slice(1)

    console.log(`\n  "${normName}":`)
    console.log(`    Keeper: "${keeper.name}" (${keeper.candidate_count} candidatos)`)

    for (const dup of duplicates) {
      console.log(`    Merge:  "${dup.name}" (${dup.candidate_count} candidatos)`)

      // Migrate ALL candidates (active and inactive) to avoid FK issues
      const updated = await sql`
        UPDATE candidates SET party_id = ${keeper.id}::uuid
        WHERE party_id = ${dup.id}::uuid
        RETURNING id
      `
      if (updated.length > 0) {
        totalMerged += updated.length
        console.log(`      -> ${updated.length} candidatos migrados`)
      }

      // Copy logo/color if keeper lacks them
      if (!keeper.logo_url && dup.logo_url) {
        await sql`UPDATE parties SET logo_url = ${dup.logo_url} WHERE id = ${keeper.id}::uuid`
        keeper.logo_url = dup.logo_url
      }
      if (!keeper.color && dup.color) {
        await sql`UPDATE parties SET color = ${dup.color} WHERE id = ${keeper.id}::uuid`
        keeper.color = dup.color
      }
      if (!keeper.short_name && dup.short_name) {
        await sql`UPDATE parties SET short_name = ${dup.short_name} WHERE id = ${keeper.id}::uuid`
        keeper.short_name = dup.short_name
      }

      // Verify no remaining references
      const remaining = await sql`
        SELECT COUNT(*)::int as cnt FROM candidates WHERE party_id = ${dup.id}::uuid
      `
      if (remaining[0].cnt === 0) {
        // Check other FK references (party_finances, party_donors, party_expenses)
        const financeRefs = await sql`
          SELECT COUNT(*)::int as cnt FROM party_finances WHERE party_id = ${dup.id}::uuid
        `
        if (financeRefs[0].cnt > 0) {
          await sql`UPDATE party_finances SET party_id = ${keeper.id}::uuid WHERE party_id = ${dup.id}::uuid`
          console.log(`      -> Finanzas migradas`)
        }

        const donorRefs = await sql`
          SELECT COUNT(*)::int as cnt FROM party_donors WHERE party_id = ${dup.id}::uuid
        `
        if (donorRefs[0].cnt > 0) {
          await sql`UPDATE party_donors SET party_id = ${keeper.id}::uuid WHERE party_id = ${dup.id}::uuid`
          console.log(`      -> Donantes migrados`)
        }

        const expenseRefs = await sql`
          SELECT COUNT(*)::int as cnt FROM party_expenses WHERE party_id = ${dup.id}::uuid
        `
        if (expenseRefs[0].cnt > 0) {
          await sql`UPDATE party_expenses SET party_id = ${keeper.id}::uuid WHERE party_id = ${dup.id}::uuid`
          console.log(`      -> Gastos migrados`)
        }

        await sql`DELETE FROM parties WHERE id = ${dup.id}::uuid`
        totalDeleted++
        console.log(`      -> Partido eliminado`)
      } else {
        console.log(`      !! Aun tiene ${remaining[0].cnt} refs, no eliminado`)
      }
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70))
  console.log(`  Candidatos migrados: ${totalMerged}`)
  console.log(`  Partidos eliminados: ${totalDeleted}`)

  const finalParties = await sql`
    SELECT p.name, COUNT(c.id)::int as cnt
    FROM parties p
    LEFT JOIN candidates c ON c.party_id = p.id AND c.is_active = true
    GROUP BY p.id, p.name
    ORDER BY cnt DESC
  `
  console.log(`  Partidos finales: ${finalParties.length}`)
  console.log('\nPartidos:')
  for (const p of finalParties) {
    console.log(`  ${(p.name || '').padEnd(55)} ${p.cnt}`)
  }
}

main().catch(console.error)
