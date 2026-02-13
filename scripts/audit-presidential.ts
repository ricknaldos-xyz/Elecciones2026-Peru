/**
 * COMPREHENSIVE AUDIT: All Presidential Candidates (cargo='presidente')
 *
 * Checks for each candidate:
 * 1. JNE API data vs DB data (name, education, experience, sentences)
 * 2. education_level consistency with education_details
 * 3. experience match with API
 * 4. Candidates with jne_id=0 or NULL
 * 5. Penal/civil sentence consistency (source='jne' vs API sentenciaPenal/sentenciaObliga)
 *
 * Usage: npx tsx scripts/audit-presidential.ts
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const sql = neon(dbMatch![1])

// ----- Types -----
interface Issue {
  candidate: string
  slug: string
  category: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  detail: string
}

interface ApiData {
  datoGeneral?: any
  experienciaLaboral?: any[]
  formacionAcademica?: any
  trayectoria?: any
  renunciaEfectuada?: any[]
  sentenciaPenal?: any[]
  sentenciaObliga?: any[]
  declaracionJurada?: any
}

const issues: Issue[] = []

function addIssue(candidate: string, slug: string, category: string, severity: Issue['severity'], detail: string) {
  issues.push({ candidate, slug, category, severity, detail })
}

// ----- JNE API Fetch -----
async function fetchJneHojaVida(jneId: string): Promise<ApiData | null> {
  const url = `https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida?idHojaVida=${jneId}`
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://votoinformado.jne.gob.pe',
        'Referer': 'https://votoinformado.jne.gob.pe/',
      },
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ----- Education Helpers -----
function getHighestEducationFromApi(formacion: any): string {
  if (!formacion) return 'sin_informacion'

  // Check postgrad first
  const posgrado = formacion.educacionPosgrado || []
  const posgradoOtro = formacion.educacionPosgradoOtro || []
  const allPosgrado = [...posgrado, ...posgradoOtro]
  for (const p of allPosgrado) {
    const spec = (p.especialidadPosgrado || p.carreraPosgrado || '').toLowerCase()
    if (spec.includes('doctor') || p.esDoctor === 'SI' || p.esDoctor === '1') return 'Doctorado'
    if (spec.includes('maestr') || spec.includes('magist') || p.esMaestro === 'SI' || p.esMaestro === '1') return 'Maestria'
  }
  if (allPosgrado.length > 0) return 'Maestria'

  // University
  const uni = formacion.educacionUniversitaria || []
  if (uni.length > 0) {
    for (const u of uni) {
      if (u.tituloUni === 'SI' || u.tituloUni === '1') return 'Universitario (Titulo)'
      if (u.bachillerEduUni === 'SI' || u.bachillerEduUni === '1') return 'Universitario (Bachiller)'
      if (u.concluidoEduUni === 'SI' || u.concluidoEduUni === '1') return 'Universitario (Completo)'
    }
    return 'Universitario (Incompleto)'
  }

  // Non-university
  if ((formacion.educacionNoUniversitaria || []).length > 0) return 'No Universitario'

  // Technical
  if ((formacion.educacionTecnico || []).length > 0) return 'Tecnico'

  // Basic
  if (formacion.educacionBasica) {
    if (formacion.educacionBasica.concluidoEduSecundaria === 'SI') return 'Secundaria'
    if (formacion.educacionBasica.concluidoEduPrimaria === 'SI') return 'Primaria'
  }

  return 'sin_informacion'
}

function countApiEducationEntries(formacion: any): number {
  if (!formacion) return 0
  let count = 0
  if (formacion.educacionBasica?.eduPrimaria === 'SI') count++
  if (formacion.educacionBasica?.eduSecundaria === 'SI') count++
  count += (formacion.educacionTecnico || []).length
  count += (formacion.educacionNoUniversitaria || []).length
  count += (formacion.educacionUniversitaria || []).length
  count += (formacion.educacionPosgrado || []).length
  count += (formacion.educacionPosgradoOtro || []).length
  return count
}

function getDbHighestLevel(educationDetails: any[]): string {
  if (!educationDetails || educationDetails.length === 0) return 'sin_informacion'
  const levels = educationDetails.map((e: any) => (e.level || '').toLowerCase())
  if (levels.some(l => l.includes('doctorado'))) return 'Doctorado'
  if (levels.some(l => l.includes('maestr') || l.includes('magist'))) return 'Maestria'
  if (levels.some(l => l.includes('posgrado'))) return 'Posgrado'
  if (levels.some(l => l.includes('universit'))) {
    // Check if title
    const uniEntries = educationDetails.filter((e: any) => (e.level || '').toLowerCase().includes('universit'))
    if (uniEntries.some((e: any) => e.has_title)) return 'Universitario (Titulo)'
    if (uniEntries.some((e: any) => e.has_bachelor)) return 'Universitario (Bachiller)'
    if (uniEntries.some((e: any) => e.is_completed)) return 'Universitario (Completo)'
    return 'Universitario (Incompleto)'
  }
  if (levels.some(l => l.includes('no universit'))) return 'No Universitario'
  if (levels.some(l => l.includes('tecnic') || l.includes('técnic'))) return 'Tecnico'
  if (levels.some(l => l.includes('secundaria'))) return 'Secundaria'
  if (levels.some(l => l.includes('primaria'))) return 'Primaria'
  return 'sin_informacion'
}

// ----- Education Level vs Details Consistency -----
function checkEducationLevelConsistency(educationLevel: string | null, educationDetails: any[]): string | null {
  if (!educationLevel) {
    if (educationDetails && educationDetails.length > 0) {
      return `education_level is NULL but education_details has ${educationDetails.length} entries`
    }
    return null
  }

  if (!educationDetails || educationDetails.length === 0) {
    return `education_level="${educationLevel}" but education_details is empty`
  }

  const level = educationLevel.toLowerCase()
  const detailLevels = educationDetails.map((e: any) => (e.level || '').toLowerCase())

  // Check if education_level matches highest in details
  if (level.includes('doctorado') && !detailLevels.some(d => d.includes('doctorado'))) {
    return `education_level="${educationLevel}" but no Doctorado in education_details`
  }
  if ((level.includes('maestr') || level.includes('magist')) && !detailLevels.some(d => d.includes('maestr') || d.includes('magist') || d.includes('posgrado'))) {
    return `education_level="${educationLevel}" but no Maestria/Posgrado in education_details`
  }
  if (level.includes('universit') && !detailLevels.some(d => d.includes('universit') || d.includes('maestr') || d.includes('doctorado') || d.includes('posgrado'))) {
    return `education_level="${educationLevel}" but no university-level education in education_details`
  }

  return null
}

// ----- Main Audit -----
async function main() {
  console.log('='.repeat(80))
  console.log(' COMPREHENSIVE AUDIT: Presidential Candidates (cargo=presidente)')
  console.log(' Date: ' + new Date().toISOString())
  console.log('='.repeat(80))

  // Fetch all presidential candidates with full data
  const candidates = await sql`
    SELECT
      c.id, c.full_name, c.slug, c.jne_id, c.dni, c.data_source,
      c.education_level, c.education_details, c.experience_details,
      c.political_trajectory, c.penal_sentences, c.civil_sentences,
      c.party_resignations, c.assets_declaration, c.birth_date,
      c.photo_url, c.data_verified, c.is_active,
      p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `

  console.log(`\nTotal presidential candidates in DB: ${candidates.length}`)
  if (candidates.length < 30) {
    console.log(`\n  WARNING: Expected ~36 candidates, found only ${candidates.length}`)
  }

  // ============================================================
  // CHECK 4: Candidates with jne_id=0 or NULL
  // ============================================================
  console.log('\n' + '-'.repeat(80))
  console.log(' CHECK 4: Candidates with jne_id=0 or NULL')
  console.log('-'.repeat(80))

  const missingJneId = candidates.filter((c: any) => !c.jne_id || c.jne_id === '0' || c.jne_id === 'null' || c.jne_id === 'undefined')
  console.log(`\nCandidates missing JNE ID: ${missingJneId.length}`)
  for (const c of missingJneId) {
    console.log(`  - ${c.full_name} (slug=${c.slug}, jne_id=${c.jne_id}, dni=${c.dni})`)
    addIssue(c.full_name, c.slug, 'MISSING_JNE_ID', 'HIGH',
      `jne_id=${c.jne_id || 'NULL'} - cannot verify against JNE API. DNI=${c.dni}`)
  }

  // ============================================================
  // For each candidate with a valid jne_id, fetch API and compare
  // ============================================================
  console.log('\n' + '-'.repeat(80))
  console.log(' CHECKS 1,2,3,5: Per-candidate API comparison')
  console.log('-'.repeat(80))

  let apiSuccessCount = 0
  let apiFailCount = 0

  for (const c of candidates) {
    const hasJneId = c.jne_id && c.jne_id !== '0' && c.jne_id !== 'null' && c.jne_id !== 'undefined'
    console.log(`\n--- ${c.full_name} (jne_id=${c.jne_id || 'NONE'}) ---`)

    // ---- Check 2: education_level vs education_details consistency (no API needed) ----
    const eduDetails = c.education_details || []
    const eduLevelIssue = checkEducationLevelConsistency(c.education_level, eduDetails)
    if (eduLevelIssue) {
      console.log(`  [EDU_CONSISTENCY] ${eduLevelIssue}`)
      addIssue(c.full_name, c.slug, 'EDUCATION_CONSISTENCY', 'MEDIUM', eduLevelIssue)
    }

    // Also check: education_level matches the highest in education_details
    const dbHighest = getDbHighestLevel(eduDetails)
    if (c.education_level) {
      const levelNorm = c.education_level.toLowerCase()
      const highestNorm = dbHighest.toLowerCase()
      // Only flag if they are significantly different
      if (highestNorm.includes('doctorado') && !levelNorm.includes('doctorado')) {
        addIssue(c.full_name, c.slug, 'EDUCATION_LEVEL_MISMATCH', 'MEDIUM',
          `education_level="${c.education_level}" but highest in details is "${dbHighest}"`)
        console.log(`  [EDU_LEVEL_MISMATCH] education_level="${c.education_level}" vs details highest="${dbHighest}"`)
      } else if (highestNorm.includes('maestr') && !levelNorm.includes('maestr') && !levelNorm.includes('doctorado')) {
        addIssue(c.full_name, c.slug, 'EDUCATION_LEVEL_MISMATCH', 'MEDIUM',
          `education_level="${c.education_level}" but highest in details is "${dbHighest}"`)
        console.log(`  [EDU_LEVEL_MISMATCH] education_level="${c.education_level}" vs details highest="${dbHighest}"`)
      }
    }

    if (!hasJneId) {
      console.log(`  Skipping API checks (no valid jne_id)`)
      continue
    }

    // Fetch from API
    const apiData = await fetchJneHojaVida(c.jne_id)
    await delay(500) // Rate limiting

    if (!apiData || !apiData.datoGeneral) {
      apiFailCount++
      console.log(`  [API_FAIL] Could not fetch data from JNE API`)
      addIssue(c.full_name, c.slug, 'API_FETCH_FAIL', 'LOW',
        `JNE API returned no data for jne_id=${c.jne_id}`)
      continue
    }

    apiSuccessCount++
    const api = apiData

    // ---- Check 1a: Name match ----
    const apiName = `${api.datoGeneral.apellidoPaterno} ${api.datoGeneral.apellidoMaterno} ${api.datoGeneral.nombres}`.trim().toUpperCase()
    const dbName = c.full_name.toUpperCase()
    if (apiName !== dbName) {
      // Check partial match (some names have different formatting)
      const apiParts = apiName.split(/\s+/).filter(Boolean)
      const dbParts = dbName.split(/\s+/).filter(Boolean)
      const matchingParts = apiParts.filter(p => dbParts.includes(p))
      if (matchingParts.length < Math.min(apiParts.length, dbParts.length) * 0.6) {
        addIssue(c.full_name, c.slug, 'NAME_MISMATCH', 'HIGH',
          `DB="${dbName}" vs API="${apiName}"`)
        console.log(`  [NAME_MISMATCH] DB="${dbName}" vs API="${apiName}"`)
      } else {
        addIssue(c.full_name, c.slug, 'NAME_FORMAT_DIFF', 'LOW',
          `DB="${dbName}" vs API="${apiName}" (partial match)`)
        console.log(`  [NAME_FORMAT_DIFF] DB="${dbName}" vs API="${apiName}"`)
      }
    }

    // ---- Check 1b: DNI match ----
    if (api.datoGeneral.numeroDocumento && c.dni) {
      if (api.datoGeneral.numeroDocumento !== c.dni) {
        addIssue(c.full_name, c.slug, 'DNI_MISMATCH', 'HIGH',
          `DB dni="${c.dni}" vs API="${api.datoGeneral.numeroDocumento}"`)
        console.log(`  [DNI_MISMATCH] DB="${c.dni}" vs API="${api.datoGeneral.numeroDocumento}"`)
      }
    }

    // ---- Check 1c: Party match ----
    if (api.datoGeneral.organizacionPolitica && c.party_name) {
      const apiParty = api.datoGeneral.organizacionPolitica.toUpperCase().trim()
      const dbParty = c.party_name.toUpperCase().trim()
      if (apiParty !== dbParty && !apiParty.includes(dbParty) && !dbParty.includes(apiParty)) {
        addIssue(c.full_name, c.slug, 'PARTY_MISMATCH', 'MEDIUM',
          `DB party="${c.party_name}" vs API="${api.datoGeneral.organizacionPolitica}"`)
        console.log(`  [PARTY_MISMATCH] DB="${c.party_name}" vs API="${api.datoGeneral.organizacionPolitica}"`)
      }
    }

    // ---- Check 1d: Education count match ----
    const apiEduCount = countApiEducationEntries(api.formacionAcademica)
    const dbEduCount = (c.education_details || []).length
    if (Math.abs(apiEduCount - dbEduCount) > 1) {
      addIssue(c.full_name, c.slug, 'EDUCATION_COUNT_MISMATCH', 'MEDIUM',
        `DB has ${dbEduCount} education entries vs API has ${apiEduCount}`)
      console.log(`  [EDU_COUNT] DB=${dbEduCount} vs API=${apiEduCount}`)
    }

    // ---- Check 1e: Education highest level match ----
    const apiHighest = getHighestEducationFromApi(api.formacionAcademica)
    if (dbHighest !== 'sin_informacion' && apiHighest !== 'sin_informacion') {
      // Normalize for comparison
      const dbH = dbHighest.toLowerCase().replace(/[\(\)]/g, '').trim()
      const apiH = apiHighest.toLowerCase().replace(/[\(\)]/g, '').trim()
      if (!dbH.includes(apiH.split(' ')[0]) && !apiH.includes(dbH.split(' ')[0])) {
        addIssue(c.full_name, c.slug, 'EDUCATION_HIGHEST_MISMATCH', 'MEDIUM',
          `DB highest="${dbHighest}" vs API highest="${apiHighest}"`)
        console.log(`  [EDU_HIGHEST] DB="${dbHighest}" vs API="${apiHighest}"`)
      }
    }

    // ---- Check 3: Experience count match ----
    const apiExpCount = (api.experienciaLaboral || []).length
    const dbExpCount = (c.experience_details || []).length
    if (Math.abs(apiExpCount - dbExpCount) > 1) {
      addIssue(c.full_name, c.slug, 'EXPERIENCE_COUNT_MISMATCH', 'MEDIUM',
        `DB has ${dbExpCount} experience entries vs API has ${apiExpCount}`)
      console.log(`  [EXP_COUNT] DB=${dbExpCount} vs API=${apiExpCount}`)
    }

    // ---- Check 3b: Experience content match ----
    if (apiExpCount > 0 && dbExpCount > 0) {
      const apiOrgs = (api.experienciaLaboral || []).map((e: any) =>
        (e.centroTrabajo || '').toUpperCase().trim()
      ).filter(Boolean)
      const dbOrgs = (c.experience_details || []).map((e: any) =>
        (e.organization || '').toUpperCase().trim()
      ).filter(Boolean)

      // Check if at least 50% of API orgs are in DB
      const matchedOrgs = apiOrgs.filter((org: string) =>
        dbOrgs.some((dbOrg: string) =>
          org.includes(dbOrg) || dbOrg.includes(org) || levenshteinSimilarity(org, dbOrg) > 0.7
        )
      )
      if (matchedOrgs.length < apiOrgs.length * 0.5 && apiOrgs.length >= 2) {
        const missingOrgs = apiOrgs.filter((org: string) =>
          !dbOrgs.some((dbOrg: string) =>
            org.includes(dbOrg) || dbOrg.includes(org) || levenshteinSimilarity(org, dbOrg) > 0.7
          )
        )
        addIssue(c.full_name, c.slug, 'EXPERIENCE_CONTENT_MISMATCH', 'MEDIUM',
          `Only ${matchedOrgs.length}/${apiOrgs.length} API orgs found in DB. Missing: ${missingOrgs.slice(0, 3).join('; ')}`)
        console.log(`  [EXP_CONTENT] ${matchedOrgs.length}/${apiOrgs.length} API orgs matched. Missing: ${missingOrgs.slice(0, 3).join('; ')}`)
      }
    }

    // ---- Check 5: Penal sentences consistency ----
    const apiPenalCount = (api.sentenciaPenal || []).length
    const dbPenalSentences = c.penal_sentences || []
    const dbPenalJne = dbPenalSentences.filter((s: any) => s.source === 'jne')
    const dbPenalNonJne = dbPenalSentences.filter((s: any) => s.source !== 'jne')

    if (apiPenalCount !== dbPenalJne.length) {
      const severity = apiPenalCount > 0 && dbPenalJne.length === 0 ? 'HIGH' : 'MEDIUM'
      addIssue(c.full_name, c.slug, 'PENAL_SENTENCE_COUNT_MISMATCH', severity,
        `API sentenciaPenal=${apiPenalCount} vs DB penal_sentences(source=jne)=${dbPenalJne.length} (DB total=${dbPenalSentences.length}, non-JNE=${dbPenalNonJne.length})`)
      console.log(`  [PENAL_COUNT] API=${apiPenalCount} vs DB(jne)=${dbPenalJne.length} (total=${dbPenalSentences.length})`)
    }

    // Check penal detail match if both have entries
    if (apiPenalCount > 0) {
      for (const apiSent of api.sentenciaPenal!) {
        const apiExp = (apiSent.txExpedientePenal || apiSent.expedientePenal || '').trim()
        const apiDelito = (apiSent.txDelitoPenal || apiSent.delito || '').trim()
        const apiFallo = (apiSent.txFalloPenal || '').trim()
        const apiModalidad = (apiSent.txModalidad || '').trim()

        // Search in ALL DB penal entries (not just jne-sourced)
        const found = dbPenalSentences.some((db: any) => {
          const dbExp = db.expediente || db.case_number || ''
          const dbDelito = db.delito || db.sentence || db.type || ''
          return (dbExp && apiExp && (dbExp.includes(apiExp) || apiExp.includes(dbExp))) ||
            (dbDelito && apiDelito && (dbDelito.toLowerCase().includes(apiDelito.toLowerCase()) || apiDelito.toLowerCase().includes(dbDelito.toLowerCase())))
        })
        if (!found) {
          addIssue(c.full_name, c.slug, 'PENAL_SENTENCE_MISSING_IN_DB', 'HIGH',
            `API penal sentence not found in DB: exp="${apiExp}" delito="${apiDelito}" fallo="${apiFallo}" modalidad="${apiModalidad}"`)
          console.log(`  [PENAL_MISSING] API sentence not in DB: exp="${apiExp}" delito="${apiDelito}" fallo="${apiFallo}"`)
        }
      }
    }

    // ---- Check 5b: Civil sentences consistency ----
    const apiCivilCount = (api.sentenciaObliga || []).length
    const dbCivilSentences = c.civil_sentences || []
    const dbCivilJne = dbCivilSentences.filter((s: any) => s.source === 'jne')
    const dbCivilNonJne = dbCivilSentences.filter((s: any) => s.source !== 'jne')

    if (apiCivilCount !== dbCivilJne.length) {
      const severity = apiCivilCount > 0 && dbCivilJne.length === 0 ? 'HIGH' : 'MEDIUM'
      addIssue(c.full_name, c.slug, 'CIVIL_SENTENCE_COUNT_MISMATCH', severity,
        `API sentenciaObliga=${apiCivilCount} vs DB civil_sentences(source=jne)=${dbCivilJne.length} (DB total=${dbCivilSentences.length}, non-JNE=${dbCivilNonJne.length})`)
      console.log(`  [CIVIL_COUNT] API=${apiCivilCount} vs DB(jne)=${dbCivilJne.length} (total=${dbCivilSentences.length})`)
    }

    // Check civil detail match
    if (apiCivilCount > 0) {
      for (const apiSent of api.sentenciaObliga!) {
        const apiExp = (apiSent.txExpedienteObliga || apiSent.expedienteObliga || '').trim()
        const apiMateria = (apiSent.txMateria || apiSent.materia || '').trim()

        const found = dbCivilSentences.some((db: any) => {
          const dbExp = db.expediente || db.case_number || ''
          const dbDelito = db.delito || db.descripcion || db.tipo || ''
          return (dbExp && apiExp && (dbExp.includes(apiExp) || apiExp.includes(dbExp))) ||
            (dbDelito && apiMateria && (dbDelito.toLowerCase().includes(apiMateria.toLowerCase()) || apiMateria.toLowerCase().includes(dbDelito.toLowerCase())))
        })
        if (!found) {
          addIssue(c.full_name, c.slug, 'CIVIL_SENTENCE_MISSING_IN_DB', 'HIGH',
            `API civil sentence not found in DB: exp="${apiExp}" materia="${apiMateria}"`)
          console.log(`  [CIVIL_MISSING] API sentence not in DB: exp="${apiExp}" materia="${apiMateria}"`)
        }
      }
    }

    // ---- Check: party_resignations count ----
    const apiResignations = (api.renunciaEfectuada || []).length
    const dbResignations = c.party_resignations || 0
    if (apiResignations !== dbResignations) {
      addIssue(c.full_name, c.slug, 'RESIGNATION_COUNT_MISMATCH', 'LOW',
        `API renunciaEfectuada=${apiResignations} vs DB party_resignations=${dbResignations}`)
      console.log(`  [RESIGN_COUNT] API=${apiResignations} vs DB=${dbResignations}`)
    }

    // ---- Check: inscription status ----
    if (api.datoGeneral.estado && api.datoGeneral.estado !== 'INSCRITO') {
      addIssue(c.full_name, c.slug, 'NOT_INSCRIBED', 'HIGH',
        `API shows status="${api.datoGeneral.estado}" (not INSCRITO)`)
      console.log(`  [STATUS] API shows: ${api.datoGeneral.estado}`)
    }

    // ---- Check: education_details missing postgrad from API educacionPosgradoOtro ----
    const apiPosgradoOtro = api.formacionAcademica?.educacionPosgradoOtro || []
    if (apiPosgradoOtro.length > 0) {
      const dbLevels = (c.education_details || []).map((e: any) => (e.level || '').toLowerCase())
      const hasPostgrad = dbLevels.some(l => l.includes('maestr') || l.includes('doctorado') || l.includes('posgrado'))
      if (!hasPostgrad) {
        const specs = apiPosgradoOtro.map((p: any) => p.txEspecialidadPosgradoOtro || p.especialidadPosgradoOtro || '?')
        addIssue(c.full_name, c.slug, 'EDUCATION_MISSING_POSTGRAD_OTRO', 'HIGH',
          `API has educacionPosgradoOtro (${specs.join(', ')}) but DB education_details has no postgrad entries`)
        console.log(`  [EDU_POSTGRAD_OTRO] API has postgrad entries not in DB: ${specs.join(', ')}`)
      }
    }

    console.log(`  API fetch OK. Status: ${api.datoGeneral.estado}`)
  }

  // ============================================================
  // CHECK: Bad slugs (UUIDs or photo GUIDs used as slugs)
  // ============================================================
  console.log('\n' + '-'.repeat(80))
  console.log(' CHECK: Bad slugs (GUID/photo-based slugs)')
  console.log('-'.repeat(80))

  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  for (const c of candidates) {
    if (UUID_PATTERN.test(c.slug) || c.slug.endsWith('-jpg') || c.slug.endsWith('-png')) {
      addIssue(c.full_name, c.slug, 'BAD_SLUG', 'MEDIUM',
        `Slug "${c.slug}" appears to be a GUID/photo filename, not a human-readable slug`)
      console.log(`  ${c.full_name}: slug="${c.slug}"`)
    }
  }

  // ============================================================
  // SUMMARY REPORT
  // ============================================================
  console.log('\n' + '='.repeat(80))
  console.log(' AUDIT SUMMARY REPORT')
  console.log('='.repeat(80))

  console.log(`\nTotal candidates audited: ${candidates.length}`)
  console.log(`API fetches successful: ${apiSuccessCount}`)
  console.log(`API fetches failed/skipped: ${apiFailCount + missingJneId.length}`)
  console.log(`Total issues found: ${issues.length}`)

  // Issues by severity
  const high = issues.filter(i => i.severity === 'HIGH')
  const medium = issues.filter(i => i.severity === 'MEDIUM')
  const low = issues.filter(i => i.severity === 'LOW')

  console.log(`\n  HIGH severity: ${high.length}`)
  console.log(`  MEDIUM severity: ${medium.length}`)
  console.log(`  LOW severity: ${low.length}`)

  // Issues by category
  console.log('\nIssues by category:')
  const categories = new Map<string, Issue[]>()
  for (const issue of issues) {
    const list = categories.get(issue.category) || []
    list.push(issue)
    categories.set(issue.category, list)
  }
  for (const [category, categoryIssues] of [...categories.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${category}: ${categoryIssues.length}`)
  }

  // ---- Detailed HIGH issues ----
  if (high.length > 0) {
    console.log('\n' + '-'.repeat(80))
    console.log(' HIGH SEVERITY ISSUES')
    console.log('-'.repeat(80))
    for (const issue of high) {
      console.log(`\n  [${issue.category}] ${issue.candidate} (${issue.slug})`)
      console.log(`    ${issue.detail}`)
    }
  }

  // ---- Detailed MEDIUM issues ----
  if (medium.length > 0) {
    console.log('\n' + '-'.repeat(80))
    console.log(' MEDIUM SEVERITY ISSUES')
    console.log('-'.repeat(80))
    for (const issue of medium) {
      console.log(`\n  [${issue.category}] ${issue.candidate} (${issue.slug})`)
      console.log(`    ${issue.detail}`)
    }
  }

  // ---- Detailed LOW issues ----
  if (low.length > 0) {
    console.log('\n' + '-'.repeat(80))
    console.log(' LOW SEVERITY ISSUES')
    console.log('-'.repeat(80))
    for (const issue of low) {
      console.log(`\n  [${issue.category}] ${issue.candidate} (${issue.slug})`)
      console.log(`    ${issue.detail}`)
    }
  }

  // ---- Per-candidate summary table ----
  console.log('\n' + '-'.repeat(80))
  console.log(' PER-CANDIDATE ISSUE COUNT')
  console.log('-'.repeat(80))
  console.log(`${'Candidate'.padEnd(50)} HIGH  MED  LOW  TOTAL`)
  console.log('-'.repeat(80))

  for (const c of candidates) {
    const cIssues = issues.filter(i => i.slug === c.slug)
    if (cIssues.length === 0) continue
    const cHigh = cIssues.filter(i => i.severity === 'HIGH').length
    const cMed = cIssues.filter(i => i.severity === 'MEDIUM').length
    const cLow = cIssues.filter(i => i.severity === 'LOW').length
    console.log(`${c.full_name.padEnd(50)} ${String(cHigh).padStart(4)}  ${String(cMed).padStart(3)}  ${String(cLow).padStart(3)}  ${String(cIssues.length).padStart(5)}`)
  }

  const cleanCandidates = candidates.filter((c: any) => !issues.some(i => i.slug === c.slug))
  if (cleanCandidates.length > 0) {
    console.log(`\nCandidates with NO issues (${cleanCandidates.length}):`)
    for (const c of cleanCandidates) {
      console.log(`  - ${c.full_name}`)
    }
  }

  // Save full report
  const report = {
    audit_date: new Date().toISOString(),
    total_candidates: candidates.length,
    api_success: apiSuccessCount,
    api_fail: apiFailCount,
    missing_jne_id: missingJneId.length,
    total_issues: issues.length,
    by_severity: { high: high.length, medium: medium.length, low: low.length },
    by_category: Object.fromEntries(categories),
    issues,
  }
  fs.writeFileSync('/tmp/presidential-audit-report.json', JSON.stringify(report, null, 2))
  console.log('\n\nFull JSON report saved to: /tmp/presidential-audit-report.json')
}

// ---- Utility: Levenshtein similarity ----
function levenshteinSimilarity(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0
  const maxLen = Math.max(a.length, b.length)
  const distance = levenshteinDistance(a, b)
  return 1 - distance / maxLen
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

main().catch(console.error)
