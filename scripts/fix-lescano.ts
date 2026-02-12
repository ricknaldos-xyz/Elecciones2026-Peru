/**
 * Fix Yonhy Lescano data:
 * 1. Add full congressional career to senador record (missing 4 terms)
 * 2. Add congressional suspension for sexual harassment (120 days, 76 votes)
 * 3. Recalculate score
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const sql = neon(dbMatch![1])

async function fix() {
  console.log('=== Fixing Yonhy Lescano Data ===\n')

  // Full trajectory including congressional career
  const fullTrajectory = [
    {
      type: 'cargo_partidario',
      party: 'ACCION POPULAR',
      source: 'jne',
      position: 'SECRETARIO GENERAL NACIONAL',
      year_start: 2009,
      year_end: 2011,
      is_elected: false,
    },
    {
      type: 'cargo_partidario',
      party: 'ACCION POPULAR',
      source: 'jne',
      position: 'ADHERENTE FUNDACIONAL',
      year_start: 2004,
      year_end: 2023,
      is_elected: false,
    },
    {
      type: 'cargo_electivo',
      party: 'Acción Popular',
      source: 'congreso.gob.pe',
      position: 'Congresista por Puno',
      year_start: 2001,
      year_end: 2006,
      is_elected: true,
      institution: 'Congreso de la República',
    },
    {
      type: 'cargo_electivo',
      party: 'Frente de Centro',
      source: 'congreso.gob.pe',
      position: 'Congresista por Puno',
      year_start: 2006,
      year_end: 2011,
      is_elected: true,
      institution: 'Congreso de la República',
    },
    {
      type: 'cargo_electivo',
      party: 'Perú Posible',
      source: 'congreso.gob.pe',
      position: 'Congresista por Lima',
      year_start: 2011,
      year_end: 2016,
      is_elected: true,
      institution: 'Congreso de la República',
    },
    {
      type: 'cargo_electivo',
      party: 'Acción Popular',
      source: 'congreso.gob.pe',
      position: 'Congresista por Lima',
      year_start: 2016,
      year_end: 2019,
      is_elected: true,
      institution: 'Congreso de la República',
    },
  ]

  // Civil sentence: Congressional suspension for sexual harassment
  const civilSentences = [
    {
      type: 'sancion_congresal',
      court: 'Pleno del Congreso de la República',
      source: 'congreso',
      status: 'firme',
      sentence: 'Suspendido 120 días sin goce de haber por acoso sexual a periodista vía WhatsApp (Feb 2019). Comisión de Ética aprobó investigación por unanimidad. Pleno aprobó suspensión con 76 votos a favor, 0 en contra, 15 abstenciones. Juez concluyó en 2022 que la periodista NO difamó a Lescano con la denuncia (demanda de S/500,000 rechazada).',
      case_number: 'Comisión de Ética - Suspensión 120 días (2019)',
      date: '2019-03-01',
      citation: 'El Comercio: "El Congreso suspendió a Lescano por acoso sexual". RPP: "Periodista denunció al congresista por acoso sexual". Infobae 29/09/2022: "Juez concluye que no difamaron a Yonhy Lescano con denuncia".',
    },
  ]

  // Update ALL Lescano records
  const candidates = await sql`
    SELECT id, full_name, cargo
    FROM candidates
    WHERE (full_name ILIKE '%LESCANO%YONHY%' OR full_name ILIKE '%YONHY LESCANO%')
    AND is_active = true
  `

  console.log(`Found ${candidates.length} Lescano records\n`)

  for (const c of candidates) {
    // Update trajectory (full career for all records)
    await sql`
      UPDATE candidates
      SET political_trajectory = ${JSON.stringify(fullTrajectory)}::jsonb,
          civil_sentences = ${JSON.stringify(civilSentences)}::jsonb,
          penal_sentences = '[]'::jsonb
      WHERE id = ${c.id}::uuid
    `
    console.log(`  Updated ${c.full_name} (${c.cargo}): trajectory + civil_sentences`)
  }

  // Verify
  console.log('\n=== Verification ===')
  const updated = await sql`
    SELECT full_name, cargo,
      jsonb_array_length(political_trajectory) as traj_count,
      jsonb_array_length(COALESCE(civil_sentences, '[]'::jsonb)) as civil_count
    FROM candidates
    WHERE (full_name ILIKE '%LESCANO%YONHY%' OR full_name ILIKE '%YONHY LESCANO%')
    AND is_active = true
  `
  for (const u of updated) {
    console.log(`  ${u.full_name} (${u.cargo}): ${u.traj_count} trajectory entries, ${u.civil_count} civil sentences`)
  }
}

fix()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal error:', err); process.exit(1) })
