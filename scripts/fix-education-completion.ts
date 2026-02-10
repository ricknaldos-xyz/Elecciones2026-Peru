/**
 * Fix Education Completion Status
 *
 * Fixes education_details JSONB entries where:
 * 1. is_completed=false but degree text indicates a completed degree
 *    (PROFESOR, BACHILLER, DOCTOR, LICENCIADO, ABOGADO, INGENIERO, etc.)
 * 2. Universitario entries with has_title=true or has_bachelor=true but is_completed=false
 *
 * Also normalizes entries that have graduation year data but is_completed=false.
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

// Load DATABASE_URL from .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

// Degree keywords that indicate completion
const COMPLETION_KEYWORDS = [
  'PROFESOR', 'PROFESORA',
  'BACHILLER',
  'DOCTOR', 'DOCTORA',
  'LICENCIADO', 'LICENCIADA',
  'ABOGADO', 'ABOGADA',
  'INGENIERO', 'INGENIERA',
  'CONTADOR', 'CONTADORA',
  'ARQUITECTO', 'ARQUITECTA',
  'ECONOMISTA',
  'ENFERMERO', 'ENFERMERA',
  'MEDICO', 'MÉDICO', 'MEDICA', 'MÉDICA',
  'CIRUJANO', 'CIRUJANA',
  'PSICOLOGO', 'PSICÓLOGA', 'PSICÓLOGO',
  'SOCIOLOGO', 'SOCIÓLOGA', 'SOCIÓLOGO',
  'OBSTETRA', 'OBSTETRIZ',
  'FARMACEUTICO', 'FARMACÉUTICO',
  'QUIMICO', 'QUÍMICO',
  'BIOLOGO', 'BIÓLOGO',
  'FISICO', 'FÍSICO',
  'MATEMATICO', 'MATEMÁTICO',
  'ESTADISTICO', 'ESTADÍSTICO',
  'ANTROPOLOGO', 'ANTROPÓLOGO',
  'FILOSOFO', 'FILÓSOFO',
  'HISTORIADOR', 'HISTORIADORA',
  'PERIODISTA',
  'COMUNICADOR', 'COMUNICADORA',
  'ADMINISTRADOR', 'ADMINISTRADORA',
  'NUTRICIONISTA',
  'ODONTOLOGO', 'ODONTÓLOGO',
  'VETERINARIO', 'VETERINARIA',
  'TECNOLOGO', 'TECNÓLOGO',
  'MAGISTER', 'MAGÍSTER',
  'MAESTRO', 'MAESTRA', // as in "Maestro en..."
  'TITULO PROFESIONAL', 'TÍTULO PROFESIONAL',
  'TITULADO', 'TITULADA',
  'DIPLOMADO', 'DIPLOMADA',
  'ESPECIALISTA',
  'GRADUADO', 'GRADUADA',
  'EGRESADO', 'EGRESADA', // egresado = graduated (completed studies but may not have degree)
]

// Build a regex pattern for matching (word boundary where possible)
function matchesCompletionKeyword(degree: string): string | null {
  const upper = degree.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const kw of COMPLETION_KEYWORDS) {
    const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Check if the keyword appears as a standalone word or at the start
    const regex = new RegExp(`\\b${kwNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (regex.test(upper)) {
      return kw
    }
  }
  return null
}

interface EducationEntry {
  level: string
  degree: string
  institution: string
  is_completed: boolean
  has_title?: boolean
  has_bachelor?: boolean
  title_year?: string | null
  bachelor_year?: string | null
  year?: string | null
  end_date?: string | null
  source?: string
  [key: string]: unknown
}

async function main() {
  console.log('=' .repeat(60))
  console.log(' FIX: Education Completion Status')
  console.log('=' .repeat(60))
  console.log()

  // Fetch all candidates with education_details
  const candidates = await sql`
    SELECT id, full_name, education_details
    FROM candidates
    WHERE education_details IS NOT NULL
      AND jsonb_array_length(education_details) > 0
    ORDER BY full_name
  `

  console.log(`Candidates with education data: ${candidates.length}`)
  console.log()

  let totalEntries = 0
  let totalFixed = 0
  let candidatesUpdated = 0
  const fixes: { name: string; degree: string; reason: string }[] = []

  for (const candidate of candidates) {
    const educationDetails = candidate.education_details as EducationEntry[]
    let modified = false

    for (const entry of educationDetails) {
      totalEntries++

      if (entry.is_completed) continue // Already marked as completed

      let fixReason: string | null = null

      // Check 1: Universitario with has_title=true or has_bachelor=true
      if (entry.level === 'Universitario') {
        if (entry.has_title === true) {
          fixReason = `has_title=true`
        } else if (entry.has_bachelor === true) {
          fixReason = `has_bachelor=true`
        } else if (entry.title_year) {
          fixReason = `title_year=${entry.title_year}`
        } else if (entry.bachelor_year) {
          fixReason = `bachelor_year=${entry.bachelor_year}`
        }
      }

      // Check 2: Has graduation year data (year, end_date)
      if (!fixReason && entry.year) {
        // Maestría/Posgrado with a year = likely completed
        if (entry.level === 'Maestría' || entry.level === 'Posgrado' || entry.level === 'Maestria') {
          fixReason = `year=${entry.year} (${entry.level})`
        }
      }

      // Check 3: Degree text contains completion keywords
      if (!fixReason && entry.degree) {
        const match = matchesCompletionKeyword(entry.degree)
        if (match) {
          // Extra check: exclude obvious "en curso" / "incompleto" cases
          const degreeLower = entry.degree.toLowerCase()
          if (degreeLower.includes('incompleto') || degreeLower.includes('en curso') || degreeLower.includes('no concluido') || degreeLower.includes('no egresado')) {
            // Skip - explicitly marked as incomplete in the text
          } else {
            fixReason = `degree contains "${match}"`
          }
        }
      }

      if (fixReason) {
        entry.is_completed = true
        modified = true
        totalFixed++
        fixes.push({
          name: candidate.full_name,
          degree: entry.degree || entry.level,
          reason: fixReason,
        })
      }
    }

    if (modified) {
      // Update the candidate's education_details in the database
      await sql`
        UPDATE candidates
        SET education_details = ${JSON.stringify(educationDetails)}::jsonb
        WHERE id = ${candidate.id}
      `
      candidatesUpdated++
    }
  }

  console.log('-'.repeat(60))
  console.log(`Total education entries scanned: ${totalEntries}`)
  console.log(`Entries fixed: ${totalFixed}`)
  console.log(`Candidates updated: ${candidatesUpdated}`)
  console.log()

  if (fixes.length > 0) {
    console.log('Fixes applied:')
    // Group by reason type
    const byReason: Record<string, number> = {}
    for (const f of fixes) {
      const key = f.reason.split(' ')[0] // First word of reason
      byReason[key] = (byReason[key] || 0) + 1
    }
    console.log()
    console.log('  By reason:')
    for (const [reason, count] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${reason}: ${count}`)
    }

    console.log()
    console.log('  Detailed list:')
    for (const f of fixes) {
      console.log(`    ${f.name}: "${f.degree}" (${f.reason})`)
    }
  }

  console.log()
  console.log('Done!')
}

main().catch(console.error)
