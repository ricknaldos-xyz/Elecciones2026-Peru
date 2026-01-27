/**
 * Comprehensive verification of candidate data completeness
 * Checks all cargo types and all data fields
 */

import {
  createDb,
} from './lib/scraper-utils'

const sql = createDb()

function pct(n: number, total: number): string {
  if (total === 0) return '0.0%'
  return `${((n / total) * 100).toFixed(1)}%`
}

function bar(n: number, total: number, width: number = 30): string {
  if (total === 0) return ' '.repeat(width)
  const filled = Math.round((n / total) * width)
  return '#'.repeat(filled) + '-'.repeat(width - filled)
}

async function main() {
  console.log('='.repeat(70))
  console.log(' VERIFICACION COMPLETA DE DATOS DE CANDIDATOS')
  console.log('='.repeat(70))

  // Overall stats
  const [overall] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN dni IS NOT NULL AND dni <> '' THEN 1 END) as with_dni,
      COUNT(CASE WHEN jne_org_id IS NOT NULL THEN 1 END) as with_org_id,
      COUNT(CASE WHEN photo_url IS NOT NULL AND photo_url <> '' THEN 1 END) as with_photo,
      COUNT(CASE WHEN birth_date IS NOT NULL THEN 1 END) as with_birth,
      COUNT(CASE WHEN education_details IS NOT NULL AND jsonb_array_length(education_details) > 0 THEN 1 END) as with_edu,
      COUNT(CASE WHEN experience_details IS NOT NULL AND jsonb_array_length(experience_details) > 0 THEN 1 END) as with_exp,
      COUNT(CASE WHEN political_trajectory IS NOT NULL AND jsonb_array_length(political_trajectory) > 0 THEN 1 END) as with_pol,
      COUNT(CASE WHEN penal_sentences IS NOT NULL AND jsonb_array_length(penal_sentences) > 0 THEN 1 END) as with_penal,
      COUNT(CASE WHEN civil_sentences IS NOT NULL AND jsonb_array_length(civil_sentences) > 0 THEN 1 END) as with_civil,
      COUNT(CASE WHEN assets_declaration IS NOT NULL AND assets_declaration <> '{}'::jsonb AND assets_declaration <> '{"source":"jne"}'::jsonb THEN 1 END) as with_assets,
      COUNT(CASE WHEN djhv_url IS NOT NULL AND djhv_url <> '' THEN 1 END) as with_djhv,
      COUNT(CASE WHEN plan_gobierno_url IS NOT NULL AND plan_gobierno_url <> '' THEN 1 END) as with_plan,
      COUNT(CASE WHEN data_verified = true THEN 1 END) as verified
    FROM candidates
    WHERE is_active = true
  `

  const total = Number(overall.total)
  console.log(`\nTotal candidatos activos: ${total}`)
  console.log('')

  const fields = [
    ['DNI', Number(overall.with_dni)],
    ['Org ID JNE', Number(overall.with_org_id)],
    ['Foto', Number(overall.with_photo)],
    ['Fecha nacimiento', Number(overall.with_birth)],
    ['Educacion', Number(overall.with_edu)],
    ['Experiencia', Number(overall.with_exp)],
    ['Trayectoria politica', Number(overall.with_pol)],
    ['Sentencias penales', Number(overall.with_penal)],
    ['Sentencias civiles', Number(overall.with_civil)],
    ['Patrimonio', Number(overall.with_assets)],
    ['URL Hoja de Vida', Number(overall.with_djhv)],
    ['Plan de Gobierno', Number(overall.with_plan)],
    ['Verificado', Number(overall.verified)],
  ] as [string, number][]

  for (const [name, count] of fields) {
    console.log(`  ${name.padEnd(22)} [${bar(count, total)}] ${String(count).padStart(5)}/${total} ${pct(count, total)}`)
  }

  // Per-cargo breakdown
  console.log('\n' + '-'.repeat(70))
  console.log(' POR CARGO')
  console.log('-'.repeat(70))

  const cargos = ['presidente', 'vicepresidente', 'senador', 'diputado', 'parlamento_andino']

  for (const cargo of cargos) {
    const [stats] = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN dni IS NOT NULL AND dni <> '' THEN 1 END) as with_dni,
        COUNT(CASE WHEN jne_org_id IS NOT NULL THEN 1 END) as with_org,
        COUNT(CASE WHEN education_details IS NOT NULL AND jsonb_array_length(education_details) > 0 THEN 1 END) as with_edu,
        COUNT(CASE WHEN experience_details IS NOT NULL AND jsonb_array_length(experience_details) > 0 THEN 1 END) as with_exp,
        COUNT(CASE WHEN assets_declaration IS NOT NULL AND assets_declaration <> '{}'::jsonb THEN 1 END) as with_assets,
        COUNT(CASE WHEN djhv_url IS NOT NULL AND djhv_url <> '' THEN 1 END) as with_djhv
      FROM candidates
      WHERE cargo = ${cargo} AND is_active = true
    `

    const t = Number(stats.total)
    if (t === 0) {
      console.log(`\n  ${cargo.toUpperCase()}: 0 candidatos`)
      continue
    }

    console.log(`\n  ${cargo.toUpperCase()}: ${t} candidatos`)
    console.log(`    DNI:         ${pct(Number(stats.with_dni), t).padStart(6)} (${stats.with_dni}/${t})`)
    console.log(`    Org ID:      ${pct(Number(stats.with_org), t).padStart(6)} (${stats.with_org}/${t})`)
    console.log(`    Educacion:   ${pct(Number(stats.with_edu), t).padStart(6)} (${stats.with_edu}/${t})`)
    console.log(`    Experiencia: ${pct(Number(stats.with_exp), t).padStart(6)} (${stats.with_exp}/${t})`)
    console.log(`    Patrimonio:  ${pct(Number(stats.with_assets), t).padStart(6)} (${stats.with_assets}/${t})`)
    console.log(`    URL HV:      ${pct(Number(stats.with_djhv), t).padStart(6)} (${stats.with_djhv}/${t})`)
  }

  // District breakdown for deputies
  console.log('\n' + '-'.repeat(70))
  console.log(' DIPUTADOS POR DISTRITO')
  console.log('-'.repeat(70))

  const districtStats = await sql`
    SELECT
      d.name as district_name,
      d.deputies_count as expected,
      COUNT(c.id) as actual,
      COUNT(CASE WHEN c.education_details IS NOT NULL AND jsonb_array_length(c.education_details) > 0 THEN 1 END) as with_edu
    FROM districts d
    LEFT JOIN candidates c ON c.district_id = d.id AND c.cargo = 'diputado' AND c.is_active = true
    GROUP BY d.id, d.name, d.deputies_count
    ORDER BY d.deputies_count DESC
  `

  for (const d of districtStats) {
    const actual = Number(d.actual)
    const expected = Number(d.expected)
    const withEdu = Number(d.with_edu)
    const status = actual > 0 ? (withEdu === actual ? 'OK' : 'PARCIAL') : 'VACIO'
    console.log(`  ${d.district_name?.padEnd(25)} Escanos: ${expected}  Candidatos: ${actual}  Edu: ${withEdu}  [${status}]`)
  }

  // Candidates without DNI
  console.log('\n' + '-'.repeat(70))
  console.log(' CANDIDATOS SIN DNI')
  console.log('-'.repeat(70))

  const noDni = await sql`
    SELECT full_name, cargo, slug
    FROM candidates
    WHERE is_active = true
    AND (dni IS NULL OR dni = '')
    ORDER BY cargo, full_name
  `

  if (noDni.length === 0) {
    console.log('  Todos los candidatos tienen DNI')
  } else {
    console.log(`  ${noDni.length} candidatos sin DNI:`)
    for (const c of noDni.slice(0, 30)) {
      console.log(`    - [${c.cargo}] ${c.full_name} (${c.slug})`)
    }
    if (noDni.length > 30) {
      console.log(`    ... y ${noDni.length - 30} mas`)
    }
  }

  // Candidates without org ID (can't scrape HV)
  console.log('\n' + '-'.repeat(70))
  console.log(' CANDIDATOS SIN ORG ID (no se puede scrapear HV)')
  console.log('-'.repeat(70))

  const noOrg = await sql`
    SELECT full_name, cargo, dni, slug
    FROM candidates
    WHERE is_active = true
    AND jne_org_id IS NULL
    AND dni IS NOT NULL AND dni <> ''
    ORDER BY cargo, full_name
  `

  if (noOrg.length === 0) {
    console.log('  Todos los candidatos con DNI tienen org ID')
  } else {
    console.log(`  ${noOrg.length} candidatos con DNI pero sin org ID:`)
    for (const c of noOrg.slice(0, 20)) {
      console.log(`    - [${c.cargo}] ${c.full_name} (DNI: ${c.dni})`)
    }
    if (noOrg.length > 20) {
      console.log(`    ... y ${noOrg.length - 20} mas`)
    }
  }

  // Data sources
  console.log('\n' + '-'.repeat(70))
  console.log(' FUENTES DE DATOS')
  console.log('-'.repeat(70))

  const sources = await sql`
    SELECT
      COALESCE(data_source, 'unknown') as source,
      COUNT(*) as count
    FROM candidates
    WHERE is_active = true
    GROUP BY data_source
    ORDER BY count DESC
  `

  for (const s of sources) {
    console.log(`  ${(s.source || 'unknown').padEnd(20)} ${s.count}`)
  }

  // Party stats
  console.log('\n' + '-'.repeat(70))
  console.log(' PARTIDOS')
  console.log('-'.repeat(70))

  const [partyStats] = await sql`
    SELECT
      COUNT(DISTINCT party_id) as with_party,
      COUNT(CASE WHEN party_id IS NULL THEN 1 END) as without_party
    FROM candidates
    WHERE is_active = true
  `

  const totalParties = await sql`SELECT COUNT(*) as count FROM parties`
  console.log(`  Partidos en BD: ${totalParties[0].count}`)
  console.log(`  Candidatos con partido: ${partyStats.with_party}`)
  console.log(`  Candidatos sin partido: ${partyStats.without_party}`)

  console.log('\n' + '='.repeat(70))
}

main().catch(console.error)
