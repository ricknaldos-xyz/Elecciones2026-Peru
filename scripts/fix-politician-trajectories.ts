/**
 * Fix Missing Political Trajectories for Major Politicians
 *
 * Based on audit findings - these politicians have severely incomplete
 * trajectory/experience data resulting in deflated competence scores.
 *
 * All data sourced from:
 * - congreso.gob.pe (official congressional records)
 * - Wikipedia (cross-referenced with official sources)
 * - JNE Voto Informado
 * - News sources (Infobae, El Comercio, RPP, La República)
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
if (!dbMatch) throw new Error('No DATABASE_URL')
const sql = neon(dbMatch[1])

interface TrajectoryEntry {
  type: string
  party?: string
  source: string
  position: string
  year_start?: number
  year_end?: number
  is_elected?: boolean
  institution?: string
}

interface ExperienceEntry {
  organization: string
  position: string
  year_start: number
  year_end?: number
  sector?: string
  source?: string
}

// ================================================================
// POLITICIAN DATA - All verified from public sources
// ================================================================

const POLITICIANS: Record<string, {
  namePattern: string
  trajectory: TrajectoryEntry[]
  experience: ExperienceEntry[]
  education_level?: string
  education_details_add?: any[]
}> = {
  'CHIABRA': {
    namePattern: '%CHIABRA LEON%ROBERTO%',
    trajectory: [
      {
        type: 'cargo_electivo',
        party: 'Renovación Popular',
        source: 'congreso.gob.pe',
        position: 'Congresista por Lima',
        year_start: 2021,
        year_end: 2026,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_publico',
        source: 'gob.pe',
        position: 'Ministro de Defensa',
        year_start: 2003,
        year_end: 2005,
        is_elected: false,
        institution: 'Ministerio de Defensa del Perú',
      },
      {
        type: 'cargo_militar',
        source: 'ejercito.mil.pe',
        position: 'Comandante General del Ejército del Perú',
        year_start: 2002,
        year_end: 2003,
        is_elected: false,
        institution: 'Ejército del Perú',
      },
    ],
    experience: [
      { organization: 'Congreso de la República', position: 'Congresista por Lima', year_start: 2021, year_end: 2026, sector: 'público' },
      { organization: 'Ministerio de Defensa del Perú', position: 'Ministro de Defensa', year_start: 2003, year_end: 2005, sector: 'público' },
      { organization: 'Ejército del Perú', position: 'Comandante General del Ejército', year_start: 2002, year_end: 2003, sector: 'público' },
      { organization: 'Ejército del Perú', position: 'General de División', year_start: 1966, year_end: 2003, sector: 'público' },
      { organization: 'Ejército del Perú', position: 'Jefe del Comando de Operaciones del Frente Ucayali (Guerra del Cenepa)', year_start: 1995, year_end: 1995, sector: 'público' },
    ],
  },

  'WILLIAMS': {
    namePattern: '%WILLIAMS ZAPATA%',
    trajectory: [
      {
        type: 'cargo_electivo',
        party: 'Avanza País',
        source: 'congreso.gob.pe',
        position: 'Congresista por Lima',
        year_start: 2021,
        year_end: 2026,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_electivo',
        party: 'Avanza País',
        source: 'congreso.gob.pe',
        position: 'Presidente del Congreso de la República',
        year_start: 2022,
        year_end: 2023,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_publico',
        source: 'caen.edu.pe',
        position: 'Director Académico del CAEN',
        year_start: 2009,
        year_end: 2012,
        is_elected: false,
        institution: 'Centro de Altos Estudios Nacionales (CAEN)',
      },
      {
        type: 'cargo_militar',
        source: 'ejercito.mil.pe',
        position: 'General de División del Ejército del Perú',
        year_start: 1968,
        year_end: 2003,
        is_elected: false,
        institution: 'Ejército del Perú',
      },
    ],
    experience: [
      { organization: 'Congreso de la República', position: 'Presidente del Congreso', year_start: 2022, year_end: 2023, sector: 'público' },
      { organization: 'Congreso de la República', position: 'Congresista por Lima', year_start: 2021, year_end: 2026, sector: 'público' },
      { organization: 'Centro de Altos Estudios Nacionales (CAEN)', position: 'Director Académico', year_start: 2009, year_end: 2012, sector: 'público' },
      { organization: 'Ejército del Perú', position: 'General de División - Comandó Operación Chavín de Huántar (1997)', year_start: 1968, year_end: 2003, sector: 'público' },
    ],
  },

  'CHAVEZ_MARTHA': {
    namePattern: '%CHAVEZ COSSIO%MARTHA%',
    education_level: 'Maestria',
    trajectory: [
      {
        type: 'cargo_electivo',
        party: 'Cambio Democrático - Juntos por el Perú',
        source: 'congreso.gob.pe',
        position: 'Congresista por Lima (CCD)',
        year_start: 1992,
        year_end: 1995,
        is_elected: true,
        institution: 'Congreso Constituyente Democrático',
      },
      {
        type: 'cargo_electivo',
        party: 'Nueva Mayoría',
        source: 'congreso.gob.pe',
        position: 'Congresista por Lima - Presidenta del Congreso 1995-1996',
        year_start: 1995,
        year_end: 2000,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_electivo',
        party: 'Nueva Mayoría',
        source: 'congreso.gob.pe',
        position: 'Congresista por Lima',
        year_start: 2000,
        year_end: 2001,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_electivo',
        party: 'Alianza Electoral Unidad Nacional',
        source: 'congreso.gob.pe',
        position: 'Congresista por Lima',
        year_start: 2001,
        year_end: 2006,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_electivo',
        party: 'Fuerza 2011',
        source: 'congreso.gob.pe',
        position: 'Congresista por Lima',
        year_start: 2011,
        year_end: 2016,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_electivo',
        party: 'Fuerza Popular',
        source: 'congreso.gob.pe',
        position: 'Congresista por Lima',
        year_start: 2020,
        year_end: 2021,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_partidario',
        party: 'Nueva Mayoría',
        source: 'jne',
        position: 'Secretaria General',
        year_start: 1998,
        year_end: 2004,
        is_elected: false,
      },
      {
        type: 'cargo_partidario',
        party: 'Nueva Mayoría',
        source: 'jne',
        position: 'Presidenta',
        year_start: 2004,
        year_end: 2011,
        is_elected: false,
      },
    ],
    experience: [
      { organization: 'Congreso Constituyente Democrático', position: 'Congresista (CCD)', year_start: 1992, year_end: 1995, sector: 'público' },
      { organization: 'Congreso de la República', position: 'Presidenta del Congreso (primera mujer)', year_start: 1995, year_end: 1996, sector: 'público' },
      { organization: 'Congreso de la República', position: 'Congresista por Lima', year_start: 1995, year_end: 2006, sector: 'público' },
      { organization: 'Congreso de la República', position: 'Congresista por Lima', year_start: 2011, year_end: 2016, sector: 'público' },
      { organization: 'Congreso de la República', position: 'Congresista por Lima', year_start: 2020, year_end: 2021, sector: 'público' },
    ],
  },

  'PORTALATINO': {
    namePattern: '%PORTALATINO%KELLY%',
    trajectory: [
      {
        type: 'cargo_electivo',
        party: 'Perú Libre',
        source: 'congreso.gob.pe',
        position: 'Congresista por Áncash',
        year_start: 2021,
        year_end: 2026,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_publico',
        source: 'gob.pe',
        position: 'Ministra de Salud',
        year_start: 2022,
        year_end: 2022,
        is_elected: false,
        institution: 'Ministerio de Salud (MINSA)',
      },
    ],
    experience: [
      { organization: 'Congreso de la República', position: 'Congresista por Áncash', year_start: 2021, year_end: 2026, sector: 'público' },
      { organization: 'Ministerio de Salud (MINSA)', position: 'Ministra de Salud', year_start: 2022, year_end: 2022, sector: 'público' },
    ],
  },

  'SOTO_ALEJANDRO': {
    namePattern: '%SOTO REYES%ALEJANDRO%',
    trajectory: [
      {
        type: 'cargo_electivo',
        party: 'Alianza para el Progreso',
        source: 'congreso.gob.pe',
        position: 'Congresista por Cusco',
        year_start: 2021,
        year_end: 2026,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_electivo',
        party: 'Alianza para el Progreso',
        source: 'congreso.gob.pe',
        position: 'Presidente del Congreso de la República',
        year_start: 2023,
        year_end: 2024,
        is_elected: true,
        institution: 'Congreso de la República',
      },
    ],
    experience: [
      { organization: 'Congreso de la República', position: 'Presidente del Congreso', year_start: 2023, year_end: 2024, sector: 'público' },
      { organization: 'Congreso de la República', position: 'Congresista por Cusco', year_start: 2021, year_end: 2026, sector: 'público' },
    ],
  },

  'BELLIDO': {
    namePattern: '%BELLIDO UGARTE%GUIDO%',
    trajectory: [
      {
        type: 'cargo_electivo',
        party: 'Perú Libre',
        source: 'congreso.gob.pe',
        position: 'Congresista por Cusco',
        year_start: 2021,
        year_end: 2026,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_publico',
        source: 'gob.pe',
        position: 'Presidente del Consejo de Ministros (PCM)',
        year_start: 2021,
        year_end: 2021,
        is_elected: false,
        institution: 'Presidencia del Consejo de Ministros',
      },
    ],
    experience: [
      { organization: 'Congreso de la República', position: 'Congresista por Cusco', year_start: 2021, year_end: 2026, sector: 'público' },
      { organization: 'Presidencia del Consejo de Ministros', position: 'Presidente del Consejo de Ministros (PCM)', year_start: 2021, year_end: 2021, sector: 'público' },
    ],
  },

  'OLIVERA': {
    namePattern: '%OLIVERA VEGA%FERNANDO%',
    education_level: 'Maestria',
    education_details_add: [
      {
        level: 'Maestria',
        institution: 'Universidad Complutense de Madrid',
        degree: 'Maestría en Relaciones Internacionales',
        is_completed: true,
        year: 2008,
        source: 'congreso.gob.pe',
      },
    ],
    trajectory: [
      {
        type: 'cargo_electivo',
        source: 'congreso.gob.pe',
        position: 'Diputado',
        year_start: 1985,
        year_end: 1990,
        is_elected: true,
        institution: 'Cámara de Diputados',
      },
      {
        type: 'cargo_electivo',
        source: 'congreso.gob.pe',
        position: 'Diputado',
        year_start: 1990,
        year_end: 1992,
        is_elected: true,
        institution: 'Cámara de Diputados',
      },
      {
        type: 'cargo_electivo',
        party: 'Frente Independiente Moralizador (FIM)',
        source: 'congreso.gob.pe',
        position: 'Congresista por Lima',
        year_start: 1995,
        year_end: 2001,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_electivo',
        party: 'Frente Independiente Moralizador (FIM)',
        source: 'congreso.gob.pe',
        position: 'Congresista por Lima',
        year_start: 2001,
        year_end: 2002,
        is_elected: true,
        institution: 'Congreso de la República',
      },
      {
        type: 'cargo_publico',
        source: 'gob.pe',
        position: 'Ministro de Relaciones Exteriores',
        year_start: 2005,
        year_end: 2005,
        is_elected: false,
        institution: 'Ministerio de Relaciones Exteriores',
      },
      {
        type: 'cargo_publico',
        source: 'gob.pe',
        position: 'Embajador del Perú en España',
        year_start: 2002,
        year_end: 2005,
        is_elected: false,
        institution: 'Embajada del Perú en España',
      },
    ],
    experience: [
      { organization: 'Cámara de Diputados', position: 'Diputado', year_start: 1985, year_end: 1992, sector: 'público' },
      { organization: 'Congreso de la República', position: 'Congresista por Lima', year_start: 1995, year_end: 2002, sector: 'público' },
      { organization: 'Embajada del Perú en España', position: 'Embajador', year_start: 2002, year_end: 2005, sector: 'público' },
      { organization: 'Ministerio de Relaciones Exteriores', position: 'Ministro de Relaciones Exteriores', year_start: 2005, year_end: 2005, sector: 'público' },
    ],
  },
}

async function main() {
  console.log('='.repeat(80))
  console.log(' FIX POLITICIAN TRAJECTORIES')
  console.log('='.repeat(80))

  for (const [key, data] of Object.entries(POLITICIANS)) {
    console.log(`\n--- ${key} ---`)

    const candidates = await sql`
      SELECT id, full_name, cargo, political_trajectory, experience_details,
             education_level, education_details
      FROM candidates
      WHERE is_active = true
      AND full_name ILIKE ${data.namePattern}
    `

    if (candidates.length === 0) {
      console.log(`  No candidates found for pattern: ${data.namePattern}`)
      continue
    }

    console.log(`  Found ${candidates.length} records`)

    for (const c of candidates) {
      // Merge trajectory (keep existing JNE entries, add missing ones)
      const existingTraj = Array.isArray(c.political_trajectory) ? c.political_trajectory : []
      const newTraj = [...existingTraj]

      for (const entry of data.trajectory) {
        const exists = existingTraj.some((e: any) =>
          e.position === entry.position && e.year_start === entry.year_start
        )
        if (!exists) {
          newTraj.push(entry)
        }
      }

      // Merge experience (keep existing, add missing)
      const existingExp = Array.isArray(c.experience_details) ? c.experience_details : []
      const newExp = [...existingExp]

      for (const entry of data.experience) {
        const exists = existingExp.some((e: any) =>
          e.organization === entry.organization && e.year_start === entry.year_start
        )
        if (!exists) {
          newExp.push(entry)
        }
      }

      // Build update query
      let updateFields = `
        political_trajectory = ${JSON.stringify(newTraj)}::jsonb,
        experience_details = ${JSON.stringify(newExp)}::jsonb
      `

      // Update education if specified
      if (data.education_level) {
        await sql`
          UPDATE candidates
          SET political_trajectory = ${JSON.stringify(newTraj)}::jsonb,
              experience_details = ${JSON.stringify(newExp)}::jsonb,
              education_level = ${data.education_level}
          WHERE id = ${c.id}::uuid
        `
      } else {
        await sql`
          UPDATE candidates
          SET political_trajectory = ${JSON.stringify(newTraj)}::jsonb,
              experience_details = ${JSON.stringify(newExp)}::jsonb
          WHERE id = ${c.id}::uuid
        `
      }

      // Add education details if specified
      if (data.education_details_add && data.education_details_add.length > 0) {
        const existingEdu = Array.isArray(c.education_details) ? c.education_details : []
        const newEdu = [...existingEdu]
        for (const entry of data.education_details_add) {
          const exists = existingEdu.some((e: any) =>
            e.institution === entry.institution && e.degree === entry.degree
          )
          if (!exists) {
            newEdu.push(entry)
          }
        }
        await sql`
          UPDATE candidates
          SET education_details = ${JSON.stringify(newEdu)}::jsonb
          WHERE id = ${c.id}::uuid
        `
      }

      const trajAdded = newTraj.length - existingTraj.length
      const expAdded = newExp.length - existingExp.length
      console.log(`  ${c.full_name} (${c.cargo}): +${trajAdded} trajectory, +${expAdded} experience${data.education_level ? `, edu→${data.education_level}` : ''}`)
    }
  }

  // Verify
  console.log('\n' + '='.repeat(80))
  console.log(' VERIFICATION')
  console.log('='.repeat(80))

  const verify = await sql`
    SELECT full_name, cargo,
      jsonb_array_length(COALESCE(political_trajectory, '[]'::jsonb)) as traj_count,
      jsonb_array_length(COALESCE(experience_details, '[]'::jsonb)) as exp_count,
      education_level
    FROM candidates
    WHERE is_active = true
    AND (
      full_name ILIKE '%CHIABRA LEON%'
      OR full_name ILIKE '%WILLIAMS ZAPATA%'
      OR full_name ILIKE '%CHAVEZ COSSIO%MARTHA%'
      OR full_name ILIKE '%PORTALATINO%'
      OR full_name ILIKE '%SOTO REYES%ALEJANDRO%'
      OR full_name ILIKE '%BELLIDO UGARTE%'
      OR full_name ILIKE '%OLIVERA VEGA%'
    )
    ORDER BY full_name
  `

  for (const v of verify) {
    console.log(`  ${v.full_name} (${v.cargo}): ${v.traj_count} traj, ${v.exp_count} exp, edu=${v.education_level}`)
  }

  console.log('\n=== DONE ===')
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
