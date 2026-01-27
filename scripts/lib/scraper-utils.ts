/**
 * Utilidades compartidas para scrapers del JNE
 * Extraidas del script probado complete-hojas-vida-final.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer'

export const VOTO_INFORMADO_BASE = 'https://votoinformado.jne.gob.pe'
export const DELAY_MS = 2500
export const CHECKPOINTS_DIR = path.join(process.cwd(), 'scripts', 'checkpoints')

// ============================================
// Environment & Database
// ============================================

export function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return match ? match[1] : ''
}

export function createDb(): NeonQueryFunction<false, false> {
  return neon(loadEnv())
}

// ============================================
// Browser
// ============================================

export async function setupBrowser(): Promise<{ browser: Browser; page: Page }> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

  return { browser, page }
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================
// Checkpoint System
// ============================================

export interface Checkpoint {
  lastProcessedIndex: number
  completedDnis: string[]
  failedDnis: string[]
  timestamp: string
}

export function ensureCheckpointsDir(): void {
  if (!fs.existsSync(CHECKPOINTS_DIR)) {
    fs.mkdirSync(CHECKPOINTS_DIR, { recursive: true })
  }
}

export function saveCheckpoint(name: string, data: Checkpoint): void {
  ensureCheckpointsDir()
  const filePath = path.join(CHECKPOINTS_DIR, `${name}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

export function loadCheckpoint(name: string): Checkpoint | null {
  const filePath = path.join(CHECKPOINTS_DIR, `${name}.json`)
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

// ============================================
// API Interception: Capture GetHVConsolidado
// ============================================

export async function captureHojaVida(page: Page, orgId: number, dni: string): Promise<any | null> {
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

  // Use a race between navigation and an overall timeout
  const overallTimeout = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('Overall timeout')), 45000)
  )

  try {
    await Promise.race([
      (async () => {
        await page.goto(`${VOTO_INFORMADO_BASE}/hoja-vida/${orgId}/${dni}`, {
          waitUntil: 'networkidle2',
          timeout: 30000
        })
        await delay(4000)
      })(),
      overallTimeout
    ])
  } catch (e) {
    // Navigation error or timeout, hvData may still have been captured
  } finally {
    page.off('response', handler)
  }

  return hvData
}

// ============================================
// API Interception: Capture ListaCandidatos
// ============================================

export interface CandidateListItem {
  dni: string
  orgId: number
  fullName: string
  party: string
  cargo: string
  jneId: number
  photoGuid: string
  district?: string
  position?: number
}

export async function captureListaCandidatos(
  page: Page,
  urlPath: string
): Promise<CandidateListItem[]> {
  const candidates: CandidateListItem[] = []

  const handler = async (response: HTTPResponse) => {
    const url = response.url()
    const method = response.request().method()

    if (url.includes('ListaCandidatos') && method === 'POST') {
      try {
        const text = await response.text()
        const data = JSON.parse(text)
        if (data?.data && Array.isArray(data.data)) {
          for (const c of data.data) {
            if (c.strDocumentoIdentidad && c.idOrganizacionPolitica) {
              candidates.push({
                dni: c.strDocumentoIdentidad,
                orgId: c.idOrganizacionPolitica,
                fullName: [c.strApellidoPaterno, c.strApellidoMaterno, c.strNombres]
                  .filter(Boolean).join(' '),
                party: c.strOrganizacionPolitica || '',
                cargo: c.strCargo || '',
                jneId: c.idHojaVida || 0,
                photoGuid: c.strGuidFoto || '',
                district: c.strDistrito || undefined,
                position: c.intPosicion || undefined,
              })
            }
          }
        }
      } catch (e) {}
    }
  }

  page.on('response', handler)

  try {
    await page.goto(`${VOTO_INFORMADO_BASE}${urlPath}`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })
    await delay(5000)
  } catch (e) {
    console.log(`  Error navegando a ${urlPath}: ${e}`)
  } finally {
    page.off('response', handler)
  }

  return candidates
}

// ============================================
// Parsing Functions (proven from complete-hojas-vida-final.ts)
// ============================================

export function parseAllEducation(data: any): any[] {
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

  // Non-university education
  if (data.oEduNoUniversitaria) {
    const nu = data.oEduNoUniversitaria
    if (nu.strEduNoUniversitaria === '1' || nu.strTengoEduNoUniversitaria === '1') {
      education.push({
        level: 'No Universitario',
        institution: nu.strCenEstudioNoUni || '',
        degree: nu.strCarreraNoUni || '',
        is_completed: nu.strConcluidoEduNoUni === '1',
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

export function parseExperience(data: any): any[] {
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

export function parsePolitical(data: any): any[] {
  const trajectory: any[] = []

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

export function parseSentences(items: any[]): any[] {
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

export function parseResignations(data: any): number {
  if (!data.lRenunciaOP || !Array.isArray(data.lRenunciaOP)) return 0
  return data.lRenunciaOP.length
}

export function parseAssets(data: any): any {
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

export function getHighestEducationLevel(education: any[]): string | null {
  const levels = ['Doctorado', 'Maestría', 'Posgrado', 'Universitario', 'No Universitario', 'Técnico', 'Secundaria', 'Primaria']
  for (const level of levels) {
    if (education.some(e => e.level === level)) return level
  }
  return null
}

// ============================================
// Slug Generation
// ============================================

export function createSlug(fullName: string): string {
  return fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================
// Cargo Normalization
// ============================================

export function normalizeCargo(cargo: string): string {
  const c = cargo.toLowerCase()
  if (c.includes('presidente') && !c.includes('vice')) return 'presidente'
  if (c.includes('vicepresidente') || c.includes('vice')) return 'vicepresidente'
  if (c.includes('senador')) return 'senador'
  if (c.includes('diputado') || c.includes('congres')) return 'diputado'
  if (c.includes('andino') || c.includes('parlamento')) return 'parlamento_andino'
  return cargo.toLowerCase()
}

// ============================================
// Database Update Helper
// ============================================

export async function updateCandidateHojaVida(
  sql: NeonQueryFunction<false, false>,
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
        jne_org_id = ${orgId},
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
