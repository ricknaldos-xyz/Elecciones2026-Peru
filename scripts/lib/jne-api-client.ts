/**
 * Cliente para capturar y procesar datos de la API del JNE Voto Informado
 * Usa Puppeteer para interceptar llamadas de red en el sitio Angular
 */

import puppeteer, { Page, Browser, HTTPResponse } from 'puppeteer'

const VOTO_INFORMADO_BASE = 'https://votoinformado.jne.gob.pe'
const DEFAULT_TIMEOUT = 60000
const NETWORK_IDLE_TIMEOUT = 5000

export interface ApiResponse {
  url: string
  method: string
  status: number
  data: unknown
}

export interface CandidatoListItem {
  idHojaVida: number
  idOrganizacionPolitica: number
  strNombreCompleto: string
  strOrganizacionPolitica: string
  strCargo: string
  strFoto?: string
  strDistrito?: string
  intPosicion?: number
}

export interface JneApiClient {
  browser: Browser
  page: Page
  responses: ApiResponse[]
}

/**
 * Inicializa el cliente con Puppeteer
 */
export async function createJneApiClient(): Promise<JneApiClient> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

  const responses: ApiResponse[] = []

  // Interceptar respuestas JSON de la API
  page.on('response', async (response: HTTPResponse) => {
    const url = response.url()
    const contentType = response.headers()['content-type'] || ''

    // Filtrar solo respuestas JSON relevantes
    if (contentType.includes('application/json') && isRelevantUrl(url)) {
      try {
        const data = await response.json()
        responses.push({
          url,
          method: response.request().method(),
          status: response.status(),
          data
        })
      } catch {
        // Ignorar errores de parsing
      }
    }
  })

  return { browser, page, responses }
}

function isRelevantUrl(url: string): boolean {
  const relevantPatterns = [
    'formula', 'Formula',
    'candidato', 'Candidato',
    'lista', 'Lista',
    'hoja', 'Hoja',
    'detalle', 'Detalle',
    'api/', 'Api/'
  ]
  return relevantPatterns.some(pattern => url.toLowerCase().includes(pattern.toLowerCase()))
}

/**
 * Navega a una página y espera a que se cargue
 */
export async function navigateAndWait(
  client: JneApiClient,
  path: string,
  waitForSelector?: string
): Promise<void> {
  const url = path.startsWith('http') ? path : `${VOTO_INFORMADO_BASE}${path}`

  // Limpiar respuestas anteriores
  client.responses.length = 0

  await client.page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: DEFAULT_TIMEOUT
  })

  // Esperar adicional para Angular
  await delay(NETWORK_IDLE_TIMEOUT)

  if (waitForSelector) {
    try {
      await client.page.waitForSelector(waitForSelector, { timeout: 10000 })
    } catch {
      console.log(`Selector ${waitForSelector} no encontrado, continuando...`)
    }
  }
}

/**
 * Obtiene la lista de candidatos de una página
 */
export async function fetchCandidateList(
  client: JneApiClient,
  cargoPath: string
): Promise<CandidatoListItem[]> {
  console.log(`\nObteniendo lista de candidatos: ${cargoPath}`)

  await navigateAndWait(client, cargoPath)

  // Buscar datos en las respuestas API capturadas
  const candidates: CandidatoListItem[] = []

  for (const response of client.responses) {
    const items = extractCandidatesFromResponse(response.data)
    candidates.push(...items)
  }

  // Si no hay datos de API, extraer del DOM
  if (candidates.length === 0) {
    const domCandidates = await extractCandidatesFromDom(client.page)
    candidates.push(...domCandidates)
  }

  console.log(`  Encontrados: ${candidates.length} candidatos`)
  return candidates
}

/**
 * Extrae candidatos de una respuesta JSON de la API
 */
