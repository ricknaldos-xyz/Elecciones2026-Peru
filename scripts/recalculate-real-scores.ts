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

// Map database education level to scoring system
function mapEducationLevel(level: string): EducationLevel {
  const mapping: Record<string, EducationLevel> = {
    'sin_informacion': 'sin_informacion',
    'primaria_completa': 'primaria',
    'secundaria_incompleta': 'secundaria_incompleta',
    'secundaria_completa': 'secundaria_completa',
    'tecnico_incompleto': 'tecnico_incompleto',
    'tecnico_completo': 'tecnico_completo',
    'universitario_incompleto': 'universitario_incompleto',
    'universitario_completo': 'universitario_completo',
    'titulo_profesional': 'titulo_profesional',
    'maestria': 'maestria',
    'doctorado': 'doctorado',
  }
  return mapping[level] || 'sin_informacion'
}

// Map database role type to scoring system
function mapRoleType(roleType: string): RoleType {
  const mapping: Record<string, RoleType> = {
    'electivo_alto': 'electivo_alto',
    'electivo_medio': 'electivo_medio',
    'ejecutivo_publico_alto': 'ejecutivo_publico_alto',
    'ejecutivo_publico_medio': 'ejecutivo_publico_medio',
    'ejecutivo_privado_alto': 'ejecutivo_privado_alto',
    'ejecutivo_privado_medio': 'ejecutivo_privado_medio',
    'tecnico_profesional': 'tecnico_profesional',
    'academia': 'academia',
    'internacional': 'internacional',
    'partidario': 'partidario',
  }
  return mapping[roleType] || 'tecnico_profesional'
}

// Map seniority level
function mapSeniorityLevel(level: string): SeniorityLevel {
  const mapping: Record<string, SeniorityLevel> = {
    'individual': 'individual_contributor',
    'coordinador': 'coordinador',
    'jefatura': 'jefatura',
    'gerencia': 'gerencia',
    'direccion': 'direccion',
  }
  return mapping[level] || 'individual_contributor'
}

// Parse year from date string
function parseYear(dateStr?: string): number {
  if (!dateStr) return new Date().getFullYear()
  const year = parseInt(dateStr.substring(0, 4))
  return isNaN(year) ? new Date().getFullYear() : year
}

// Transform database data to CandidateData for scoring
function transformToScoringData(candidate: any): CandidateData {
  // Education
  const education: EducationDetail[] = (candidate.education_details || []).map((ed: any) => ({
    level: mapEducationLevel(ed.level),
    field: ed.field_of_study,
    institution: ed.institution,
    year: ed.end_date ? parseYear(ed.end_date) : undefined,
    isVerified: ed.is_verified
  }))

  // Experience
  const experience: Experience[] = (candidate.experience_details || []).map((exp: any) => {
    const startYear = parseYear(exp.start_date)
    const endYear = exp.is_current ? undefined : parseYear(exp.end_date)

    // Determine if leadership role
    const isLeadership = ['direccion', 'gerencia', 'jefatura'].includes(exp.seniority_level)

    return {
      role: exp.position,
      roleType: mapRoleType(exp.role_type),
      organization: exp.organization,
      startYear,
      endYear,
      isLeadership,
      seniorityLevel: mapSeniorityLevel(exp.seniority_level)
    }
  })

  // Add political trajectory as experience
  const politicalExp: Experience[] = (candidate.political_trajectory || []).map((pt: any) => {
    const startYear = parseYear(pt.start_date)
    const endYear = pt.end_date ? parseYear(pt.end_date) : undefined

    // Elected positions are high relevance
    const roleType: RoleType = pt.is_elected ? 'electivo_alto' : 'partidario'

    return {
      role: pt.position,
      roleType,
      organization: pt.party || 'Gobierno',
      startYear,
      endYear,
      isLeadership: pt.is_elected,
      seniorityLevel: 'direccion' as SeniorityLevel
    }
  })

  const allExperience = [...experience, ...politicalExp]

  // Penal sentences
  const penalSentences: PenalSentence[] = (candidate.penal_sentences || []).map((s: any) => ({
    type: 'penal' as const,
    description: s.description,
    isFirm: s.status === 'firme',
    year: s.date ? parseYear(s.date) : undefined
  }))

  // Civil sentences
  const civilSentences: CivilSentence[] = (candidate.civil_sentences || []).map((s: any) => {
    let type: CivilSentence['type'] = 'contractual'
    if (s.type?.includes('violencia')) type = 'violence'
    else if (s.type?.includes('alimento')) type = 'alimentos'
    else if (s.type?.includes('laboral')) type = 'laboral'

    return {
      type,
      description: s.description,
      year: s.date ? parseYear(s.date) : undefined
    }
  })

  // Calculate completeness based on available data
  let completeness = 30 // Base
  if (education.length > 0) completeness += 20
  if (allExperience.length > 0) completeness += 20
  if (candidate.birth_date) completeness += 10
  if (candidate.assets_declaration) completeness += 20

  // Verification level based on data source
  let verificationLevel = 50 // Base
  if (candidate.data_verified) verificationLevel += 30
  if (candidate.data_source?.includes('verified')) verificationLevel += 20

  return {
    education,
    experience: allExperience,
    penalSentences,
    civilSentences,
    partyResignations: candidate.party_resignations || 0,
    declarationCompleteness: completeness,
    declarationConsistency: completeness, // Same as completeness for now
    assetsQuality: candidate.assets_declaration ? 60 : 30,
    verificationLevel,
    coverageLevel: verificationLevel
  }
}

