/**
 * Apply New Penalties Script
 *
 * Applies new penalty calculations (company issues, incumbent performance)
 * on top of existing scores without recalculating everything from scratch.
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

/**
 * Fetch company legal issues for a candidate
 */
async function getCompanyIssues(candidateId: string): Promise<{
  penalCases: number
  laborIssues: number
  environmentalIssues: number
  consumerComplaints: number
  totalFines: number
}> {
  const result = await sql`
    SELECT
      cli.issue_type,
      COUNT(*) as count,
      COALESCE(SUM(cli.fine_amount), 0) as total_fines
    FROM company_legal_issues cli
    JOIN candidate_companies cc ON cli.company_id = cc.id
    WHERE cc.candidate_id = ${candidateId}::uuid
    GROUP BY cli.issue_type
  `

  let penalCases = 0
  let laborIssues = 0
  let environmentalIssues = 0
  let consumerComplaints = 0
  let totalFines = 0

  for (const row of result) {
    const count = Number(row.count) || 0
    totalFines += Number(row.total_fines) || 0

    switch (row.issue_type) {
      case 'penal':
        penalCases = count
        break
      case 'laboral':
        laborIssues = count
        break
      case 'ambiental':
        environmentalIssues = count
        break
      case 'consumidor':
        consumerComplaints = count
        break
    }
  }

  return { penalCases, laborIssues, environmentalIssues, consumerComplaints, totalFines }
}

/**
 * Fetch incumbent performance for a candidate
 */
async function getIncumbentPerformance(candidateId: string): Promise<{
  isIncumbent: boolean
  budgetExecutionPct?: number
  contraloríaReports?: number
  performanceScore?: number
}> {
  const result = await sql`
    SELECT
      budget_execution_pct,
      contraloria_reports,
      performance_score
    FROM incumbent_performance
    WHERE candidate_id = ${candidateId}::uuid
    LIMIT 1
  `

  if (result.length === 0) {
    return { isIncumbent: false }
  }

  const row = result[0]
  return {
    isIncumbent: true,
    budgetExecutionPct: row.budget_execution_pct ? Number(row.budget_execution_pct) : undefined,
    contraloríaReports: row.contraloria_reports ? Number(row.contraloria_reports) : undefined,
    performanceScore: row.performance_score ? Number(row.performance_score) : undefined,
  }
}

/**
 * Calculate company penalty (same logic as scoring/index.ts)
 */
function calculateCompanyPenalty(issues: {
  penalCases: number
  laborIssues: number
  environmentalIssues: number
  consumerComplaints: number
}): number {
  let penalty = 0

  // Penal cases in companies are serious
  if (issues.penalCases > 0) {
    penalty += issues.penalCases * 40
  }

  // Labor violations
  if (issues.laborIssues > 0) {
    penalty += issues.laborIssues * 20
  }

  // Environmental violations
  if (issues.environmentalIssues > 0) {
    penalty += issues.environmentalIssues * 25
  }

  // Consumer complaints (less severe but still relevant)
  if (issues.consumerComplaints > 5) {
    penalty += 15
  }

  return Math.min(penalty, 60) // Cap company penalties
}

/**
 * Calculate incumbent penalty from Contraloría reports
 */
function calculateIncumbentPenalty(performance: {
  isIncumbent: boolean
  budgetExecutionPct?: number
  contraloríaReports?: number
  performanceScore?: number
}): number {
  if (!performance.isIncumbent) return 0

  let penalty = 0

  // Contraloría reports are bad
  if (performance.contraloríaReports) {
    penalty += performance.contraloríaReports * 5
  }

  // Low budget execution is a concern (below 70%)
  if (performance.budgetExecutionPct && performance.budgetExecutionPct < 70) {
    penalty += Math.round((70 - performance.budgetExecutionPct) / 5) * 3
  }

  // If there's a direct performance score that's low
  if (performance.performanceScore && performance.performanceScore < 50) {
    penalty += Math.round((50 - performance.performanceScore) / 10) * 5
  }

  return Math.min(penalty, 40) // Cap incumbent penalties
}

