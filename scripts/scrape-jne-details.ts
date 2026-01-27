/**
 * Scraper detallado para JNE Voto Informado
 * Extrae TODA la información de cada candidato:
 * - Datos personales
 * - Educación
 * - Experiencia laboral
 * - Trayectoria política
 * - Sentencias penales y civiles
 * - Declaración de bienes
 * - Plan de gobierno (PDF)
 */

import puppeteer, { Page, Browser } from 'puppeteer'
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const sql = neon(process.env.DATABASE_URL || '')

const VOTO_INFORMADO_BASE = 'https://votoinformado.jne.gob.pe'
const DELAY_MS = 3000

interface CandidateDetails {
  full_name: string
  party_name: string
  party_short_name?: string
  cargo: string
  photo_url?: string
  jne_id?: string
  dni?: string
  birth_date?: string
  birth_place?: string
  residence?: string

  // Educación
  education_details: Array<{
    level: string
    institution: string
    degree?: string
    year_start?: number
    year_end?: number
    completed: boolean
  }>

  // Experiencia laboral
  experience_details: Array<{
    organization: string
    position: string
    sector: 'publico' | 'privado'
    year_start?: number
    year_end?: number
  }>

  // Trayectoria política
  political_trajectory: Array<{
    party: string
    position: string
    year_start?: number
    year_end?: number
    elected: boolean
  }>

  // Sentencias
  penal_sentences: Array<{
    type: string
    description: string
    status: string
    date?: string
    expediente?: string
  }>

  civil_sentences: Array<{
    type: string
    description: string
    amount?: number
    status: string
  }>

  // Bienes
  assets_declaration?: {
    properties: number
    vehicles: number
    total_assets: number
    total_liabilities: number
    income?: number
  }

  // Renuncias a partidos
  party_resignations: number

  // Plan de gobierno
  plan_gobierno_url?: string
  hoja_vida_url?: string

  // Datos adicionales
  profession?: string
  additional_info?: string
}