async function recalculateScores() {
  console.log('🚀 Recalculando scores basados en datos reales...\n')
  console.log('='.repeat(60))

  // Get all candidates with verified data
  const candidates = await sql`
    SELECT
      id, slug, full_name, cargo,
      education_level, education_details,
      experience_details, political_trajectory,
      penal_sentences, civil_sentences,
      party_resignations, assets_declaration,
      birth_date, data_verified, data_source
    FROM candidates
    WHERE data_verified = TRUE
    ORDER BY cargo, full_name
  `

  console.log(`📋 Candidatos verificados a procesar: ${candidates.length}\n`)

  let processed = 0
  let errors = 0

  for (const candidate of candidates) {
    try {
      console.log(`\n📊 Procesando: ${candidate.full_name} (${candidate.cargo})`)

      // Transform to scoring data
      const scoringData = transformToScoringData(candidate)

      // Calculate scores
      const result = calculateAllScores(scoringData, candidate.cargo)

      console.log(`   Competencia: ${result.scores.competence.toFixed(1)}`)
      console.log(`     - Educación: ${result.competence.education.total}`)
      console.log(`     - Experiencia: ${result.competence.experienceTotal + result.competence.experienceRelevant}`)
      console.log(`     - Liderazgo: ${result.competence.leadership.total}`)
      console.log(`   Integridad: ${result.scores.integrity.toFixed(1)}`)
      if (result.integrity.penalPenalty > 0) {
        console.log(`     ⚠️ Penalidad penal: -${result.integrity.penalPenalty}`)
      }
      if (result.integrity.civilPenalties.length > 0) {
        console.log(`     ⚠️ Penalidades civiles: ${result.integrity.civilPenalties.map(p => `-${p.penalty}`).join(', ')}`)
      }
      console.log(`   Transparencia: ${result.scores.transparency.toFixed(1)}`)
      console.log(`   Confianza: ${result.scores.confidence.toFixed(1)}`)
      console.log(`   Score Balanceado: ${result.scores.balanced.toFixed(1)}`)

      // Check if score record exists
      const existingScore = await sql`
        SELECT id FROM scores WHERE candidate_id = ${candidate.id}::uuid
      `

      if (existingScore.length > 0) {
        // Update existing score
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
        // Insert new score
        await sql`
          INSERT INTO scores (
            candidate_id, competence, integrity, transparency, confidence,
            score_balanced, score_merit, score_integrity
          ) VALUES (
            ${candidate.id}::uuid,
            ${Math.round(result.scores.competence)},
            ${Math.round(result.scores.integrity)},
            ${Math.round(result.scores.transparency)},
            ${Math.round(result.scores.confidence)},
            ${Math.round(result.scores.balanced * 10) / 10},
            ${Math.round(result.scores.merit * 10) / 10},
            ${Math.round(result.scores.integrityFirst * 10) / 10}
          )
        `
      }

      // Update score breakdown
      const existingBreakdown = await sql`
        SELECT id FROM score_breakdowns WHERE candidate_id = ${candidate.id}::uuid
      `

      const breakdownData = {
        education_points: result.competence.education.total,
        education_level_points: result.competence.education.level,
        education_depth_points: result.competence.education.depth,
        experience_total_points: result.competence.experienceTotal,
        experience_relevant_points: result.competence.experienceRelevant,
        leadership_points: result.competence.leadership.total,
        leadership_seniority: result.competence.leadership.seniority,
        leadership_stability: result.competence.leadership.stability,
        integrity_base: result.integrity.base,
        penal_penalty: result.integrity.penalPenalty,
        civil_penalties: result.integrity.civilPenalties,
        resignation_penalty: result.integrity.resignationPenalty,
        completeness_points: result.transparency.completeness,
        consistency_points: result.transparency.consistency,
        assets_quality_points: result.transparency.assetsQuality,
        verification_points: result.confidence.verification,
        coverage_points: result.confidence.coverage
      }

      if (existingBreakdown.length > 0) {
        await sql`
          UPDATE score_breakdowns SET
            education_points = ${breakdownData.education_points},
            education_level_points = ${breakdownData.education_level_points},
            education_depth_points = ${breakdownData.education_depth_points},
            experience_total_points = ${breakdownData.experience_total_points},
            experience_relevant_points = ${breakdownData.experience_relevant_points},
            leadership_points = ${breakdownData.leadership_points},
            leadership_seniority = ${breakdownData.leadership_seniority},
            leadership_stability = ${breakdownData.leadership_stability},
            integrity_base = ${breakdownData.integrity_base},
            penal_penalty = ${breakdownData.penal_penalty},
            civil_penalties = ${JSON.stringify(breakdownData.civil_penalties)}::jsonb,
            resignation_penalty = ${breakdownData.resignation_penalty},
            completeness_points = ${breakdownData.completeness_points},
            consistency_points = ${breakdownData.consistency_points},
            assets_quality_points = ${breakdownData.assets_quality_points},
            verification_points = ${breakdownData.verification_points},
            coverage_points = ${breakdownData.coverage_points}
          WHERE candidate_id = ${candidate.id}::uuid
        `
      } else {
        await sql`
          INSERT INTO score_breakdowns (
            candidate_id,
            education_points, education_level_points, education_depth_points,
            experience_total_points, experience_relevant_points,
            leadership_points, leadership_seniority, leadership_stability,
            integrity_base, penal_penalty, civil_penalties, resignation_penalty,
            completeness_points, consistency_points, assets_quality_points,
            verification_points, coverage_points
          ) VALUES (
            ${candidate.id}::uuid,
            ${breakdownData.education_points},
            ${breakdownData.education_level_points},
            ${breakdownData.education_depth_points},
            ${breakdownData.experience_total_points},
            ${breakdownData.experience_relevant_points},
            ${breakdownData.leadership_points},
            ${breakdownData.leadership_seniority},
            ${breakdownData.leadership_stability},
            ${breakdownData.integrity_base},
            ${breakdownData.penal_penalty},
            ${JSON.stringify(breakdownData.civil_penalties)}::jsonb,
            ${breakdownData.resignation_penalty},
            ${breakdownData.completeness_points},
            ${breakdownData.consistency_points},
            ${breakdownData.assets_quality_points},
            ${breakdownData.verification_points},
            ${breakdownData.coverage_points}
          )
        `
      }

      console.log(`   ✅ Score actualizado`)
      processed++

    } catch (error) {
      console.error(`   ❌ Error: ${error}`)
      errors++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Resumen del recálculo:')
  console.log(`  ✅ Procesados: ${processed}`)
  console.log(`  ❌ Errores: ${errors}`)

  // Show top 10 by balanced score
  const topCandidates = await sql`
    SELECT c.full_name, c.cargo, s.score_balanced, s.competence, s.integrity
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.data_verified = TRUE
    ORDER BY s.score_balanced DESC
    LIMIT 10
  `

  console.log('\n📈 Top 10 candidatos por score balanceado:')
  topCandidates.forEach((c: any, i: number) => {
    console.log(`  ${i + 1}. ${c.full_name} (${c.cargo}): ${c.score_balanced}`)
    console.log(`     Competencia: ${c.competence} | Integridad: ${c.integrity}`)
  })

  console.log('\n✅ Recálculo completado!')
}

recalculateScores()
