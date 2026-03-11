/**
 * Complete penal_sentences for ALL presidential candidates from verified sources
 * and recalculate integrity scores with the granular penalty scale.
 *
 * Penalty scale:
 * - Sentencia firme (condenado/firme): -70 (1 case), -85 cap (2+)
 * - Juicio oral / acusación fiscal: -30 per case
 * - Investigación formalizada (investigacion_preparatoria): -15 per case
 * - Investigación preliminar: -10 per case
 * - Anulado / archivado / absuelto: -5
 *
 * Sources: JNE hojas de vida, El Comercio, Infobae, La República, RPP, Gestión
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

interface PenalEntry {
  type: 'penal'
  description: string
  status: string
  isFirm: boolean
  year?: number
  citation?: string
}

// ============================================================
// VERIFIED PENAL DATA PER CANDIDATE
// Only candidates with actual penal cases are listed
// ============================================================

const PENAL_DATA: Record<string, PenalEntry[]> = {

  // --- KEIKO FUJIMORI ---
  // 4 active cases, 2 archived
  'FUJIMORI HIGUCHI': [
    {
      type: 'penal', isFirm: false, status: 'archivado', year: 2026,
      description: 'Caso Cócteles - lavado de activos y organización criminal (campañas 2011/2016)',
      citation: 'TC anuló proceso. Juez Verástegui archivó definitivamente enero 2026.',
    },
    {
      type: 'penal', isFirm: false, status: 'acusacion_fiscal', year: 2026,
      description: 'Caso Cócteles - falsa declaración ante ONPE y falsedad genérica',
      citation: 'Cargos subsistentes tras archivamiento del lavado. Etapa intermedia.',
    },
    {
      type: 'penal', isFirm: false, status: 'acusacion_fiscal', year: 2025,
      description: 'Caso Alas Peruanas - lavado de activos vía Universidad Alas Peruanas',
      citation: 'Investigación preparatoria concluida, fiscalía formulando acusación. Fuerza Popular incorporada como persona jurídica dic 2025.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion_preparatoria', year: 2025,
      description: 'Caso Lavamoto - lavado de activos campaña 2021',
      citation: 'Formalizada sept 2025, plazo 36 meses. Co-investigados: Galarreta, Torres.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion_preliminar', year: 2026,
      description: 'Enriquecimiento ilícito - USD 3.65M de Dionisio Romero no declarados',
      citation: 'Abierta feb 2026, investigación compleja 8 meses.',
    },
  ],

  // --- LOPEZ CHAU ---
  // 2 cases (already inserted, but re-confirming)
  'LOPEZ CHAU': [
    {
      type: 'penal', isFirm: false, status: 'acusacion_fiscal', year: 2025,
      description: 'Colusión agravada - designación irregular de secretaria general UNI',
      citation: 'Fiscalía pide 5 años prisión + 12.5 años inhabilitación. Control de acusación pendiente.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion_preparatoria', year: 2026,
      description: 'Peculado doloso - contratos a militantes de Ahora Nación con fondos UNI',
      citation: 'Investigación compleja declarada 12/01/2026. Contraloría ordenó auditar gestión UNI.',
    },
  ],

  // --- CERRON ROJAS ---
  // 5 active cases, prófugo
  'CERRON ROJAS': [
    {
      type: 'penal', isFirm: false, status: 'investigacion_preparatoria', year: 2023,
      description: 'Lavado de activos y organización criminal - Los Dinámicos del Centro / Perú Libre',
      citation: 'Prisión preventiva vigente. Prófugo desde oct 2023. TC evalúa habeas corpus.',
    },
    {
      type: 'penal', isFirm: false, status: 'proceso', year: 2026,
      description: 'Caso La Oroya - negociación incompatible como gobernador regional',
      citation: 'TC anuló condena previa. Nuevo juicio oral ordenado. No prescrito (vence 2029).',
    },
    {
      type: 'penal', isFirm: false, status: 'proceso', year: 2024,
      description: 'Caso Antalsis - colusión agravada, contratos SIMA por S/26M',
      citation: 'Proceso penal continúa. Prisión preventiva anulada por vicios procesales.',
    },
    {
      type: 'penal', isFirm: false, status: 'proceso', year: 2024,
      description: 'Afiliación a organización terrorista - vínculos con Sendero Luminoso VRAEM',
      citation: 'Juicio oral autorizado oct 2024. Fiscalía pide 25 años prisión.',
    },
    {
      type: 'penal', isFirm: false, status: 'acusacion_fiscal', year: 2024,
      description: 'Caso Hospital Higa Arakaki - colusión en obra de Satipo',
      citation: 'Fiscalía pide 9 años prisión. Etapa intermedia.',
    },
  ],

  // --- VIZCARRA CORNEJO ---
  // 1 condena + 3 procesos activos
  'VIZCARRA CORNEJO': [
    {
      type: 'penal', isFirm: false, status: 'condenado', year: 2025,
      description: 'Cohecho pasivo impropio - coimas S/2.3M por obras Lomas de Ilo y Hospital Moquegua',
      citation: 'Condenado 14 años prisión primera instancia (nov 2025). En apelación. Preso en Barbadillo.',
    },
    {
      type: 'penal', isFirm: false, status: 'acusacion_fiscal', year: 2025,
      description: 'Caso Vacunagate - concusión por vacunación irregular Sinopharm',
      citation: 'Congreso aprobó acusación constitucional nov 2025.',
    },
    {
      type: 'penal', isFirm: false, status: 'acusacion_fiscal', year: 2025,
      description: 'Caso Chirimayuni - negociación incompatible en obra de represa',
      citation: 'Fiscalía pide 9 años 8 meses prisión. Sobreseimiento revocado.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion', year: 2025,
      description: 'Los Intocables de la Corrupción - organización criminal en MTC/Provías',
      citation: 'Denuncia constitucional nov 2025. Podría enfrentar hasta 30 años.',
    },
  ],

  // --- LOPEZ ALIAGA ---
  // 1 investigación preparatoria + 2 preliminares (el "confirmado" en DB es electoral, no penal)
  'LOPEZ ALIAGA': [
    {
      type: 'penal', isFirm: false, status: 'investigacion_preparatoria', year: 2025,
      description: 'Caso Panama Papers - lavado de activos vía empresas offshore ACRES',
      citation: 'Investigación ampliada 24 meses (sept 2025). Intentos de archivo rechazados.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion_preliminar', year: 2026,
      description: 'Destrucción de patrimonio cultural - casonas históricas Jr. Azángaro',
      citation: 'Fiscalía abrió investigación feb 2026. No se presentó a citación.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion_preliminar', year: 2026,
      description: 'Favorecimiento a Gezhouba - Vía Expresa Norte S/277M',
      citation: 'Investigación preliminar abierta feb 2026 por corrupción de funcionarios.',
    },
  ],

  // --- LUNA GALVEZ ---
  // 3 procesos penales (1 escaló a acusación fiscal)
  'LUNA GALVEZ': [
    {
      type: 'penal', isFirm: false, status: 'acusacion_fiscal', year: 2025,
      description: 'Caso ONPE/Gángsteres - organización criminal + cohecho para inscribir Podemos',
      citation: 'Fiscalía pide 22 años 8 meses prisión. Control de acusación iniciado dic 2025.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion_preparatoria', year: 2026,
      description: 'Caso Lava Jato/Odebrecht - lavado de activos vía Telesup',
      citation: 'Investigación activa. Pedido de archivo rechazado. Reparación civil US$141M.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion_preparatoria', year: 2025,
      description: 'Caso Cuellos Blancos - lavado de activos depósitos a ex-CNM Noguera',
      citation: 'PJ revocó anulación y reinstauró investigación mayo 2025. TC evalúa recurso.',
    },
  ],

  // --- MOLINELLI ---
  // 3 procesos fiscales
  'MOLINELLI': [
    {
      type: 'penal', isFirm: false, status: 'investigacion_preparatoria', year: 2021,
      description: 'Club de las Farmacéuticas - organización criminal + colusión agravada en EsSalud COVID',
      citation: 'Impedimento de salida 12 meses. Sobreprecio S/18.2M en equipos médicos.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion_preparatoria', year: 2024,
      description: 'Caso Chinchero - colusión agravada por adenda aeropuerto Cusco',
      citation: 'Investigación formalizada. Comparecencia restringida declarada infundada.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion_preliminar', year: 2025,
      description: 'Hospital María Reiche Marcona - omisión de funciones + abuso de autoridad',
      citation: 'Diligencias preliminares desde enero 2025.',
    },
  ],

  // --- SANCHEZ PALOMINO ---
  // Múltiples investigaciones (caso rebelión excluido)
  'SANCHEZ PALOMINO': [
    {
      type: 'penal', isFirm: false, status: 'investigacion', year: 2022,
      description: 'Obstrucción a la justicia - pagos a esposa de Bruno Pacheco para silenciarlo',
      citation: 'Investigación abierta nov 2022. 34 llamadas documentadas.',
    },
    {
      type: 'penal', isFirm: false, status: 'acusacion_fiscal', year: 2025,
      description: 'Negociación incompatible - contratación irregular de Daniel Abarca en Mincetur',
      citation: 'Denuncia constitucional ante Congreso. Caso vinculado a Guido Bellido.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion', year: 2024,
      description: 'Mochasueldos y delitos contra administración pública - Mincetur',
      citation: 'Investigación reportada ago 2024. Esposa recibió S/214K sin título profesional.',
    },
  ],

  // --- FORSYTH ---
  // 1 investigación preparatoria formalizada
  'FORSYTH': [
    {
      type: 'penal', isFirm: false, status: 'investigacion_preparatoria', year: 2025,
      description: 'Colusión agravada + negociación incompatible - contratos familia Coello en La Victoria',
      citation: 'Investigación ampliada 8 meses hasta mayo 2026. 95 procesos, S/3M.',
    },
  ],

  // --- BELMONT ---
  // 1 condena primera instancia + 1 juicio oral
  'BELMONT': [
    {
      type: 'penal', isFirm: false, status: 'condenado', year: 2024,
      description: 'Difamación agravada contra Phillip Butters',
      citation: 'Condenado primera instancia: 1 año suspendido + S/20K reparación. En apelación.',
    },
    {
      type: 'penal', isFirm: false, status: 'proceso', year: 2024,
      description: 'Usurpación agravada + hurto agravado - toma violenta PBO Radio/Morro Solar',
      citation: 'Fiscalía pide 7 años 5 meses prisión efectiva. En juicio oral.',
    },
  ],

  // --- MASSE ---
  // 1-2 investigaciones APDAYC
  'MASSE': [
    {
      type: 'penal', isFirm: false, status: 'investigacion', year: 2013,
      description: 'Lavado de activos - transferencias APDAYC a Wells Fargo y compra frecuencias radiales',
      citation: 'Investigación fiscal desde 2013. Sin acusación formal reportada.',
    },
    {
      type: 'penal', isFirm: false, status: 'investigacion', year: 2013,
      description: 'Estafa y administración fraudulenta - manejo irregular de regalías APDAYC',
      citation: 'Denunciado por compositor Felipe "Kiri" Escobar. Indecopi disolvió directiva.',
    },
  ],

  // --- ACUÑA PERALTA ---
  // Exclusión JNE + investigación colusión 2025
  'ACUÑA PERALTA': [
    {
      type: 'penal', isFirm: false, status: 'investigacion_preliminar', year: 2025,
      description: 'Colusión - S/2M de fondos públicos para publicidad personal como gobernador',
      citation: 'Investigación compleja 120 días desde abril 2025.',
    },
  ],

  // --- NIETO MONTESINOS ---
  'NIETO MONTESINOS': [
    {
      type: 'penal', isFirm: false, status: 'investigacion', year: 2024,
      description: 'Investigación por lavado de activos - caso Odebrecht',
      citation: 'Investigación activa.',
    },
  ],

  // --- PAZ DE LA BARRA: sin casos penales (violencia familiar es civil) ---
  // --- Candidatos limpios no necesitan entrada ---
}

// Civil penalties for specific candidates
const CIVIL_OVERRIDES: Record<string, { type: string; penalty: number }[]> = {
  'PAZ DE LA BARRA': [{ type: 'violencia familiar', penalty: 50 }],
  'OLIVERA': [{ type: 'contractual', penalty: 8 }],
  'LESCANO': [{ type: 'acoso archivada', penalty: 13 }],
  'LOPEZ ALIAGA': [{ type: 'falsedad JEE / omisiones declaración', penalty: 15 }],
  'ACUÑA PERALTA': [{ type: 'plagio académico confirmado Indecopi', penalty: 15 }, { type: 'exclusión JNE compra de votos 2016', penalty: 20 }],
  'BELMONT': [{ type: 'laboral', penalty: 25 }],
  'LUNA GALVEZ': [{ type: 'extinción de dominio S/1.6M', penalty: 5 }],
}

// Penalty per status
const STATUS_PENALTY: Record<string, number> = {
  condenado: 70, firme: 70,
  proceso: 30, acusacion_fiscal: 30,
  investigacion_preparatoria: 15,
  investigacion: 10, investigacion_preliminar: 10,
  archivado: 5, juicio_anulado: 5, anulada_rehacer: 5, absuelto: 5, observacion: 5,
}

const STATUS_LABELS: Record<string, string> = {
  condenado: 'Sentencia (1ra instancia)',
  firme: 'Sentencia firme',
  proceso: 'Juicio oral',
  acusacion_fiscal: 'Acusación fiscal',
  investigacion_preparatoria: 'Investigación formalizada',
  investigacion: 'Investigación activa',
  investigacion_preliminar: 'Investigación preliminar',
  archivado: 'Caso archivado',
  juicio_anulado: 'Juicio anulado',
  anulada_rehacer: 'Sentencia anulada',
  absuelto: 'Absuelto',
  observacion: 'Observación',
}

function resignationPenalty(count: number): number {
  if (count >= 3) return 15
  if (count >= 2) return 10
  if (count >= 1) return 5
  return 0
}

async function main() {
  console.log('='.repeat(70))
  console.log(' COMPLETE PENAL DATA + RECALCULATE INTEGRITY (VERIFIED SOURCES)')
  console.log('='.repeat(70))

  // Phase 1: Update penal_sentences for all candidates with verified data
  console.log('\n--- Phase 1: Updating penal_sentences ---\n')

  for (const [searchName, penalEntries] of Object.entries(PENAL_DATA)) {
    const parts = searchName.split(' ')
    const candidates = parts.length === 1
      ? await sql`SELECT id, full_name FROM candidates WHERE cargo='presidente' AND is_active=true AND full_name ILIKE ${`%${parts[0]}%`} LIMIT 1`
      : await sql`SELECT id, full_name FROM candidates WHERE cargo='presidente' AND is_active=true AND full_name ILIKE ${`%${parts[0]}%`} AND full_name ILIKE ${`%${parts[1]}%`} LIMIT 1`

    if (candidates.length === 0) {
      console.log(`  ✗ No encontrado: ${searchName}`)
      continue
    }

    await sql`UPDATE candidates SET penal_sentences = ${JSON.stringify(penalEntries)}::jsonb WHERE id = ${candidates[0].id}`
    console.log(`  ✓ ${candidates[0].full_name.substring(0, 45).padEnd(47)} → ${penalEntries.length} casos penales`)
  }

  // Phase 2: Recalculate ALL presidential candidates
  console.log('\n--- Phase 2: Recalculating integrity scores ---\n')

  const allCandidates = await sql`
    SELECT c.id, c.full_name, c.penal_sentences, c.civil_sentences, c.party_resignations,
           s.integrity as old_integrity, s.competence, s.transparency, s.confidence, s.plan_viability,
           sb.reinfo_penalty as sb_reinfo_penalty
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `

  for (const c of allCandidates) {
    const penalSentences = (c.penal_sentences || []) as PenalEntry[]
    const partyResignations = Number(c.party_resignations) || 0
    const reinfoP = Number(c.sb_reinfo_penalty) || 0

    // Calculate penal penalties with granular scale
    const penalDetails: { status: string; description: string; penalty: number }[] = []
    for (const s of penalSentences) {
      const status = s.status || (s.isFirm ? 'condenado' : 'investigacion')
      const penalty = STATUS_PENALTY[status] || 10
      const label = STATUS_LABELS[status] || status
      penalDetails.push({
        status,
        description: `${label}: ${(s.description || '').substring(0, 80)}`,
        penalty,
      })
    }

    // Cap total penal at 85
    const totalPenalPenalty = Math.min(85, penalDetails.reduce((sum, p) => sum + p.penalty, 0))

    // Civil penalties - use overrides if available, otherwise keep existing breakdown data
    const nameKey = Object.keys(CIVIL_OVERRIDES).find(k => {
      const parts = k.split(' ')
      return parts.every(p => c.full_name.toUpperCase().includes(p))
    })
    const civilPenalties = nameKey ? CIVIL_OVERRIDES[nameKey] : []
    const civilPenaltiesSum = civilPenalties.reduce((s, p) => s + p.penalty, 0)

    const resignP = resignationPenalty(partyResignations)
    const newIntegrity = Math.max(0, 100 - totalPenalPenalty - civilPenaltiesSum - resignP - reinfoP)

    // Update scores
    await sql`UPDATE scores SET integrity = ${newIntegrity}, updated_at = NOW() WHERE candidate_id = ${c.id}`

    // Update breakdowns
    await sql`
      UPDATE score_breakdowns SET
        integrity_base = 100,
        penal_penalty = ${totalPenalPenalty},
        penal_penalties = ${JSON.stringify(penalDetails)}::jsonb,
        civil_penalties = ${JSON.stringify(civilPenalties)}::jsonb,
        resignation_penalty = ${resignP},
        reinfo_penalty = ${reinfoP}
      WHERE candidate_id = ${c.id}
    `

    const oldI = Number(c.old_integrity)
    const changed = Math.abs(oldI - newIntegrity) > 0.5
    const marker = changed ? '⚠' : '✓'
    const name = c.full_name.substring(0, 38).padEnd(40)
    const penalSummary = penalDetails.length > 0
      ? penalDetails.map(p => `${p.status}(-${p.penalty})`).join('+')
      : 'limpio'
    console.log(`  ${marker} ${name} ${penalSummary.substring(0, 55).padEnd(57)} civ=-${civilPenaltiesSum} res=-${resignP} → I=${newIntegrity}${changed ? ` (was ${oldI})` : ''}`)
  }

  // Phase 3: Recalculate weighted scores
  console.log('\n--- Phase 3: Recalculating weighted scores ---')
  await sql`
    UPDATE scores SET
      score_balanced = ROUND((0.30 * competence + 0.30 * integrity + 0.20 * transparency + 0.20 * confidence)::numeric, 1),
      score_merit = ROUND((0.40 * competence + 0.25 * integrity + 0.15 * transparency + 0.20 * confidence)::numeric, 1),
      score_integrity = ROUND((0.25 * competence + 0.40 * integrity + 0.15 * transparency + 0.20 * confidence)::numeric, 1)
    WHERE candidate_id IN (SELECT id FROM candidates WHERE cargo = 'presidente' AND is_active = true)
  `
  await sql`
    UPDATE scores SET
      score_balanced_p = ROUND((0.30 * competence + 0.30 * integrity + 0.10 * transparency + 0.30 * plan_viability)::numeric, 1),
      score_merit_p = ROUND((0.40 * competence + 0.25 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1),
      score_integrity_p = ROUND((0.25 * competence + 0.40 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1)
    WHERE candidate_id IN (SELECT id FROM candidates WHERE cargo = 'presidente' AND is_active = true)
    AND plan_viability IS NOT NULL
  `

  // Phase 4: Final verification
  console.log('\n' + '='.repeat(70))
  console.log(' RANKING FINAL')
  console.log('='.repeat(70))

  const ranking = await sql`
    SELECT c.full_name, s.competence, s.integrity, s.transparency, s.plan_viability,
           s.score_balanced_p, sb.penal_penalty, sb.resignation_penalty
    FROM candidates c JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY COALESCE(s.score_balanced_p, s.score_balanced) DESC
  `
  ranking.forEach((r, i) => {
    const rank = String(i + 1).padStart(2)
    const name = r.full_name.substring(0, 32).padEnd(34)
    console.log(`  ${rank}. ${name} C=${String(r.competence).padStart(5)} I=${String(r.integrity).padStart(5)} T=${String(r.transparency).padStart(5)} P=${String(r.plan_viability || '-').padStart(3)} | 4P=${r.score_balanced_p || '-'}`)
  })

  // Verify consistency
  console.log('\n' + '='.repeat(70))
  console.log(' VERIFICACIÓN DE CONSISTENCIA')
  console.log('='.repeat(70))

  const checks = await sql`
    SELECT c.full_name, s.integrity, sb.integrity_base, sb.penal_penalty, sb.civil_penalties, sb.resignation_penalty, sb.reinfo_penalty
    FROM candidates c JOIN scores s ON c.id = s.candidate_id JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true ORDER BY c.full_name
  `
  let mismatches = 0
  for (const row of checks) {
    const civils = (typeof row.civil_penalties === 'string' ? JSON.parse(row.civil_penalties) : row.civil_penalties || []) as { penalty: number }[]
    const civilSum = civils.reduce((s: number, p: { penalty: number }) => s + p.penalty, 0)
    const calc = Math.max(0, 100 - Number(row.penal_penalty) - civilSum - Number(row.resignation_penalty) - (Number(row.reinfo_penalty) || 0))
    const diff = Number(row.integrity) - calc
    if (Math.abs(diff) > 0.5) {
      console.log(`  ⚠ ${row.full_name.substring(0, 37).padEnd(39)} score=${row.integrity} calc=${calc} diff=${diff > 0 ? '+' : ''}${diff}`)
      mismatches++
    }
  }
  if (mismatches === 0) console.log('  ✓ TODOS LOS SCORES COINCIDEN CON SUS BREAKDOWNS')

  console.log('\n' + '='.repeat(70))
  console.log(` COMPLETADO: ${allCandidates.length} candidatos procesados`)
  console.log('='.repeat(70))
}

main().catch(console.error)
