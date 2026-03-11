/**
 * FIX ALL CANDIDATE DATA
 *
 * Comprehensive fix for 3 systematic problems:
 * 1. Education levels: Ensure DB entries have proper `level` values the scoring engine can map
 * 2. Experience role_type/seniority_level: Infer and populate missing fields
 * 3. Political trajectory → experience: Merge elected/appointed positions into experience_details
 *
 * This updates the JSONB columns directly in the candidates table.
 * After running, recalculate-enhanced-scores.ts should produce correct scores.
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
// EDUCATION LEVEL FIXES
// ============================================

/**
 * Fix education entry: ensure `level` is a value the scoring engine can properly map.
 * The scoring engine's mapEducationDetail() checks level and degree text.
 * We need to ensure:
 * - "Posgrado" entries with MAESTRIA/MAGISTER in degree → level="Maestría"
 * - "Posgrado" entries with DOCTOR in degree → level="Doctorado"
 * - "No Universitario" → level="Técnico" (JNE's term for non-university technical)
 * - Education completion flags are set correctly
 */
function fixEducationEntry(entry: any): { fixed: any; changes: string[] } {
  const changes: string[] = []
  const fixed = { ...entry }
  const degree = (entry.degree || '').toUpperCase()
  const level = (entry.level || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const field = (entry.field_of_study || '').toUpperCase()

  // Fix "No Universitario" → "Técnico"
  if (level.includes('no universitario')) {
    fixed.level = 'Técnico'
    changes.push(`level: "${entry.level}" → "Técnico"`)
  }

  // Fix "Posgrado" → detect if Maestría or Doctorado
  if (level.includes('posgrado') || level.includes('postgrado')) {
    if (degree.includes('DOCTOR') || field.includes('DOCTOR')) {
      fixed.level = 'Doctorado'
      changes.push(`level: "${entry.level}" → "Doctorado" (degree contains DOCTOR)`)
    } else if (degree.includes('MAESTR') || degree.includes('MAGIST') || degree.includes('MASTER') ||
               field.includes('MAESTR') || field.includes('MAGIST')) {
      fixed.level = 'Maestría'
      changes.push(`level: "${entry.level}" → "Maestría" (degree contains MAESTR/MAGIST)`)
    } else {
      fixed.level = 'Maestría'  // Default posgrado = maestría
      changes.push(`level: "${entry.level}" → "Maestría" (default posgrado)`)
    }
  }

  // Fix "Maestria" (without accent) → "Maestría"
  if (level === 'maestria' && entry.level !== 'Maestría') {
    fixed.level = 'Maestría'
    changes.push(`level: "${entry.level}" → "Maestría"`)
  }

  // Detect professional title from degree name for Universitario entries
  if (level.includes('universitario')) {
    const titlePatterns = [
      'ABOGADO', 'INGENIERO', 'LICENCIADO', 'LICENCIADA', 'MEDICO', 'MÉDICO',
      'CONTADOR', 'ARQUITECTO', 'ECONOMISTA', 'PSICOLOGO', 'PSICÓLOGA',
      'CIRUJANO', 'ENFERMERA', 'ENFERMERO', 'ODONTÓLOGO', 'ODONTOLOGO',
      'TITULO', 'TÍTULO', 'ESPECIALISTA',
    ]
    const hasProfTitle = titlePatterns.some(p => degree.includes(p))
    const isBachiller = degree.includes('BACHILLER')

    if (hasProfTitle && !isBachiller) {
      // This is a professional title, mark as completed and with title
      if (!fixed.is_completed) {
        fixed.is_completed = true
        changes.push('is_completed: false → true (professional title detected)')
      }
      if (!fixed.has_title) {
        fixed.has_title = true
        changes.push('has_title: set to true (professional title detected)')
      }
    } else if (isBachiller && !hasProfTitle) {
      // Bachelor degree = completed university
      if (!fixed.is_completed) {
        fixed.is_completed = true
        changes.push('is_completed: false → true (bachiller detected)')
      }
      if (!fixed.has_bachelor) {
        fixed.has_bachelor = true
        changes.push('has_bachelor: set to true')
      }
    }
  }

  // Detect "Maestría" from degree name even if level says "Universitario"
  if (level.includes('universitario') &&
      (degree.includes('MAESTR') || degree.includes('MAGIST') || degree.includes('MASTER'))) {
    fixed.level = 'Maestría'
    changes.push(`level: "${entry.level}" → "Maestría" (degree is actually maestría)`)
  }

  // Detect "Doctorado" from degree name even if level says "Universitario"
  if (level.includes('universitario') &&
      (degree.includes('DOCTOR') && !degree.includes('DOCTRINA'))) {
    fixed.level = 'Doctorado'
    changes.push(`level: "${entry.level}" → "Doctorado" (degree is actually doctorado)`)
  }

  return { fixed, changes }
}

// ============================================
// EXPERIENCE ROLE_TYPE / SENIORITY INFERENCE
// ============================================

function inferRoleType(position: string, organization: string): string {
  const pos = (position || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const org = (organization || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Elected positions
  if (pos.includes('congresista') || pos.includes('senador') || pos.includes('diputado') ||
      pos.includes('parlamentario') || pos.includes('representante') && org.includes('congreso')) {
    return 'electivo_alto'
  }
  if (pos.includes('gobernador') || pos.includes('presidente regional') || pos.includes('presidente de la republica')) {
    return 'electivo_alto'
  }
  if (pos.includes('alcalde')) {
    return 'electivo_medio'
  }
  if (pos.includes('regidor')) {
    return 'electivo_medio'
  }

  // High public sector
  if (pos.includes('ministro') || pos.includes('ministra') || pos.includes('viceministro') ||
      pos.includes('viceministra') || pos.includes('embajador') || pos.includes('embajadora')) {
    return 'ejecutivo_publico_alto'
  }
  if (pos.includes('presidente ejecutivo') || pos.includes('presidenta ejecutiva') ||
      pos.includes('superintendente') || pos.includes('contralor') ||
      pos.includes('defensor del pueblo') || pos.includes('fiscal de la nacion') ||
      pos.includes('jefe institucional')) {
    return 'ejecutivo_publico_alto'
  }
  if (pos.includes('secretario general') && (org.includes('gobierno') || org.includes('palacio') ||
      org.includes('congreso') || org.includes('ministerio') || org.includes('presidencia'))) {
    return 'ejecutivo_publico_alto'
  }
  if (pos.includes('comandante general') || pos.includes('general de division') ||
      pos.includes('almirante') || pos.includes('teniente general')) {
    return 'ejecutivo_publico_alto'
  }

  // Medium public sector
  const publicOrgs = ['ministerio', 'gobierno', 'municipalidad', 'congreso', 'poder judicial',
    'fiscalia', 'contraloria', 'defensa', 'fuerzas armadas', 'ejercito', 'marina',
    'fuerza aerea', 'policia', 'essalud', 'sunat', 'sunarp', 'onpe', 'jne', 'reniec',
    'region', 'regional', 'prefectura', 'gobernacion']
  const isPublicOrg = publicOrgs.some(kw => org.includes(kw))

  if (isPublicOrg) {
    if (pos.includes('director') || pos.includes('general') || pos.includes('jefe') ||
        pos.includes('comandante') || pos.includes('oficial superior') || pos.includes('coronel')) {
      return 'ejecutivo_publico_alto'
    }
    if (pos.includes('gerente') || pos.includes('sub gerente') || pos.includes('subgerente') ||
        pos.includes('asesor') || pos.includes('analista')) {
      return 'ejecutivo_publico_medio'
    }
    return 'ejecutivo_publico_medio'
  }

  // Academia
  if (pos.includes('rector') || pos.includes('decano') || pos.includes('vicerrector')) {
    return 'academia'
  }
  if (pos.includes('catedratico') || pos.includes('profesor') || pos.includes('docente') ||
      pos.includes('investigador') || pos.includes('catedrático')) {
    return 'academia'
  }
  if ((org.includes('universidad') || org.includes('instituto') || org.includes('escuela')) &&
      (pos.includes('profesor') || pos.includes('docente') || pos.includes('catedratico') ||
       pos.includes('director academico') || pos.includes('coordinador'))) {
    return 'academia'
  }

  // International
  if (org.includes('naciones unidas') || org.includes('onu') || org.includes('bid') ||
      org.includes('banco mundial') || org.includes('oea') || org.includes('cepal') ||
      org.includes('pnud') || org.includes('unicef') || org.includes('can') ||
      pos.includes('embajador') || pos.includes('consul')) {
    return 'internacional'
  }

  // Private sector - high
  if (pos.includes('gerente general') || pos.includes('director general') || pos.includes('ceo') ||
      pos.includes('presidente ejecutivo') || pos.includes('presidente del directorio') ||
      pos.includes('presidente fundador') || pos.includes('fundador')) {
    return 'ejecutivo_privado_alto'
  }
  if (pos.includes('empresario') || (pos.includes('presidente') && !isPublicOrg)) {
    return 'ejecutivo_privado_alto'
  }

  // Private sector - medium
  if (pos.includes('gerente') || pos.includes('director') || pos.includes('subgerente') ||
      pos.includes('jefe') || pos.includes('socio')) {
    return 'ejecutivo_privado_medio'
  }

  // Partisan
  if (pos.includes('secretario general') || pos.includes('presidente') && org.includes('partido')) {
    return 'partidario'
  }
  if (pos.includes('personero') || pos.includes('apoderado') || pos.includes('representante legal') ||
      pos.includes('militante') || pos.includes('adherente')) {
    return 'partidario'
  }

  // Professional
  if (pos.includes('abogado') || pos.includes('ingeniero') || pos.includes('medico') ||
      pos.includes('cirujano') || pos.includes('neurocirujano') || pos.includes('economista') ||
      pos.includes('contador') || pos.includes('arquitecto') || pos.includes('consultor') ||
      pos.includes('notario')) {
    return 'tecnico_profesional'
  }

  // Default
  return 'tecnico_profesional'
}

function inferSeniorityLevel(position: string, organization?: string): string {
  const pos = (position || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Dirección - highest leadership
  if (pos.includes('presidente') || pos.includes('presidenta') ||
      pos.includes('rector') || pos.includes('ministro') || pos.includes('ministra') ||
      pos.includes('alcalde') || pos.includes('alcaldesa') ||
      pos.includes('gobernador') || pos.includes('gobernadora') ||
      pos.includes('congresista') || pos.includes('senador') || pos.includes('senadora') ||
      pos.includes('diputado') || pos.includes('diputada') ||
      pos.includes('embajador') || pos.includes('embajadora') ||
      pos.includes('director general') || pos.includes('directora general') ||
      pos.includes('ceo') || pos.includes('gerente general') ||
      pos.includes('comandante general') || pos.includes('superintendente') ||
      pos.includes('contralor') || pos.includes('fiscal de la nacion') ||
      pos.includes('defensor del pueblo') || pos.includes('fundador') ||
      pos.includes('parlamentario')) {
    return 'direccion'
  }

  // Gerencia
  if (pos.includes('general') || pos.includes('gerente') || pos.includes('director') ||
      pos.includes('directora') || pos.includes('decano') || pos.includes('decana') ||
      pos.includes('viceministro') || pos.includes('viceministra') ||
      pos.includes('vicerrector') || pos.includes('empresario') ||
      pos.includes('oficial superior') || pos.includes('coronel') ||
      pos.includes('almirante') || pos.includes('socio')) {
    return 'gerencia'
  }

  // Jefatura
  if (pos.includes('jefe') || pos.includes('jefa') ||
      pos.includes('subgerente') || pos.includes('sub gerente') ||
      pos.includes('coordinador') || pos.includes('coordinadora') ||
      pos.includes('regidor') || pos.includes('regidora') ||
      pos.includes('asesor') || pos.includes('asesora') ||
      pos.includes('secretario general') || pos.includes('secretaria general')) {
    return 'jefatura'
  }

  // Coordinador
  if (pos.includes('profesor') || pos.includes('profesora') ||
      pos.includes('catedratico') || pos.includes('docente') ||
      pos.includes('especialista') || pos.includes('analista') ||
      pos.includes('abogado') || pos.includes('ingeniero') || pos.includes('ingeniera') ||
      pos.includes('medico') || pos.includes('economista') || pos.includes('contador') ||
      pos.includes('consultor') || pos.includes('notario') || pos.includes('investigador')) {
    return 'coordinador'
  }

  return 'individual_contributor'
}

// ============================================
// POLITICAL → EXPERIENCE MERGER
// ============================================

function normalizeForComparison(text: string): string {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim()
}

function isDuplicateExperience(
  existing: any[],
  newEntry: { position: string; organization: string; startYear: number; endYear: number | null }
): boolean {
  const newPos = normalizeForComparison(newEntry.position)
  const newOrg = normalizeForComparison(newEntry.organization)

  for (const exp of existing) {
    const expPos = normalizeForComparison(exp.position || '')
    const expOrg = normalizeForComparison(exp.organization || '')
    const expStart = parseInt(exp.start_year || exp.year_start || exp.start_date || '0')
    const expEnd = parseInt(exp.end_year || exp.year_end || exp.end_date || '0')

    // Check position similarity (substring match)
    const posMatch = newPos.includes(expPos) || expPos.includes(newPos) ||
      // Common abbreviations
      (newPos.includes('congresista') && expPos.includes('congresista')) ||
      (newPos.includes('ministro') && expPos.includes('ministro')) ||
      (newPos.includes('ministra') && expPos.includes('ministra')) ||
      (newPos.includes('gobernador') && expPos.includes('gobernador')) ||
      (newPos.includes('alcalde') && expPos.includes('alcalde')) ||
      (newPos.includes('presidente') && expPos.includes('presidente'))

    // Check year overlap (within 1 year tolerance)
    const yearOverlap = Math.abs(newEntry.startYear - expStart) <= 1 &&
      ((!newEntry.endYear && !expEnd) || Math.abs((newEntry.endYear || 2026) - (expEnd || 2026)) <= 1)

    if (posMatch && yearOverlap) return true
  }
  return false
}

function politicalToExperience(entry: any): any | null {
  const type = (entry.type || '').toLowerCase()
  const position = entry.position || ''
  const posLower = position.toLowerCase()

  // Only convert actual positions, not affiliations or candidaturas
  if (type === 'candidatura') return null
  if (type === 'afiliacion') return null

  // Check if it's an actual position (elected, appointed, or partisan leadership)
  const isElectedPosition = type === 'cargo_electivo' || entry.is_elected === true ||
    posLower.includes('congresista') || posLower.includes('senador') ||
    posLower.includes('diputado') || posLower.includes('alcalde') ||
    posLower.includes('gobernador') || posLower.includes('presidente regional') ||
    posLower.includes('regidor') || posLower.includes('parlamentario')

  const isPublicPosition = type === 'cargo_publico' ||
    posLower.includes('ministro') || posLower.includes('ministra') ||
    posLower.includes('viceministro') || posLower.includes('viceministra') ||
    posLower.includes('embajador') || posLower.includes('secretario general') ||
    posLower.includes('presidente ejecutivo') || posLower.includes('superintendente') ||
    posLower.includes('director') || posLower.includes('general de division') ||
    posLower.includes('comandante')

  const isPartisanLeadership = type === 'cargo_partidario' &&
    (posLower.includes('secretario general') || posLower.includes('presidente') ||
     posLower.includes('fundador'))

  if (!isElectedPosition && !isPublicPosition && !isPartisanLeadership) return null

  const startYear = entry.year_start || entry.start_year || entry.year
  const endYear = entry.year_end || entry.end_year
  if (!startYear) return null

  const org = entry.institution || entry.party || 'Gobierno del Perú'
  const roleType = inferRoleType(position, org)
  const seniorityLevel = inferSeniorityLevel(position, org)

  return {
    position,
    organization: org,
    start_year: String(startYear),
    end_year: endYear ? String(endYear) : null,
    is_current: !endYear || endYear >= 2025,
    sector: isPartisanLeadership ? 'privado' : 'publico',
    role_type: roleType,
    seniority_level: seniorityLevel,
    source: 'political_trajectory',
    is_verified: true,
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('='.repeat(90))
  console.log(' FIX ALL CANDIDATE DATA - Educación, Experiencia, Trayectoria Política')
  console.log('='.repeat(90))

  const candidates = await sql`
    SELECT id, full_name, slug, cargo,
           education_details, experience_details, political_trajectory
    FROM candidates
    WHERE is_active = true
    ORDER BY cargo, full_name
  `

  console.log(`\nCandidatos activos: ${candidates.length}\n`)

  let totalEduFixes = 0
  let totalExpFixes = 0
  let totalPolMerges = 0
  let candidatesModified = 0

  for (const c of candidates) {
    const edu = (c.education_details || []) as any[]
    const exp = (c.experience_details || []) as any[]
    const pol = (c.political_trajectory || []) as any[]

    let modified = false
    const candidateChanges: string[] = []

    // === FIX 1: Education levels ===
    const fixedEdu = edu.map(entry => {
      const { fixed, changes } = fixEducationEntry(entry)
      if (changes.length > 0) {
        totalEduFixes += changes.length
        candidateChanges.push(...changes.map(ch => `  EDU: ${ch}`))
      }
      return fixed
    })

    if (candidateChanges.length > 0) modified = true

    // === FIX 2: Experience role_type and seniority_level ===
    const fixedExp = exp.map(entry => {
      const fixed = { ...entry }
      const position = entry.position || ''
      const organization = entry.organization || ''
      const changes: string[] = []

      if (!entry.role_type || entry.role_type === '?') {
        fixed.role_type = inferRoleType(position, organization)
        changes.push(`role_type: "${entry.role_type || 'null'}" → "${fixed.role_type}"`)
        totalExpFixes++
      }

      if (!entry.seniority_level || entry.seniority_level === '?') {
        fixed.seniority_level = inferSeniorityLevel(position, organization)
        changes.push(`seniority_level: "${entry.seniority_level || 'null'}" → "${fixed.seniority_level}"`)
        totalExpFixes++
      }

      if (changes.length > 0) {
        candidateChanges.push(...changes.map(ch => `  EXP [${position.substring(0, 30)}]: ${ch}`))
        modified = true
      }

      return fixed
    })

    // === FIX 3: Merge political trajectory into experience ===
    const mergedExp = [...fixedExp]
    for (const polEntry of pol) {
      const expEntry = politicalToExperience(polEntry)
      if (!expEntry) continue

      const startYear = parseInt(expEntry.start_year)
      const endYear = expEntry.end_year ? parseInt(expEntry.end_year) : null

      if (!isDuplicateExperience(mergedExp, {
        position: expEntry.position,
        organization: expEntry.organization,
        startYear,
        endYear,
      })) {
        mergedExp.push(expEntry)
        totalPolMerges++
        candidateChanges.push(`  POL→EXP: ${expEntry.position} (${expEntry.start_year}-${expEntry.end_year || 'present'}) [${expEntry.role_type}/${expEntry.seniority_level}]`)
        modified = true
      }
    }

    // === Apply changes ===
    if (modified) {
      candidatesModified++
      const isPres = c.cargo === 'presidente'
      const prefix = isPres ? '🔴 ' : '  '
      console.log(`${prefix}${c.full_name} (${c.cargo})`)
      for (const change of candidateChanges) {
        console.log(`   ${change}`)
      }

      await sql`
        UPDATE candidates SET
          education_details = ${JSON.stringify(fixedEdu)}::jsonb,
          experience_details = ${JSON.stringify(mergedExp)}::jsonb
        WHERE id = ${c.id}
      `
      console.log(`   ✅ Guardado (${fixedEdu.length} edu, ${mergedExp.length} exp)\n`)
    }
  }

  console.log('\n' + '='.repeat(90))
  console.log(' RESUMEN')
  console.log('='.repeat(90))
  console.log(`  Candidatos modificados: ${candidatesModified} / ${candidates.length}`)
  console.log(`  Fixes educación: ${totalEduFixes}`)
  console.log(`  Fixes experiencia (role_type/seniority): ${totalExpFixes}`)
  console.log(`  Merges político → experiencia: ${totalPolMerges}`)
  console.log('='.repeat(90))
}

main().catch(console.error)
