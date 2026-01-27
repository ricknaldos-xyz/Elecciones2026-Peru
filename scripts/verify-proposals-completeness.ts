/**
 * Verifica la completitud de las propuestas extraídas
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

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' VERIFICACIÓN DE COMPLETITUD DE PROPUESTAS '.padStart(52).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  // 1. Total de candidatos presidenciales
  const totalCandidates = await sql`
    SELECT COUNT(*) as count FROM candidates WHERE cargo = 'presidente'
  `
  console.log(`\n📊 Total candidatos presidenciales: ${totalCandidates[0].count}`)

  // 2. Candidatos con plan_gobierno_url
  const withPlanUrl = await sql`
    SELECT COUNT(*) as count FROM candidates
    WHERE cargo = 'presidente' AND plan_gobierno_url IS NOT NULL
  `
  console.log(`📋 Candidatos con URL de plan: ${withPlanUrl[0].count}`)

  // 3. Candidatos con propuestas extraídas
  const withProposals = await sql`
    SELECT COUNT(DISTINCT c.id) as count
    FROM candidates c
    INNER JOIN candidate_proposals cp ON c.id = cp.candidate_id
    WHERE c.cargo = 'presidente'
  `
  console.log(`✓ Candidatos con propuestas extraídas: ${withProposals[0].count}`)

  // 4. Candidatos SIN propuestas
  const withoutProposals = await sql`
    SELECT c.id, c.full_name, c.slug, p.name as party_name, c.plan_gobierno_url
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN candidate_proposals cp ON c.id = cp.candidate_id
    WHERE c.cargo = 'presidente'
    AND cp.id IS NULL
    ORDER BY c.full_name
  `

  console.log(`\n⚠ Candidatos SIN propuestas: ${withoutProposals.length}`)
  if (withoutProposals.length > 0) {
    console.log('─'.repeat(70))
    for (const c of withoutProposals) {
      const hasUrl = c.plan_gobierno_url ? '✓ tiene URL' : '✗ sin URL'
      console.log(`  - ${c.full_name} (${c.party_name}) [${hasUrl}]`)
    }
  }

  // 5. Total de propuestas
  const totalProposals = await sql`
    SELECT COUNT(*) as count FROM candidate_proposals
  `
  console.log(`\n📝 Total propuestas en BD: ${totalProposals[0].count}`)

  // 6. Propuestas por categoría
  const byCategory = await sql`
    SELECT category, COUNT(*) as count
    FROM candidate_proposals
    GROUP BY category
    ORDER BY count DESC
  `

  console.log('\n📊 Propuestas por categoría:')
  console.log('─'.repeat(40))
  for (const row of byCategory) {
    const bar = '█'.repeat(Math.min(Math.floor(Number(row.count) / 5), 30))
    console.log(`  ${row.category.padEnd(20)} ${String(row.count).padStart(4)} ${bar}`)
  }

  // 7. Propuestas por candidato
  const byCandidate = await sql`
    SELECT c.full_name, p.name as party_name, COUNT(cp.id) as proposal_count
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    INNER JOIN candidate_proposals cp ON c.id = cp.candidate_id
    WHERE c.cargo = 'presidente'
    GROUP BY c.id, c.full_name, p.name
    ORDER BY proposal_count DESC
  `

  console.log('\n📊 Propuestas por candidato:')
  console.log('─'.repeat(70))
  for (const row of byCandidate) {
    const bar = '█'.repeat(Math.min(Number(row.proposal_count), 30))
    console.log(`  ${row.full_name.substring(0, 30).padEnd(32)} ${String(row.proposal_count).padStart(3)} ${bar}`)
  }

  // 8. Resumen final
  const candidatesWithProposals = Number(withProposals[0].count)
  const totalCand = Number(totalCandidates[0].count)
  const coverage = ((candidatesWithProposals / totalCand) * 100).toFixed(1)

  console.log('\n' + '═'.repeat(70))
  console.log('RESUMEN DE COMPLETITUD')
  console.log('═'.repeat(70))
  console.log(`Cobertura: ${candidatesWithProposals}/${totalCand} candidatos (${coverage}%)`)
  console.log(`Total propuestas: ${totalProposals[0].count}`)
  console.log(`Promedio por candidato: ${(Number(totalProposals[0].count) / candidatesWithProposals).toFixed(1)}`)

  if (withoutProposals.length > 0) {
    console.log(`\n⚠ FALTAN propuestas para ${withoutProposals.length} candidatos`)
  } else {
    console.log(`\n✓ TODAS las propuestas están completas`)
  }
}

main().catch(console.error)