async function applyNewPenalties() {
  console.log('🚀 Aplicando nuevas penalizaciones...\n')
  console.log('='.repeat(60))

  // First, restore original scores from migration
  console.log('📋 Restaurando scores originales...')
  await sql`
    UPDATE scores s
    SET
      competence = COALESCE((
        SELECT CASE c.slug
          WHEN 'marisol-perez-tello' THEN 82
          WHEN 'jorge-nieto-montesinos' THEN 82
          WHEN 'fiorella-molinelli-aristondo' THEN 76
          WHEN 'francisco-diez-canseco-terry' THEN 75
          WHEN 'rosario-fernandez-figueroa' THEN 72
          WHEN 'alfonso-lopez-chau-nava' THEN 80
          WHEN 'jose-williams-zapata' THEN 70
          WHEN 'rafael-lopez-aliaga-cazorla' THEN 78
          WHEN 'rafael-belaunde-aubry' THEN 65
          WHEN 'roberto-chiabra-leon' THEN 68
          WHEN 'george-patrick-forsyth-sommer' THEN 75
          WHEN 'keiko-sofia-fujimori-higuchi' THEN 70
          WHEN 'cesar-acuna-peralta' THEN 68
          WHEN 'jose-luna-galvez' THEN 60
          WHEN 'vladimir-roy-cerron-rojas' THEN 45
          ELSE 55
        END
        FROM candidates c WHERE c.id = s.candidate_id
      ), 55),
      integrity = COALESCE((
        SELECT CASE c.slug
          WHEN 'marisol-perez-tello' THEN 92
          WHEN 'jorge-nieto-montesinos' THEN 85
          WHEN 'fiorella-molinelli-aristondo' THEN 78
          WHEN 'francisco-diez-canseco-terry' THEN 80
          WHEN 'rosario-fernandez-figueroa' THEN 82
          WHEN 'alfonso-lopez-chau-nava' THEN 78
          WHEN 'jose-williams-zapata' THEN 80
          WHEN 'rafael-lopez-aliaga-cazorla' THEN 72
          WHEN 'rafael-belaunde-aubry' THEN 78
          WHEN 'roberto-chiabra-leon' THEN 75
          WHEN 'george-patrick-forsyth-sommer' THEN 78
          WHEN 'keiko-sofia-fujimori-higuchi' THEN 35
          WHEN 'cesar-acuna-peralta' THEN 55
          WHEN 'jose-luna-galvez' THEN 30
          WHEN 'vladimir-roy-cerron-rojas' THEN 10
          ELSE 70
        END
        FROM candidates c WHERE c.id = s.candidate_id
      ), 70)
  `

  // Get all candidates with scores
  const candidates = await sql`
    SELECT
      c.id, c.slug, c.full_name, c.cargo,
      s.competence, s.integrity, s.transparency, s.confidence,
      s.score_balanced
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    ORDER BY c.cargo, c.full_name
  `

  console.log(`📋 Candidatos a procesar: ${candidates.length}\n`)

  let processed = 0
  const significantChanges: Array<{
    name: string
    cargo: string
    oldIntegrity: number
    newIntegrity: number
    companyPenalty: number
    incumbentPenalty: number
  }> = []

  for (const candidate of candidates) {
    const oldIntegrity = Number(candidate.integrity) || 100
    const competence = Number(candidate.competence) || 50
    const transparency = Number(candidate.transparency) || 50
    const confidence = Number(candidate.confidence) || 50

    // Fetch new data
    const companyIssues = await getCompanyIssues(candidate.id)
    const incumbentPerf = await getIncumbentPerformance(candidate.id)

    // Calculate penalties
    const companyPenalty = calculateCompanyPenalty(companyIssues)
    const incumbentPenalty = calculateIncumbentPenalty(incumbentPerf)
    const totalNewPenalty = companyPenalty + incumbentPenalty

    // Apply penalties
    const newIntegrity = Math.max(0, oldIntegrity - totalNewPenalty)

    // Recalculate balanced score
    const newBalanced = 0.45 * competence + 0.45 * newIntegrity + 0.10 * transparency
    const newMerit = 0.60 * competence + 0.30 * newIntegrity + 0.10 * transparency
    const newIntegrityFirst = 0.30 * competence + 0.60 * newIntegrity + 0.10 * transparency

    console.log(`\n📊 ${candidate.full_name} (${candidate.cargo})`)
    console.log(`   Competencia: ${competence}`)
    console.log(`   Integridad: ${oldIntegrity} → ${newIntegrity}`)
    if (companyPenalty > 0) {
      console.log(`     ⚠️ Penalidad empresarial: -${companyPenalty}`)
      console.log(`        (Penal: ${companyIssues.penalCases}, Laboral: ${companyIssues.laborIssues}, Ambiental: ${companyIssues.environmentalIssues}, Consumidor: ${companyIssues.consumerComplaints})`)
    }
    if (incumbentPerf.isIncumbent) {
      console.log(`     📊 Es incumbente:`)
      console.log(`        Ejecución presupuestal: ${incumbentPerf.budgetExecutionPct || 'N/A'}%`)
      console.log(`        Informes Contraloría: ${incumbentPerf.contraloríaReports || 0}`)
      if (incumbentPenalty > 0) {
        console.log(`     ⚠️ Penalidad por gestión: -${incumbentPenalty}`)
      }
    }
    console.log(`   Score Balanceado: ${Number(candidate.score_balanced).toFixed(1)} → ${newBalanced.toFixed(1)}`)

    // Update scores
    await sql`
      UPDATE scores SET
        integrity = ${newIntegrity},
        score_balanced = ${Math.round(newBalanced * 10) / 10},
        score_merit = ${Math.round(newMerit * 10) / 10},
        score_integrity = ${Math.round(newIntegrityFirst * 10) / 10},
        updated_at = NOW()
      WHERE candidate_id = ${candidate.id}::uuid
    `

    // Update breakdown
    await sql`
      UPDATE score_breakdowns SET
        company_penalty = ${companyPenalty},
        voting_penalty = 0,
        voting_bonus = 0,
        tax_penalty = 0,
        omission_penalty = 0
      WHERE candidate_id = ${candidate.id}::uuid
    `

    // Track significant changes
    if (totalNewPenalty > 0) {
      significantChanges.push({
        name: candidate.full_name,
        cargo: candidate.cargo,
        oldIntegrity,
        newIntegrity,
        companyPenalty,
        incumbentPenalty,
      })
    }

    processed++
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Resumen:')
  console.log(`  ✅ Procesados: ${processed}`)

  if (significantChanges.length > 0) {
    console.log('\n📉 Candidatos con penalizaciones aplicadas:')
    for (const c of significantChanges) {
      const delta = c.newIntegrity - c.oldIntegrity
      console.log(`  ${c.name} (${c.cargo})`)
      console.log(`    Integridad: ${c.oldIntegrity} → ${c.newIntegrity} (${delta})`)
      if (c.companyPenalty > 0) console.log(`      Empresarial: -${c.companyPenalty}`)
      if (c.incumbentPenalty > 0) console.log(`      Gestión: -${c.incumbentPenalty}`)
    }
  }

  // Show new ranking
  const topCandidates = await sql`
    SELECT c.full_name, c.cargo, s.score_balanced, s.competence, s.integrity
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.cargo = 'presidente'
    ORDER BY s.score_balanced DESC
    LIMIT 10
  `

  console.log('\n📈 Top 10 candidatos presidenciales por score balanceado:')
  topCandidates.forEach((c: any, i: number) => {
    console.log(`  ${i + 1}. ${c.full_name}: ${c.score_balanced}`)
    console.log(`     Competencia: ${c.competence} | Integridad: ${c.integrity}`)
  })

  console.log('\n✅ Penalizaciones aplicadas!')
}

applyNewPenalties()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
