/**
 * Detecta y corrige candidatos duplicados, mapea URLs de planes
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return match ? match[1] : ''
}

const sql = neon(loadEnv())

interface PlanGobierno {
  candidato: string
  partido: string
  cargo: string
  foto_url: string
  plan_url: string
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim()
}

function getLastNames(fullName: string): string[] {
  const parts = fullName.split(' ')
  // Usually first 2-3 words are last names in Peru
  return parts.slice(0, Math.min(2, parts.length)).map(p => normalizeString(p))
}

function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeString(name1)
  const n2 = normalizeString(name2)

  // Exact match after normalization
  if (n1 === n2) return true

  // Check if last names match
  const lastNames1 = getLastNames(name1)
  const lastNames2 = getLastNames(name2)

  if (lastNames1.length >= 2 && lastNames2.length >= 2) {
    return lastNames1[0] === lastNames2[0] && lastNames1[1] === lastNames2[1]
  }

  return false
}

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' CORRECCIÓN DE DUPLICADOS Y MAPEO DE PLANES '.padStart(53).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  // Load planes-gobierno.json
  const planesPath = path.join(process.cwd(), 'planes-gobierno.json')
  const allPlanes: PlanGobierno[] = JSON.parse(fs.readFileSync(planesPath, 'utf-8'))
  const presidentes = allPlanes.filter(p => p.cargo === 'PRESIDENTE DE LA REPÚBLICA')

  console.log(`\n📋 Planes de gobierno JNE: ${presidentes.length}`)

  // Get all presidential candidates
  const candidates = await sql`
    SELECT c.id, c.full_name, c.slug, c.cargo, c.plan_gobierno_url,
           p.id as party_id, p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente'
    ORDER BY c.full_name
  `

  console.log(`📊 Candidatos en BD: ${candidates.length}`)

  // Find duplicates by comparing names
  const duplicateGroups: Map<string, typeof candidates> = new Map()
  const processed = new Set<string>()

  for (const c1 of candidates) {
    if (processed.has(c1.id)) continue

    const group = [c1]
    for (const c2 of candidates) {
      if (c1.id === c2.id || processed.has(c2.id)) continue
      if (namesMatch(c1.full_name, c2.full_name)) {
        group.push(c2)
        processed.add(c2.id)
      }
    }

    if (group.length > 1) {
      processed.add(c1.id)
      duplicateGroups.set(c1.id, group)
    }
  }

  console.log(`\n⚠ Grupos de duplicados encontrados: ${duplicateGroups.size}`)

  // Process duplicates
  console.log('\n' + '═'.repeat(70))
  console.log('PROCESANDO DUPLICADOS')
  console.log('═'.repeat(70))

  let mergedCount = 0
  let deletedCount = 0

  for (const [, group] of duplicateGroups) {
    // Sort by: has proposals > has plan_url > has party > name quality
    const sorted = group.sort((a, b) => {
      // Prefer one with party
      if (a.party_id && !b.party_id) return -1
      if (!a.party_id && b.party_id) return 1
      // Prefer one with plan URL
      if (a.plan_gobierno_url && !b.plan_gobierno_url) return -1
      if (!a.plan_gobierno_url && b.plan_gobierno_url) return 1
      // Prefer proper cased name over ALL CAPS
      const aIsUpper = a.full_name === a.full_name.toUpperCase()
      const bIsUpper = b.full_name === b.full_name.toUpperCase()
      if (!aIsUpper && bIsUpper) return -1
      if (aIsUpper && !bIsUpper) return 1
      return 0
    })

    const keeper = sorted[0]
    const toDelete = sorted.slice(1)

    console.log(`\n📌 Manteniendo: ${keeper.full_name} (${keeper.party_name || 'sin partido'})`)

    for (const dup of toDelete) {
      console.log(`   ❌ Eliminando: ${dup.full_name} (${dup.party_name || 'sin partido'})`)

      // Check if duplicate has proposals to migrate
      const proposals = await sql`
        SELECT COUNT(*) as count FROM candidate_proposals WHERE candidate_id = ${dup.id}
      `

      if (Number(proposals[0].count) > 0) {
        // Migrate proposals to keeper
        await sql`
          UPDATE candidate_proposals SET candidate_id = ${keeper.id} WHERE candidate_id = ${dup.id}
        `
        console.log(`     ↳ Migradas ${proposals[0].count} propuestas`)
      }

      // If duplicate has plan_url and keeper doesn't, copy it
      if (dup.plan_gobierno_url && !keeper.plan_gobierno_url) {
        await sql`
          UPDATE candidates SET plan_gobierno_url = ${dup.plan_gobierno_url} WHERE id = ${keeper.id}
        `
        console.log(`     ↳ Copiada URL del plan`)
      }

      // Delete the duplicate
      try {
        await sql`DELETE FROM candidates WHERE id = ${dup.id}`
        deletedCount++
      } catch (error) {
        console.log(`     ⚠ No se pudo eliminar (puede tener referencias): ${error}`)
      }
    }

    mergedCount++
  }

  // Now map plan URLs from JNE data
  console.log('\n' + '═'.repeat(70))
  console.log('MAPEANDO URLs DE PLANES DE GOBIERNO')
  console.log('═'.repeat(70))

  // Refresh candidates list
  const updatedCandidates = await sql`
    SELECT c.id, c.full_name, c.slug, c.plan_gobierno_url, p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente'
  `

  let mappedUrls = 0

  for (const plan of presidentes) {
    // Find matching candidate
    let matched = false

    for (const candidate of updatedCandidates) {
      // Try name match
      if (namesMatch(plan.candidato, candidate.full_name)) {
        if (!candidate.plan_gobierno_url) {
          await sql`
            UPDATE candidates SET plan_gobierno_url = ${plan.plan_url} WHERE id = ${candidate.id}
          `
          console.log(`✓ ${candidate.full_name} ← ${plan.plan_url.split('/').pop()}`)
          mappedUrls++
        }
        matched = true
        break
      }

      // Try party name match
      const partyNorm = normalizeString(plan.partido)
      const candPartyNorm = normalizeString(candidate.party_name || '')
      if (partyNorm && candPartyNorm && (partyNorm.includes(candPartyNorm) || candPartyNorm.includes(partyNorm))) {
        if (!candidate.plan_gobierno_url) {
          await sql`
            UPDATE candidates SET plan_gobierno_url = ${plan.plan_url} WHERE id = ${candidate.id}
          `
          console.log(`✓ ${candidate.full_name} (por partido) ← ${plan.plan_url.split('/').pop()}`)
          mappedUrls++
        }
        matched = true
        break
      }
    }

    if (!matched) {
      console.log(`⚠ Sin match: ${plan.candidato} (${plan.partido})`)
    }
  }

  // Final stats
  const finalCandidates = await sql`
    SELECT COUNT(*) as total,
           COUNT(plan_gobierno_url) as with_url
    FROM candidates WHERE cargo = 'presidente'
  `

  const finalProposals = await sql`
    SELECT COUNT(DISTINCT candidate_id) as candidates_with_proposals
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente'
  `

  console.log('\n' + '═'.repeat(70))
  console.log('RESUMEN FINAL')
  console.log('═'.repeat(70))
  console.log(`Duplicados procesados: ${mergedCount}`)
  console.log(`Candidatos eliminados: ${deletedCount}`)
  console.log(`URLs mapeadas: ${mappedUrls}`)
  console.log(`\nCandidatos presidenciales: ${finalCandidates[0].total}`)
  console.log(`Con URL de plan: ${finalCandidates[0].with_url}`)
  console.log(`Con propuestas: ${finalProposals[0].candidates_with_proposals}`)
}

main().catch(console.error)
