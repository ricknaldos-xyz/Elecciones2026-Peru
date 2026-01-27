/**
 * Limpia los duplicados restantes que tienen nombres muy diferentes
 * pero pertenecen al mismo partido o son la misma persona
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

// Manual mapping of duplicates based on analysis
const KNOWN_DUPLICATES: [string, string][] = [
  // [keeper partial name, duplicate partial name]
  ['Carlos Álvarez', 'CARLOS GONSALO ALVAREZ'],
  ['Francisco Diez Canseco', 'FRANCISCO ERNESTO DIEZ-CANSECO'],
  ['Rafael López Aliaga', 'RAFAEL BERNARDO LOPEZ ALIAGA'],
  ['Walter Chirinos', 'WALTER GILMER CHIRINOS'],
  ['Wolfgang Grozo', 'WOLFGANG MARIO GROZO'],
  ['Álvaro Paz de la Barra', 'ALVARO GONZALO PAZ DE LA BARRA'],
  ['Armando Massé', 'ARMANDO JOAQUIN MASSE'],
  ['Carlos Jaico', 'CARLOS ERNESTO JAICO'],
  ['Fiorella Molinelli', 'FIORELLA GIANNINA MOLINELLI'],
  ['José Luna', 'JOSE LEON LUNA'],
  ['Fernando Olivera', 'LUIS FERNANDO OLIVERA'],
  ['Marisol Pérez Tello', 'MARIA SOLEDAD PEREZ TELLO'],
  ['Mario Vizcarra', 'MARIO ENRIQUE VIZCARRA'],
  ['Mesías Guevara', 'MESIAS ANTONIO GUEVARA'],
  ['Alfonso López Chau', 'PABLO ALFONSO LOPEZ CHAU'],
  ['Paul Jaimes', 'PAUL DAVIS JAIMES'],
  ['Enrique Valderrama', 'PITTER ENRIQUE VALDERRAMA'],
  ['Rafael Belaunde', 'RAFAEL JORGE BELAUNDE'],
  ['Ricardo Belmont', 'RICARDO PABLO BELMONT'],
  ['Roberto Chiabra', 'ROBERTO ENRIQUE CHIABRA'],
  ['Roberto Sánchez Palomino', 'ROBERTO HELBERT SANCHEZ PALOMINO'],
  ['Ronald Atencio', 'RONALD DARWIN ATENCIO'],
  ['Rosario Fernández', 'ROSARIO DEL PILAR FERNANDEZ'],
  ['José Williams', 'JOSE DANIEL WILLIAMS'],
  ['Carlos Espá', 'ALFONSO CARLOS ESPA'],
  ['Yonhy Lescano', 'YONHY LESCANO'],
]

function normalizeForMatch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
}

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' LIMPIEZA DE DUPLICADOS RESTANTES '.padStart(48).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  // Get all presidential candidates
  const candidates = await sql`
    SELECT c.id, c.full_name, c.plan_gobierno_url, p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente'
    ORDER BY c.full_name
  `

  console.log(`\n📊 Candidatos actuales: ${candidates.length}`)

  let deletedCount = 0
  let migratedProposals = 0

  for (const [keeperPattern, duplicatePattern] of KNOWN_DUPLICATES) {
    const keeperNorm = normalizeForMatch(keeperPattern)
    const dupNorm = normalizeForMatch(duplicatePattern)

    // Find the keeper (the one with proper casing, party, or proposals)
    const keeper = candidates.find(c => {
      const nameNorm = normalizeForMatch(c.full_name)
      return nameNorm.includes(keeperNorm) && c.full_name !== c.full_name.toUpperCase()
    })

    // Find the duplicate (usually ALL CAPS, no party)
    const duplicate = candidates.find(c => {
      const nameNorm = normalizeForMatch(c.full_name)
      return nameNorm.includes(dupNorm) && c.full_name === c.full_name.toUpperCase()
    })

    if (keeper && duplicate && keeper.id !== duplicate.id) {
      console.log(`\n📌 Manteniendo: ${keeper.full_name}`)
      console.log(`   ❌ Eliminando: ${duplicate.full_name}`)

      // Check for proposals to migrate
      const proposals = await sql`
        SELECT COUNT(*) as count FROM candidate_proposals WHERE candidate_id = ${duplicate.id}
      `

      if (Number(proposals[0].count) > 0) {
        await sql`
          UPDATE candidate_proposals SET candidate_id = ${keeper.id} WHERE candidate_id = ${duplicate.id}
        `
        migratedProposals += Number(proposals[0].count)
        console.log(`     ↳ Migradas ${proposals[0].count} propuestas`)
      }

      // Copy plan URL if keeper doesn't have one
      if (duplicate.plan_gobierno_url && !keeper.plan_gobierno_url) {
        await sql`
          UPDATE candidates SET plan_gobierno_url = ${duplicate.plan_gobierno_url} WHERE id = ${keeper.id}
        `
        console.log(`     ↳ Copiada URL del plan`)
      }

      // Delete duplicate
      try {
        await sql`DELETE FROM candidates WHERE id = ${duplicate.id}`
        deletedCount++
      } catch (error) {
        console.log(`     ⚠ Error eliminando: ${error}`)
      }
    }
  }

  // Final verification
  const finalCandidates = await sql`
    SELECT COUNT(*) as total,
           COUNT(plan_gobierno_url) as with_url
    FROM candidates WHERE cargo = 'presidente'
  `

  const withProposals = await sql`
    SELECT COUNT(DISTINCT candidate_id) as count
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente'
  `

  console.log('\n' + '═'.repeat(70))
  console.log('RESUMEN')
  console.log('═'.repeat(70))
  console.log(`Duplicados eliminados: ${deletedCount}`)
  console.log(`Propuestas migradas: ${migratedProposals}`)
  console.log(`\nCandidatos presidenciales: ${finalCandidates[0].total}`)
  console.log(`Con URL de plan: ${finalCandidates[0].with_url}`)
  console.log(`Con propuestas: ${withProposals[0].count}`)
}

main().catch(console.error)
