/**
 * Apply audited scores to production database (v2 - Post 6-agent audit)
 * Matches candidates by name (ILIKE) to handle mixed UUID formats
 *
 * Changes from v1:
 * - Competence raised ~8-12pts for most candidates (systematic underscoring found)
 * - Molinelli I=65→35 (3 active fiscal processes confirmed)
 * - Belmont I=5→15, education corrected (bachelor U. de Lima)
 * - Massé C=60→76 (MD+JD+MBA+MA = 4 degrees)
 * - Transparency lowered for JEE-flagged candidates
 * - Confidence adjustments for data quality
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
    if (match) return match[1]
  }
  throw new Error('DATABASE_URL not found')
}

const sql = neon(loadEnv())

// All 36 presidential candidates with audited scores (v2)
// C=Competence, I=Integrity, T=Transparency, D=Confidence
// balanced=0.45C+0.45I+0.10T, merit=0.60C+0.30I+0.10T, integrity=0.30C+0.60I+0.10T
const AUDITED_SCORES: Record<string, {
  C: number, I: number, T: number, D: number
  balanced: number, merit: number, integrity_score: number
  notes: string
}> = {
  // 1. César Acuña (C=82, I=55, T=62, D=80)
  'ACUÑA PERALTA': {
    C: 82, I: 55, T: 62, D: 80,
    balanced: 67.9, merit: 71.9, integrity_score: 63.8,
    notes: 'MBA + rector UCV (mayor univ privada) + gobernador. No penal, pero exclusión JNE + plagio doctoral + SUNAFIL laboral + alimentos'
  },
  // 2. Keiko Fujimori (C=76, I=30, T=52, D=80)
  'FUJIMORI HIGUCHI': {
    C: 76, I: 30, T: 52, D: 80,
    balanced: 52.9, merit: 59.8, integrity_score: 46.0,
    notes: 'MBA Columbia + congresista + 3x candidata. 2 penales pendientes (falsedad genérica + Lavamoto). T baja por omisiones JEE'
  },
  // 3. López Aliaga (C=84, I=40, T=45, D=80)
  'LOPEZ ALIAGA': {
    C: 84, I: 40, T: 45, D: 80,
    balanced: 60.3, merit: 66.9, integrity_score: 53.7,
    notes: 'MBA UPacífico + alcalde Lima capital. Panama Papers lavado pendiente. T bajada: JEE posible falsedad + omisiones empresas + deuda SUNAT S/28.4M'
  },
  // 4. George Forsyth (C=50, I=55, T=58, D=70)
  'FORSYTH': {
    C: 50, I: 55, T: 58, D: 70,
    balanced: 53.1, merit: 52.3, integrity_score: 53.8,
    notes: 'Universitario completo tardío, alcalde breve con renuncias. Colusión agravada en proceso. T bajada por declaraciones incompletas'
  },
  // 5. Vladimir Cerrón (C=82, I=10, T=35, D=60)
  'CERRON ROJAS': {
    C: 82, I: 10, T: 35, D: 60,
    balanced: 44.9, merit: 55.7, integrity_score: 34.1,
    notes: 'Neurocirujano doctorado Cuba + gobernador Junín. Prófugo, org criminal + negociación incompatible (TC anuló) + colusión (absuelto CS)'
  },
  // 6. Marisol Pérez Tello (C=85, I=90, T=80, D=85)
  'PEREZ TELLO': {
    C: 85, I: 90, T: 80, D: 85,
    balanced: 86.8, merit: 86.0, integrity_score: 87.5,
    notes: 'Abogada PUCP, ministra Justicia, congresista. Sin procesos. T bajada de 88: JEE procedimiento sancionador detectado'
  },
  // 7. José Williams (C=80, I=80, T=75, D=78)
  'WILLIAMS': {
    C: 80, I: 80, T: 75, D: 78,
    balanced: 79.5, merit: 79.5, integrity_score: 79.5,
    notes: 'General héroe Chavín de Huántar + presidente Congreso + congresista. Sin procesos relevantes'
  },
  // 8. Yonhy Lescano (C=76, I=70, T=72, D=75)
  'LESCANO': {
    C: 76, I: 70, T: 72, D: 75,
    balanced: 72.9, merit: 73.8, integrity_score: 72.0,
    notes: 'Abogado + maestría + congresista 4 periodos. Sin procesos penales'
  },
  // 9. Mesías Guevara (C=76, I=75, T=70, D=72)
  'GUEVARA': {
    C: 76, I: 75, T: 70, D: 72,
    balanced: 75.0, merit: 75.1, integrity_score: 74.8,
    notes: 'Ingeniero + gobernador Cajamarca + congresista. Limpio'
  },
  // 10. Fiorella Molinelli (C=84, I=35, T=72, D=75)
  'MOLINELLI': {
    C: 84, I: 35, T: 72, D: 75,
    balanced: 60.8, merit: 68.1, integrity_score: 53.4,
    notes: 'Doctorado USMP + presidenta EsSalud + ministra. 3 procesos fiscales activos (colusión agravada + org criminal EsSalud COVID). T bajada de 80'
  },
  // 11. Álvaro Paz de la Barra (C=66, I=50, T=62, D=68)
  'PAZ DE LA BARRA': {
    C: 66, I: 50, T: 62, D: 68,
    balanced: 58.4, merit: 60.8, integrity_score: 56.0,
    notes: 'Abogado + alcalde La Molina. Denuncia violencia familiar. C subida de 60'
  },
  // 12. Herbert Caller (C=70, I=70, T=65, D=60)
  'CALLER': {
    C: 70, I: 70, T: 65, D: 60,
    balanced: 69.5, merit: 69.5, integrity_score: 69.5,
    notes: 'Maestría Carlos III Madrid, 21 años Armada, empresario. Limpio. C subida de 63'
  },
  // 13. Carlos Espá (C=64, I=72, T=68, D=62)
  'ESPA': {
    C: 64, I: 72, T: 68, D: 62,
    balanced: 68.0, merit: 66.8, integrity_score: 69.2,
    notes: 'Periodista + experiencia política. Limpio. C subida de 58'
  },
  // 14. Rosario Fernández (C=82, I=82, T=78, D=75)
  'FERNANDEZ': {
    C: 82, I: 82, T: 78, D: 75,
    balanced: 81.6, merit: 81.6, integrity_score: 81.6,
    notes: '1ra de promoción PUCP + primera ministra + ministra Justicia + VP BVL. Limpia. C subida de 77'
  },
  // 15. Roberto Chiabra (C=76, I=75, T=72, D=75)
  'CHIABRA': {
    C: 76, I: 75, T: 72, D: 75,
    balanced: 75.2, merit: 75.3, integrity_score: 75.0,
    notes: 'General + congresista + ministro Defensa. Limpio. C subida de 68'
  },
  // 16. Ricardo Belmont (C=56, I=15, T=55, D=63)
  'BELMONT': {
    C: 56, I: 15, T: 55, D: 63,
    balanced: 37.5, merit: 43.6, integrity_score: 31.3,
    notes: 'Bachiller U. de Lima (no secundaria) + alcalde Lima + comunicador. 2 penales + civil + dimisiones. I subida de 5→15, D bajada 70→63'
  },
  // 17. Napoleón Becerra (C=56, I=72, T=65, D=60)
  'BECERRA': {
    C: 56, I: 72, T: 65, D: 60,
    balanced: 64.1, merit: 61.7, integrity_score: 66.5,
    notes: 'Dirigente sindical longevo. Limpio. C subida de 49'
  },
  // 18. Alex Gonzales (C=66, I=75, T=70, D=58)
  'GONZALES CASTILLO': {
    C: 66, I: 75, T: 70, D: 58,
    balanced: 70.5, merit: 69.1, integrity_score: 71.8,
    notes: 'Univ incompleta pero ex-alcalde SJL (distrito más poblado). Limpio. C subida de 59'
  },
  // 19. Charlie Carrasco (C=66, I=70, T=65, D=55)
  'CARRASCO': {
    C: 66, I: 70, T: 65, D: 55,
    balanced: 67.7, merit: 67.1, integrity_score: 68.3,
    notes: 'Doctorado F. Villarreal + profesor titular. Sin gestión pública relevante. Limpio. C subida de 57'
  },
  // 20. Armando Massé (C=76, I=30, T=68, D=62)
  'MASSE': {
    C: 76, I: 30, T: 68, D: 62,
    balanced: 54.5, merit: 61.4, integrity_score: 47.6,
    notes: 'MD + JD + MBA + MA (4 títulos!) + presidente APDAYC. 2 penales pendientes (admin fraudulenta + lavado). C subida masiva de 60'
  },
  // 21. Wolfgang Grozo (C=76, I=74, T=68, D=60)
  'GROZO': {
    C: 76, I: 74, T: 68, D: 60,
    balanced: 74.3, merit: 74.6, integrity_score: 74.0,
    notes: 'Gral Mayor FAP + postgrados CAEN/CESEDEN + profesor U. Lima. Limpio. C subida de 66'
  },
  // 22. Carlos Jaico (C=74, I=70, T=68, D=65)
  'JAICO': {
    C: 74, I: 70, T: 68, D: 65,
    balanced: 71.6, merit: 72.2, integrity_score: 71.0,
    notes: 'Maestría + MBA Suiza + Sec Gral Palacio + Cámara Comercio Suiza-Perú. Limpio. C subida de 66'
  },
  // 23. Alfonso López Chau (C=85, I=65, T=75, D=72)
  'LOPEZ CHAU': {
    C: 85, I: 65, T: 75, D: 72,
    balanced: 75.0, merit: 78.0, integrity_score: 72.0,
    notes: 'Rector UNI + ingeniero distinguido. Colusión UNI en proceso. C subida de 80'
  },
  // 24. Ronald Atencio (C=55, I=72, T=65, D=58)
  'ATENCIO': {
    C: 55, I: 72, T: 65, D: 58,
    balanced: 63.7, merit: 61.1, integrity_score: 66.2,
    notes: 'Abogado sin cargos destacados. Limpio. Sin cambios (confirmado correcto por auditoría)'
  },
  // 25. Roberto Sánchez (C=62, I=30, T=70, D=65)
  'SANCHEZ PALOMINO': {
    C: 62, I: 30, T: 70, D: 65,
    balanced: 48.4, merit: 53.2, integrity_score: 43.6,
    notes: 'Psicólogo UNMSM + ministro MINCETUR + roles municipales. 2 penales (rebelión + org criminal). C subida de 58'
  },
  // 26. Rafael Belaúnde (C=72, I=78, T=72, D=70)
  'BELAUNDE': {
    C: 72, I: 78, T: 72, D: 70,
    balanced: 74.7, merit: 73.8, integrity_score: 75.6,
    notes: 'Experiencia política + apellido histórico. Limpio. C subida de 65'
  },
  // 27. Fernando Olivera (C=78, I=85, T=63, D=75)
  'OLIVERA': {
    C: 78, I: 85, T: 63, D: 75,
    balanced: 79.7, merit: 78.6, integrity_score: 80.7,
    notes: 'Abogado + congresista + ministro + embajador + maestría. Solo 1 civil contractual. C subida de 70'
  },
  // 28. Carlos Álvarez (C=42, I=72, T=68, D=60)
  'ALVAREZ': {
    C: 42, I: 72, T: 68, D: 60,
    balanced: 58.1, merit: 53.6, integrity_score: 62.6,
    notes: 'Secundaria completa, humorista famoso, liderazgo comunicacional. Limpio. C subida de 38'
  },
  // 29. Francisco Diez-Canseco (C=82, I=80, T=78, D=75)
  'DIEZ-CANSECO': {
    C: 82, I: 80, T: 78, D: 75,
    balanced: 80.7, merit: 81.0, integrity_score: 80.4,
    notes: 'Abogado experimentado + congresista + legislador. Limpio. C subida de 75'
  },
  // 30. Mario Vizcarra (C=55, I=15, T=65, D=58)
  'VIZCARRA CORNEJO': {
    C: 55, I: 15, T: 65, D: 58,
    balanced: 38.0, merit: 44.0, integrity_score: 32.0,
    notes: 'Ingeniero UNI + presidente regional Moquegua. Condenado peculado S/2.3M + 2 investigaciones. C subida de 43'
  },
  // 31. Walter Chirinos (C=55, I=68, T=62, D=55)
  'CHIRINOS': {
    C: 55, I: 68, T: 62, D: 55,
    balanced: 61.6, merit: 59.6, integrity_score: 63.5,
    notes: 'Contador Telesup + cargo breve MININTER. Limpio. C subida de 49'
  },
  // 32. José Luna Gálvez (C=80, I=10, T=42, D=75)
  'LUNA GALVEZ': {
    C: 80, I: 10, T: 42, D: 75,
    balanced: 44.7, merit: 55.2, integrity_score: 34.2,
    notes: 'Fundador U. Telesup + congresista + empresario exitoso. 3 penales + civil + dimisiones. I subida 5→10, T bajada 55→42, C subida 70→80'
  },
  // 33. Paul Jaimes (C=62, I=72, T=68, D=58)
  'JAIMES': {
    C: 62, I: 72, T: 68, D: 58,
    balanced: 67.1, merit: 65.6, integrity_score: 68.6,
    notes: 'Experiencia moderada. Limpio. C subida de 55'
  },
  // 34. Jorge Nieto (C=75, I=65, T=80, D=73)
  'NIETO MONTESINOS': {
    C: 75, I: 65, T: 80, D: 73,
    balanced: 71.0, merit: 72.5, integrity_score: 69.5,
    notes: 'Sociólogo, doctorado incompleto El Colegio de México, ministros breves. Odebrecht lavado juicio oral. D bajada 78→73'
  },
  // 35. Enrique Valderrama (C=52, I=65, T=62, D=60)
  'VALDERRAMA': {
    C: 52, I: 65, T: 62, D: 60,
    balanced: 58.9, merit: 56.9, integrity_score: 60.8,
    notes: 'Bachiller Derecho reciente 2022 + cargos privados medios, 39 años. Limpio. C subida de 46'
  },
  // 36. Antonio Ortiz (C=48, I=70, T=65, D=55)
  'ORTIZ': {
    C: 48, I: 70, T: 65, D: 55,
    balanced: 59.6, merit: 56.3, integrity_score: 62.9,
    notes: 'Empresario, candidatura por sorteo. Sin educación superior verificada. Limpio. C subida de 43'
  },
}

async function main() {
  console.log('='.repeat(70))
  console.log(' APLICANDO SCORES AUDITADOS v2 - 36 CANDIDATOS PRESIDENCIALES')
  console.log(' Post auditoría de 6 agentes especializados')
  console.log('='.repeat(70))

  let updated = 0
  let notFound = 0

  for (const [searchName, data] of Object.entries(AUDITED_SCORES)) {
    const parts = searchName.split(' ')

    // Build query - match all parts of the name
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

    // Update scores
    await sql`
      UPDATE scores SET
        competence = ${data.C},
        integrity = ${data.I},
        transparency = ${data.T},
        confidence = ${data.D},
        score_balanced = ${data.balanced},
        score_merit = ${data.merit},
        score_integrity = ${data.integrity_score},
        updated_at = NOW()
      WHERE candidate_id = ${candidate.id}
    `

    console.log(`  ✓ ${candidate.full_name.substring(0, 40).padEnd(40)} C=${String(data.C).padStart(2)} I=${String(data.I).padStart(2)} T=${String(data.T).padStart(2)} D=${String(data.D).padStart(2)} Bal=${data.balanced}`)
    updated++
  }

  // Recalculate 4-pillar scores for all presidential candidates with plan_viability
  console.log('\n' + '='.repeat(70))
  console.log(' RECALCULANDO SCORES DE 4 PILARES')
  console.log('='.repeat(70))

  await sql`
    UPDATE scores SET
      score_balanced_p = ROUND((0.30 * competence + 0.30 * integrity + 0.10 * transparency + 0.30 * plan_viability)::numeric, 1),
      score_merit_p = ROUND((0.40 * competence + 0.25 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1),
      score_integrity_p = ROUND((0.25 * competence + 0.40 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1)
    WHERE candidate_id IN (
      SELECT id FROM candidates WHERE cargo = 'presidente' AND is_active = true
    )
    AND plan_viability IS NOT NULL
  `
  console.log('  ✓ 4-pillar scores recalculated')

  // Show final ranking
  console.log('\n' + '='.repeat(70))
  console.log(' RANKING FINAL (Balanced 3P)')
  console.log('='.repeat(70))

  const ranking = await sql`
    SELECT c.full_name, s.competence, s.integrity, s.transparency, s.confidence,
           s.score_balanced, s.plan_viability, s.score_balanced_p
    FROM candidates c JOIN scores s ON c.id = s.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY s.score_balanced DESC
  `

  ranking.forEach((r, i) => {
    const rank = String(i + 1).padStart(2)
    const name = r.full_name.substring(0, 35).padEnd(35)
    console.log(`  ${rank}. ${name} C=${String(r.competence).padStart(2)} I=${String(r.integrity).padStart(2)} T=${String(r.transparency).padStart(2)} D=${String(r.confidence).padStart(2)} Bal=${r.score_balanced} | PV=${r.plan_viability || 'N/A'} 4P=${r.score_balanced_p || 'N/A'}`)
  })

  console.log('\n' + '='.repeat(70))
  console.log(` RESUMEN: ${updated} actualizados, ${notFound} no encontrados`)
  console.log('='.repeat(70))
}

main().catch(console.error)
