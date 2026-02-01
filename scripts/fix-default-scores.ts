/**
 * Fix candidates with default/unprocessed scores.
 *
 * Problem: 63% of candidates (4,503) have integrity=100 with zero penalties,
 * meaning their integrity was never calculated from their actual data.
 * Also, transparency=88 and confidence=80 are suspiciously uniform defaults.
 *
 * Solution: Recalculate ALL candidates' scores from their actual data
 * (education, experience, sentences, resignations, etc.)
 */

import { neon } from '@neondatabase/serverless'
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

const DATABASE_URL = 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
const sql = neon(DATABASE_URL)

// ─── Mapping functions (copied from recalculate-real-scores.ts) ───

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
  if (l.includes('secundaria')) {
    return (ed?.is_completed !== false) ? 'secundaria_completa' : 'secundaria_incompleta'
  }
  if (l.includes('primaria')) return 'primaria'
  const exactMapping: Record<string, EducationLevel> = {
    'sin_informacion': 'sin_informacion', 'primaria_completa': 'primaria',
    'secundaria_incompleta': 'secundaria_incompleta', 'secundaria_completa': 'secundaria_completa',
    'tecnico_incompleto': 'tecnico_incompleto', 'tecnico_completo': 'tecnico_completo',
    'universitario_incompleto': 'universitario_incompleto', 'universitario_completo': 'universitario_completo',
    'titulo_profesional': 'titulo_profesional', 'maestria': 'maestria', 'doctorado': 'doctorado',
  }
  return exactMapping[level] || 'sin_informacion'
}

function inferRoleType(position: string, organization: string, sector?: string): RoleType {
  const pos = (position || '').toLowerCase()
  const org = (organization || '').toLowerCase()
  if (pos.includes('congresista') || pos.includes('parlamentari') || pos.includes('senador') || pos.includes('diputado')) return 'electivo_alto'
  if (pos.includes('alcalde') || pos.includes('gobernador') || pos.includes('regidor')) return 'electivo_medio'
  if (pos.includes('ministr') || pos.includes('presidente ejecutiv') || pos.includes('viceministr') ||
      pos.includes('jefe de gabinete') || pos.includes('secretario general') || pos.includes('superintendente') ||
      pos.includes('contralor') || pos.includes('fiscal de la nacion') || pos.includes('defensor del pueblo')) return 'ejecutivo_publico_alto'
  if ((pos.includes('director') || pos.includes('gerente') || pos.includes('jefe')) &&
      (org.includes('ministerio') || org.includes('municipalid') || org.includes('gobierno') ||
       org.includes('seguro social') || org.includes('congreso') || sector === 'publico')) return 'ejecutivo_publico_medio'
  if (pos.includes('docente') || pos.includes('profesor') || pos.includes('catedratic') || pos.includes('investigador') ||
      pos.includes('decano') || pos.includes('rector') ||
      org.includes('universidad') || org.includes('univ.') || org.includes('pucp') || org.includes('caen')) return 'academia'
  if (pos.includes('gerente general') || pos.includes('director general') || pos.includes('ceo') ||
      pos.includes('presidente') || pos.includes('socio fundador') || pos.includes('fundador')) return 'ejecutivo_privado_alto'
  if (pos.includes('gerente') || pos.includes('director') || pos.includes('jefe') || pos.includes('subgerente')) return 'ejecutivo_privado_medio'
  if (org.includes('naciones unidas') || org.includes('onu') || org.includes('bid') || org.includes('banco mundial') ||
      org.includes('oea') || org.includes('embajad') || pos.includes('embajador') || pos.includes('consul')) return 'internacional'
  if (pos.includes('notari')) return 'tecnico_profesional'
  if (sector === 'publico' || org.includes('ministerio') || org.includes('municipalid')) return 'ejecutivo_publico_medio'
  return 'tecnico_profesional'
}

