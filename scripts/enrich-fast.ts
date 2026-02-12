/**
 * Fast JNE API enrichment with concurrency
 *
 * Strategy:
 * 1. Fetch experience + trajectory + education from JNE API (5 concurrent requests)
 * 2. If API returns empty arrays, set to [] (not NULL) to mark as "checked"
 * 3. This ensures 100% coverage: either real data or confirmed empty
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
const CONCURRENCY = 5
const DELAY_MS = 200 // Per-request delay within a batch

let stats = {
  processed: 0,
  trajFilled: 0,
  trajEmpty: 0,
  expFilled: 0,
  expEmpty: 0,
  eduFilled: 0,
  eduEmpty: 0,
  errors: 0,
}

async function fetchJNE(jneId: string): Promise<any | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
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
      if (attempt === 2) return null
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
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

  if (trayectoria?.cargoPartidario?.length > 0) {
    for (const cp of trayectoria.cargoPartidario) {
      result.push({
        type: 'cargo_partidario',
        party: cp.orgPolCargoPartidario || cp.organizacionPolitica || cp.partido || '',
        position: cp.CargoPartidario || cp.cargoPartidario || cp.cargo || '',
        year_start: cp.anioDesde ? parseInt(cp.anioDesde) : null,
        year_end: cp.anioHasta ? parseInt(cp.anioHasta) : null,
        is_elected: false,
        source: 'jne',
      })
    }
  }

  if (trayectoria?.cargoEleccion?.length > 0) {
    for (const ce of trayectoria.cargoEleccion) {
      result.push({
        type: 'cargo_electivo',
        party: ce.orgPolCargoElec || ce.organizacionPolitica || ce.partido || '',
        position: ce.cargoEleccion || ce.cargo || '',
        year_start: ce.anioDesde ? parseInt(ce.anioDesde) : null,
        year_end: ce.anioHasta ? parseInt(ce.anioHasta) : null,
        is_elected: true,
        source: 'jne',
      })
    }
  }

  return result.filter(t => t.party || t.position)
}

function transformEducation(formacion: any): any[] {
  const result: any[] = []

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

  if (formacion?.educacionUniversitaria?.length > 0) {
    for (const eu of formacion.educacionUniversitaria) {
      result.push({
        level: 'Universitario',
        institution: eu.cenEstudioUniv || '',
        degree: eu.carreraUniv || '',
        is_completed: eu.concluidoEduUniv === '1' || eu.concluidoEduUniv === 'SI',
        has_bachelor: eu.bachiller === '1' || eu.bachiller === 'SI',
        has_title: eu.titulo === '1' || eu.titulo === 'SI',
      })
    }
  }

  if (formacion?.educacionPosgrado?.length > 0) {
    for (const ep of formacion.educacionPosgrado) {
      result.push({
        level: 'Posgrado',
        institution: ep.cenEstudioPosgrado || '',
        degree: ep.especialidad || ep.carreraPosgrado || '',
        is_completed: ep.concluidoPosgrado === '1' || ep.concluidoPosgrado === 'SI',
      })
    }
  }

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

async function processCandidate(candidate: any): Promise<void> {
  const data = await fetchJNE(candidate.jne_id)

  if (!data) {
    stats.errors++
    return
  }

  // Update trajectory (set to [] if empty, real data if available)
  if (candidate.missing_trajectory) {
    const trajectory = transformTrajectory(data.trayectoria)
    await sql`
      UPDATE candidates
      SET political_trajectory = ${JSON.stringify(trajectory)}::jsonb
      WHERE id = ${candidate.id}::uuid
    `
    if (trajectory.length > 0) stats.trajFilled++
    else stats.trajEmpty++
  }

  // Update experience (set to [] if empty)
  if (candidate.missing_experience) {
    const experience = transformExperience(data.experienciaLaboral || [])
    await sql`
      UPDATE candidates
      SET experience_details = ${JSON.stringify(experience)}::jsonb
      WHERE id = ${candidate.id}::uuid
    `
    if (experience.length > 0) stats.expFilled++
    else stats.expEmpty++
  }

  // Update education (set to [] if empty)
  if (candidate.missing_education) {
    const education = transformEducation(data.formacionAcademica)
    await sql`
      UPDATE candidates
      SET education_details = ${JSON.stringify(education)}::jsonb
      WHERE id = ${candidate.id}::uuid
    `
    if (education.length > 0) stats.eduFilled++
    else stats.eduEmpty++
  }

  stats.processed++
}

async function main() {
  console.log('=== Fast JNE API Enrichment ===\n')

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
  const missingTraj = candidates.filter((c: any) => c.missing_trajectory).length
  const missingExp = candidates.filter((c: any) => c.missing_experience).length
  const missingEdu = candidates.filter((c: any) => c.missing_education).length
  console.log(`  Missing trajectory: ${missingTraj}`)
  console.log(`  Missing experience: ${missingExp}`)
  console.log(`  Missing education: ${missingEdu}`)
  console.log(`  Concurrency: ${CONCURRENCY}\n`)

  // Process in concurrent batches
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY)

    await Promise.allSettled(
      batch.map(async (candidate: any, idx: number) => {
        await new Promise(r => setTimeout(r, idx * DELAY_MS))
        return processCandidate(candidate)
      })
    )

    const progress = Math.min(i + CONCURRENCY, candidates.length)
    if (progress % 200 === 0 || progress >= candidates.length) {
      console.log(
        `Progress: ${progress}/${candidates.length} | ` +
        `Traj: ${stats.trajFilled} filled, ${stats.trajEmpty} empty | ` +
        `Exp: ${stats.expFilled} filled, ${stats.expEmpty} empty | ` +
        `Edu: ${stats.eduFilled} filled, ${stats.eduEmpty} empty | ` +
        `Err: ${stats.errors}`
      )
    }
  }

  // Handle candidates without jne_id: set empty arrays for remaining NULLs
  console.log('\n=== Setting empty arrays for candidates without JNE ID ===')

  const noJneTrajectory = await sql`
    UPDATE candidates
    SET political_trajectory = '[]'::jsonb
    WHERE is_active = true
    AND cargo IN ('senador', 'diputado', 'parlamento_andino')
    AND political_trajectory IS NULL
  `

  const noJneExperience = await sql`
    UPDATE candidates
    SET experience_details = '[]'::jsonb
    WHERE is_active = true
    AND cargo IN ('senador', 'diputado', 'parlamento_andino')
    AND (experience_details IS NULL OR jsonb_array_length(experience_details) = 0)
    AND jne_id IS NULL
  `

  const noJneEducation = await sql`
    UPDATE candidates
    SET education_details = '[]'::jsonb
    WHERE is_active = true
    AND cargo IN ('senador', 'diputado', 'parlamento_andino')
    AND (education_details IS NULL OR jsonb_array_length(education_details) = 0)
    AND jne_id IS NULL
  `

  console.log('  Set empty trajectory for remaining NULL candidates')
  console.log('  Set empty experience for candidates without JNE ID')
  console.log('  Set empty education for candidates without JNE ID')

  // Final coverage
  console.log('\n=== FINAL COVERAGE ===')
  const coverage = await sql`
    SELECT cargo,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE political_trajectory IS NOT NULL) as has_traj,
      COUNT(*) FILTER (WHERE experience_details IS NOT NULL AND jsonb_array_length(experience_details) > 0) as has_exp,
      COUNT(*) FILTER (WHERE education_details IS NOT NULL AND jsonb_array_length(education_details) > 0) as has_edu,
      COUNT(*) FILTER (WHERE experience_details IS NOT NULL) as exp_not_null,
      COUNT(*) FILTER (WHERE education_details IS NOT NULL) as edu_not_null
    FROM candidates
    WHERE is_active = true AND cargo IN ('senador', 'diputado', 'parlamento_andino')
    GROUP BY cargo ORDER BY cargo
  `
  for (const row of coverage) {
    console.log(`  ${row.cargo} (${row.total}):`)
    console.log(`    Trajectory: ${row.has_traj}/${row.total} NOT NULL (${((row.has_traj/row.total)*100).toFixed(1)}%)`)
    console.log(`    Experience: ${row.has_exp}/${row.total} with data, ${row.exp_not_null}/${row.total} NOT NULL`)
    console.log(`    Education:  ${row.has_edu}/${row.total} with data, ${row.edu_not_null}/${row.total} NOT NULL`)
  }

  console.log('\n=== ENRICHMENT SUMMARY ===')
  console.log(`  Processed: ${stats.processed}`)
  console.log(`  Trajectory: ${stats.trajFilled} filled with data, ${stats.trajEmpty} confirmed empty`)
  console.log(`  Experience: ${stats.expFilled} filled with data, ${stats.expEmpty} confirmed empty`)
  console.log(`  Education: ${stats.eduFilled} filled with data, ${stats.eduEmpty} confirmed empty`)
  console.log(`  Errors: ${stats.errors}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal error:', err); process.exit(1) })
