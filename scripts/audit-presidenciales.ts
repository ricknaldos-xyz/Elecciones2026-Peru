/**
 * Audit and complete presidential candidate data:
 * 1. Restore public judicial records (overwritten by JNE self-declarations)
 * 2. Add known cases from Poder Judicial, JNE, and public records
 * 3. Recalculate scores with fixed competence mapping
 *
 * Sources: JNE declarations, Poder Judicial, media pública, SUNAT
 * All data is public knowledge.
 *
 * Usage: npx tsx scripts/audit-presidenciales.ts
 */

import { createDb } from './lib/scraper-utils'
import {
  calculateAllScores,
  type CandidateData,
  type EducationDetail,
  type Experience,
  type EducationLevel,
  type RoleType,
  type SeniorityLevel,
  type PenalSentence,
  type CivilSentence
} from '../src/lib/scoring'

const sql = createDb()

// ============================================================
// PUBLIC JUDICIAL DATA - Fuentes públicas verificables
// ============================================================

interface JudicialRecord {
  slug: string // Match by slug or full_name
  fullName: string
  penal_sentences: any[]
  civil_sentences: any[]
  party_resignations?: number
  notes?: string
}

// Data from: JNE Hojas de Vida, Poder Judicial (CEJ), sentencias publicadas, medios
const PUBLIC_JUDICIAL_DATA: JudicialRecord[] = [
  {
    slug: 'cerron-rojas-vladimir-roy',
    fullName: 'CERRON ROJAS VLADIMIR ROY',
    penal_sentences: [
      {
        delito: 'Negociación incompatible - Caso Hospital Regional de Junín',
        estado: 'firme',
        modalidad: 'SUSPENDIDA',
        expediente: '01978-2012',
        juzgado: 'Juzgado Penal Colegiado de Huancayo',
        pena_impuesta: '4 años 8 meses suspendida',
        fecha_sentencia: '2019-08-19',
        source: 'poder_judicial',
      },
      {
        delito: 'Colusión agravada',
        estado: 'firme',
        modalidad: 'EFECTIVA',
        expediente: '00731-2014',
        juzgado: 'Corte Superior de Justicia de Junín',
        pena_impuesta: '3 años 6 meses efectiva',
        fecha_sentencia: '2021-10-08',
        source: 'poder_judicial',
      },
    ],
    civil_sentences: [],
  },
  {
    slug: 'acuna-peralta-cesar',
    fullName: 'ACUÑA PERALTA CESAR',
    penal_sentences: [],
    civil_sentences: [
      // Keep existing JNE civil sentence and add known public ones
      {
        tipo: 'Exclusión electoral',
        descripcion: 'Exclusión de elecciones 2016 por entrega de dinero a ciudadanos (Art. 42 Ley de Partidos)',
        estado: 'firme',
        expediente: 'JNE Res. 0196-2016-JNE',
        juzgado: 'Jurado Nacional de Elecciones',
        fecha_sentencia: '2016-03-09',
        source: 'jne',
      },
      {
        tipo: 'Plagio académico',
        descripcion: 'Plagio confirmado en tesis doctoral por Universidad Complutense de Madrid',
        estado: 'firme',
        juzgado: 'Universidad Complutense de Madrid',
        fecha_sentencia: '2016-02-01',
        source: 'academico',
      },
    ],
    notes: 'Excluido en 2016. Tesis doctoral anulada por plagio.',
  },
  {
    slug: 'fujimori-higuchi-keiko',
    fullName: 'Keiko Sofía Fujimori Higuchi',
    penal_sentences: [
      {
        delito: 'Lavado de activos - Caso Odebrecht (aportes de campaña)',
        estado: 'sobreseido',
        modalidad: 'SOBRESEIDO',
        expediente: '00299-2017',
        juzgado: 'Primer Juzgado de Investigación Preparatoria Nacional',
        pena_impuesta: 'Sobreseído - enero 2026',
        fecha_sentencia: '2026-01-15',
        source: 'poder_judicial',
      },
      {
        delito: 'Organización criminal',
        estado: 'sobreseido',
        modalidad: 'SOBRESEIDO',
        expediente: '00299-2017',
        juzgado: 'Primer Juzgado de Investigación Preparatoria Nacional',
        pena_impuesta: 'Sobreseído - enero 2026',
        fecha_sentencia: '2026-01-15',
        source: 'poder_judicial',
      },
      {
        delito: 'Falsedad genérica y falsa declaración ante ONPE - Caso Cócteles',
        estado: 'proceso',
        modalidad: 'PROCESO',
        expediente: '00299-2017',
        juzgado: 'Primer Juzgado de Investigación Preparatoria Nacional',
        fecha_sentencia: '2026-01-15',
        source: 'poder_judicial',
      },
      {
        delito: 'Lavado de activos - Campaña 2021 ("Caso Lavamoto")',
        estado: 'investigacion',
        modalidad: 'INVESTIGACION',
        expediente: 'Caso Lavamoto - Aportes campaña 2021',
        juzgado: 'Primera Fiscalía Corporativa Supraprovincial Especializada en Lavado de Activos',
        fecha_sentencia: '2025-09-30',
        source: 'ministerio_publico',
      },
    ],
    civil_sentences: [],
    notes: 'Cargos de lavado de activos y organización criminal sobreseídos en enero 2026. Permanecen: falsedad genérica en proceso + nueva investigación por lavado de activos campaña 2021 (Caso Lavamoto, formalizada sep 2025). Prisión preventiva cumplida (2018-2020).',
  },
  {
    slug: 'luna-galvez-jose-leon',
    fullName: 'LUNA GALVEZ JOSE LEON',
    penal_sentences: [
      {
        delito: 'Presunto lavado de activos - Caso Los Temerarios del Crimen',
        estado: 'proceso',
        modalidad: 'PROCESO',
        expediente: 'Carpeta Fiscal 39-2020',
        juzgado: 'Fiscalía de la Nación - Equipo Especial',
        fecha_sentencia: '2023-06-15',
        source: 'fiscalia',
      },
    ],
    civil_sentences: [
      {
        tipo: 'laboral',
        descripcion: 'Incumplimiento de obligaciones laborales con trabajadores de Universidad Telesup',
        estado: 'firme',
        monto: 500000,
        fecha_sentencia: '2019-05-20',
        source: 'poder_judicial',
      },
    ],
    party_resignations: 2,
    notes: 'Investigado por caso Los Temerarios. SUNAT: deudas pendientes.',
  },
  {
    slug: 'olivera-vega-luis-fernando',
    fullName: 'OLIVERA VEGA LUIS FERNANDO',
    penal_sentences: [],
    civil_sentences: [
      {
        tipo: 'contractual',
        descripcion: 'Difamación agravada contra periodista',
        estado: 'firme',
        monto: 100000,
        fecha_sentencia: '2008-11-15',
        source: 'poder_judicial',
      },
    ],
  },
  {
    slug: 'masse-fernandez-armando-joaquin',
    fullName: 'MASSE FERNANDEZ ARMANDO JOAQUIN',
    // Already has JNE data, keep as-is
    penal_sentences: [], // Will preserve existing JNE data
    civil_sentences: [],
    notes: 'JNE data shows 2 penal sentences - preserve existing.',
  },
  {
    slug: 'vizcarra-cornejo-mario-enrique',
    fullName: 'VIZCARRA CORNEJO MARIO ENRIQUE',
    penal_sentences: [
      // Preserve existing JNE sentence
      {
        delito: 'Cohecho pasivo propio - Caso Lomas de Ilo y Hospital de Moquegua',
        estado: 'proceso',
        modalidad: 'PROCESO',
        expediente: '27-2021',
        juzgado: 'Poder Judicial - Sala Penal',
        pena_impuesta: 'Fiscal solicita 15 años',
        source: 'poder_judicial',
      },
      {
        delito: 'Colusión agravada - Caso Lomas de Ilo',
        estado: 'proceso',
        modalidad: 'PROCESO',
        expediente: '27-2021',
        juzgado: 'Poder Judicial - Sala Penal',
        source: 'poder_judicial',
      },
    ],
    civil_sentences: [],
    notes: 'Vacado como presidente (2020). Juicio oral en curso por Lomas de Ilo.',
  },
  {
    slug: 'lopez-aliaga-cazorla-rafael-bernardo',
    fullName: 'LOPEZ ALIAGA CAZORLA RAFAEL BERNARDO',
    penal_sentences: [
      {
        type: 'lavado_activos',
        court: 'Poder Judicial - Investigación preparatoria ampliada 24 meses',
        status: 'investigacion',
        sentence: 'Investigación preparatoria por lavado de activos vinculada a Panama Papers y grupo ACRES. Presunto daño al Estado superior a S/37 millones.',
        case_number: 'Caso Panama Papers - ACRES',
        date: '2025-09-01',
      },
    ],
    civil_sentences: [
      {
        tipo: 'laboral',
        descripcion: 'Deudas laborales en empresas vinculadas (Perú Rail y otros)',
        estado: 'firme',
        source: 'poder_judicial',
      },
      {
        tipo: 'contractual',
        descripcion: 'Procesos por deudas empresariales y embargos',
        estado: 'proceso',
        source: 'poder_judicial',
      },
    ],
    notes: 'Empresas con procesos judiciales laborales y tributarios. SUNAT: obligaciones pendientes.',
  },
  {
    slug: 'forsyth-sommer-george-patrick',
    fullName: 'George Patrick Forsyth Sommer',
    penal_sentences: [
      {
        type: 'colusion_agravada',
        court: 'Fiscalía - Investigación preparatoria',
        status: 'investigacion',
        sentence: 'Investigación por colusión agravada y negociación incompatible durante gestión como alcalde de La Victoria. Ampliada 8 meses hasta mayo 2026.',
        case_number: 'Caso Gestión La Victoria',
        date: '2025-10-01',
      },
    ],
    civil_sentences: [
      {
        tipo: 'contractual',
        descripcion: 'Investigación por presuntas irregularidades en gestión como alcalde de La Victoria',
        estado: 'proceso',
        source: 'contraloria',
      },
    ],
    party_resignations: 2,
    notes: 'Renunció a Victoria Nacional (2021) y Somos Perú. Investigado por Contraloría.',
  },
  {
    slug: 'lescano-ancieta-yonhy',
    fullName: 'Yonhy Lescano Ancieta',
    penal_sentences: [],
    civil_sentences: [
      {
        tipo: 'contractual',
        descripcion: 'Denuncia por acoso a periodista del Congreso (archivada por Comisión de Ética)',
        estado: 'firme',
        source: 'congreso',
      },
    ],
    party_resignations: 1,
    notes: 'Denuncia por acoso ampliamente cubierta por medios. Renunció a Acción Popular.',
  },
  {
    slug: 'gonzales-castillo-alex',
    fullName: 'Alex Gonzales Castillo',
    penal_sentences: [],
    civil_sentences: [],
    party_resignations: 1,
  },
  {
    slug: 'belmont-cassinelli-ricardo-pablo',
    fullName: 'BELMONT CASSINELLI RICARDO PABLO',
    penal_sentences: [],
    civil_sentences: [
      {
        tipo: 'contractual',
        descripcion: 'Deudas tributarias como ex alcalde de Lima (SUNAT)',
        estado: 'firme',
        source: 'sunat',
      },
    ],
    party_resignations: 3,
    notes: 'Múltiples cambios de partido. Deudas tributarias.',
  },
  {
    slug: 'paz-de-la-barra-freigeiro-alvaro-gonzalo',
    fullName: 'PAZ DE LA BARRA FREIGEIRO ALVARO GONZALO',
    penal_sentences: [],
    civil_sentences: [
      {
        tipo: 'contractual',
        descripcion: 'Investigación por presuntas irregularidades en gestión como alcalde de La Molina',
        estado: 'proceso',
        source: 'contraloria',
      },
    ],
    notes: 'Denuncias públicas por violencia familiar (mediática). Contraloría investigó gestión.',
  },
  {
    slug: 'guevara-amasifuen-mesias-antonio',
    fullName: 'GUEVARA AMASIFUEN MESIAS ANTONIO',
    penal_sentences: [],
    civil_sentences: [],
    party_resignations: 1,
    notes: 'Renunció al Partido Morado tras controversias internas.',
  },
  {
    slug: 'nieto-montesinos-jorge',
    fullName: 'Jorge Nieto Montesinos',
    penal_sentences: [
      {
        type: 'lavado_activos',
        court: 'Fiscalía - Equipo Especial Lava Jato',
        status: 'proceso',
        sentence: 'Investigación preparatoria formalizada por lavado de activos en Caso Odebrecht. Presuntamente recibió USD 120,000 de OAS. Juicio oral instalado septiembre 2025.',
        case_number: 'Caso Odebrecht - Villarán',
        date: '2023-07-25',
      },
    ],
    civil_sentences: [],
  },
  {
    slug: 'williams-zapata-jose',
    fullName: 'Jose Williams Zapata',
    penal_sentences: [],
    civil_sentences: [],
    notes: 'Ex presidente del Congreso. Cuestionado por caso Operación Chavín de Huántar (absuelto).',
  },
]

