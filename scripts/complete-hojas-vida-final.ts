/**
 * Completa las hojas de vida de TODOS los candidatos (todos los cargos)
 * 1. Usa el API HTTP de JNE para obtener el mapeo DNI → orgId
 * 2. Usa Puppeteer para navegar cada hoja de vida y capturar GetHVConsolidado
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

const JNE_API_BASE = 'https://sije.jne.gob.pe/ServiciosWeb/WSCandidato'
const VOTO_INFORMADO_BASE = 'https://votoinformado.jne.gob.pe'
const PROCESO_ELECTORAL = 124
const DELAY_MS = 2500

// Tipos de elección en el JNE
const ELECTION_TYPES = [
  { id: 1, name: 'Presidencial', cargo: 'presidente' },
  { id: 2, name: 'Senadores', cargo: 'senador' },
  { id: 3, name: 'Diputados', cargo: 'diputado' },
  { id: 4, name: 'Parlamento Andino', cargo: 'parlamento_andino' },
]

interface CandidateInfo {
  id: string
  full_name: string
  dni: string
  orgId: number
  cargo: string
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

// Step 1: Capture auth token from Angular app, then get DNI → orgId mapping
async function getOrgMapping(page: Page): Promise<Map<string, number>> {
  console.log('\n  Paso 1: Capturando token de autenticacion...')

  // Navigate to votoinformado to capture auth token from Angular API calls
  let authToken = ''
  let userId = 0

  const requestHandler = (request: any) => {
    if (request.url().includes('ListaCandidatos') && request.method() === 'POST') {
      try {
        const body = JSON.parse(request.postData() || '{}')
        if (body.oToken) {
          authToken = body.oToken.AuthToken
          userId = body.oToken.UserId
        }
      } catch (e) {}
    }
  }

  page.on('request', requestHandler)

  // Navigate to /diputados to trigger ListaCandidatos and capture token
  await page.goto(`${VOTO_INFORMADO_BASE}/diputados`, {
    waitUntil: 'networkidle2',
    timeout: 60000
  })
  await delay(5000)

  page.off('request', requestHandler)

  if (!authToken) {
    console.log('  ERROR: No se capturo token de autenticacion')
    return new Map()
  }

  console.log(`  Token capturado: ${authToken.slice(0, 10)}...`)
  console.log('\n  Paso 2: Obteniendo mapa DNI -> Organizacion via API...')

  const dniToOrg = new Map<string, number>()

  // Helper to fetch candidates from API within browser context
  async function fetchCandidatesFromApi(typeId: number, deptCode: string): Promise<any[]> {
    return page.evaluate(
      async (token: string, uid: number, tId: number, dept: string, apiBase: string) => {
        try {
          const resp = await fetch(`${apiBase}/ListaCandidatos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              oToken: { AuthToken: token, UserId: uid },
              oFiltro: {
                idProcesoElectoral: 124,
                idTipoEleccion: tId,
                strUbiDepartamento: dept,
              }
            })
          })

          if (!resp.ok) return []
          const data = await resp.json()
          if (data.success === false) return []
          const items = Array.isArray(data) ? data :
            Array.isArray(data?.data) ? data.data :
            data?.lListaCandidato || []

          return items.map((item: any) => ({
            dni: item.strDocumentoIdentidad || '',
            orgId: item.idOrganizacionPolitica || 0,
          })).filter((c: any) => c.dni && c.orgId)
        } catch (e) {
          return []
        }
      },
      authToken, userId, typeId, deptCode, JNE_API_BASE
    )
  }

  // Senadores (idTipoEleccion=20, no dept filter needed)
  try {
    const senadores = await fetchCandidatesFromApi(20, '')
    for (const c of senadores) dniToOrg.set(c.dni, c.orgId)
    console.log(`    Senadores: ${senadores.length} candidatos`)
  } catch (error) {
    console.error(`    Senadores: Error - ${error}`)
  }
  await delay(500)

  // Parlamento Andino (idTipoEleccion=3, no dept filter needed)
  try {
    const parlamento = await fetchCandidatesFromApi(3, '')
    for (const c of parlamento) dniToOrg.set(c.dni, c.orgId)
    console.log(`    Parlamento Andino: ${parlamento.length} candidatos`)
  } catch (error) {
    console.error(`    Parlamento Andino: Error - ${error}`)
  }
  await delay(500)

  // Diputados (idTipoEleccion=15, need per-district queries)
  // Get district codes from the dropdown on the page
  const districtCodes: string[] = await page.$$eval('select option', (opts: any[]) =>
    opts.map(o => o.value).filter((v: string) => v && v.length > 0)
  )
  console.log(`    Diputados: consultando ${districtCodes.length} distritos...`)

  let diputadosTotal = 0
  for (const code of districtCodes) {
    try {
      const diputados = await fetchCandidatesFromApi(15, code)
      for (const c of diputados) dniToOrg.set(c.dni, c.orgId)
      diputadosTotal += diputados.length
    } catch (e) {}
    await delay(300)
  }
  console.log(`    Diputados: ${diputadosTotal} candidatos`)

  console.log(`  Total mapeados: ${dniToOrg.size}`)
  return dniToOrg
}

// Step 2: Get candidates needing asset data from DB
async function getCandidatesToComplete(dniToOrg: Map<string, number>): Promise<CandidateInfo[]> {
  const candidates = await sql`
    SELECT id, full_name, dni, cargo
    FROM candidates
    WHERE is_active = true
    AND dni IS NOT NULL AND dni <> ''
    AND (
      assets_declaration IS NULL
      OR assets_declaration = '{}'::jsonb
      OR assets_declaration = '{"source":"jne"}'::jsonb
      OR NOT (assets_declaration ? 'total_income')
    )
    ORDER BY
      CASE cargo
        WHEN 'presidente' THEN 1
        WHEN 'vicepresidente' THEN 2
        WHEN 'senador' THEN 3
        WHEN 'diputado' THEN 4
        WHEN 'parlamento_andino' THEN 5
      END,
      full_name
  `

  const result: CandidateInfo[] = []

  for (const c of candidates) {
    const orgId = dniToOrg.get(c.dni)
    if (orgId) {
      result.push({
        id: c.id,
        full_name: c.full_name,
        dni: c.dni,
        orgId,
        cargo: c.cargo,
      })
    }
  }

  return result
}

// Step 3: Navigate to hoja de vida and capture GetHVConsolidado data
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

  if (data.oEduBasica) {
    const b = data.oEduBasica
    if (b.strEduPrimaria === '1') {
      education.push({
        level: 'Primaria', institution: '', degree: 'Educacion Primaria',
        is_completed: b.strConcluidoEduPrimaria === '1', source: 'jne'
      })
    }
    if (b.strEduSecundaria === '1') {
      education.push({
        level: 'Secundaria', institution: '', degree: 'Educacion Secundaria',
        is_completed: b.strConcluidoEduSecundaria === '1', source: 'jne'
      })
    }
  }

  if (data.oEduTecnico) {
    const t = data.oEduTecnico
    if (t.strEduTecnico === '1' || t.strTengoEduTecnico === '1') {
      education.push({
        level: 'Tecnico', institution: t.strCenEstudioTecnico || '',
        degree: t.strCarreraTecnico || '', is_completed: t.strConcluidoEduTecnico === '1', source: 'jne'
      })
    }
  }

  if (data.lEduUniversitaria && Array.isArray(data.lEduUniversitaria)) {
    for (const u of data.lEduUniversitaria) {
      education.push({
        level: 'Universitario', institution: u.strUniversidad || '',
        degree: u.strCarreraUni || '', is_completed: u.strConcluidoEduUni === '1',
        has_bachelor: u.strBachillerEduUni === '1', has_title: u.strTituloUni === '1',
        bachelor_year: u.strAnioBachiller || null, title_year: u.strAnioTitulo || null, source: 'jne'
      })
    }
  }

  if (data.lEduPosgrado && Array.isArray(data.lEduPosgrado)) {
    for (const p of data.lEduPosgrado) {
      education.push({
        level: p.strEsMaestro === '1' ? 'Maestria' : p.strEsDoctor === '1' ? 'Doctorado' : 'Posgrado',
        institution: p.strCenEstudioPosgrado || '', degree: p.strEspecialidadPosgrado || '',
        is_completed: p.strConcluidoPosgrado === '1', year: p.strAnioPosgrado || null, source: 'jne'
      })
    }
  }

  return education.filter(e => e.level || e.institution || e.degree)
}

// Parse work experience
function parseExperience(data: any): any[] {
  if (!data.lExperienciaLaboral || !Array.isArray(data.lExperienciaLaboral)) return []

  return data.lExperienciaLaboral.map((e: any) => ({
    organization: e.strCentroTrabajo || '', position: e.strOcupacionProfesion || '',
    start_year: e.strAnioTrabajoDesde || null, end_year: e.strAnioTrabajoHasta || null,
    is_current: !e.strAnioTrabajoHasta || e.strAnioTrabajoHasta === '',
    country: e.strTrabajoPais || 'Peru', department: e.strTrabajoDepartamento || '', source: 'jne'
  })).filter((e: any) => e.organization || e.position)
}

// Parse political trajectory
function parsePolitical(data: any): any[] {
  const trajectory: any[] = []

  if (data.lCargoPartidario && Array.isArray(data.lCargoPartidario)) {
    for (const c of data.lCargoPartidario) {
      trajectory.push({
        type: 'partidario', party: c.strOrgPolCargoPartidario || '',
        position: c.strCargoPartidario || '',
        start_year: c.strAnioCargoPartiDesde || null, end_year: c.strAnioCargoPartiHasta || null,
        is_elected: false, source: 'jne'
      })
    }
  }

  if (data.lCargoEleccion && Array.isArray(data.lCargoEleccion)) {
    for (const c of data.lCargoEleccion) {
      trajectory.push({
        type: 'eleccion', position: c.strCargoEleccion || '', is_elected: true, source: 'jne'
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
    pena: s.strPena || '', modalidad: s.strModalidad || '',
    monto: s.decMontoObliga || null, estado: s.strCumplimientoPena || s.strEstadoObliga || '',
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

  if (data.lBienInmueble && Array.isArray(data.lBienInmueble)) {
    assets.real_estate_count = data.lBienInmueble.length
    assets.real_estate_total = data.lBienInmueble.reduce(
      (sum: number, b: any) => sum + (parseFloat(b.decAutovaluo) || parseFloat(b.decValor) || 0), 0
    )
  }

  if (data.lBienMueble && Array.isArray(data.lBienMueble)) {
    assets.vehicle_count = data.lBienMueble.length
    assets.vehicle_total = data.lBienMueble.reduce(
      (sum: number, b: any) => sum + (parseFloat(b.decValor) || 0), 0
    )
  }

  return assets
}

// Get highest education level
function getHighestEducationLevel(education: any[]): string | null {
  const levels = ['Doctorado', 'Maestria', 'Posgrado', 'Universitario', 'Tecnico', 'Secundaria', 'Primaria']
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

  let birthDate: string | null = null
  if (hvData.oDatosPersonales?.strFechaNacimiento) {
    const parts = hvData.oDatosPersonales.strFechaNacimiento.split('/')
    if (parts.length >= 3) {
      birthDate = `${parts[2].substring(0, 4)}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
  }

  const jneId = hvData.oDatosPersonales?.idHojaVida?.toString() || null

  try {
    await sql`
      UPDATE candidates SET
        jne_id = COALESCE(${jneId}, jne_id),
        birth_date = COALESCE(${birthDate}::date, birth_date),
        education_level = COALESCE(${educationLevel}, education_level),
        education_details = CASE
          WHEN ${education.length} > 0 THEN ${JSON.stringify(education)}::jsonb
          ELSE education_details
        END,
        experience_details = CASE
          WHEN ${experience.length} > 0 THEN ${JSON.stringify(experience)}::jsonb
          ELSE experience_details
        END,
        political_trajectory = CASE
          WHEN ${political.length} > 0 THEN ${JSON.stringify(political)}::jsonb
          ELSE political_trajectory
        END,
        penal_sentences = CASE
          WHEN ${penalSentences.length} > 0 THEN ${JSON.stringify(penalSentences)}::jsonb
          ELSE penal_sentences
        END,
        civil_sentences = CASE
          WHEN ${civilSentences.length} > 0 THEN ${JSON.stringify(civilSentences)}::jsonb
          ELSE civil_sentences
        END,
        party_resignations = GREATEST(${resignations}, party_resignations),
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
  console.log('=' .repeat(70))
  console.log(' COMPLETAR HOJAS DE VIDA - TODOS LOS CARGOS')
  console.log('='.repeat(70))

  // Step 1: Launch browser (needed for auth token capture and HV navigation)
  console.log('\n  Iniciando navegador...')
  const { browser, page } = await setupBrowser()

  // Step 2: Get org mapping via authenticated API
  const dniToOrg = await getOrgMapping(page)

  if (dniToOrg.size === 0) {
    console.log('\nError: No se pudo obtener el mapa de candidatos del JNE')
    await browser.close()
    return
  }

  // Step 3: Get candidates needing update
  const candidates = await getCandidatesToComplete(dniToOrg)
  console.log(`\n  Candidatos sin patrimonio completo: ${candidates.length}`)

  if (candidates.length === 0) {
    console.log('\n  Todos los candidatos tienen datos de patrimonio')
    await browser.close()
    return
  }

  // Show breakdown by cargo
  const byCargo: Record<string, number> = {}
  for (const c of candidates) {
    byCargo[c.cargo] = (byCargo[c.cargo] || 0) + 1
  }
  for (const [cargo, count] of Object.entries(byCargo)) {
    console.log(`    ${cargo}: ${count}`)
  }

  try {
    console.log('\n  Paso 4: Capturando hojas de vida (Puppeteer)...')

    let completed = 0
    let failed = 0
    let skipped = 0

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i]
      console.log(`\n[${i + 1}/${candidates.length}] ${candidate.full_name} (${candidate.cargo})`)

      const hvData = await captureHojaVida(page, candidate.orgId, candidate.dni)

      if (!hvData) {
        failed++
        console.log('  ! No se capturaron datos')
        await delay(DELAY_MS)
        continue
      }

      // Check if there's actually asset data
      const hasAssets = hvData.oIngresos || hvData.lBienInmueble || hvData.lBienMueble
      if (!hasAssets) {
        skipped++
        console.log('  - Sin datos de patrimonio en la declaracion')

        // Still update other fields if missing
        const success = await updateCandidate(candidate.id, hvData, candidate.orgId, candidate.dni)
        if (success) console.log('    (otros datos actualizados)')

        await delay(DELAY_MS)
        continue
      }

      const success = await updateCandidate(candidate.id, hvData, candidate.orgId, candidate.dni)

      if (success) {
        completed++
        const assets = parseAssets(hvData)
        console.log(`  + Patrimonio: S/ ${(assets.real_estate_total || 0) + (assets.vehicle_total || 0)} | Ingresos: S/ ${assets.total_income || 0}`)
      } else {
        failed++
      }

      await delay(DELAY_MS)
    }

    console.log('\n' + '='.repeat(70))
    console.log('RESUMEN')
    console.log('='.repeat(70))
    console.log(`  Completados: ${completed}`)
    console.log(`  Sin patrimonio: ${skipped}`)
    console.log(`  Fallidos: ${failed}`)

    // Final verification
    const [stats] = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN assets_declaration IS NOT NULL
          AND assets_declaration != '{}'::jsonb
          AND assets_declaration != '{"source":"jne"}'::jsonb
          AND (assets_declaration ? 'total_income')
          THEN 1 END) as with_assets,
        COUNT(CASE WHEN education_details IS NOT NULL AND jsonb_array_length(education_details) > 0 THEN 1 END) as with_edu
      FROM candidates
      WHERE is_active = true
    `

    console.log(`\n  Estado actual:`)
    console.log(`    Total candidatos activos: ${stats.total}`)
    console.log(`    Con patrimonio: ${stats.with_assets} (${((Number(stats.with_assets) / Number(stats.total)) * 100).toFixed(1)}%)`)
    console.log(`    Con educacion: ${stats.with_edu} (${((Number(stats.with_edu) / Number(stats.total)) * 100).toFixed(1)}%)`)

  } finally {
    await browser.close()
    console.log('\n  Navegador cerrado')
  }
}

main().catch(console.error)