interface ApiResponse {
  url: string
  data: any
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function setupPageWithIntercept(browser: Browser): Promise<{ page: Page; responses: ApiResponse[] }> {
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  const responses: ApiResponse[] = []

  // Interceptar respuestas JSON
  page.on('response', async response => {
    const url = response.url()
    const contentType = response.headers()['content-type'] || ''

    if (contentType.includes('application/json') &&
        (url.includes('Candidato') || url.includes('candidato') ||
         url.includes('Formula') || url.includes('HojaVida') ||
         url.includes('Plan') || url.includes('Detalle'))) {
      try {
        const data = await response.json()
        responses.push({ url, data })
      } catch (e) {
        // Ignore
      }
    }
  })

  return { page, responses }
}

async function scrapePresidentialCandidates(browser: Browser): Promise<CandidateDetails[]> {
  console.log('\n' + '='.repeat(70))
  console.log('EXTRAYENDO DATOS DETALLADOS DE CANDIDATOS PRESIDENCIALES')
  console.log('='.repeat(70))

  const { page, responses } = await setupPageWithIntercept(browser)
  const candidates: CandidateDetails[] = []

  try {
    // Navegar a la página de presidentes
    console.log('\nNavegando a presidente-vicepresidentes...')
    await page.goto(`${VOTO_INFORMADO_BASE}/presidente-vicepresidentes`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await delay(5000)

    // Buscar el endpoint de la API en las respuestas capturadas
    console.log(`\nRespuestas API capturadas: ${responses.length}`)

    for (const resp of responses) {
      console.log(`  - ${resp.url.substring(0, 80)}...`)
      if (resp.data) {
        // Guardar respuesta para análisis
        fs.writeFileSync('jne-api-response.json', JSON.stringify(resp.data, null, 2))
      }
    }

    // Obtener las tarjetas de candidatos del DOM
    const candidateCards = await page.evaluate(() => {
      const cards: any[] = []

      // Buscar todas las tarjetas de candidatos
      document.querySelectorAll('app-card-formula, [class*="card"], [class*="formula"]').forEach(card => {
        const text = card.textContent || ''
        if (text.length < 50) return

        // Extraer información básica
        const nameEl = card.querySelector('h3, h4, h5, .nombre, [class*="nombre"]')
        const partyEl = card.querySelector('.partido, [class*="partido"], [class*="organizacion"]')
        const imgEl = card.querySelector('img')

        // Buscar botones o enlaces para ver más detalles
        const detailLink = card.querySelector('a[href*="candidato"], a[href*="formula"], button')

        cards.push({
          name: nameEl?.textContent?.trim() || '',
          party: partyEl?.textContent?.trim() || '',
          photo: imgEl?.src || '',
          detailLink: detailLink?.getAttribute('href') || '',
          rawText: text.substring(0, 500)
        })
      })

      return cards
    })

    console.log(`\nTarjetas de candidatos encontradas: ${candidateCards.length}`)

    // Hacer clic en cada candidato para obtener sus detalles
    for (let i = 0; i < Math.min(candidateCards.length, 40); i++) {
      const card = candidateCards[i]
      if (!card.name || card.name.length < 3) continue

      console.log(`\n[${i + 1}/${candidateCards.length}] ${card.name}`)

      try {
        // Hacer clic en la tarjeta para abrir el modal o navegar al detalle
        const clicked = await page.evaluate((index) => {
          const cards = document.querySelectorAll('app-card-formula, [class*="card"]')
          const targetCard = cards[index]
          if (targetCard) {
            // Buscar botón o enlace clickeable
            const clickable = targetCard.querySelector('button, a, [class*="ver"], [class*="detalle"]')
            if (clickable) {
              (clickable as HTMLElement).click()
              return true
            }
            // Hacer clic en la tarjeta misma
            (targetCard as HTMLElement).click()
            return true
          }
          return false
        }, i)

        if (clicked) {
          await delay(2000)

          // Extraer datos del modal o página de detalle
          const details = await extractCandidateDetails(page)

          if (details) {
            details.full_name = details.full_name || card.name
            details.party_name = details.party_name || card.party
            details.photo_url = details.photo_url || card.photo
            details.cargo = 'presidente'

            candidates.push(details)
            console.log(`  ✓ Educación: ${details.education_details.length}`)
            console.log(`  ✓ Experiencia: ${details.experience_details.length}`)
            console.log(`  ✓ Sentencias penales: ${details.penal_sentences.length}`)
            console.log(`  ✓ Plan de gobierno: ${details.plan_gobierno_url ? 'Sí' : 'No'}`)
          }

          // Cerrar modal si existe
          await page.evaluate(() => {
            const closeBtn = document.querySelector('[class*="close"], [class*="cerrar"], .mat-dialog-close, button[mat-dialog-close]')
            if (closeBtn) (closeBtn as HTMLElement).click()
          })

          await delay(1000)
        }

      } catch (error) {
        console.log(`  ✗ Error: ${error}`)
      }
    }

    // Verificar si hay respuestas API con datos estructurados
    const apiData = responses.find(r =>
      r.data && (Array.isArray(r.data) || r.data.data || r.data.formulas || r.data.candidatos)
    )

    if (apiData) {
      console.log('\n=== DATOS DE API ENCONTRADOS ===')
      await processApiResponse(apiData.data, candidates)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await page.close()
  }

  return candidates
}

async function extractCandidateDetails(page: Page): Promise<CandidateDetails | null> {
  return await page.evaluate(() => {
    const details: any = {
      full_name: '',
      party_name: '',
      cargo: '',
      education_details: [],
      experience_details: [],
      political_trajectory: [],
      penal_sentences: [],
      civil_sentences: [],
      party_resignations: 0
    }

    // Buscar nombre
    const nameEl = document.querySelector('h1, h2, .nombre-candidato, [class*="nombre"]')
    if (nameEl) details.full_name = nameEl.textContent?.trim() || ''

    // Buscar partido
    const partyEl = document.querySelector('.partido, [class*="partido"], [class*="organizacion"]')
    if (partyEl) details.party_name = partyEl.textContent?.trim() || ''

    // Buscar foto
    const photoEl = document.querySelector('.foto-candidato img, [class*="foto"] img, .modal img')
    if (photoEl) details.photo_url = (photoEl as HTMLImageElement).src

    // Buscar secciones de información
    const sections = document.querySelectorAll('[class*="seccion"], [class*="section"], .mat-expansion-panel, .accordion')

    sections.forEach(section => {
      const title = section.querySelector('h3, h4, .titulo, [class*="titulo"]')?.textContent?.toLowerCase() || ''
      const content = section.textContent || ''

      // Educación
      if (title.includes('educación') || title.includes('formación') || title.includes('estudios')) {
        const rows = section.querySelectorAll('tr, li, .item')
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, span')
          if (cells.length >= 2) {
            details.education_details.push({
              level: cells[0]?.textContent?.trim() || '',
              institution: cells[1]?.textContent?.trim() || '',
              degree: cells[2]?.textContent?.trim() || '',
              completed: true
            })
          }
        })
      }

      // Experiencia
      if (title.includes('experiencia') || title.includes('laboral') || title.includes('trabajo')) {
        const rows = section.querySelectorAll('tr, li, .item')
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, span')
          if (cells.length >= 2) {
            details.experience_details.push({
              organization: cells[0]?.textContent?.trim() || '',
              position: cells[1]?.textContent?.trim() || '',
              sector: content.toLowerCase().includes('público') ? 'publico' : 'privado'
            })
          }
        })
      }

      // Sentencias penales
      if (title.includes('penal') || title.includes('sentencia')) {
        const rows = section.querySelectorAll('tr, li, .item')
        rows.forEach(row => {
          const text = row.textContent?.trim() || ''
          if (text.length > 10 && !text.toLowerCase().includes('no tiene') && !text.toLowerCase().includes('ninguna')) {
            details.penal_sentences.push({
              type: 'Sentencia penal',
              description: text.substring(0, 500),
              status: text.toLowerCase().includes('firme') ? 'firme' : 'proceso'
            })
          }
        })
      }

      // Sentencias civiles
      if (title.includes('civil') || title.includes('obligacion')) {
        const rows = section.querySelectorAll('tr, li, .item')
        rows.forEach(row => {
          const text = row.textContent?.trim() || ''
          if (text.length > 10 && !text.toLowerCase().includes('no tiene') && !text.toLowerCase().includes('ninguna')) {
            details.civil_sentences.push({
              type: 'Obligación civil',
              description: text.substring(0, 500),
              status: 'pendiente'
            })
          }
        })
      }
    })

    // Buscar enlaces a documentos
    const pdfLinks = document.querySelectorAll('a[href*=".pdf"], a[href*="plan"], a[href*="Plan"]')
    pdfLinks.forEach(link => {
      const href = link.getAttribute('href') || ''
      const text = link.textContent?.toLowerCase() || ''

      if (text.includes('plan') || href.toLowerCase().includes('plan')) {
        details.plan_gobierno_url = href
      }
      if (text.includes('hoja') || text.includes('vida') || href.toLowerCase().includes('hojavida')) {
        details.hoja_vida_url = href
      }
    })

    // Buscar bienes
    const assetsSection = document.querySelector('[class*="bienes"], [class*="patrimonio"]')
    if (assetsSection) {
      const text = assetsSection.textContent || ''
      const totalMatch = text.match(/total[:\s]*S\/?\s*([\d,]+)/i)
      if (totalMatch) {
        details.assets_declaration = {
          total_assets: parseFloat(totalMatch[1].replace(/,/g, ''))
        }
      }
    }

    return details.full_name ? details : null
  })
}