function inferSeniorityLevel(position: string): SeniorityLevel {
  const pos = (position || '').toLowerCase()
  if (pos.includes('ministr') || pos.includes('presidente') || pos.includes('congresista') ||
      pos.includes('gobernador') || pos.includes('alcalde') || pos.includes('rector') ||
      pos.includes('superintendente') || pos.includes('contralor') || pos.includes('fiscal') ||
      pos.includes('viceministr') || pos.includes('fundador') || pos.includes('embajador') ||
      pos.includes('decano') || pos.includes('notari')) return 'direccion'
  if (pos.includes('gerente general') || pos.includes('director general') || pos.includes('director ejecutiv') ||
      pos.includes('secretario general') || pos.includes('ceo')) return 'direccion'
  if (pos.includes('gerente') || pos.includes('subgerente') || pos.includes('director')) return 'gerencia'
  if (pos.includes('jefe') || pos.includes('coordinador') || pos.includes('supervisor')) return 'jefatura'
  if (pos.includes('asesor') || pos.includes('analista') || pos.includes('especialista') ||
      pos.includes('profesor') || pos.includes('docente')) return 'coordinador'
  return 'individual_contributor'
}

function mapRoleType(roleType: string, position?: string, organization?: string, sector?: string): RoleType {
  const mapping: Record<string, RoleType> = {
    'electivo_alto': 'electivo_alto', 'electivo_medio': 'electivo_medio',
    'ejecutivo_publico_alto': 'ejecutivo_publico_alto', 'ejecutivo_publico_medio': 'ejecutivo_publico_medio',
    'ejecutivo_privado_alto': 'ejecutivo_privado_alto', 'ejecutivo_privado_medio': 'ejecutivo_privado_medio',
    'tecnico_profesional': 'tecnico_profesional', 'academia': 'academia',
    'internacional': 'internacional', 'partidario': 'partidario',
  }
  if (mapping[roleType]) return mapping[roleType]
  return inferRoleType(position || '', organization || '', sector)
}

function mapSeniorityLevel(level: string, position?: string): SeniorityLevel {
  const mapping: Record<string, SeniorityLevel> = {
    'individual': 'individual_contributor', 'individual_contributor': 'individual_contributor',
    'coordinador': 'coordinador', 'jefatura': 'jefatura', 'gerencia': 'gerencia', 'direccion': 'direccion',
  }
  if (mapping[level]) return mapping[level]
  return inferSeniorityLevel(position || '')
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
    year: ed.year ? parseInt(ed.year) : (ed.bachelor_year ? parseInt(ed.bachelor_year) : (ed.end_date ? parseYear(ed.end_date) : undefined)),
    isVerified: ed.is_verified ?? (ed.source === 'jne')
  }))

  const experience: Experience[] = (candidate.experience_details || []).map((exp: any) => {
    const startYear = exp.start_year ? parseInt(exp.start_year) : parseYear(exp.start_date)
    const endYear = exp.is_current ? undefined : (exp.end_year ? parseInt(exp.end_year) : parseYear(exp.end_date))
    const position = exp.position || exp.cargo || ''
    const organization = exp.organization || exp.entidad || ''
    const roleType = mapRoleType(exp.role_type, position, organization, exp.sector || exp.department)
    const seniorityLevel = mapSeniorityLevel(exp.seniority_level, position)
    const isLeadership = ['direccion', 'gerencia', 'jefatura'].includes(seniorityLevel)
    return { role: position, roleType, organization, startYear, endYear, isLeadership, seniorityLevel }
  })

  const politicalExp: Experience[] = (candidate.political_trajectory || []).map((pt: any) => {
    const startYear = pt.start_year ? parseInt(pt.start_year) : parseYear(pt.start_date)
    const rawEnd = pt.end_year ? parseInt(pt.end_year) : (pt.end_date ? parseYear(pt.end_date) : undefined)
    const endYear = (rawEnd && rawEnd > 1900) ? rawEnd : undefined
    const position = pt.position || ''
    let roleType: RoleType
    if (pt.is_elected || pt.type === 'eleccion') {
      roleType = 'electivo_alto'
    } else {
      const pos = position.toLowerCase()
      if (pos.includes('presidente') || pos.includes('secretario general') || pos.includes('fundador')) {
        roleType = 'ejecutivo_privado_alto'
      } else {
        roleType = 'partidario'
      }
    }
    return { role: position, roleType, organization: pt.party || 'Gobierno', startYear, endYear, isLeadership: true, seniorityLevel: 'direccion' as SeniorityLevel }
  })

  const allExperience = [...experience, ...politicalExp]

  const penalSentences: PenalSentence[] = (candidate.penal_sentences || []).map((s: any) => {
    const description = s.description || s.delito || ''
    const status = s.status || s.estado || ''
    const modalidad = (s.modalidad || '').toLowerCase()
    const isFirm = status === 'firme' || modalidad === 'efectiva' || modalidad === 'suspendida'
    return { type: 'penal' as const, description, isFirm, year: s.date ? parseYear(s.date) : (s.fecha_sentencia ? parseYear(s.fecha_sentencia) : undefined) }
  })

  const civilSentences: CivilSentence[] = (candidate.civil_sentences || []).map((s: any) => {
    const desc = (s.description || s.delito || s.tipo || '').toLowerCase()
    let type: CivilSentence['type'] = 'contractual'
    if (desc.includes('violencia') || desc.includes('familiar')) type = 'violence'
    else if (desc.includes('alimento')) type = 'alimentos'
    else if (desc.includes('laboral') || desc.includes('trabajo')) type = 'laboral'
    return { type, description: s.description || s.delito || '', year: s.date ? parseYear(s.date) : (s.fecha_sentencia ? parseYear(s.fecha_sentencia) : undefined) }
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
    declarationCompleteness: completeness,
    declarationConsistency: completeness,
    assetsQuality: candidate.assets_declaration ? 60 : 30,
    verificationLevel,
    coverageLevel: verificationLevel
  }
}