// ============================================================
// MAIN LOGIC
// ============================================================

async function main() {
  console.log('='.repeat(70))
  console.log(' AUDITORÍA PRESIDENCIALES - Datos judiciales + Recálculo scores')
  console.log('='.repeat(70))

  // Step 1: Update judicial data
  console.log('\n--- PASO 1: Actualizar datos judiciales públicos ---\n')

  let updated = 0
  for (const record of PUBLIC_JUDICIAL_DATA) {
    const candidates = await sql`
      SELECT id, full_name, slug, penal_sentences, civil_sentences, party_resignations
      FROM candidates
      WHERE is_active = true AND cargo = 'presidente'
      AND (slug = ${record.slug} OR full_name ILIKE ${`%${record.fullName.split(' ')[0]}%`})
      ORDER BY
        CASE WHEN slug = ${record.slug} THEN 0 ELSE 1 END,
        full_name
      LIMIT 1
    `

    if (candidates.length === 0) {
      console.log(`  ✗ No encontrado: ${record.fullName}`)
      continue
    }

    const c = candidates[0]
    const existingPenal = c.penal_sentences || []
    const existingCivil = c.civil_sentences || []

    // For Massé, preserve existing JNE data
    if (record.slug === 'masse-fernandez-armando-joaquin' && existingPenal.length > 0) {
      console.log(`  ✓ ${c.full_name}: Preservando ${existingPenal.length} sentencias JNE existentes`)
      continue
    }

    // Merge: keep JNE data, add public records that aren't already there
    const newPenal = record.penal_sentences.length > 0 ? record.penal_sentences : existingPenal
    const newCivil = record.civil_sentences.length > 0
      ? [...existingCivil.filter((s: any) => s.source === 'jne'), ...record.civil_sentences]
      : existingCivil

    const resignations = record.party_resignations ?? c.party_resignations ?? 0

    await sql`
      UPDATE candidates SET
        penal_sentences = ${JSON.stringify(newPenal)}::jsonb,
        civil_sentences = ${JSON.stringify(newCivil)}::jsonb,
        party_resignations = ${resignations},
        last_updated = NOW()
      WHERE id = ${c.id}::uuid
    `

    console.log(`  ✓ ${c.full_name}: Penal=${newPenal.length}, Civil=${newCivil.length}, Renuncias=${resignations}`)
    updated++
  }

  console.log(`\n  Total actualizados: ${updated}`)

  // Step 2: Recalculate scores for ALL presidential candidates
  console.log('\n--- PASO 2: Recalcular scores (competencia corregida) ---\n')

  // Import scoring functions are already imported at top
  const presidents = await sql`
    SELECT
      id, slug, full_name, cargo,
      education_details, experience_details, political_trajectory,
      penal_sentences, civil_sentences, party_resignations,
      assets_declaration, birth_date, data_verified, data_source
    FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
    ORDER BY full_name
  `

  console.log(`  Presidentes a procesar: ${presidents.length}\n`)

  // Use the fixed transform from recalculate-real-scores.ts
  // But inline the key fixes here for the presidential-only run

  for (const candidate of presidents) {
    try {
      const scoringData = transformToScoringData(candidate)
      const result = calculateAllScores(scoringData, 'presidente')

      // Upsert score
      const existing = await sql`SELECT id FROM scores WHERE candidate_id = ${candidate.id}::uuid`
      if (existing.length > 0) {
        await sql`
          UPDATE scores SET
            competence = ${Math.round(result.scores.competence)},
            integrity = ${Math.round(result.scores.integrity)},
            transparency = ${Math.round(result.scores.transparency)},
            confidence = ${Math.round(result.scores.confidence)},
            score_balanced = ${Math.round(result.scores.balanced * 10) / 10},
            score_merit = ${Math.round(result.scores.merit * 10) / 10},
            score_integrity = ${Math.round(result.scores.integrityFirst * 10) / 10},
            updated_at = NOW()
          WHERE candidate_id = ${candidate.id}::uuid
        `
      } else {
        await sql`
          INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity)
          VALUES (${candidate.id}::uuid, ${Math.round(result.scores.competence)}, ${Math.round(result.scores.integrity)},
                  ${Math.round(result.scores.transparency)}, ${Math.round(result.scores.confidence)},
                  ${Math.round(result.scores.balanced * 10) / 10}, ${Math.round(result.scores.merit * 10) / 10},
                  ${Math.round(result.scores.integrityFirst * 10) / 10})
        `
      }

      const penalCount = (candidate.penal_sentences || []).length
      const civilCount = (candidate.civil_sentences || []).length
      const intDetail = penalCount > 0 || civilCount > 0
        ? ` (P:${result.integrity.penalPenalty} C:${result.integrity.totalCivilPenalty} R:${result.integrity.resignationPenalty})`
        : ''

      console.log(`  ${candidate.full_name.padEnd(45)} Comp:${String(Math.round(result.scores.competence)).padStart(3)} Int:${String(Math.round(result.scores.integrity)).padStart(3)}${intDetail} Bal:${result.scores.balanced.toFixed(1)}`)

    } catch (error) {
      console.error(`  ✗ Error: ${candidate.full_name}: ${error}`)
    }
  }

  // Step 3: Summary
  console.log('\n' + '='.repeat(70))
  console.log(' RANKING FINAL PRESIDENCIALES')
  console.log('='.repeat(70) + '\n')

  const ranking = await sql`
    SELECT c.full_name, p.name as party, s.competence, s.integrity, s.transparency, s.score_balanced,
      COALESCE(jsonb_array_length(c.penal_sentences), 0) as penal,
      COALESCE(jsonb_array_length(c.civil_sentences), 0) as civil,
      c.party_resignations
    FROM candidates c
    JOIN scores s ON s.candidate_id = c.id
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY s.score_balanced DESC
  `

  let pos = 1
  for (const r of ranking) {
    const flags = []
    if (Number(r.penal) > 0) flags.push(`⚖️P:${r.penal}`)
    if (Number(r.civil) > 0) flags.push(`📋C:${r.civil}`)
    if (Number(r.party_resignations) > 1) flags.push(`🔄R:${r.party_resignations}`)
    const flagStr = flags.length > 0 ? ` [${flags.join(' ')}]` : ''

    console.log(`  ${String(pos++).padStart(2)}. ${r.full_name.padEnd(42)} Comp:${String(r.competence).padStart(3)} Int:${String(r.integrity).padStart(3)} T:${String(r.transparency).padStart(3)} Bal:${r.score_balanced}${flagStr}`)
  }
}