async function processApiResponse(data: any, candidates: CandidateDetails[]): Promise<void> {
  // Procesar diferentes formatos de respuesta API
  let items: any[] = []

  if (Array.isArray(data)) {
    items = data
  } else if (data.data && Array.isArray(data.data)) {
    items = data.data
  } else if (data.formulas && Array.isArray(data.formulas)) {
    items = data.formulas
  } else if (data.candidatos && Array.isArray(data.candidatos)) {
    items = data.candidatos
  }

  console.log(`Procesando ${items.length} items de la API...`)

  for (const item of items) {
    // Buscar candidato existente o crear nuevo
    const name = item.strNombreCompleto || item.nombreCompleto || item.nombre ||
                 item.strNombres ? `${item.strApellidoPaterno || ''} ${item.strApellidoMaterno || ''} ${item.strNombres || ''}`.trim() : ''

    if (!name) continue

    let candidate = candidates.find(c =>
      c.full_name.toLowerCase().includes(name.toLowerCase().split(' ')[0])
    )

    if (!candidate) {
      candidate = {
        full_name: name,
        party_name: item.strOrganizacionPolitica || item.organizacionPolitica || item.partido || '',
        cargo: 'presidente',
        education_details: [],
        experience_details: [],
        political_trajectory: [],
        penal_sentences: [],
        civil_sentences: [],
        party_resignations: 0
      }
      candidates.push(candidate)
    }

    // Actualizar con datos de la API
    if (item.strUrlFoto || item.urlFoto) {
      candidate.photo_url = item.strUrlFoto || item.urlFoto
    }

    if (item.strDNI || item.dni) {
      candidate.dni = item.strDNI || item.dni
    }

    // Plan de gobierno
    if (item.strUrlPlanGobierno || item.urlPlanGobierno || item.planGobierno) {
      candidate.plan_gobierno_url = item.strUrlPlanGobierno || item.urlPlanGobierno || item.planGobierno
    }

    // Hoja de vida
    if (item.strUrlHojaVida || item.urlHojaVida || item.hojaVida) {
      candidate.hoja_vida_url = item.strUrlHojaVida || item.urlHojaVida || item.hojaVida
    }

    // Educación
    if (item.educacion && Array.isArray(item.educacion)) {
      candidate.education_details = item.educacion.map((e: any) => ({
        level: e.strNivelEstudio || e.nivel || '',
        institution: e.strCentroEstudio || e.institucion || '',
        degree: e.strCarrera || e.carrera || '',
        year_end: e.intAnioEstudio || e.anio,
        completed: e.blnConcluido !== false
      }))
    }

    // Experiencia
    if (item.experiencia && Array.isArray(item.experiencia)) {
      candidate.experience_details = item.experiencia.map((e: any) => ({
        organization: e.strCentroTrabajo || e.entidad || '',
        position: e.strOcupacion || e.cargo || '',
        sector: (e.strSector || '').toLowerCase().includes('público') ? 'publico' : 'privado',
        year_start: e.intAnioInicio,
        year_end: e.intAnioFin
      }))
    }

    // Sentencias penales
    if (item.sentenciasPenales && Array.isArray(item.sentenciasPenales)) {
      candidate.penal_sentences = item.sentenciasPenales.map((s: any) => ({
        type: s.strTipoDelito || s.tipo || 'Sentencia penal',
        description: s.strDelito || s.descripcion || '',
        status: s.strEstado || s.estado || 'proceso',
        expediente: s.strExpediente || s.expediente
      }))
    }

    // Sentencias civiles
    if (item.sentenciasCiviles && Array.isArray(item.sentenciasCiviles)) {
      candidate.civil_sentences = item.sentenciasCiviles.map((s: any) => ({
        type: s.strTipo || s.tipo || 'Obligación civil',
        description: s.strMateria || s.descripcion || '',
        amount: s.decMonto || s.monto,
        status: s.strEstado || s.estado || 'pendiente'
      }))
    }

    // Bienes
    if (item.bienes || item.declaracionBienes) {
      const bienes = item.bienes || item.declaracionBienes
      candidate.assets_declaration = {
        properties: bienes.intCantidadInmuebles || bienes.inmuebles || 0,
        vehicles: bienes.intCantidadVehiculos || bienes.vehiculos || 0,
        total_assets: bienes.decTotalBienes || bienes.totalActivos || 0,
        total_liabilities: bienes.decTotalDeudas || bienes.totalPasivos || 0,
        income: bienes.decIngresoTotal || bienes.ingresos || 0
      }
    }

    // Renuncias
    if (item.intCantidadRenuncias || item.renuncias) {
      candidate.party_resignations = item.intCantidadRenuncias ||
        (Array.isArray(item.renuncias) ? item.renuncias.length : 0)
    }

    console.log(`  ✓ ${candidate.full_name}`)
  }
}