// ─── Main fix function ───

async function fixDefaultScores() {
  console.log('=== FIX: Recalculating ALL active candidate scores ===\n')

  // Get ALL active candidates (not just data_verified)
  const candidates = await sql`
    SELECT
      id, slug, full_name, cargo,
      education_level, education_details,
      experience_details, political_trajectory,
      penal_sentences, civil_sentences,
      party_resignations, assets_declaration,
      birth_date, data_verified, data_source
    FROM candidates
    WHERE is_active = true
    ORDER BY cargo, full_name
  `

  console.log(`Total candidates to process: ${candidates.length}\n`)

  let processed = 0
  let errors = 0
  let changed = 0
  const BATCH_SIZE = 50

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    try {
      const scoringData = transformToScoringData(candidate)
      const result = calculateAllScores(scoringData, candidate.cargo)

      const newCompetence = Math.round(result.scores.competence)
      const newIntegrity = Math.round(result.scores.integrity)
      const newTransparency = Math.round(result.scores.transparency)
      const newConfidence = Math.round(result.scores.confidence)
      const newBalanced = Math.round(result.scores.balanced * 10) / 10
      const newMerit = Math.round(result.scores.merit * 10) / 10
      const newIntegrityFirst = Math.round(result.scores.integrityFirst * 10) / 10

      // Check if scores changed significantly
      const existingScores = await sql`
        SELECT competence, integrity, transparency, confidence, score_balanced
        FROM scores WHERE candidate_id = ${candidate.id}::uuid
      `

      if (existingScores.length > 0) {
        const old = existingScores[0]
        const integrityDiff = Math.abs(Number(old.integrity) - newIntegrity)
        const balancedDiff = Math.abs(Number(old.score_balanced) - newBalanced)

        if (integrityDiff > 1 || balancedDiff > 1) {
          changed++
          if (changed <= 50) {
            console.log(`  CHANGED: ${candidate.full_name} (${candidate.cargo})`)
            console.log(`    Integrity: ${old.integrity} -> ${newIntegrity}`)
            console.log(`    Balanced: ${old.score_balanced} -> ${newBalanced}`)
          }
        }
      }

      // Update scores
      await sql`
        INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity, updated_at)
        VALUES (${candidate.id}::uuid, ${newCompetence}, ${newIntegrity}, ${newTransparency}, ${newConfidence}, ${newBalanced}, ${newMerit}, ${newIntegrityFirst}, NOW())
        ON CONFLICT (candidate_id) DO UPDATE SET
          competence = EXCLUDED.competence,
          integrity = EXCLUDED.integrity,
          transparency = EXCLUDED.transparency,
          confidence = EXCLUDED.confidence,
          score_balanced = EXCLUDED.score_balanced,
          score_merit = EXCLUDED.score_merit,
          score_integrity = EXCLUDED.score_integrity,
          updated_at = NOW()
      `

      // Update score breakdowns
      await sql`
        INSERT INTO score_breakdowns (
          candidate_id,
          education_level_points, education_depth_points,
          experience_total_points, experience_relevant_points,
          leadership_seniority_points, leadership_stability_points,
          integrity_base, penal_penalty, civil_penalties, resignation_penalty,
          completeness_points, consistency_points, assets_quality_points,
          verification_points, coverage_points,
          updated_at
        ) VALUES (
          ${candidate.id}::uuid,
          ${result.competence.education.level}, ${result.competence.education.depth},
          ${result.competence.experienceTotal}, ${result.competence.experienceRelevant},
          ${result.competence.leadership.seniority}, ${result.competence.leadership.stability},
          ${result.integrity.base}, ${result.integrity.penalPenalty},
          ${JSON.stringify(result.integrity.civilPenalties)}::jsonb,
          ${result.integrity.resignationPenalty},
          ${result.transparency.completeness}, ${result.transparency.consistency},
          ${result.transparency.assetsQuality},
          ${result.confidence.verification}, ${result.confidence.coverage},
          NOW()
        )
        ON CONFLICT (candidate_id) DO UPDATE SET
          education_level_points = EXCLUDED.education_level_points,
          education_depth_points = EXCLUDED.education_depth_points,
          experience_total_points = EXCLUDED.experience_total_points,
          experience_relevant_points = EXCLUDED.experience_relevant_points,
          leadership_seniority_points = EXCLUDED.leadership_seniority_points,
          leadership_stability_points = EXCLUDED.leadership_stability_points,
          integrity_base = EXCLUDED.integrity_base,
          penal_penalty = EXCLUDED.penal_penalty,
          civil_penalties = EXCLUDED.civil_penalties,
          resignation_penalty = EXCLUDED.resignation_penalty,
          completeness_points = EXCLUDED.completeness_points,
          consistency_points = EXCLUDED.consistency_points,
          assets_quality_points = EXCLUDED.assets_quality_points,
          verification_points = EXCLUDED.verification_points,
          coverage_points = EXCLUDED.coverage_points,
          updated_at = NOW()
      `

      processed++
      if (processed % 500 === 0) {
        console.log(`  Progress: ${processed}/${candidates.length} (${changed} changed so far)`)
      }
    } catch (error) {
      errors++
      if (errors <= 10) {
        console.error(`  ERROR: ${candidate.full_name} (${candidate.cargo}): ${error}`)
      }
    }
  }

  console.log('\n=== RESULTS ===')
  console.log(`Processed: ${processed}`)
  console.log(`Changed (integrity or balanced diff > 1): ${changed}`)
  console.log(`Errors: ${errors}`)

  // Post-fix audit
  console.log('\n=== POST-FIX AUDIT ===')

  const [{ cnt: integ100After }] = await sql`
    SELECT COUNT(*) as cnt FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true AND s.integrity = 100
  `
  console.log(`Candidates with integrity = 100 AFTER fix: ${integ100After}`)

  const integDistAfter = await sql`
    SELECT
      CASE
        WHEN s.integrity = 100 THEN '100'
        WHEN s.integrity >= 90 THEN '90-99'
        WHEN s.integrity >= 80 THEN '80-89'
        WHEN s.integrity >= 60 THEN '60-79'
        WHEN s.integrity >= 40 THEN '40-59'
        WHEN s.integrity >= 20 THEN '20-39'
        WHEN s.integrity > 0 THEN '1-19'
        ELSE '0'
      END as range,
      COUNT(*) as cnt
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
    GROUP BY range
    ORDER BY range
  `
  console.log('\nIntegrity distribution after fix:')
  integDistAfter.forEach(r => console.log(`  ${r.range}: ${r.cnt}`))

  // New top 10
  const top10 = await sql`
    SELECT c.full_name, c.cargo, s.score_balanced, s.competence, s.integrity, s.transparency
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
    ORDER BY s.score_balanced DESC
    LIMIT 10
  `
  console.log('\nNew Top 10 by score_balanced:')
  top10.forEach((t: any, i: number) => {
    console.log(`  ${i + 1}. ${t.full_name} (${t.cargo}): ${t.score_balanced} | C=${t.competence} I=${t.integrity} T=${t.transparency}`)
  })

  console.log('\nDone!')
}

fixDefaultScores().catch(console.error)