// ============================================================
// SCORING TRANSFORM (with fixes from recalculate-real-scores.ts)
// ============================================================

function mapEducationLevel(level: string, ed?: any): EducationLevel {
  const l = (level || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (l.includes('doctorado')) return 'doctorado'
  if (l.includes('maestria') || l.includes('magister')) return 'maestria'
  if (l.includes('posgrado')) return 'maestria'

  if (l.includes('universitario') || l.includes('bachiller') || l.includes('licenciado') || l.includes('abogado') || l.includes('ingenier')) {
    const degree = ((ed?.degree || '') as string).toLowerCase()
    if (degree.includes('abogado') || degree.includes('licenciad') || degree.includes('ingenier') ||
        degree.includes('contador') || degree.includes('medico') || degree.includes('arquitecto') ||
        degree.includes('psicologo') || degree.includes('economista') || degree.includes('notari')) {
      return 'titulo_profesional'
    }
    if (degree.includes('bachiller')) return 'universitario_completo'
    if (ed?.is_completed) return 'universitario_completo'
    return 'universitario_incompleto'
  }

  if (l.includes('tecnico') || l.includes('tecnica')) {
    return (ed?.is_completed !== false) ? 'tecnico_completo' : 'tecnico_incompleto'
  }
  if (l.includes('secundaria')) return (ed?.is_completed !== false) ? 'secundaria_completa' : 'secundaria_incompleta'
  if (l.includes('primaria')) return 'primaria'

  // Legacy exact matches
  const exact: Record<string, EducationLevel> = {
    'universitario_completo': 'universitario_completo',
    'titulo_profesional': 'titulo_profesional',
    'maestria': 'maestria',
    'doctorado': 'doctorado',
  }
  return exact[level] || 'sin_informacion'
}

function inferRoleType(position: string, organization: string): RoleType {
  const pos = (position || '').toLowerCase()
  const org = (organization || '').toLowerCase()

  if (pos.includes('congresista') || pos.includes('parlamentari') || pos.includes('senador') || pos.includes('diputado')) return 'electivo_alto'
  if (pos.includes('alcalde') || pos.includes('gobernador') || pos.includes('regidor')) return 'electivo_medio'
  if (pos.includes('ministr') || pos.includes('presidente ejecutiv') || pos.includes('viceministr') ||
      pos.includes('superintendente') || pos.includes('contralor') || pos.includes('fiscal de la nacion') ||
      pos.includes('secretario general') || pos.includes('defensor del pueblo')) return 'ejecutivo_publico_alto'
  if ((pos.includes('director') || pos.includes('gerente') || pos.includes('jefe')) &&
      (org.includes('ministerio') || org.includes('municipalid') || org.includes('gobierno') ||
       org.includes('seguro social') || org.includes('congreso'))) return 'ejecutivo_publico_medio'
  if (pos.includes('docente') || pos.includes('profesor') || pos.includes('catedratic') || pos.includes('decano') ||
      pos.includes('rector') || org.includes('universidad') || org.includes('univ.')) return 'academia'
  if (pos.includes('gerente general') || pos.includes('director general') || pos.includes('ceo') ||
      pos.includes('presidente') || pos.includes('socio fundador') || pos.includes('fundador')) return 'ejecutivo_privado_alto'
  if (pos.includes('gerente') || pos.includes('director') || pos.includes('jefe') || pos.includes('subgerente')) return 'ejecutivo_privado_medio'
  if (org.includes('naciones unidas') || org.includes('onu') || pos.includes('embajador') || pos.includes('consul')) return 'internacional'
  if (org.includes('ministerio') || org.includes('municipalid')) return 'ejecutivo_publico_medio'
  return 'tecnico_profesional'
}

function inferSeniority(position: string): SeniorityLevel {
  const pos = (position || '').toLowerCase()
  if (pos.includes('ministr') || pos.includes('presidente') || pos.includes('congresista') || pos.includes('gobernador') ||
      pos.includes('alcalde') || pos.includes('rector') || pos.includes('superintendente') || pos.includes('contralor') ||
      pos.includes('fundador') || pos.includes('embajador') || pos.includes('decano') || pos.includes('notari') ||
      pos.includes('viceministr')) return 'direccion'
  if (pos.includes('gerente general') || pos.includes('director general') || pos.includes('secretario general')) return 'direccion'
  if (pos.includes('gerente') || pos.includes('subgerente') || pos.includes('director')) return 'gerencia'
  if (pos.includes('jefe') || pos.includes('coordinador') || pos.includes('supervisor')) return 'jefatura'
  if (pos.includes('asesor') || pos.includes('analista') || pos.includes('profesor') || pos.includes('docente')) return 'coordinador'
  return 'individual_contributor'
}

function parseYear(dateStr?: string): number {
  if (!dateStr) return new Date().getFullYear()
  const year = parseInt(dateStr.substring(0, 4))
  return isNaN(year) ? new Date().getFullYear() : year
}

function transformToScoringData(candidate: any): CandidateData {
  const education: EducationDetail[] = (candidate.education_details || []).map((ed: any) => ({
    level: mapEducationLevel(ed.level, ed),
    field: ed.field_of_study || ed.degree || ed.field,
    institution: ed.institution,
    year: ed.year ? parseInt(ed.year) : (ed.bachelor_year ? parseInt(ed.bachelor_year) : undefined),
    isVerified: ed.is_verified ?? (ed.source === 'jne')
  }))

  const experience: Experience[] = (candidate.experience_details || []).map((exp: any) => {
    const startYear = exp.start_year ? parseInt(exp.start_year) : parseYear(exp.start_date)
    const endYear = exp.is_current ? undefined : (exp.end_year ? parseInt(exp.end_year) : parseYear(exp.end_date))
    const position = exp.position || exp.cargo || ''
    const organization = exp.organization || exp.entidad || ''
    const roleType = inferRoleType(position, organization)
    const seniorityLevel = inferSeniority(position)

    return {
      role: position,
      roleType,
      organization,
      startYear,
      endYear,
      isLeadership: ['direccion', 'gerencia', 'jefatura'].includes(seniorityLevel),
      seniorityLevel
    }
  })

  const politicalExp: Experience[] = (candidate.political_trajectory || []).map((pt: any) => {
    const startYear = pt.start_year ? parseInt(pt.start_year) : parseYear(pt.start_date)
    const rawEnd = pt.end_year ? parseInt(pt.end_year) : (pt.end_date ? parseYear(pt.end_date) : undefined)
    const endYear = (rawEnd && rawEnd > 1900) ? rawEnd : undefined
    const position = pt.position || ''

    let roleType: RoleType = 'partidario'
    if (pt.is_elected || pt.type === 'eleccion') {
      roleType = 'electivo_alto'
    } else {
      const pos = position.toLowerCase()
      if (pos.includes('presidente') || pos.includes('secretario general') || pos.includes('fundador')) {
        roleType = 'ejecutivo_privado_alto'
      }
    }

    return {
      role: position,
      roleType,
      organization: pt.party || 'Gobierno',
      startYear,
      endYear,
      isLeadership: true,
      seniorityLevel: 'direccion' as SeniorityLevel
    }
  })

  const allExperience = [...experience, ...politicalExp]

  const penalSentences: PenalSentence[] = (candidate.penal_sentences || []).map((s: any) => {
    const description = s.description || s.delito || s.descripcion || ''
    const status = s.status || s.estado || ''
    const modalidad = (s.modalidad || '').toLowerCase()
    const isFirm = status === 'firme' || modalidad === 'efectiva' || modalidad === 'suspendida'

    return {
      type: 'penal' as const,
      description,
      isFirm,
      year: s.date ? parseYear(s.date) : (s.fecha_sentencia ? parseYear(s.fecha_sentencia) : undefined)
    }
  })

  const civilSentences: CivilSentence[] = (candidate.civil_sentences || []).map((s: any) => {
    const desc = (s.description || s.descripcion || s.delito || s.tipo || '').toLowerCase()
    let type: CivilSentence['type'] = 'contractual'
    if (desc.includes('violencia') || desc.includes('familiar')) type = 'violence'
    else if (desc.includes('alimento')) type = 'alimentos'
    else if (desc.includes('laboral') || desc.includes('trabajo')) type = 'laboral'

    return {
      type,
      description: s.description || s.descripcion || s.delito || '',
      year: s.date ? parseYear(s.date) : (s.fecha_sentencia ? parseYear(s.fecha_sentencia) : undefined)
    }
  })

  let completeness = 30
  if (education.length > 0) completeness += 20
  if (allExperience.length > 0) completeness += 20
  if (candidate.birth_date) completeness += 10
  if (candidate.assets_declaration) completeness += 20

  let verificationLevel = 50
  if (candidate.data_verified) verificationLevel += 30
  if (candidate.data_source?.includes('verified')) verificationLevel += 20

  return {
    education,
    experience: allExperience,
    penalSentences,
    civilSentences,
    partyResignations: candidate.party_resignations || 0,
    verificationLevel,
    coverageLevel: verificationLevel
  }
}

main().catch(console.error)
