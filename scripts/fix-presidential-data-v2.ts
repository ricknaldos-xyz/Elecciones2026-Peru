/**
 * FIX PRESIDENTIAL CANDIDATE DATA - V2 (Research batches 2-4 findings)
 *
 * Additional fixes based on deep web research of all 36 candidates.
 * Only adds MISSING data — does not remove or modify existing entries.
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

interface ExpEntry {
  position: string
  organization: string
  start_year: string
  end_year: string | null
  is_current: boolean
  sector: string
  role_type: string
  seniority_level: string
  source: string
  is_verified: boolean
}

interface EduFix {
  matchDegree: string
  updates: Record<string, any>
}

interface CandidateFix {
  slug: string
  eduFixes?: EduFix[]
  newEdu?: any[]
  newExp?: ExpEntry[]
}

const FIXES: CandidateFix[] = [
  // ============================================
  // HIGH PRIORITY: Major missing data
  // ============================================
  {
    slug: 'jorge-nieto-montesinos',
    // Has COMPLETED doctorate from El Colegio de México (1988-1991)
    // Currently only Maestría in DB
    newEdu: [
      {
        level: 'Doctorado',
        degree: 'Doctorado en Ciencias Sociales',
        institution: 'El Colegio de México',
        is_completed: true,
        source: 'wikipedia',
      },
    ],
    newExp: [
      {
        position: 'Director de la Unidad de Gobernanza Mundial',
        organization: 'UNESCO',
        start_year: '2005', end_year: '2010',
        is_current: false, sector: 'publico',
        role_type: 'internacional', seniority_level: 'direccion',
        source: 'wikipedia', is_verified: true,
      },
    ],
  },
  {
    slug: 'sanchez-palomino-roberto-helbert',
    newExp: [
      {
        position: 'Congresista de la República',
        organization: 'Congreso de la República',
        start_year: '2021', end_year: '2026',
        is_current: false, sector: 'publico',
        role_type: 'electivo_alto', seniority_level: 'direccion',
        source: 'wikipedia', is_verified: true,
      },
      {
        position: 'Ministro de Comercio Exterior y Turismo',
        organization: 'MINCETUR',
        start_year: '2021', end_year: '2022',
        is_current: false, sector: 'publico',
        role_type: 'ejecutivo_publico_alto', seniority_level: 'direccion',
        source: 'wikipedia', is_verified: true,
      },
    ],
  },
  {
    slug: 'perez-tello-de-rodriguez-maria-soledad',
    newEdu: [
      {
        level: 'Doctorado',
        degree: 'Doctorado en Derecho',
        institution: 'Universidad de San Martín de Porres',
        is_completed: true,
        source: 'infobae',
      },
    ],
  },
  {
    slug: 'acuna-peralta-cesar',
    newExp: [
      {
        position: 'Gobernador Regional de La Libertad',
        organization: 'Gobierno Regional de La Libertad',
        start_year: '2023', end_year: null,
        is_current: true, sector: 'publico',
        role_type: 'electivo_alto', seniority_level: 'direccion',
        source: 'wikipedia', is_verified: true,
      },
    ],
    newEdu: [
      {
        level: 'Maestría',
        degree: 'Maestría en Dirección Universitaria',
        institution: 'Universidad de los Andes, Colombia',
        is_completed: true,
        source: 'web',
      },
    ],
  },

  // ============================================
  // MEDIUM PRIORITY: Experience gaps
  // ============================================
  {
    slug: 'guevara-amasifuen-mesias-antonio',
    newEdu: [
      {
        level: 'Doctorado',
        degree: 'DEA - Diploma de Estudios Avanzados en Administración de Empresas',
        institution: 'Universidad de Sevilla',
        is_completed: false, // incomplete doctorate
        source: 'infobae',
      },
    ],
  },
  {
    slug: 'jaico-carranza-carlos-ernesto',
    newEdu: [
      {
        level: 'Posgrado',
        degree: 'Advanced Studies in European Law',
        institution: "King's College London",
        is_completed: true,
        source: 'web',
      },
    ],
    newExp: [
      {
        position: 'Presidente Fundador',
        organization: 'Cámara de Comercio e Industria Suizo-Peruana',
        start_year: '2011', end_year: '2016',
        is_current: false, sector: 'privado',
        role_type: 'ejecutivo_privado_alto', seniority_level: 'direccion',
        source: 'web', is_verified: true,
      },
      {
        position: 'Docente de Maestría en Economía y Finanzas Internacionales',
        organization: 'Tecnológico de Monterrey',
        start_year: '2012', end_year: '2018',
        is_current: false, sector: 'privado',
        role_type: 'academia', seniority_level: 'coordinador',
        source: 'web', is_verified: true,
      },
    ],
  },
  {
    slug: 'george-patrick-forsyth-sommer',
    newExp: [
      {
        position: 'Futbolista Profesional (Arquero)',
        organization: 'Alianza Lima / Borussia Dortmund II / Sport Boys / Selección Peruana',
        start_year: '2001', end_year: '2014',
        is_current: false, sector: 'privado',
        role_type: 'tecnico_profesional', seniority_level: 'individual_contributor',
        source: 'wikipedia', is_verified: true,
      },
      {
        position: 'Regidor / Teniente Alcalde de La Victoria',
        organization: 'Municipalidad de La Victoria',
        start_year: '2010', end_year: '2014',
        is_current: false, sector: 'publico',
        role_type: 'electivo_medio', seniority_level: 'jefatura',
        source: 'wikipedia', is_verified: true,
      },
    ],
  },
  {
    slug: 'lopez-aliaga-cazorla-rafael-bernardo',
    newExp: [
      {
        position: 'Gerente de Banca Corporativa',
        organization: 'Citibank N.A. Lima',
        start_year: '1984', end_year: '1988',
        is_current: false, sector: 'privado',
        role_type: 'ejecutivo_privado_alto', seniority_level: 'gerencia',
        source: 'web', is_verified: true,
      },
      {
        position: 'Director',
        organization: 'Banco Interandino',
        start_year: '1989', end_year: '1991',
        is_current: false, sector: 'privado',
        role_type: 'ejecutivo_privado_alto', seniority_level: 'direccion',
        source: 'web', is_verified: true,
      },
      {
        position: 'Co-fundador y Director',
        organization: 'PeruRail S.A. / Peruval Corp',
        start_year: '1999', end_year: null,
        is_current: true, sector: 'privado',
        role_type: 'ejecutivo_privado_alto', seniority_level: 'direccion',
        source: 'wikipedia', is_verified: true,
      },
    ],
  },
  {
    slug: 'paz-de-la-barra-freigeiro-alvaro-gonzalo',
    newExp: [
      {
        position: 'Presidente de la Asociación de Municipalidades del Perú',
        organization: 'AMPE',
        start_year: '2019', end_year: '2022',
        is_current: false, sector: 'publico',
        role_type: 'ejecutivo_publico_alto', seniority_level: 'direccion',
        source: 'wikipedia', is_verified: true,
      },
    ],
  },

  // ============================================
  // LOW PRIORITY: Minor additions
  // ============================================
  {
    slug: 'cerron-rojas-vladimir-roy',
    newEdu: [
      {
        level: 'Maestría',
        degree: 'Maestría en Neurociencias',
        institution: 'Universidad Nacional Mayor de San Marcos',
        is_completed: true,
        source: 'web',
      },
    ],
  },
  {
    slug: 'keiko-sofia-fujimori-higuchi',
    // Add Primera Dama and charity foundation work
    newExp: [
      {
        position: 'Primera Dama del Perú (de facto)',
        organization: 'Presidencia de la República',
        start_year: '1994', end_year: '2000',
        is_current: false, sector: 'publico',
        role_type: 'ejecutivo_publico_alto', seniority_level: 'direccion',
        source: 'wikipedia', is_verified: true,
      },
    ],
  },
  {
    slug: 'vizcarra-cornejo-mario-enrique',
    // Add Ministro de Transportes (was VP + also served as minister)
    newExp: [
      {
        position: 'Ministro de Transportes y Comunicaciones',
        organization: 'Ministerio de Transportes y Comunicaciones',
        start_year: '2016', end_year: '2017',
        is_current: false, sector: 'publico',
        role_type: 'ejecutivo_publico_alto', seniority_level: 'direccion',
        source: 'wikipedia', is_verified: true,
      },
    ],
  },
  {
    slug: 'caller-gutierrez-herbert',
    // Confirm military career details
    newExp: [
      {
        position: 'Oficial de la Marina de Guerra (Comandante, Fuerza de Submarinos)',
        organization: 'Marina de Guerra del Perú',
        start_year: '1996', end_year: '2017',
        is_current: false, sector: 'publico',
        role_type: 'ejecutivo_publico_alto', seniority_level: 'gerencia',
        source: 'andina', is_verified: true,
      },
    ],
  },
]

function normalizeForComparison(text: string): string {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim()
}

function isDuplicate(existing: any[], newEntry: ExpEntry): boolean {
  const newPos = normalizeForComparison(newEntry.position)
  for (const exp of existing) {
    const expPos = normalizeForComparison(exp.position || '')
    const expStart = String(exp.start_year || exp.year_start || '0')

    const posMatch = newPos.includes(expPos.substring(0, 15)) || expPos.includes(newPos.substring(0, 15))
    const yearMatch = Math.abs(parseInt(newEntry.start_year) - parseInt(expStart)) <= 1

    if (posMatch && yearMatch) return true
  }
  return false
}

async function main() {
  console.log('='.repeat(90))
  console.log(' FIX PRESIDENTIAL CANDIDATE DATA V2 - Additional research findings')
  console.log('='.repeat(90))

  let totalExpAdded = 0
  let totalEduFixed = 0
  let totalEduAdded = 0
  let candidatesModified = 0

  for (const fix of FIXES) {
    if (!fix.eduFixes && !fix.newEdu && !fix.newExp) continue

    let candidates = await sql`
      SELECT id, full_name, slug, education_details, experience_details
      FROM candidates WHERE cargo = 'presidente' AND is_active = true
      AND slug = ${fix.slug} LIMIT 1
    `

    if (candidates.length === 0) {
      const parts = fix.slug.split('-')
      const search = `%${parts[0]}%`
      candidates = await sql`
        SELECT id, full_name, slug, education_details, experience_details
        FROM candidates WHERE cargo = 'presidente' AND is_active = true
        AND slug ILIKE ${search} LIMIT 1
      `
    }

    if (candidates.length === 0) {
      console.log(`  ✗ Not found: ${fix.slug}`)
      continue
    }

    const c = candidates[0]
    let edu = (c.education_details || []) as any[]
    let exp = (c.experience_details || []) as any[]
    const changes: string[] = []

    if (fix.eduFixes) {
      for (const ef of fix.eduFixes) {
        for (let i = 0; i < edu.length; i++) {
          if ((edu[i].degree || '').toUpperCase().includes(ef.matchDegree)) {
            edu[i] = { ...edu[i], ...ef.updates }
            changes.push(`  EDU FIX: ${edu[i].degree} → ${JSON.stringify(ef.updates)}`)
            totalEduFixed++
          }
        }
      }
    }

    if (fix.newEdu) {
      for (const newE of fix.newEdu) {
        const exists = edu.some(e =>
          normalizeForComparison(e.degree || '').includes(normalizeForComparison(newE.degree || '').substring(0, 15))
        )
        if (!exists) {
          edu.push(newE)
          changes.push(`  EDU ADD: ${newE.degree} (${newE.institution})`)
          totalEduAdded++
        } else {
          changes.push(`  EDU SKIP (dup): ${newE.degree}`)
        }
      }
    }

    if (fix.newExp) {
      for (const newE of fix.newExp) {
        if (!isDuplicate(exp, newE)) {
          exp.push(newE)
          changes.push(`  EXP ADD: ${newE.position} @ ${newE.organization} (${newE.start_year}-${newE.end_year || 'present'})`)
          totalExpAdded++
        } else {
          changes.push(`  EXP SKIP (dup): ${newE.position} (${newE.start_year})`)
        }
      }
    }

    if (changes.length > 0) {
      candidatesModified++
      console.log(`\n🔴 ${c.full_name} (${c.slug})`)
      for (const ch of changes) console.log(ch)

      await sql`
        UPDATE candidates SET
          education_details = ${JSON.stringify(edu)}::jsonb,
          experience_details = ${JSON.stringify(exp)}::jsonb
        WHERE id = ${c.id}
      `
      console.log(`  ✅ Saved (${edu.length} edu, ${exp.length} exp)`)
    }
  }

  console.log('\n' + '='.repeat(90))
  console.log(' SUMMARY')
  console.log('='.repeat(90))
  console.log(`  Candidates modified: ${candidatesModified}`)
  console.log(`  Education fixes: ${totalEduFixed}`)
  console.log(`  Education added: ${totalEduAdded}`)
  console.log(`  Experience added: ${totalExpAdded}`)
  console.log('='.repeat(90))
}

main().catch(console.error)
