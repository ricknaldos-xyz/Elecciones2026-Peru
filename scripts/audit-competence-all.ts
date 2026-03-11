/**
 * AUDIT: Compare actual DB data vs audited competence scores for ALL presidential candidates
 *
 * For each candidate:
 * 1. Reads education_details, experience_details, political_trajectory from DB
 * 2. Calculates competence using the actual scoring algorithm
 * 3. Compares with stored score
 * 4. Flags mismatches
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

// ============================================
// SCORING ALGORITHM (copied from src/lib/scoring/index.ts)
// ============================================

type EducationLevel =
  | 'sin_informacion' | 'primaria' | 'secundaria_incompleta' | 'secundaria_completa'
  | 'tecnico_incompleto' | 'tecnico_completo' | 'universitario_incompleto'
  | 'universitario_completo' | 'titulo_profesional' | 'maestria' | 'doctorado'

type RoleType =
  | 'electivo_alto' | 'electivo_medio' | 'ejecutivo_publico_alto' | 'ejecutivo_publico_medio'
  | 'ejecutivo_privado_alto' | 'ejecutivo_privado_medio' | 'tecnico_profesional'
  | 'academia' | 'internacional' | 'partidario'

type SeniorityLevel = 'individual_contributor' | 'coordinador' | 'jefatura' | 'gerencia' | 'direccion'

const EDUCATION_POINTS: Record<string, number> = {
  sin_informacion: 0, primaria: 2, secundaria_incompleta: 4, secundaria_completa: 6,
  tecnico_incompleto: 7, tecnico_completo: 10, universitario_incompleto: 9,
  universitario_completo: 14, titulo_profesional: 16, maestria: 18, doctorado: 22,
}

const EXPERIENCE_TOTAL_POINTS = [
  { minYears: 15, points: 25 }, { minYears: 11, points: 20 }, { minYears: 8, points: 16 },
  { minYears: 5, points: 12 }, { minYears: 2, points: 6 }, { minYears: 0, points: 0 },
]

const RELEVANCE_PRESIDENTE: Record<string, number> = {
  electivo_alto: 3.0, ejecutivo_publico_alto: 3.0, ejecutivo_privado_alto: 2.8,
  ejecutivo_publico_medio: 2.0, ejecutivo_privado_medio: 1.8, internacional: 1.8,
  electivo_medio: 1.5, tecnico_profesional: 1.2, academia: 1.0, partidario: 0.6,
}

const SENIORITY_POINTS: Record<string, number> = {
  individual_contributor: 2, individual: 2, coordinador: 6, jefatura: 8, gerencia: 10, direccion: 14,
}

const STABILITY_POINTS = [
  { minYears: 7, points: 6 }, { minYears: 4, points: 4 },
  { minYears: 2, points: 2 }, { minYears: 0, points: 0 },
]

interface EducationEntry {
  level: string
  institution?: string
  degree?: string
  field_of_study?: string
  is_completed?: boolean
  completed?: boolean
  title_year?: number
  bachelor_year?: number
  end_date?: string
  year?: number
}

interface ExperienceEntry {
  role_type?: string
  position?: string
  organization?: string
  institution?: string
  centro_trabajo?: string
  sector?: string
  start_year?: number
  start_date?: string
  year_start?: number
  end_year?: number
  end_date?: string
  year_end?: number
  is_current?: boolean
  seniority_level?: string
  is_leadership?: boolean
  description?: string
}

interface PoliticalEntry {
  type?: string
  position?: string
  party?: string
  start_year?: number
  start_date?: string
  year_start?: number
  end_year?: number
  end_date?: string
  year_end?: number
  is_elected?: boolean
  result?: string
  institution?: string
}

function calculateEducation(entries: EducationEntry[]): { level: number; depth: number; total: number } {
  if (!entries || entries.length === 0) return { level: 0, depth: 0, total: 0 }

  const levels = entries.map(e => {
    const isCompleted = e.is_completed ?? e.completed ?? true
    let level = String(e.level || '').toLowerCase()

    // If not completed and it's a degree, downgrade
    if (!isCompleted && level === 'doctorado') level = 'maestria' // incomplete doctorate = next lower
    if (!isCompleted && level === 'maestria') level = 'universitario_completo'

    return EDUCATION_POINTS[level] || 0
  })

  const maxLevel = Math.max(...levels)
  let depthBonus = 0
  const sorted = [...levels].sort((a, b) => b - a)
  for (let i = 1; i < sorted.length && depthBonus < 8; i++) {
    if (sorted[i] >= 10) depthBonus += 2
  }

  return {
    level: Math.min(maxLevel, 22),
    depth: Math.min(depthBonus, 8),
    total: Math.min(maxLevel + depthBonus, 30),
  }
}

function mergeTimeRanges(ranges: { start: number; end: number }[]) {
  if (ranges.length === 0) return []
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const merged = [{ ...sorted[0] }]
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push({ ...current })
    }
  }
  return merged
}

function parseYear(val: any): number {
  if (!val) return 0
  const n = parseInt(String(val), 10)
  return isNaN(n) ? 0 : n
}

function getExperienceYears(entries: ExperienceEntry[]): { raw: number; unique: number } {
  const currentYear = 2026
  const ranges = entries.map(e => {
    const start = parseYear(e.start_year ?? e.year_start ?? e.start_date)
    let end = parseYear(e.end_year ?? e.year_end ?? e.end_date)
    if (!end || e.is_current) end = currentYear
    return { start, end: Math.max(start, end) }
  }).filter(r => r.start > 0)

  const raw = ranges.reduce((sum, r) => sum + (r.end - r.start), 0)
  const merged = mergeTimeRanges(ranges)
  const unique = merged.reduce((sum, r) => sum + (r.end - r.start), 0)
  return { raw, unique }
}

function calculateExperienceTotal(entries: ExperienceEntry[]): number {
  const { unique } = getExperienceYears(entries)
  for (const tier of EXPERIENCE_TOTAL_POINTS) {
    if (unique >= tier.minYears) return tier.points
  }
  return 0
}

function calculateExperienceRelevant(entries: ExperienceEntry[]): number {
  const currentYear = 2026
  let score = 0
  for (const e of entries) {
    const start = parseYear(e.start_year ?? e.year_start ?? e.start_date)
    let end = parseYear(e.end_year ?? e.year_end ?? e.end_date)
    if (!end || e.is_current) end = currentYear
    if (!start) continue

    const years = Math.min(end - start, 10)
    const roleType = e.role_type || 'tecnico_profesional'
    const ptsPerYear = RELEVANCE_PRESIDENTE[roleType] || 0.5
    score += years * ptsPerYear
  }
  return Math.min(Math.round(score * 10) / 10, 25)
}

function calculateLeadership(entries: ExperienceEntry[]): { seniority: number; stability: number; total: number } {
  const currentYear = 2026
  const leaders = entries.filter(e => {
    const sl = e.seniority_level || ''
    return sl && sl !== 'individual_contributor' && sl !== 'individual'
  })

  if (leaders.length === 0) return { seniority: 0, stability: 0, total: 0 }

  const maxSeniority = Math.max(...leaders.map(e => SENIORITY_POINTS[e.seniority_level || ''] || 0))

  let leaderYears = 0
  for (const e of leaders) {
    const start = parseYear(e.start_year ?? e.year_start ?? e.start_date)
    let end = parseYear(e.end_year ?? e.year_end ?? e.end_date)
    if (!end || e.is_current) end = currentYear
    if (start) leaderYears += (end - start)
  }

  let stability = 0
  for (const tier of STABILITY_POINTS) {
    if (leaderYears >= tier.minYears) { stability = tier.points; break }
  }

  return {
    seniority: Math.min(maxSeniority, 14),
    stability: Math.min(stability, 6),
    total: Math.min(maxSeniority + stability, 20),
  }
}

async function main() {
  console.log('='.repeat(90))
  console.log(' AUDITORÍA COMPLETA DE COMPETENCIA - TODOS LOS CANDIDATOS PRESIDENCIALES')
  console.log('='.repeat(90))

  // Get all presidential candidates with their data
  const candidates = await sql`
    SELECT
      c.id, c.full_name, c.slug, c.education_level,
      c.education_details, c.experience_details, c.political_trajectory,
      s.competence as stored_competence,
      sb.education_level_points, sb.education_depth_points,
      sb.experience_total_points, sb.experience_relevant_points,
      sb.leadership_seniority_points, sb.leadership_stability_points
    FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY s.competence DESC NULLS LAST
  `

  console.log(`\nEncontrados: ${candidates.length} candidatos presidenciales\n`)

  const mismatches: any[] = []

  for (const c of candidates) {
    const edu = (c.education_details || []) as EducationEntry[]
    const exp = (c.experience_details || []) as ExperienceEntry[]
    const pol = (c.political_trajectory || []) as PoliticalEntry[]

    // Calculate using algorithm
    const education = calculateEducation(edu)
    const expTotal = calculateExperienceTotal(exp)
    const expRelevant = calculateExperienceRelevant(exp)
    const leadership = calculateLeadership(exp)
    const calculatedCompetence = Math.min(education.total + expTotal + expRelevant + leadership.total, 100)

    const stored = Number(c.stored_competence) || 0
    const diff = stored - calculatedCompetence

    const name = c.full_name.substring(0, 40).padEnd(42)
    const flag = Math.abs(diff) > 5 ? '⚠️ ' : '  '

    // Education details summary
    const eduSummary = edu.map(e => {
      const completed = e.is_completed ?? e.completed ?? true
      return `${e.level}${completed ? '' : '(INC)'}${e.degree ? `:${e.degree}` : ''}`
    }).join(', ') || 'SIN DATA'

    // Experience summary
    const { raw, unique } = getExperienceYears(exp)
    const expSummary = exp.map(e => {
      const start = parseYear(e.start_year ?? e.year_start ?? e.start_date)
      let end = parseYear(e.end_year ?? e.year_end ?? e.end_date)
      if (!end || e.is_current) end = 2026
      return `${(e.position || e.role_type || '?').substring(0, 25)}(${start}-${end})[${e.role_type || '?'}/${e.seniority_level || '?'}]`
    }).join('; ') || 'SIN DATA'

    console.log(`${flag}${name} DB=${String(stored).padStart(2)} CALC=${String(Math.round(calculatedCompetence)).padStart(2)} DIFF=${(diff >= 0 ? '+' : '') + diff.toFixed(0).padStart(3)}`)
    console.log(`     Edu: ${education.level}lvl + ${education.depth}dep = ${education.total}/30  |  ${eduSummary}`)
    console.log(`     Exp: ${expTotal}total + ${Math.round(expRelevant)}rel = ${expTotal + Math.round(expRelevant)}/50 (${unique}yr unique, ${raw}yr raw)`)
    console.log(`     Lead: ${leadership.seniority}sen + ${leadership.stability}stab = ${leadership.total}/20`)
    console.log(`     TOTAL: ${education.total} + ${expTotal} + ${Math.round(expRelevant)} + ${leadership.total} = ${Math.round(calculatedCompetence)}/100`)

    if (exp.length > 0) {
      console.log(`     Detalle exp: ${expSummary}`)
    }
    if (pol.length > 0) {
      const polSummary = pol.map(p => `${(p.position || p.type || '?').substring(0, 30)}(${p.start_year || p.year_start || '?'}-${p.end_year || p.year_end || '?'})`).join('; ')
      console.log(`     Política: ${polSummary}`)
    }
    console.log('')

    if (Math.abs(diff) > 5) {
      mismatches.push({
        name: c.full_name,
        slug: c.slug,
        id: c.id,
        stored,
        calculated: Math.round(calculatedCompetence),
        diff: Math.round(diff),
        education,
        expTotal,
        expRelevant: Math.round(expRelevant),
        leadership,
        eduEntries: edu.length,
        expEntries: exp.length,
        polEntries: pol.length,
      })
    }
  }

  console.log('\n' + '='.repeat(90))
  console.log(` RESUMEN: ${mismatches.length} de ${candidates.length} con diferencia > 5 puntos`)
  console.log('='.repeat(90))

  if (mismatches.length > 0) {
    console.log('\nCANDIDATOS CON DISCREPANCIAS SIGNIFICATIVAS:')
    console.log('-'.repeat(80))
    for (const m of mismatches) {
      console.log(`  ${m.name}`)
      console.log(`    DB=${m.stored}  CALC=${m.calculated}  DIFF=${m.diff > 0 ? '+' : ''}${m.diff}`)
      console.log(`    Edu=${m.education.total}/30  ExpT=${m.expTotal}  ExpR=${m.expRelevant}  Lead=${m.leadership.total}/20`)
      console.log(`    Data: ${m.eduEntries} edu, ${m.expEntries} exp, ${m.polEntries} pol entries`)
      console.log('')
    }
  }

  // Also check candidates with 0 data entries but high scores
  const suspiciousZero = candidates.filter((c: any) => {
    const edu = (c.education_details || []) as any[]
    const exp = (c.experience_details || []) as any[]
    return (edu.length === 0 || exp.length === 0) && Number(c.stored_competence) > 50
  })

  if (suspiciousZero.length > 0) {
    console.log('\n⚠️  CANDIDATOS CON DATOS FALTANTES PERO SCORE > 50:')
    console.log('-'.repeat(80))
    for (const c of suspiciousZero) {
      const edu = (c.education_details || []) as any[]
      const exp = (c.experience_details || []) as any[]
      console.log(`  ${c.full_name}: C=${c.stored_competence}, edu_entries=${edu.length}, exp_entries=${exp.length}`)
    }
  }
}

main().catch(console.error)
