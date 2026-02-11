import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''
const sql = neon(DATABASE_URL)

async function checkFinalState() {
  console.log('📊 ESTADO FINAL DE LA BASE DE DATOS\n')
  console.log('='.repeat(70))

  // Total candidates
  const totals = await sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN data_verified = TRUE THEN 1 ELSE 0 END) as verified,
      SUM(CASE WHEN education_details::text != '[]' THEN 1 ELSE 0 END) as with_education,
      SUM(CASE WHEN experience_details::text != '[]' THEN 1 ELSE 0 END) as with_experience,
      SUM(CASE WHEN penal_sentences::text != '[]' THEN 1 ELSE 0 END) as with_penal,
      SUM(CASE WHEN civil_sentences::text != '[]' THEN 1 ELSE 0 END) as with_civil
    FROM candidates
  `

  console.log('\n📋 CANDIDATOS:')
  console.log(`  Total: ${totals[0].total}`)
  console.log(`  Verificados: ${totals[0].verified}`)
  console.log(`  Con educación: ${totals[0].with_education}`)
  console.log(`  Con experiencia: ${totals[0].with_experience}`)
  console.log(`  Con sentencias penales: ${totals[0].with_penal}`)
  console.log(`  Con sentencias civiles: ${totals[0].with_civil}`)

  // Candidates by source
  const bySource = await sql`
    SELECT data_source, COUNT(*) as count
    FROM candidates
    GROUP BY data_source
    ORDER BY count DESC
  `

  console.log('\n📁 POR FUENTE DE DATOS:')
  bySource.forEach((s: any) => {
    console.log(`  ${s.data_source || 'unknown'}: ${s.count}`)
  })

  // Flags
  const flags = await sql`
    SELECT type, severity, COUNT(*) as count
    FROM flags
    GROUP BY type, severity
    ORDER BY severity, type
  `

  console.log('\n🚩 FLAGS:')
  flags.forEach((f: any) => {
    console.log(`  ${f.severity} - ${f.type}: ${f.count}`)
  })

  // Top 10 candidates with real scores
  console.log('\n📈 TOP 10 CANDIDATOS CON SCORES REALES:')
  console.log('-'.repeat(70))

  const top10 = await sql`
    SELECT
      c.full_name,
      c.cargo,
      c.education_level,
      s.score_balanced,
      s.competence,
      s.integrity,
      s.transparency,
      CASE WHEN c.education_details::text != '[]' THEN 'SI' ELSE 'NO' END as datos_reales
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.cargo = 'presidente'
    ORDER BY s.score_balanced DESC
    LIMIT 10
  `

  top10.forEach((c: any, i: number) => {
    const flags = c.integrity < 100 ? '⚠️' : '✓'
    console.log(`  ${(i + 1).toString().padStart(2)}. ${c.full_name.padEnd(35)} | Score: ${c.score_balanced.toString().padStart(5)} | Datos: ${c.datos_reales} ${flags}`)
    console.log(`      Competencia: ${c.competence} | Integridad: ${c.integrity} | Transparencia: ${c.transparency}`)
  })

  // Candidates needing more data
  console.log('\n⚠️ CANDIDATOS QUE NECESITAN MÁS DATOS:')
  const needData = await sql`
    SELECT full_name, cargo
    FROM candidates
    WHERE education_details::text = '[]'
    AND data_verified = TRUE
    LIMIT 10
  `

  needData.forEach((c: any) => {
    console.log(`  - ${c.full_name} (${c.cargo})`)
  })

  console.log('\n' + '='.repeat(70))
  console.log('✅ VERIFICACIÓN COMPLETADA')
}

checkFinalState()
