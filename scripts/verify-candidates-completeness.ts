/**
 * Verifica la completitud de datos de candidatos en la base de datos
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

interface CompletenessStats {
  total: number
  withPhoto: number
  withDni: number
  withBirthDate: number
  withEducation: number
  withExperience: number
  withPoliticalTrajectory: number
  withPenalSentences: number
  withCivilSentences: number
  withAssets: number
  withPlanGobierno: number
  withDjhvUrl: number
  fullyComplete: number
}

async function checkCompleteness(): Promise<void> {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' VERIFICACIÓN DE COMPLETITUD DE CANDIDATOS '.padStart(52).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  // Obtener estadísticas por cargo
  const cargos = ['presidente', 'vicepresidente', 'senador', 'diputado', 'parlamento_andino']

  const allStats: Record<string, CompletenessStats> = {}

  for (const cargo of cargos) {
    const stats = await getStatsForCargo(cargo)
    if (stats.total > 0) {
      allStats[cargo] = stats
    }
  }

  // Mostrar resultados
  for (const [cargo, stats] of Object.entries(allStats)) {
    printCargoStats(cargo, stats)
  }

  // Resumen total
  const totalStats = Object.values(allStats).reduce(
    (acc, stats) => ({
      total: acc.total + stats.total,
      withPhoto: acc.withPhoto + stats.withPhoto,
      withDni: acc.withDni + stats.withDni,
      withBirthDate: acc.withBirthDate + stats.withBirthDate,
      withEducation: acc.withEducation + stats.withEducation,
      withExperience: acc.withExperience + stats.withExperience,
      withPoliticalTrajectory: acc.withPoliticalTrajectory + stats.withPoliticalTrajectory,
      withPenalSentences: acc.withPenalSentences + stats.withPenalSentences,
      withCivilSentences: acc.withCivilSentences + stats.withCivilSentences,
      withAssets: acc.withAssets + stats.withAssets,
      withPlanGobierno: acc.withPlanGobierno + stats.withPlanGobierno,
      withDjhvUrl: acc.withDjhvUrl + stats.withDjhvUrl,
      fullyComplete: acc.fullyComplete + stats.fullyComplete,
    }),
    {
      total: 0, withPhoto: 0, withDni: 0, withBirthDate: 0,
      withEducation: 0, withExperience: 0, withPoliticalTrajectory: 0,
      withPenalSentences: 0, withCivilSentences: 0, withAssets: 0,
      withPlanGobierno: 0, withDjhvUrl: 0, fullyComplete: 0
    }
  )

  if (totalStats.total > 0) {
    console.log('\n' + '═'.repeat(70))
    console.log('RESUMEN TOTAL')
    console.log('═'.repeat(70))
    printCargoStats('TODOS', totalStats)
  }

  // Candidatos incompletos
  await showIncompleteCandidates()
}

async function getStatsForCargo(cargo: string): Promise<CompletenessStats> {
  const [result] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN photo_url IS NOT NULL AND photo_url != '' THEN 1 END) as with_photo,
      COUNT(CASE WHEN dni IS NOT NULL AND dni != '' THEN 1 END) as with_dni,
      COUNT(CASE WHEN birth_date IS NOT NULL THEN 1 END) as with_birth_date,
      COUNT(CASE WHEN education_details IS NOT NULL AND jsonb_array_length(education_details) > 0 THEN 1 END) as with_education,
      COUNT(CASE WHEN experience_details IS NOT NULL AND jsonb_array_length(experience_details) > 0 THEN 1 END) as with_experience,
      COUNT(CASE WHEN political_trajectory IS NOT NULL AND jsonb_array_length(political_trajectory) > 0 THEN 1 END) as with_political,
      COUNT(CASE WHEN penal_sentences IS NOT NULL AND jsonb_array_length(penal_sentences) > 0 THEN 1 END) as with_penal,
      COUNT(CASE WHEN civil_sentences IS NOT NULL AND jsonb_array_length(civil_sentences) > 0 THEN 1 END) as with_civil,
      COUNT(CASE WHEN assets_declaration IS NOT NULL AND assets_declaration != '{}'::jsonb THEN 1 END) as with_assets,
      COUNT(CASE WHEN plan_gobierno_url IS NOT NULL AND plan_gobierno_url != '' THEN 1 END) as with_plan,
      COUNT(CASE WHEN djhv_url IS NOT NULL AND djhv_url != '' THEN 1 END) as with_djhv
    FROM candidates
    WHERE cargo = ${cargo}
  `

  // Contar completamente completos
  const [complete] = await sql`
    SELECT COUNT(*) as count
    FROM candidates
    WHERE cargo = ${cargo}
      AND photo_url IS NOT NULL AND photo_url != ''
      AND dni IS NOT NULL AND dni != ''
      AND education_details IS NOT NULL AND jsonb_array_length(education_details) > 0
      AND experience_details IS NOT NULL AND jsonb_array_length(experience_details) > 0
  `

  return {
    total: Number(result.total),
    withPhoto: Number(result.with_photo),
    withDni: Number(result.with_dni),
    withBirthDate: Number(result.with_birth_date),
    withEducation: Number(result.with_education),
    withExperience: Number(result.with_experience),
    withPoliticalTrajectory: Number(result.with_political),
    withPenalSentences: Number(result.with_penal),
    withCivilSentences: Number(result.with_civil),
    withAssets: Number(result.with_assets),
    withPlanGobierno: Number(result.with_plan),
    withDjhvUrl: Number(result.with_djhv),
    fullyComplete: Number(complete.count)
  }
}

function printCargoStats(cargo: string, stats: CompletenessStats): void {
  const pct = (n: number) => stats.total > 0 ? `${((n / stats.total) * 100).toFixed(1)}%` : '0%'
  const bar = (n: number) => {
    const filled = Math.round((n / stats.total) * 20)
    return '█'.repeat(filled) + '░'.repeat(20 - filled)
  }

  console.log(`\n📊 ${cargo.toUpperCase()} (${stats.total} candidatos)`)
  console.log('─'.repeat(60))
  console.log(`  Foto              ${bar(stats.withPhoto)} ${pct(stats.withPhoto).padStart(6)} (${stats.withPhoto})`)
  console.log(`  DNI               ${bar(stats.withDni)} ${pct(stats.withDni).padStart(6)} (${stats.withDni})`)
  console.log(`  Fecha nacimiento  ${bar(stats.withBirthDate)} ${pct(stats.withBirthDate).padStart(6)} (${stats.withBirthDate})`)
  console.log(`  Educación         ${bar(stats.withEducation)} ${pct(stats.withEducation).padStart(6)} (${stats.withEducation})`)
  console.log(`  Experiencia       ${bar(stats.withExperience)} ${pct(stats.withExperience).padStart(6)} (${stats.withExperience})`)
  console.log(`  Trayect. política ${bar(stats.withPoliticalTrajectory)} ${pct(stats.withPoliticalTrajectory).padStart(6)} (${stats.withPoliticalTrajectory})`)
  console.log(`  Sent. penales     ${bar(stats.withPenalSentences)} ${pct(stats.withPenalSentences).padStart(6)} (${stats.withPenalSentences})`)
  console.log(`  Sent. civiles     ${bar(stats.withCivilSentences)} ${pct(stats.withCivilSentences).padStart(6)} (${stats.withCivilSentences})`)
  console.log(`  Patrimonio        ${bar(stats.withAssets)} ${pct(stats.withAssets).padStart(6)} (${stats.withAssets})`)
  console.log(`  Plan de gobierno  ${bar(stats.withPlanGobierno)} ${pct(stats.withPlanGobierno).padStart(6)} (${stats.withPlanGobierno})`)
  console.log(`  URL Hoja de Vida  ${bar(stats.withDjhvUrl)} ${pct(stats.withDjhvUrl).padStart(6)} (${stats.withDjhvUrl})`)
  console.log('─'.repeat(60))
  console.log(`  Completamente completos: ${stats.fullyComplete} (${pct(stats.fullyComplete)})`)
}

async function showIncompleteCandidates(): Promise<void> {
  console.log('\n' + '═'.repeat(70))
  console.log('CANDIDATOS CON DATOS INCOMPLETOS')
  console.log('═'.repeat(70))

  const incomplete = await sql`
    SELECT full_name, cargo, party_id,
           (photo_url IS NULL OR photo_url = '') as missing_photo,
           (dni IS NULL OR dni = '') as missing_dni,
           (education_details IS NULL OR jsonb_array_length(education_details) = 0) as missing_education,
           (experience_details IS NULL OR jsonb_array_length(experience_details) = 0) as missing_experience
    FROM candidates
    WHERE cargo = 'presidente'
      AND (
        (photo_url IS NULL OR photo_url = '')
        OR (dni IS NULL OR dni = '')
        OR (education_details IS NULL OR jsonb_array_length(education_details) = 0)
        OR (experience_details IS NULL OR jsonb_array_length(experience_details) = 0)
      )
    ORDER BY full_name
    LIMIT 20
  `

  if (incomplete.length === 0) {
    console.log('\n✓ Todos los candidatos presidenciales tienen datos básicos completos')
    return
  }

  console.log(`\n⚠ ${incomplete.length} candidatos presidenciales con datos faltantes:\n`)

  for (const c of incomplete) {
    const missing: string[] = []
    if (c.missing_photo) missing.push('foto')
    if (c.missing_dni) missing.push('DNI')
    if (c.missing_education) missing.push('educación')
    if (c.missing_experience) missing.push('experiencia')

    console.log(`  - ${c.full_name}`)
    console.log(`    Falta: ${missing.join(', ')}`)
  }
}

// Ejecutar
checkCompleteness().catch(console.error)
