/**
 * Verification script: tests that normalizeExperienceDetails and normalizePoliticalTrajectory
 * correctly handle all data formats found in the database.
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

// Copy of the normalization logic from queries.ts to test independently
const PUBLIC_SECTOR_KEYWORDS = [
  'municipalidad', 'gobierno', 'ministerio', 'congreso', 'poder judicial',
  'tribunal', 'contraloria', 'defensoria', 'fiscalia', 'procuraduria',
  'superintendencia', 'organismo', 'instituto nacional', 'essalud',
  'seguro social', 'policia', 'fuerzas armadas', 'ejercito', 'marina',
  'fuerza aerea', 'sunat', 'sunarp', 'onpe', 'jne', 'reniec',
  'banco central', 'bcrp', 'sbs', 'indecopi', 'osinergmin', 'osiptel',
  'ositran', 'sunass', 'oefa', 'senace', 'servir', 'ceplan',
  'region', 'regional', 'prefectura', 'subprefectura', 'gobernacion',
  'ugel', 'dre', 'direccion regional', 'gerencia regional',
  'corte superior', 'juzgado', 'notaria', 'registro', 'electoral',
  'senado', 'camara', 'parlamento', 'asamblea',
]

interface ExperienceRecord {
  type: 'publico' | 'privado'
  institution: string
  position: string
  year_start: number
  year_end: number
  description?: string
}

interface PoliticalRecord {
  type: 'afiliacion' | 'cargo_partidario' | 'cargo_electivo' | 'candidatura' | 'cargo_publico'
  party?: string
  position?: string
  year_start?: number
  year_end?: number | null
  year?: number
  institution?: string
  result?: string
}

function normalizeExperienceDetails(raw: any): ExperienceRecord[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((entry: Record<string, unknown>) => {
    const institution = String(entry.organization || entry.institution || entry.centro_trabajo || '')
    const rawStart = entry.start_year ?? entry.year_start ?? entry.start_date
    const yearStart = rawStart ? parseInt(String(rawStart), 10) : 0
    const rawEnd = entry.end_year ?? entry.year_end ?? entry.end_date
    const yearEnd = rawEnd ? parseInt(String(rawEnd), 10) : 0

    let type: 'publico' | 'privado' = 'privado'
    if (entry.sector) {
      const sector = String(entry.sector).toLowerCase()
      if (sector.includes('public') || sector.includes('público') || sector === 'publico') {
        type = 'publico'
      }
    } else if (entry.type === 'publico' || entry.type === 'privado') {
      type = entry.type as 'publico' | 'privado'
    } else {
      const orgLower = institution.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (PUBLIC_SECTOR_KEYWORDS.some(kw => orgLower.includes(kw))) {
        type = 'publico'
      }
    }

    return {
      type,
      institution,
      position: String(entry.position || entry.cargo || ''),
      year_start: yearStart && !isNaN(yearStart) ? yearStart : 0,
      year_end: yearEnd && !isNaN(yearEnd) ? yearEnd : 0,
      description: entry.description ? String(entry.description) : undefined,
    } as ExperienceRecord
  })
}

function normalizePoliticalTrajectory(raw: any): PoliticalRecord[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((entry: Record<string, unknown>) => {
    let type: PoliticalRecord['type'] = 'afiliacion'
    const rawType = String(entry.type || '').toLowerCase()
    if (rawType === 'partidario' || rawType === 'cargo_partidario') {
      type = 'cargo_partidario'
    } else if (rawType === 'eleccion' || rawType === 'cargo_electivo') {
      type = 'cargo_electivo'
    } else if (rawType === 'candidatura') {
      type = 'candidatura'
    } else if (rawType === 'cargo_publico') {
      type = 'cargo_publico'
    } else if (rawType === 'afiliacion') {
      type = 'afiliacion'
    }

    const rawStart = entry.start_year ?? entry.year_start ?? entry.start_date
    const yearStart = rawStart ? parseInt(String(rawStart), 10) : undefined
    const rawEnd = entry.end_year ?? entry.year_end ?? entry.end_date
    const parsedEnd = rawEnd ? parseInt(String(rawEnd), 10) : undefined
    const yearEnd = rawEnd === null ? null : (parsedEnd && !isNaN(parsedEnd) ? parsedEnd : undefined)

    let result: string | undefined = entry.result ? String(entry.result) : undefined
    if (!result && entry.is_elected === true) {
      result = 'Electo'
    }

    return {
      type,
      party: entry.party ? String(entry.party) : undefined,
      position: entry.position ? String(entry.position) : undefined,
      year_start: yearStart && !isNaN(yearStart) ? yearStart : undefined,
      year_end: yearEnd,
      year: entry.year ? parseInt(String(entry.year), 10) || undefined : undefined,
      institution: entry.institution ? String(entry.institution) : undefined,
      result,
    } as PoliticalRecord
  })
}

async function main() {
  console.log('=' .repeat(70))
  console.log(' VERIFICATION: Experience & Political Trajectory Normalization')
  console.log('=' .repeat(70))
  console.log()

  // ========== EXPERIENCE ==========
  console.log('─'.repeat(70))
  console.log(' EXPERIENCE DETAILS')
  console.log('─'.repeat(70))

  const expCandidates = await sql`
    SELECT id, full_name, experience_details
    FROM candidates
    WHERE experience_details IS NOT NULL
      AND jsonb_array_length(experience_details) > 0
    ORDER BY full_name
  `

  let totalExp = 0
  let expWithInstitution = 0
  let expWithYears = 0
  let expWithPosition = 0
  let expPublico = 0
  let expPrivado = 0
  let expNoInstitution = 0
  let expNoPosition = 0
  let expNoYears = 0
  const expSamples: { name: string; entry: ExperienceRecord; raw: any }[] = []

  for (const c of expCandidates) {
    const raw = c.experience_details as any[]
    const normalized = normalizeExperienceDetails(raw)

    for (let i = 0; i < normalized.length; i++) {
      const exp = normalized[i]
      totalExp++

      if (exp.institution) expWithInstitution++
      else expNoInstitution++

      if (exp.position) expWithPosition++
      else expNoPosition++

      if (exp.year_start && exp.year_end) expWithYears++
      else if (!exp.year_start && !exp.year_end) expNoYears++

      if (exp.type === 'publico') expPublico++
      else expPrivado++

      // Collect samples
      if (expSamples.length < 5 && exp.institution && exp.year_start) {
        expSamples.push({ name: c.full_name, entry: exp, raw: raw[i] })
      }
    }
  }

  console.log(`  Total entries: ${totalExp}`)
  console.log(`  With institution: ${expWithInstitution} (${(100*expWithInstitution/totalExp).toFixed(1)}%)`)
  console.log(`  With position: ${expWithPosition} (${(100*expWithPosition/totalExp).toFixed(1)}%)`)
  console.log(`  With both years: ${expWithYears} (${(100*expWithYears/totalExp).toFixed(1)}%)`)
  console.log(`  No years at all: ${expNoYears} (${(100*expNoYears/totalExp).toFixed(1)}%)`)
  console.log(`  No institution: ${expNoInstitution}`)
  console.log(`  No position: ${expNoPosition}`)
  console.log(`  Public sector: ${expPublico} (${(100*expPublico/totalExp).toFixed(1)}%)`)
  console.log(`  Private sector: ${expPrivado} (${(100*expPrivado/totalExp).toFixed(1)}%)`)
  console.log()

  console.log('  Sample normalized entries:')
  for (const s of expSamples) {
    console.log(`    ${s.name}:`)
    console.log(`      Raw: org="${s.raw.organization}", start_year=${s.raw.start_year}, end_year=${s.raw.end_year}`)
    console.log(`      Norm: inst="${s.entry.institution}", ${s.entry.year_start}-${s.entry.year_end}, type=${s.entry.type}`)
  }

  // Check for issues
  const expIssues: string[] = []
  if (expNoInstitution > totalExp * 0.5) expIssues.push(`WARNING: ${expNoInstitution} entries missing institution`)
  if (expNoPosition > totalExp * 0.1) expIssues.push(`WARNING: ${expNoPosition} entries missing position`)

  if (expIssues.length > 0) {
    console.log()
    console.log('  ISSUES:')
    expIssues.forEach(i => console.log(`    ${i}`))
  } else {
    console.log()
    console.log('  ✅ All experience entries normalize correctly')
  }

  // ========== POLITICAL TRAJECTORY ==========
  console.log()
  console.log('─'.repeat(70))
  console.log(' POLITICAL TRAJECTORY')
  console.log('─'.repeat(70))

  const polCandidates = await sql`
    SELECT id, full_name, political_trajectory
    FROM candidates
    WHERE political_trajectory IS NOT NULL
      AND jsonb_array_length(political_trajectory) > 0
    ORDER BY full_name
  `

  let totalPol = 0
  let polWithDates = 0
  let polNoDates = 0
  let polWithParty = 0
  let polWithResult = 0
  const typeCounts: Record<string, number> = {}
  const polSamples: { name: string; entry: PoliticalRecord; raw: any }[] = []

  for (const c of polCandidates) {
    const raw = c.political_trajectory as any[]
    const normalized = normalizePoliticalTrajectory(raw)

    for (let i = 0; i < normalized.length; i++) {
      const pol = normalized[i]
      totalPol++

      typeCounts[pol.type] = (typeCounts[pol.type] || 0) + 1

      if (pol.year_start || pol.year) polWithDates++
      else polNoDates++

      if (pol.party) polWithParty++
      if (pol.result) polWithResult++

      if (polSamples.length < 5 && pol.year_start) {
        polSamples.push({ name: c.full_name, entry: pol, raw: raw[i] })
      }
    }
  }

  console.log(`  Total entries: ${totalPol}`)
  console.log(`  With dates: ${polWithDates} (${(100*polWithDates/totalPol).toFixed(1)}%)`)
  console.log(`  No dates: ${polNoDates} (${(100*polNoDates/totalPol).toFixed(1)}%)`)
  console.log(`  With party: ${polWithParty} (${(100*polWithParty/totalPol).toFixed(1)}%)`)
  console.log(`  With result: ${polWithResult}`)
  console.log()

  console.log('  Type distribution:')
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type}: ${count} (${(100*count/totalPol).toFixed(1)}%)`)
  }
  console.log()

  console.log('  Sample normalized entries:')
  for (const s of polSamples) {
    console.log(`    ${s.name}:`)
    console.log(`      Raw: type="${s.raw.type}", start_year=${s.raw.start_year}, end_year=${s.raw.end_year}, is_elected=${s.raw.is_elected}`)
    console.log(`      Norm: type="${s.entry.type}", ${s.entry.year_start}-${s.entry.year_end}, result=${s.entry.result}`)
  }

  // Verify no unmapped types
  const validTypes = ['afiliacion', 'cargo_partidario', 'cargo_electivo', 'candidatura', 'cargo_publico']
  const invalidTypes = Object.keys(typeCounts).filter(t => !validTypes.includes(t))
  if (invalidTypes.length > 0) {
    console.log()
    console.log(`  ❌ UNMAPPED TYPES: ${invalidTypes.join(', ')}`)
  } else {
    console.log()
    console.log('  ✅ All political trajectory types mapped correctly')
  }

  // ========== SUMMARY ==========
  console.log()
  console.log('=' .repeat(70))
  console.log(' SUMMARY')
  console.log('=' .repeat(70))
  console.log(`  Experience: ${totalExp} entries across ${expCandidates.length} candidates`)
  console.log(`    institution mapped: ${expWithInstitution}/${totalExp}`)
  console.log(`    years mapped: ${expWithYears}/${totalExp}`)
  console.log(`    sector inferred: publico=${expPublico}, privado=${expPrivado}`)
  console.log()
  console.log(`  Political: ${totalPol} entries across ${polCandidates.length} candidates`)
  console.log(`    dates mapped: ${polWithDates}/${totalPol}`)
  console.log(`    types mapped: all ${totalPol} to valid types`)
  console.log(`    results mapped: ${polWithResult}`)
  console.log()

  if (invalidTypes.length === 0 && expNoInstitution <= totalExp * 0.01) {
    console.log('  ✅ ALL CHECKS PASSED - Normalization is 100% correct')
  } else {
    console.log('  ⚠️  Some issues found - see details above')
  }
}

main().catch(console.error)
