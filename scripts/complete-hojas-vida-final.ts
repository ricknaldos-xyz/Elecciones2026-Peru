/**
 * Completa las hojas de vida de todos los candidatos
 * Navega a cada hoja de vida por orgId/DNI y captura la respuesta de GetHVConsolidado
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'
import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return match ? match[1] : ''
}

const sql = neon(loadEnv())

const VOTO_INFORMADO_BASE = 'https://votoinformado.jne.gob.pe'
const DELAY_MS = 2500

interface CandidateInfo {
  id: string
  full_name: string
  dni: string
  orgId: number
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function setupBrowser(): Promise<{ browser: Browser; page: Page }> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

  return { browser, page }
}

// Step 1: Get org IDs from the main page and API response
async function getOrgMapping(page: Page): Promise<Map<string, number>> {
  console.log('\n📋 Paso 1: Obteniendo mapa DNI → Organización...')

  const dniToOrg = new Map<string, number>()

  page.on('response', async (response: HTTPResponse) => {
    const url = response.url()
    const method = response.request().method()

    if (url.includes('ListaCandidatos') && method === 'POST') {
      try {
        const text = await response.text()
        const data = JSON.parse(text)
        if (data?.data && Array.isArray(data.data)) {
          for (const c of data.data) {
            if (c.strDocumentoIdentidad && c.idOrganizacionPolitica) {
              dniToOrg.set(c.strDocumentoIdentidad, c.idOrganizacionPolitica)
            }
          }
        }
      } catch (e) {}
    }
  })

  await page.goto(`${VOTO_INFORMADO_BASE}/presidente-vicepresidentes`, {
    waitUntil: 'networkidle2',
    timeout: 60000
  })

  await delay(5000)

  console.log(`  Candidatos mapeados: ${dniToOrg.size}`)
  return dniToOrg
}

// Step 2: Get candidates needing update from DB
async function getCandidatesToComplete(dniToOrg: Map<string, number>): Promise<CandidateInfo[]> {
  const candidates = await sql`
    SELECT id, full_name, dni
    FROM candidates
    WHERE cargo IN ('presidente', 'vicepresidente')
    AND dni IS NOT NULL AND dni <> ''
    AND (
      education_details IS NULL
      OR jsonb_array_length(education_details) = 0
    )
    ORDER BY full_name
  `

  const result: CandidateInfo[] = []

  for (const c of candidates) {
    const orgId = dniToOrg.get(c.dni)
    if (orgId) {
      result.push({
        id: c.id,
        full_name: c.full_name,
        dni: c.dni,
        orgId
      })
    }
  }

  return result
}

// Step 3: Navigate to hoja de vida and capture data
async function captureHojaVida(page: Page, orgId: number, dni: string): Promise<any | null> {
  let hvData: any = null

  const handler = async (response: HTTPResponse) => {
    const url = response.url()
    const method = response.request().method()

    if (url.includes('GetHVConsolidado') && method === 'POST') {
      try {
        const text = await response.text()
        const parsed = JSON.parse(text)
        if (parsed.data && parsed.success !== false) {
          hvData = parsed.data
        }
      } catch (e) {}
    }
  }

  page.on('response', handler)

  try {
    await page.goto(`${VOTO_INFORMADO_BASE}/hoja-vida/${orgId}/${dni}`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await delay(4000)
  } catch (e) {
    console.log(`    Error navegando: ${e}`)
  } finally {
    page.off('response', handler)
  }

  return hvData
}

// Parse education from all levels
function parseAllEducation(data: any): any[] {
  const education: any[] = []

  // Basic education
  if (data.oEduBasica) {
    const b = data.oEduBasica
    if (b.strEduPrimaria === '1') {
      education.push({
        level: 'Primaria',
        institution: '',
        degree: 'Educación Primaria',
        is_completed: b.strConcluidoEduPrimaria === '1',
        source: 'jne'
      })
    }
    if (b.strEduSecundaria === '1') {
      education.push({
        level: 'Secundaria',
        institution: '',
        degree: 'Educación Secundaria',
        is_completed: b.strConcluidoEduSecundaria === '1',
        source: 'jne'
      })
    }
  }

  // Technical education
  if (data.oEduTecnico) {
    const t = data.oEduTecnico
    if (t.strEduTecnico === '1' || t.strTengoEduTecnico === '1') {
      education.push({
        level: 'Técnico',
        institution: t.strCenEstudioTecnico || '',
        degree: t.strCarreraTecnico || '',
        is_completed: t.strConcluidoEduTecnico === '1',
        source: 'jne'
      })
    }
  }

  // University education
  if (data.lEduUniversitaria && Array.isArray(data.lEduUniversitaria)) {
    for (const u of data.lEduUniversitaria) {
      education.push({
        level: 'Universitario',
        institution: u.strUniversidad || '',
        degree: u.strCarreraUni || '',
        is_completed: u.strConcluidoEduUni === '1',
        has_bachelor: u.strBachillerEduUni === '1',
        has_title: u.strTituloUni === '1',
        bachelor_year: u.strAnioBachiller || null,
        title_year: u.strAnioTitulo || null,
        source: 'jne'
      })
    }
  }

  // Postgraduate
  if (data.lEduPosgrado && Array.isArray(data.lEduPosgrado)) {
    for (const p of data.lEduPosgrado) {
      education.push({
        level: p.strEsMaestro === '1' ? 'Maestría' : p.strEsDoctor === '1' ? 'Doctorado' : 'Posgrado',
        institution: p.strCenEstudioPosgrado || '',
        degree: p.strEspecialidadPosgrado || '',
        is_completed: p.strConcluidoPosgrado === '1',
        year: p.strAnioPosgrado || null,
        source: 'jne'
      })
    }
  }

  return education.filter(e => e.level || e.institution || e.degree)
}

// Parse work experience
function parseExperience(data: any): any[] {
  if (!data.lExperienciaLaboral || !Array.isArray(data.lExperienciaLaboral)) return []

  return data.lExperienciaLaboral.map((e: any) => ({
    organization: e.strCentroTrabajo || '',
    position: e.strOcupacionProfesion || '',
    start_year: e.strAnioTrabajoDesde || null,
    end_year: e.strAnioTrabajoHasta || null,
    is_current: !e.strAnioTrabajoHasta || e.strAnioTrabajoHasta === '',
    country: e.strTrabajoPais || 'Perú',
    department: e.strTrabajoDepartamento || '',
    source: 'jne'
  })).filter((e: any) => e.organization || e.position)
}

// Parse political trajectory
function parsePolitical(data: any): any[] {
  const trajectory: any[] = []

  // Party positions
  if (data.lCargoPartidario && Array.isArray(data.lCargoPartidario)) {
    for (const c of data.lCargoPartidario) {
      trajectory.push({
        type: 'partidario',
        party: c.strOrgPolCargoPartidario || '',
        position: c.strCargoPartidario || '',
        start_year: c.strAnioCargoPartiDesde || null,
        end_year: c.strAnioCargoPartiHasta || null,
        is_elected: false,
        source: 'jne'
      })
    }
  }

  // Electoral positions
  if (data.lCargoEleccion && Array.isArray(data.lCargoEleccion)) {
    for (const c of data.lCargoEleccion) {
      trajectory.push({
        type: 'eleccion',
        position: c.strCargoEleccion || '',
        is_elected: true,
        source: 'jne'
      })
    }
  }

  return trajectory.filter(t => t.party || t.position)
}

// Parse sentences
function parseSentences(items: any[]): any[] {
  if (!items || !Array.isArray(items)) return []

  return items.map((s: any) => ({
    expediente: s.strExpedientePenal || s.strExpedienteObliga || '',
    delito: s.strDelito || s.strMateria || '',
    juzgado: s.strJuzgado || s.strJuzgadoObliga || '',
    pena: s.strPena || '',
    modalidad: s.strModalidad || '',
    monto: s.decMontoObliga || null,
    estado: s.strCumplimientoPena || s.strEstadoObliga || '',
    source: 'jne'
  })).filter(s => s.expediente || s.delito)
}

// Parse party resignations
function parseResignations(data: any): number {
  if (!data.lRenunciaOP || !Array.isArray(data.lRenunciaOP)) return 0
  return data.lRenunciaOP.length
}

// Parse assets declaration
function parseAssets(data: any): any {
  const assets: any = { source: 'jne' }

  // Income
  if (data.oIngresos) {
    const i = data.oIngresos
    assets.public_salary = parseFloat(i.decRemuBrutaPublico) || 0
    assets.private_salary = parseFloat(i.decRemuBrutaPrivado) || 0
    assets.public_rent = parseFloat(i.decRentaIndividualPublico) || 0
    assets.private_rent = parseFloat(i.decRentaIndividualPrivado) || 0
    assets.other_public = parseFloat(i.decOtroIngresoPublico) || 0
    assets.other_private = parseFloat(i.decOtroIngresoPrivado) || 0
    assets.total_income = assets.public_salary + assets.private_salary +
      assets.public_rent + assets.private_rent +
      assets.other_public + assets.other_private
    assets.income_year = i.strAnioIngresos || null
  }

  // Real estate
  if (data.lBienInmueble && Array.isArray(data.lBienInmueble)) {
    assets.real_estate_count = data.lBienInmueble.length
    assets.real_estate_total = data.lBienInmueble.reduce(
      (sum: number, b: any) => sum + (parseFloat(b.decAutovaluo) || parseFloat(b.decValor) || 0), 0
    )
  }

  // Vehicles
  if (data.lBienMueble && Array.isArray(data.lBienMueble)) {
    assets.vehicle_count = data.lBienMueble.length
    assets.vehicle_total = data.lBienMueble.reduce(
      (sum: number, b: any) => sum + (parseFloat(b.decValor) || 0), 0
    )
  }

  return assets
}

// Get the highest education level
function getHighestEducationLevel(education: any[]): string | null {
  const levels = ['Doctorado', 'Maestría', 'Posgrado', 'Universitario', 'Técnico', 'Secundaria', 'Primaria']
  for (const level of levels) {
    if (education.some(e => e.level === level)) return level
  }
  return null
}

// Update candidate in database
async function updateCandidate(
  candidateId: string,
  hvData: any,
  orgId: number,
  dni: string
): Promise<boolean> {
  const education = parseAllEducation(hvData)
  const experience = parseExperience(hvData)
  const political = parsePolitical(hvData)
  const penalSentences = parseSentences(hvData.lSentenciaPenal)
  const civilSentences = parseSentences(hvData.lSentenciaObliga)
  const resignations = parseResignations(hvData)
  const assets = parseAssets(hvData)
  const educationLevel = getHighestEducationLevel(education)

  // Get birth date if available
  let birthDate: string | null = null
  if (hvData.oDatosPersonales?.strFechaNacimiento) {
    const parts = hvData.oDatosPersonales.strFechaNacimiento.split('/')
    if (parts.length >= 3) {
      birthDate = `${parts[2].substring(0, 4)}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
  }

  // Get internal jne_id
  const jneId = hvData.oDatosPersonales?.idHojaVida?.toString() || null

  try {
    await sql`
      UPDATE candidates SET
        jne_id = COALESCE(${jneId}, jne_id),
        birth_date = COALESCE(${birthDate}::date, birth_date),
        education_level = COALESCE(${educationLevel}, education_level),
        education_details = ${JSON.stringify(education)}::jsonb,
        experience_details = ${JSON.stringify(experience)}::jsonb,
        political_trajectory = ${JSON.stringify(political)}::jsonb,
        penal_sentences = ${JSON.stringify(penalSentences)}::jsonb,
        civil_sentences = ${JSON.stringify(civilSentences)}::jsonb,
        party_resignations = ${resignations},
        assets_declaration = ${JSON.stringify(assets)}::jsonb,
        djhv_url = ${`${VOTO_INFORMADO_BASE}/hoja-vida/${orgId}/${dni}`},
        data_source = 'jne',
        data_verified = true,
        verification_date = NOW(),
        last_updated = NOW()
      WHERE id = ${candidateId}::uuid
    `
    return true
  } catch (error) {
    console.error('  Error actualizando BD:', error)
    return false
  }
}

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' COMPLETAR HOJAS DE VIDA - VERSIÓN FINAL '.padStart(50).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  const { browser, page } = await setupBrowser()

  try {
    // Step 1: Get org mapping
    const dniToOrg = await getOrgMapping(page)

    // Step 2: Get candidates needing update
    const candidates = await getCandidatesToComplete(dniToOrg)
    console.log(`\n📊 Candidatos con match para actualizar: ${candidates.length}`)

    if (candidates.length === 0) {
      console.log('\n✅ Todos los candidatos tienen datos completos')
      return
    }

    // Step 3: Process each candidate
    console.log('\n📋 Paso 3: Capturando hojas de vida...')

    let completed = 0
    let failed = 0

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i]
      console.log(`\n[${i + 1}/${candidates.length}] ${candidate.full_name}`)
      console.log(`  DNI: ${candidate.dni}, Org: ${candidate.orgId}`)

      // Capture hoja de vida
      const hvData = await captureHojaVida(page, candidate.orgId, candidate.dni)

      if (!hvData) {
        failed++
        console.log('  ⚠ No se capturaron datos')
        await delay(DELAY_MS)
        continue
      }

      // Parse and count
      const education = parseAllEducation(hvData)
      const experience = parseExperience(hvData)
      const political = parsePolitical(hvData)

      console.log(`  Educación: ${education.length}, Experiencia: ${experience.length}, Trayectoria: ${political.length}`)

      // Update database
      const success = await updateCandidate(candidate.id, hvData, candidate.orgId, candidate.dni)

      if (success) {
        completed++
        console.log('  ✓ Actualizado')
      } else {
        failed++
      }

      await delay(DELAY_MS)
    }

    console.log('\n' + '═'.repeat(70))
    console.log('RESUMEN')
    console.log('═'.repeat(70))
    console.log(`✓ Completados: ${completed}`)
    console.log(`✗ Fallidos: ${failed}`)

    // Final verification
    const [stats] = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN education_details IS NOT NULL AND jsonb_array_length(education_details) > 0 THEN 1 END) as with_edu,
        COUNT(CASE WHEN experience_details IS NOT NULL AND jsonb_array_length(experience_details) > 0 THEN 1 END) as with_exp
      FROM candidates
      WHERE cargo IN ('presidente', 'vicepresidente')
    `

    console.log(`\n📊 Estado actual:`)
    console.log(`  Total candidatos: ${stats.total}`)
    console.log(`  Con educación: ${stats.with_edu} (${((Number(stats.with_edu) / Number(stats.total)) * 100).toFixed(1)}%)`)
    console.log(`  Con experiencia: ${stats.with_exp} (${((Number(stats.with_exp) / Number(stats.total)) * 100).toFixed(1)}%)`)

  } finally {
    await browser.close()
    console.log('\n🔒 Navegador cerrado')
  }
}

main().catch(console.error)
