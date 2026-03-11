/**
 * Sync score_breakdowns with audited integrity penalties
 *
 * The apply-audited-scores-v3.ts script updated scores.integrity but NOT
 * score_breakdowns, causing a mismatch between the displayed score and
 * the breakdown details. This script fixes that.
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

interface CivilPenalty {
  type: string
  penalty: number
}

interface BreakdownPenalties {
  penal_penalty: number
  civil_penalties: CivilPenalty[]
  resignation_penalty: number
  reinfo_penalty: number
}

// Penalties extracted from audited scores v3 notes
// integrity_base is always 100
const AUDIT_PENALTIES: Record<string, BreakdownPenalties> = {
  // TIER 1: Clean candidates
  'PEREZ TELLO': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 5, reinfo_penalty: 0 },
  'FERNANDEZ': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 5, reinfo_penalty: 0 },
  'DIEZ-CANSECO': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 5, reinfo_penalty: 0 },
  'WILLIAMS': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 5, reinfo_penalty: 0 },
  'GUEVARA': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 5, reinfo_penalty: 0 },
  'CHIABRA': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 5, reinfo_penalty: 0 },
  'BELAUNDE': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 5, reinfo_penalty: 0 },
  'OLIVERA': { penal_penalty: 0, civil_penalties: [{ type: 'contractual', penalty: 8 }], resignation_penalty: 0, reinfo_penalty: 0 },
  'CARRASCO': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 5, reinfo_penalty: 0 },

  // TIER 2: Clean moderate profile (I=92 → resign=8 to match audit)
  'JAICO': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 8, reinfo_penalty: 0 },       // I=92
  'GROZO': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 8, reinfo_penalty: 0 },       // I=92
  'CALLER': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 8, reinfo_penalty: 0 },      // I=92
  'LESCANO': { penal_penalty: 0, civil_penalties: [{ type: 'acoso archivada', penalty: 13 }], resignation_penalty: 5, reinfo_penalty: 0 }, // I=82
  'JAIMES': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 8, reinfo_penalty: 0 },      // I=92
  'GONZALES CASTILLO': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 8, reinfo_penalty: 0 }, // I=92
  'VALDERRAMA': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 5, reinfo_penalty: 0 },  // I=95
  'ESPA': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 8, reinfo_penalty: 0 },        // I=92

  // TIER 3: Low profile / issues
  'LOPEZ CHAU': { penal_penalty: 35, civil_penalties: [], resignation_penalty: 0, reinfo_penalty: 0 }, // 1 penal pendiente colusión (-35)
  'NIETO MONTESINOS': { penal_penalty: 35, civil_penalties: [], resignation_penalty: 0, reinfo_penalty: 0 }, // Odebrecht lavado
  'ORTIZ': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 8, reinfo_penalty: 0 },       // I=92
  'BECERRA': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 10, reinfo_penalty: 0 },    // I=90
  'CHIRINOS': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 10, reinfo_penalty: 0 },   // I=90
  'ATENCIO': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 8, reinfo_penalty: 0 },     // I=92
  'ALVAREZ': { penal_penalty: 0, civil_penalties: [], resignation_penalty: 8, reinfo_penalty: 0 },     // I=92

  // TIER 4: Integrity problems
  'PAZ DE LA BARRA': { penal_penalty: 0, civil_penalties: [{ type: 'violencia familiar', penalty: 50 }], resignation_penalty: 0, reinfo_penalty: 0 }, // I=50
  'MASSE': { penal_penalty: 70, civil_penalties: [], resignation_penalty: 0, reinfo_penalty: 0 },      // 2 penales pendientes (-70)
  'LOPEZ ALIAGA': { penal_penalty: 35, civil_penalties: [{ type: 'falsedad JEE', penalty: 30 }], resignation_penalty: 5, reinfo_penalty: 0 }, // I=30
  'FUJIMORI HIGUCHI': { penal_penalty: 70, civil_penalties: [], resignation_penalty: 0, reinfo_penalty: 0 }, // 2 penales pendientes (-70)
  'FORSYTH': { penal_penalty: 35, civil_penalties: [], resignation_penalty: 10, reinfo_penalty: 0 },   // 1 penal + renuncias
  'ACUÑA PERALTA': { penal_penalty: 30, civil_penalties: [{ type: 'plagio académico', penalty: 15 }, { type: 'laboral', penalty: 25 }], resignation_penalty: 0, reinfo_penalty: 0 }, // excluido JNE + plagio + laboral
  'MOLINELLI': { penal_penalty: 85, civil_penalties: [], resignation_penalty: 0, reinfo_penalty: 0 },  // 3 procesos fiscales min(3×35,85)
  'SANCHEZ PALOMINO': { penal_penalty: 70, civil_penalties: [], resignation_penalty: 0, reinfo_penalty: 0 }, // 2 penales pendientes
  'CERRON ROJAS': { penal_penalty: 80, civil_penalties: [], resignation_penalty: 5, reinfo_penalty: 0 }, // prófugo, 2 penales + fugitivo + renuncias
  'LUNA GALVEZ': { penal_penalty: 85, civil_penalties: [{ type: 'civil', penalty: 5 }], resignation_penalty: 5, reinfo_penalty: 0 }, // 3 penales + civil + dimisiones
  'VIZCARRA CORNEJO': { penal_penalty: 85, civil_penalties: [], resignation_penalty: 0, reinfo_penalty: 0 }, // condenado + investigaciones
  'BELMONT': { penal_penalty: 70, civil_penalties: [{ type: 'laboral', penalty: 25 }], resignation_penalty: 10, reinfo_penalty: 0 }, // 2 penales + civil laboral + dimisiones
}

async function main() {
  console.log('='.repeat(70))
  console.log(' SYNC SCORE_BREAKDOWNS WITH AUDITED PENALTIES')
  console.log('='.repeat(70))

  let updated = 0
  let notFound = 0

  for (const [searchName, penalties] of Object.entries(AUDIT_PENALTIES)) {
    const parts = searchName.split(' ')
    let candidates
    if (parts.length === 1) {
      candidates = await sql`
        SELECT id, full_name FROM candidates
        WHERE cargo = 'presidente' AND is_active = true
        AND full_name ILIKE ${`%${parts[0]}%`}
        LIMIT 1
      `
    } else {
      candidates = await sql`
        SELECT id, full_name FROM candidates
        WHERE cargo = 'presidente' AND is_active = true
        AND full_name ILIKE ${`%${parts[0]}%`}
        AND full_name ILIKE ${`%${parts[1]}%`}
        LIMIT 1
      `
    }

    if (candidates.length === 0) {
      console.log(`  ✗ No encontrado: ${searchName}`)
      notFound++
      continue
    }

    const candidate = candidates[0]
    const civilPenaltiesJson = JSON.stringify(penalties.civil_penalties)
    const civilPenaltiesSum = penalties.civil_penalties.reduce((sum, p) => sum + p.penalty, 0)
    const totalPenalties = penalties.penal_penalty + civilPenaltiesSum + penalties.resignation_penalty + penalties.reinfo_penalty
    const calculatedIntegrity = Math.max(0, 100 - totalPenalties)

    await sql`
      UPDATE score_breakdowns SET
        integrity_base = 100,
        penal_penalty = ${penalties.penal_penalty},
        civil_penalties = ${civilPenaltiesJson}::jsonb,
        resignation_penalty = ${penalties.resignation_penalty},
        reinfo_penalty = ${penalties.reinfo_penalty}
      WHERE candidate_id = ${candidate.id}
    `

    const name = candidate.full_name.substring(0, 40).padEnd(42)
    console.log(`  ✓ ${name} penal=-${penalties.penal_penalty} civil=-${civilPenaltiesSum} resign=-${penalties.resignation_penalty} reinfo=-${penalties.reinfo_penalty} → calc=${calculatedIntegrity}`)
    updated++
  }

  console.log('\n' + '='.repeat(70))
  console.log(` RESUMEN: ${updated} actualizados, ${notFound} no encontrados`)
  console.log('='.repeat(70))

  // Verify: show mismatches between scores.integrity and calculated breakdown
  console.log('\n' + '='.repeat(70))
  console.log(' VERIFICACIÓN: DIFERENCIAS ENTRE SCORE Y BREAKDOWN')
  console.log('='.repeat(70))

  const mismatches = await sql`
    SELECT c.full_name, s.integrity as score_integrity,
           sb.integrity_base, sb.penal_penalty, sb.civil_penalties,
           sb.resignation_penalty, sb.reinfo_penalty
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `

  for (const row of mismatches) {
    const civilPenalties = (typeof row.civil_penalties === 'string' ? JSON.parse(row.civil_penalties) : row.civil_penalties || []) as CivilPenalty[]
    const civilSum = civilPenalties.reduce((s: number, p: CivilPenalty) => s + p.penalty, 0)
    const calc = Math.max(0, 100 - Number(row.penal_penalty) - civilSum - Number(row.resignation_penalty) - (Number(row.reinfo_penalty) || 0))
    const diff = Number(row.score_integrity) - calc

    if (Math.abs(diff) > 0.5) {
      console.log(`  ⚠ ${row.full_name.substring(0, 35).padEnd(37)} score=${row.score_integrity} calc=${calc} diff=${diff > 0 ? '+' : ''}${diff}`)
    }
  }
}

main().catch(console.error)