function extractCandidatesFromResponse(data: unknown): CandidatoListItem[] {
  const candidates: CandidatoListItem[] = []

  if (!data) return candidates

  // Diferentes estructuras posibles de la API
  let items: unknown[] = []

  if (Array.isArray(data)) {
    items = data
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.data)) items = obj.data
    else if (Array.isArray(obj.formulas)) items = obj.formulas
    else if (Array.isArray(obj.candidatos)) items = obj.candidatos
    else if (Array.isArray(obj.lista)) items = obj.lista
  }

  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>

    // Extraer datos del candidato/fórmula
    if (obj.idHojaVida || obj.strNombreCompleto || obj.presidente) {
      // Si es una fórmula presidencial
      if (obj.presidente && typeof obj.presidente === 'object') {
        const pres = obj.presidente as Record<string, unknown>
        candidates.push({
          idHojaVida: Number(pres.idHojaVida || pres.id || 0),
          idOrganizacionPolitica: Number(obj.idOrganizacionPolitica || obj.idOP || 0),
          strNombreCompleto: String(pres.strNombreCompleto || pres.nombre || ''),
          strOrganizacionPolitica: String(obj.strOrganizacionPolitica || obj.partido || ''),
          strCargo: 'PRESIDENTE',
          strFoto: String(pres.strFoto || pres.foto || ''),
        })

        // Vicepresidentes
        const vps = obj.vicepresidentes || obj.lstVicepresidentes
        if (Array.isArray(vps)) {
          for (const vp of vps) {
            if (!vp || typeof vp !== 'object') continue
            const vpObj = vp as Record<string, unknown>
            candidates.push({
              idHojaVida: Number(vpObj.idHojaVida || vpObj.id || 0),
              idOrganizacionPolitica: Number(obj.idOrganizacionPolitica || 0),
              strNombreCompleto: String(vpObj.strNombreCompleto || vpObj.nombre || ''),
              strOrganizacionPolitica: String(obj.strOrganizacionPolitica || ''),
              strCargo: 'VICEPRESIDENTE',
              strFoto: String(vpObj.strFoto || vpObj.foto || ''),
              intPosicion: Number(vpObj.intPosicion || vpObj.posicion || 0),
            })
          }
        }
      } else {
        // Candidato individual
        candidates.push({
          idHojaVida: Number(obj.idHojaVida || obj.id || 0),
          idOrganizacionPolitica: Number(obj.idOrganizacionPolitica || obj.idOP || 0),
          strNombreCompleto: String(obj.strNombreCompleto || obj.nombre || obj.nombreCompleto || ''),
          strOrganizacionPolitica: String(obj.strOrganizacionPolitica || obj.partido || obj.organizacion || ''),
          strCargo: String(obj.strCargo || obj.cargo || ''),
          strFoto: String(obj.strFoto || obj.foto || obj.urlFoto || ''),
          strDistrito: obj.strDistrito ? String(obj.strDistrito) : undefined,
          intPosicion: obj.intPosicion ? Number(obj.intPosicion) : undefined,
        })
      }
    }
  }

  return candidates.filter(c => c.strNombreCompleto && c.strNombreCompleto.length > 3)
}

/**
 * Extrae candidatos del DOM cuando no hay datos de API
 */
async function extractCandidatesFromDom(page: Page): Promise<CandidatoListItem[]> {
  return await page.evaluate(() => {
    const candidates: CandidatoListItem[] = []

    // Buscar tarjetas de candidatos
    const cards = document.querySelectorAll(
      'app-card-formula, app-card-candidato, [class*="card-candidato"], [class*="card-formula"]'
    )

    cards.forEach((card, index) => {
      const nameEl = card.querySelector('h3, h4, h5, .nombre, [class*="nombre"]')
      const partyEl = card.querySelector('.partido, [class*="partido"], [class*="organizacion"]')
      const imgEl = card.querySelector('img')
      const linkEl = card.querySelector('a[href*="hoja-vida"]')

      const name = nameEl?.textContent?.trim() || ''
      if (!name || name.length < 3) return

      // Extraer IDs de la URL si existe
      let idHojaVida = 0
      let idOrganizacion = 0

      if (linkEl) {
        const href = linkEl.getAttribute('href') || ''
        const match = href.match(/hoja-vida\/(\d+)\/(\d+)/)
        if (match) {
          idOrganizacion = parseInt(match[1])
          idHojaVida = parseInt(match[2])
        }
      }

      candidates.push({
        idHojaVida,
        idOrganizacionPolitica: idOrganizacion,
        strNombreCompleto: name,
        strOrganizacionPolitica: partyEl?.textContent?.trim() || '',
        strCargo: '',
        strFoto: (imgEl as HTMLImageElement)?.src || '',
        intPosicion: index + 1
      })
    })

    return candidates
  })
}

