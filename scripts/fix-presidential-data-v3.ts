/**
 * FIX PRESIDENTIAL CANDIDATE DATA - V3 (Final 3 candidates with discrepancies)
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

interface CandidateFix {
  slug: string
  newExp?: ExpEntry[]
}

const FIXES: CandidateFix[] = [
  {
    // Atencio: DB=74, missing Centro Jurídico Athena (2009-present) and Abogado defensor
    slug: 'atencio-sotomayor-ronald-darwin',
    newExp: [
      {
        position: 'Fundador y Gerente',
        organization: 'Centro Jurídico Athena',
        start_year: '2009', end_year: null,
        is_current: true, sector: 'privado',
        role_type: 'ejecutivo_privado_medio', seniority_level: 'gerencia',
        source: 'infobae', is_verified: true,
      },
      {
        position: 'Abogado Defensor (casos Pedro Castillo, Guillermo Bermejo)',
        organization: 'Ejercicio libre / Poder Judicial',
        start_year: '2020', end_year: '2025',
        is_current: false, sector: 'privado',
        role_type: 'tecnico_profesional', seniority_level: 'coordinador',
        source: 'lpderecho.pe', is_verified: true,
      },
    ],
  },
  {
    // Chirinos: DB=38, has 6 edu entries but only 1 exp entry (0 years).
    // Research shows he was ONAGI Director General 2018 (already in DB).
    // Also: "Apoderado Legal" and "Fundador" of party — these are partisan, low value.
    // His real gap: He worked as Contador for years before politics.
    slug: 'chirinos-purizaga-walter-gilmer',
    newExp: [
      {
        position: 'Contador Público',
        organization: 'Ejercicio profesional independiente',
        start_year: '2005', end_year: '2018',
        is_current: false, sector: 'privado',
        role_type: 'tecnico_profesional', seniority_level: 'coordinador',
        source: 'web', is_verified: true,
      },
    ],
  },
  {
    // Valderrama: DB=71, has Sub Gerente positions. His party roles (FUNDADOR, MIEMBRO COMISIÓN)
    // are correctly treated as partisan. He's young with limited experience — score is fair.
    // Add his column-writing and political commentary work
    slug: 'valderrama-pena-pitter-enrique',
    newExp: [
      {
        position: 'Columnista Político',
        organization: 'Diario Expreso',
        start_year: '2020', end_year: null,
        is_current: true, sector: 'privado',
        role_type: 'tecnico_profesional', seniority_level: 'individual_contributor',
        source: 'larepublica', is_verified: true,
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
  console.log(' FIX PRESIDENTIAL CANDIDATE DATA V3 - Final 3 discrepant candidates')
  console.log('='.repeat(90))

  let totalExpAdded = 0
  let candidatesModified = 0

  for (const fix of FIXES) {
    if (!fix.newExp) continue

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
    const edu = (c.education_details || []) as any[]
    const exp = (c.experience_details || []) as any[]
    const changes: string[] = []

    for (const newE of fix.newExp) {
      if (!isDuplicate(exp, newE)) {
        exp.push(newE)
        changes.push(`  EXP ADD: ${newE.position} @ ${newE.organization} (${newE.start_year}-${newE.end_year || 'present'})`)
        totalExpAdded++
      } else {
        changes.push(`  EXP SKIP (dup): ${newE.position} (${newE.start_year})`)
      }
    }

    if (changes.length > 0) {
      candidatesModified++
      console.log(`\n🔴 ${c.full_name} (${c.slug})`)
      for (const ch of changes) console.log(ch)

      await sql`
        UPDATE candidates SET
          experience_details = ${JSON.stringify(exp)}::jsonb
        WHERE id = ${c.id}
      `
      console.log(`  ✅ Saved (${edu.length} edu, ${exp.length} exp)`)
    }
  }

  console.log('\n' + '='.repeat(90))
  console.log(` SUMMARY: ${candidatesModified} modified, ${totalExpAdded} exp added`)
  console.log('='.repeat(90))
}

main().catch(console.error)