async function saveToDatabase(candidates: CandidateDetails[]): Promise<void> {
  console.log(`\n${'='.repeat(70)}`)
  console.log('GUARDANDO EN BASE DE DATOS')
  console.log('='.repeat(70))

  let updated = 0
  let errors = 0

  for (const candidate of candidates) {
    try {
      // Buscar candidato existente
      const existing = await sql`
        SELECT id FROM candidates
        WHERE LOWER(full_name) LIKE ${`%${candidate.full_name.toLowerCase().split(' ')[0]}%`}
        AND LOWER(full_name) LIKE ${`%${candidate.full_name.toLowerCase().split(' ')[1] || ''}%`}
        LIMIT 1
      `

      if (existing.length > 0) {
        // Actualizar
        await sql`
          UPDATE candidates SET
            photo_url = COALESCE(${candidate.photo_url}, photo_url),
            education_details = COALESCE(${JSON.stringify(candidate.education_details)}::jsonb, education_details),
            experience_details = COALESCE(${JSON.stringify(candidate.experience_details)}::jsonb, experience_details),
            political_trajectory = COALESCE(${JSON.stringify(candidate.political_trajectory)}::jsonb, political_trajectory),
            penal_sentences = COALESCE(${JSON.stringify(candidate.penal_sentences)}::jsonb, penal_sentences),
            civil_sentences = COALESCE(${JSON.stringify(candidate.civil_sentences)}::jsonb, civil_sentences),
            assets_declaration = COALESCE(${JSON.stringify(candidate.assets_declaration || {})}::jsonb, assets_declaration),
            party_resignations = COALESCE(${candidate.party_resignations}, party_resignations),
            djhv_url = COALESCE(${candidate.hoja_vida_url}, djhv_url),
            data_source = 'jne',
            last_updated = NOW()
          WHERE id = ${existing[0].id}::uuid
        `

        console.log(`✓ Actualizado: ${candidate.full_name}`)
        updated++
      } else {
        console.log(`⚠ No encontrado en BD: ${candidate.full_name}`)
      }

    } catch (error) {
      console.error(`✗ Error con ${candidate.full_name}:`, error)
      errors++
    }
  }

  console.log(`\nResultados: ${updated} actualizados, ${errors} errores`)
}