/**
 * Obtiene el detalle completo de una hoja de vida
 */
export async function fetchHojaVidaDetail(
  client: JneApiClient,
  idOrganizacion: number,
  idHojaVida: number
): Promise<Record<string, unknown> | null> {
  const path = `/hoja-vida/${idOrganizacion}/${idHojaVida}`

  try {
    await navigateAndWait(client, path)

    // Buscar datos en las respuestas API
    for (const response of client.responses) {
      if (response.data && typeof response.data === 'object') {
        const obj = response.data as Record<string, unknown>
        // Verificar que sea el detalle correcto
        if (obj.idHojaVida || obj.datosPersonales || obj.educacion || obj.experiencia) {
          return obj
        }
      }
    }

    // Si no hay datos de API, extraer del DOM
    return await extractHojaVidaFromDom(client.page)

  } catch (error) {
    console.error(`Error obteniendo hoja de vida ${idOrganizacion}/${idHojaVida}:`, error)
    return null
  }
}

/**
 * Extrae datos de hoja de vida del DOM
 */
async function extractHojaVidaFromDom(page: Page): Promise<Record<string, unknown>> {
  return await page.evaluate(() => {
    const data: Record<string, unknown> = {
      educacion: [],
      experiencia: [],
      trayectoriaPolitica: [],
      sentenciasPenales: [],
      sentenciasCiviles: [],
      renuncias: [],
      bienes: {}
    }

    // Datos personales
    const nameEl = document.querySelector('h1, h2, .nombre-candidato')
    if (nameEl) data.strNombreCompleto = nameEl.textContent?.trim()

    const photoEl = document.querySelector('.foto-candidato img, [class*="foto"] img')
    if (photoEl) data.strFoto = (photoEl as HTMLImageElement).src

    // Buscar secciones por título
    const sections = document.querySelectorAll(
      '.mat-expansion-panel, [class*="seccion"], [class*="section"], .accordion-item'
    )

    sections.forEach(section => {
      const titleEl = section.querySelector('h3, h4, .titulo, mat-panel-title')
      const title = titleEl?.textContent?.toLowerCase() || ''
      const rows = section.querySelectorAll('tr:not(:first-child), li, .item-row')

      if (title.includes('educación') || title.includes('formación')) {
        const items: unknown[] = []
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, span, .cell')
          if (cells.length >= 2) {
            items.push({
              strNivelEstudio: cells[0]?.textContent?.trim() || '',
              strCentroEstudio: cells[1]?.textContent?.trim() || '',
              strCarrera: cells[2]?.textContent?.trim() || '',
              intAnioEstudio: parseInt(cells[3]?.textContent?.trim() || '0') || null,
              blnConcluido: !row.textContent?.toLowerCase().includes('inconcluso')
            })
          }
        })
        data.educacion = items
      }

      if (title.includes('experiencia') || title.includes('laboral')) {
        const items: unknown[] = []
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, span, .cell')
          if (cells.length >= 2) {
            items.push({
              strCentroTrabajo: cells[0]?.textContent?.trim() || '',
              strOcupacion: cells[1]?.textContent?.trim() || '',
              intAnioInicio: parseInt(cells[2]?.textContent?.trim() || '0') || null,
              intAnioFin: parseInt(cells[3]?.textContent?.trim() || '0') || null,
              strSector: row.textContent?.toLowerCase().includes('público') ? 'PUBLICO' : 'PRIVADO'
            })
          }
        })
        data.experiencia = items
      }

      if (title.includes('trayectoria') || title.includes('política')) {
        const items: unknown[] = []
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, span, .cell')
          if (cells.length >= 2) {
            items.push({
              strPartido: cells[0]?.textContent?.trim() || '',
              strCargo: cells[1]?.textContent?.trim() || '',
              intAnioInicio: parseInt(cells[2]?.textContent?.trim() || '0') || null,
              intAnioFin: parseInt(cells[3]?.textContent?.trim() || '0') || null,
              blnElecto: row.textContent?.toLowerCase().includes('electo')
            })
          }
        })
        data.trayectoriaPolitica = items
      }

      if (title.includes('penal') || title.includes('sentencia')) {
        const items: unknown[] = []
        rows.forEach(row => {
          const text = row.textContent?.trim() || ''
          if (text.length > 10 && !text.toLowerCase().includes('no tiene')) {
            const cells = row.querySelectorAll('td, span')
            items.push({
              strExpediente: cells[0]?.textContent?.trim() || '',
              strDelito: cells[1]?.textContent?.trim() || text,
              strJuzgado: cells[2]?.textContent?.trim() || '',
              strPena: cells[3]?.textContent?.trim() || '',
              strEstado: text.toLowerCase().includes('firme') ? 'FIRME' : 'EN PROCESO'
            })
          }
        })
        data.sentenciasPenales = items
      }

      if (title.includes('civil') || title.includes('obligación')) {
        const items: unknown[] = []
        rows.forEach(row => {
          const text = row.textContent?.trim() || ''
          if (text.length > 10 && !text.toLowerCase().includes('no tiene')) {
            const cells = row.querySelectorAll('td, span')
            items.push({
              strTipo: cells[0]?.textContent?.trim() || '',
              strMateria: cells[1]?.textContent?.trim() || text,
              decMonto: parseFloat(cells[2]?.textContent?.replace(/[^\d.]/g, '') || '0') || null,
              strEstado: cells[3]?.textContent?.trim() || ''
            })
          }
        })
        data.sentenciasCiviles = items
      }

      if (title.includes('renuncia') || title.includes('afiliación')) {
        const items: unknown[] = []
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, span')
          if (cells.length >= 2) {
            items.push({
              strPartido: cells[0]?.textContent?.trim() || '',
              strFechaAfiliacion: cells[1]?.textContent?.trim() || '',
              strFechaRenuncia: cells[2]?.textContent?.trim() || ''
            })
          }
        })
        data.renuncias = items
      }

      if (title.includes('bien') || title.includes('patrimonio')) {
        const text = section.textContent || ''
        const totalMatch = text.match(/total[:\s]*S\/?\s*([\d,.]+)/i)
        const ingresosMatch = text.match(/ingreso[s]?[:\s]*S\/?\s*([\d,.]+)/i)
        const inmueblesMatch = text.match(/inmueble[s]?[:\s]*(\d+)/i)
        const vehiculosMatch = text.match(/vehículo[s]?[:\s]*(\d+)/i)

        data.bienes = {
          decTotalBienes: totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : null,
          decIngresoTotal: ingresosMatch ? parseFloat(ingresosMatch[1].replace(/,/g, '')) : null,
          intCantidadInmuebles: inmueblesMatch ? parseInt(inmueblesMatch[1]) : 0,
          intCantidadVehiculos: vehiculosMatch ? parseInt(vehiculosMatch[1]) : 0
        }
      }
    })

    return data
  })
}

/**
 * Cierra el cliente y libera recursos
 */
export async function closeJneApiClient(client: JneApiClient): Promise<void> {
  await client.page.close()
  await client.browser.close()
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export { delay }
