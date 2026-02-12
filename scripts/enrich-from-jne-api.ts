/**
 * Enrich candidates with missing data from JNE Voto Informado API
 * API: https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida?idHojaVida={jne_id}
 *
 * Targets: political_trajectory, experience_details, education_details
 * for senador, diputado, parlamento_andino candidates
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : ''
const sql = neon(DATABASE_URL)

const JNE_API = 'https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida'
const DELAY_MS = 500 // 500ms between requests (conservative)
const BATCH_SIZE = 50
const MAX_RETRIES = 3

let totalProcessed = 0
let totalUpdated = 0
let totalNoNewData = 0
let totalErrors = 0
let trajectoryFilled = 0
let experienceFilled = 0
let educationFilled = 0

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchJNEData(jneId: string): Promise<any | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${JNE_API}?idHojaVida=${jneId}`, {
        headers: {
          'Accept': 'application/json',
          'Origin': 'https://votoinformado.jne.gob.pe',
          'Referer': 'https://votoinformado.jne.gob.pe/',
        },
      })
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) return null
      await delay(1000 * (attempt + 1))
    }
  }
  return null
}

function transformExperience(expArray: any[]): any[] {
  return expArray.map(exp => ({
    organization: exp.centroTrabajo || '',
    position: exp.ocupacionProfesion || '',
    start_year: exp.anioTrabajoDesde ? parseInt(exp.anioTrabajoDesde) : null,
    end_year: exp.anioTrabajoHasta ? parseInt(exp.anioTrabajoHasta) : null,
    ruc: exp.rucTrabajo || null,
    location: [exp.trabajoDepartamento, exp.trabajoProvincia, exp.trabajoDistrito].filter(Boolean).join(', '),
    country: exp.trabajoPais || 'PERU',
  })).filter(e => e.organization || e.position)
}

function transformTrajectory(trayectoria: any): any[] {
  const result: any[] = []

  // Cargos partidarios (party positions)
  if (trayectoria?.cargoPartidario?.length > 0) {
    for (const cp of trayectoria.cargoPartidario) {
      result.push({
        type: 'cargo_partidario',
        party: cp.organizacionPolitica || cp.partido || '',
        position: cp.cargoPartidario || cp.cargo || '',
        year_start: cp.anioDesde ? parseInt(cp.anioDesde) : null,
        year_end: cp.anioHasta ? parseInt(cp.anioHasta) : null,
        is_elected: false,
      })
    }
  }

  // Cargos de elección popular (elected positions)
  if (trayectoria?.cargoEleccion?.length > 0) {
    for (const ce of trayectoria.cargoEleccion) {
      result.push({
        type: 'cargo_electivo',
        party: ce.organizacionPolitica || ce.partido || '',
        position: ce.cargoEleccion || ce.cargo || '',
        year_start: ce.anioDesde ? parseInt(ce.anioDesde) : null,
        year_end: ce.anioHasta ? parseInt(ce.anioHasta) : null,
        is_elected: true,
      })
    }
  }

  return result.filter(t => t.party || t.position)
}

function transformEducation(formacion: any): any[] {
  const result: any[] = []

  // Educación técnica
  if (formacion?.educacionTecnico?.length > 0) {
    for (const et of formacion.educacionTecnico) {
      result.push({
        level: 'Técnico',
        institution: et.cenEstudioTecnico || '',
        degree: et.carreraTecnico || '',
        is_completed: et.concluidoEduTecnico === '1' || et.concluidoEduTecnico === 'SI',
      })
    }
  }

  // Educación no universitaria
  if (formacion?.educacionNoUniversitaria?.length > 0) {
    for (const enu of formacion.educacionNoUniversitaria) {
      result.push({
        level: 'Técnico',
        institution: enu.cenEstudioNoUniv || '',
        degree: enu.carreraNoUniv || '',
        is_completed: enu.concluidoNoUniv === '1' || enu.concluidoNoUniv === 'SI',
      })
    }
  }

  // Educación universitaria
  if (formacion?.educacionUniversitaria?.length > 0) {
    for (const eu of formacion.educacionUniversitaria) {
      result.push({
        level: 'Universitario',
        institution: eu.cenEstudioUniv || '',
        degree: eu.carreraUniv || '',
        is_completed: eu.concluidoEduUniv === '1' || eu.concluidoEduUniv === 'SI',
        has_bachelor: eu.bachiller === '1' || eu.bachiller === 'SI',
        has_title: eu.titulo === '1' || eu.titulo === 'SI',
        bachelor_year: eu.anioBachiller || null,
        title_year: eu.anioTitulo || null,
      })
    }
  }

  // Posgrado
  if (formacion?.educacionPosgrado?.length > 0) {
    for (const ep of formacion.educacionPosgrado) {
      result.push({
        level: 'Posgrado',
        institution: ep.cenEstudioPosgrado || '',
        degree: ep.especialidad || ep.carreraPosgrado || '',
        is_completed: ep.concluidoPosgrado === '1' || ep.concluidoPosgrado === 'SI',
        has_title: ep.titulo === '1' || ep.titulo === 'SI',
      })
    }
  }

  // Posgrado otro
  if (formacion?.educacionPosgradoOtro?.length > 0) {
    for (const epo of formacion.educacionPosgradoOtro) {
      result.push({
        level: 'Posgrado',
        institution: epo.cenEstudioPosgrado || epo.cenEstudio || '',
        degree: epo.especialidad || '',
        is_completed: epo.concluidoPosgrado === '1' || epo.concluidoPosgrado === 'SI',
      })
    }
  }

  return result.filter(e => e.institution || e.degree)
}

async function processCandidate(candidate: any): Promise<{
  updated: boolean
  trajFilled: boolean
  expFilled: boolean
  eduFilled: boolean
}> {
  const data = await fetchJNEData(candidate.jne_id)
  if (!data) {
    return { updated: false, trajFilled: false, expFilled: false, eduFilled: false }
  }

  let updated = false
  let trajFilled = false
  let expFilled = false
  let eduFilled = false

  // Update political trajectory if missing
  if (candidate.missing_trajectory) {
    const trajectory = transformTrajectory(data.trayectoria)
    if (trajectory.length > 0) {
      await sql`
        UPDATE candidates
        SET political_trajectory = ${JSON.stringify(trajectory)}::jsonb
        WHERE id = ${candidate.id}::uuid
      `
      trajFilled = true
      updated = true
    }
  }

  // Update experience if missing/empty
  if (candidate.missing_experience) {
    const experience = transformExperience(data.experienciaLaboral || [])
    if (experience.length > 0) {
      await sql`
        UPDATE candidates
        SET experience_details = ${JSON.stringify(experience)}::jsonb
        WHERE id = ${candidate.id}::uuid
      `
      expFilled = true
      updated = true
    }
  }

  // Update education if missing/empty
  if (candidate.missing_education) {
    const education = transformEducation(data.formacionAcademica)
    if (education.length > 0) {
      await sql`
        UPDATE candidates
        SET education_details = ${JSON.stringify(education)}::jsonb
        WHERE id = ${candidate.id}::uuid
      `
      eduFilled = true
      updated = true
    }
  }

  return { updated, trajFilled, expFilled, eduFilled }
}

async function enrichAll() {
  console.log('=== JNE API Enrichment: political_trajectory + experience + education ===\n')

  // Get all candidates needing enrichment
  const candidates = await sql`
    SELECT id, full_name, cargo, jne_id,
      CASE WHEN political_trajectory IS NULL THEN true ELSE false END as missing_trajectory,
      CASE WHEN experience_details IS NULL OR jsonb_array_length(experience_details) = 0 THEN true ELSE false END as missing_experience,
      CASE WHEN education_details IS NULL OR jsonb_array_length(education_details) = 0 THEN true ELSE false END as missing_education
    FROM candidates
    WHERE is_active = true
    AND jne_id IS NOT NULL
    AND cargo IN ('senador', 'diputado', 'parlamento_andino')
    AND (
      political_trajectory IS NULL
      OR experience_details IS NULL OR jsonb_array_length(experience_details) = 0
      OR education_details IS NULL OR jsonb_array_length(education_details) = 0
    )
    ORDER BY cargo, full_name
  `

  console.log(`Total candidates to process: ${candidates.length}`)

  // Count by type of missing data
  const missingTraj = candidates.filter((c: any) => c.missing_trajectory).length
  const missingExp = candidates.filter((c: any) => c.missing_experience).length
  const missingEdu = candidates.filter((c: any) => c.missing_education).length
  console.log(`  Missing trajectory: ${missingTraj}`)
  console.log(`  Missing experience: ${missingExp}`)
  console.log(`  Missing education: ${missingEdu}`)
  console.log()

  // Process in batches with rate limiting
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)

    // Process batch sequentially with delay (to respect rate limits)
    for (const candidate of batch) {
      try {
        await delay(DELAY_MS)
        const result = await processCandidate(candidate)
        totalProcessed++

        if (result.updated) {
          totalUpdated++
          if (result.trajFilled) trajectoryFilled++
          if (result.expFilled) experienceFilled++
          if (result.eduFilled) educationFilled++
        } else {
          totalNoNewData++
        }
      } catch (err) {
        totalErrors++
        if (totalErrors <= 5) {
          console.error(`  Error for ${candidate.full_name}: ${(err as Error).message}`)
        }
      }
    }

    const progress = Math.min(i + BATCH_SIZE, candidates.length)
    if (progress % 500 === 0 || progress === candidates.length) {
      console.log(`Progress: ${progress}/${candidates.length} | Updated: ${totalUpdated} | Traj: ${trajectoryFilled} | Exp: ${experienceFilled} | Edu: ${educationFilled} | NoData: ${totalNoNewData} | Err: ${totalErrors}`)
    }
  }

  console.log('\n=== ENRICHMENT RESULTS ===')
  console.log(`  Processed: ${totalProcessed}`)
  console.log(`  Updated: ${totalUpdated}`)
  console.log(`  Trajectory filled: ${trajectoryFilled}`)
  console.log(`  Experience filled: ${experienceFilled}`)
  console.log(`  Education filled: ${educationFilled}`)
  console.log(`  No new data from JNE: ${totalNoNewData}`)
  console.log(`  Errors: ${totalErrors}`)

  // Show final coverage
  const coverage = await sql`
    SELECT cargo,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE political_trajectory IS NOT NULL) as has_traj,
      COUNT(*) FILTER (WHERE experience_details IS NOT NULL AND jsonb_array_length(experience_details) > 0) as has_exp,
      COUNT(*) FILTER (WHERE education_details IS NOT NULL AND jsonb_array_length(education_details) > 0) as has_edu
    FROM candidates
    WHERE is_active = true AND cargo IN ('senador', 'diputado', 'parlamento_andino')
    GROUP BY cargo
    ORDER BY cargo
  `
  console.log('\n=== FINAL COVERAGE ===')
  for (const row of coverage) {
    console.log(`  ${row.cargo}:`)
    console.log(`    Trajectory: ${row.has_traj}/${row.total} (${((Number(row.has_traj)/Number(row.total))*100).toFixed(1)}%)`)
    console.log(`    Experience: ${row.has_exp}/${row.total} (${((Number(row.has_exp)/Number(row.total))*100).toFixed(1)}%)`)
    console.log(`    Education: ${row.has_edu}/${row.total} (${((Number(row.has_edu)/Number(row.total))*100).toFixed(1)}%)`)
  }
}

enrichAll()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal error:', err); process.exit(1) })