async function main() {
  console.log('='.repeat(70))
  console.log('SCRAPER DETALLADO JNE - EXTRACCIÓN COMPLETA')
  console.log('='.repeat(70))

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })

  try {
    // Scrapear candidatos presidenciales con detalles
    const candidates = await scrapePresidentialCandidates(browser)

    console.log(`\n${'='.repeat(70)}`)
    console.log('RESUMEN DE EXTRACCIÓN')
    console.log('='.repeat(70))
    console.log(`Total candidatos: ${candidates.length}`)

    // Estadísticas
    const withEducation = candidates.filter(c => c.education_details.length > 0).length
    const withExperience = candidates.filter(c => c.experience_details.length > 0).length
    const withPenalSentences = candidates.filter(c => c.penal_sentences.length > 0).length
    const withPlanGobierno = candidates.filter(c => c.plan_gobierno_url).length

    console.log(`Con educación: ${withEducation}`)
    console.log(`Con experiencia: ${withExperience}`)
    console.log(`Con sentencias penales: ${withPenalSentences}`)
    console.log(`Con plan de gobierno: ${withPlanGobierno}`)

    // Guardar JSON
    fs.writeFileSync('jne-candidates-details.json', JSON.stringify(candidates, null, 2))
    console.log('\nDatos guardados en: jne-candidates-details.json')

    // Guardar en base de datos
    if (candidates.length > 0) {
      await saveToDatabase(candidates)
    }

  } catch (error) {
    console.error('Error general:', error)
  } finally {
    await browser.close()
    console.log('\nScraping completado')
  }
}

main().catch(console.error)
