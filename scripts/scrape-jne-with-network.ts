/**
 * Scraper robusto para JNE Voto Informado
 * Captura todas las llamadas de red e intercepta datos de la API
 */

import puppeteer, { Page, Browser, HTTPResponse, HTTPRequest } from 'puppeteer'
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return match ? match[1] : ''
}

const sql = neon(loadEnv())

const VOTO_INFORMADO_BASE = 'https://votoinformado.jne.gob.pe'
const DELAY_MS = 3000

interface NetworkCall {
  url: string
  method: string
  status?: number
  contentType?: string
  data?: unknown
}

interface CandidateData {
  idHojaVida?: number
  idOrganizacionPolitica?: number
  strNombreCompleto: string
  strOrganizacionPolitica: string
  strCargo: string
  strFoto?: string
  strDni?: string
  strDistrito?: string
  intPosicion?: number
  rawData?: unknown
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function setupBrowserWithNetworkCapture(): Promise<{
  browser: Browser
  page: Page
  networkCalls: NetworkCall[]
}> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  const networkCalls: NetworkCall[] = []

  // Interceptar todas las respuestas de red
  page.on('response', async (response: HTTPResponse) => {
    const url = response.url()
    const contentType = response.headers()['content-type'] || ''

    // Solo capturar JSON y endpoints relevantes
    if (contentType.includes('json') ||
        url.includes('api') || url.includes('Api') ||
        url.includes('candidato') || url.includes('Candidato') ||
        url.includes('formula') || url.includes('Formula') ||
        url.includes('lista') || url.includes('Lista') ||
        url.includes('hoja') || url.includes('Hoja') ||
        url.includes('WSCandidato') || url.includes('sije')) {

      const call: NetworkCall = {
        url,
        method: response.request().method(),
        status: response.status(),
        contentType
      }

      try {
        if (contentType.includes('json') && response.status() === 200) {
          const text = await response.text()
          try {
            call.data = JSON.parse(text)
          } catch {
            call.data = text
          }
        }
      } catch (e) {
        // Ignorar errores de parsing
      }

      networkCalls.push(call)
    }
  })

  // También capturar requests para debug
  page.on('request', (request: HTTPRequest) => {
    const url = request.url()
    if (url.includes('api') || url.includes('candidato') || url.includes('formula')) {
      console.log(`  📤 ${request.method()} ${url.substring(0, 80)}...`)
    }
  })

  return { browser, page, networkCalls }
}

function extractCandidatesFromApiData(data: unknown): CandidateData[] {
  const candidates: CandidateData[] = []

  if (!data) return candidates

  // Manejar diferentes estructuras de respuesta
  let items: unknown[] = []

  if (Array.isArray(data)) {
    items = data
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>

    // Buscar arrays en diferentes propiedades
    const arrayProps = ['data', 'formulas', 'candidatos', 'lista', 'items', 'result', 'lstFormulas', 'lstCandidatos']
    for (const prop of arrayProps) {
      if (Array.isArray(obj[prop])) {
        items = obj[prop]
        break
      }
    }

    // Si tiene estructura de fórmula presidencial
    if (obj.presidente || obj.strPresidente) {
      items = [obj]
    }
  }

  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>

    // Detectar si es una fórmula presidencial (tiene presidente y vicepresidentes)
    if (obj.presidente || obj.strPresidente || obj.objPresidente) {
      const pres = (obj.presidente || obj.strPresidente || obj.objPresidente) as Record<string, unknown>

      if (pres && typeof pres === 'object') {
        candidates.push({
          idHojaVida: Number(pres.idHojaVida || pres.id || 0),
          idOrganizacionPolitica: Number(obj.idOrganizacionPolitica || obj.idOP || 0),
          strNombreCompleto: String(pres.strNombreCompleto || pres.nombre || pres.strNombre || ''),
          strOrganizacionPolitica: String(obj.strOrganizacionPolitica || obj.partido || obj.strPartido || ''),
          strCargo: 'PRESIDENTE DE LA REPÚBLICA',
          strFoto: String(pres.strFoto || pres.foto || pres.strUrlFoto || ''),
          strDni: String(pres.strDni || pres.dni || pres.strDocumentoIdentidad || ''),
          rawData: pres
        })
      }

      // Vicepresidentes
      const vpsKeys = ['vicepresidentes', 'lstVicepresidentes', 'objVicepresidentes', 'arrVicepresidentes']
      for (const key of vpsKeys) {
        const vps = obj[key]
        if (Array.isArray(vps)) {
          for (let i = 0; i < vps.length; i++) {
            const vp = vps[i] as Record<string, unknown>
            if (vp && typeof vp === 'object') {
              candidates.push({
                idHojaVida: Number(vp.idHojaVida || vp.id || 0),
                idOrganizacionPolitica: Number(obj.idOrganizacionPolitica || 0),
                strNombreCompleto: String(vp.strNombreCompleto || vp.nombre || vp.strNombre || ''),
                strOrganizacionPolitica: String(obj.strOrganizacionPolitica || ''),
                strCargo: i === 0 ? 'PRIMER VICEPRESIDENTE' : 'SEGUNDO VICEPRESIDENTE',
                strFoto: String(vp.strFoto || vp.foto || ''),
                strDni: String(vp.strDni || vp.dni || ''),
                intPosicion: i + 1,
                rawData: vp
              })
            }
          }
        }
      }
    } else if (obj.strNombres || obj.strApellidoPaterno || obj.strNombreCompleto || obj.nombre) {
      // Candidato individual - construir nombre completo desde partes
      let fullName = ''
      if (obj.strApellidoPaterno && obj.strNombres) {
        fullName = `${obj.strApellidoPaterno} ${obj.strApellidoMaterno || ''} ${obj.strNombres}`.trim()
      } else if (obj.strNombreCompleto && !String(obj.strNombreCompleto).includes('.jpg')) {
        fullName = String(obj.strNombreCompleto)
      } else if (obj.nombre) {
        fullName = String(obj.nombre)
      }

      // Construir URL de foto desde GUID
      let photoUrl = ''
      if (obj.strGuidFoto) {
        photoUrl = `https://mpesije.jne.gob.pe/apidocs/${obj.strGuidFoto}.jpg`
      } else if (obj.strFoto && !String(obj.strFoto).includes('.jpg')) {
        photoUrl = String(obj.strFoto)
      }

      if (fullName) {
        candidates.push({
          idHojaVida: Number(obj.idHojaVida || obj.id || 0),
          idOrganizacionPolitica: Number(obj.idOrganizacionPolitica || obj.idOP || 0),
          strNombreCompleto: fullName,
          strOrganizacionPolitica: String(obj.strOrganizacionPolitica || obj.partido || ''),
          strCargo: String(obj.strCargo || obj.cargo || ''),
          strFoto: photoUrl,
          strDni: String(obj.strDni || obj.dni || obj.strDocumentoIdentidad || ''),
          strDistrito: obj.strDistrito ? String(obj.strDistrito) : undefined,
          intPosicion: obj.intPosicion ? Number(obj.intPosicion) : undefined,
          rawData: obj
        })
      }
    }
  }

  return candidates.filter(c => c.strNombreCompleto && c.strNombreCompleto.length > 3)
}

async function scrapePage(
  page: Page,
  networkCalls: NetworkCall[],
  url: string,
  cargoName: string
): Promise<CandidateData[]> {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`SCRAPEANDO: ${cargoName}`)
  console.log(`URL: ${url}`)
  console.log('═'.repeat(70))

  // Limpiar llamadas anteriores
  networkCalls.length = 0

  try {
    // Navegar
    console.log('\n📡 Navegando...')
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    // Esperar carga de Angular
    console.log('⏳ Esperando carga completa...')
    await delay(DELAY_MS)

    // Intentar hacer scroll para cargar más contenido
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })
    await delay(1000)
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await delay(2000)

    // Analizar llamadas de red capturadas
    console.log(`\n📊 Llamadas de red capturadas: ${networkCalls.length}`)

    const allCandidates: CandidateData[] = []

    for (const call of networkCalls) {
      if (call.data) {
        console.log(`  ✓ ${call.url.substring(0, 60)}... [${call.status}]`)

        const candidates = extractCandidatesFromApiData(call.data)
        if (candidates.length > 0) {
          console.log(`    → ${candidates.length} candidatos encontrados`)
          allCandidates.push(...candidates)
        }
      }
    }

    // Si no hay datos de API, intentar extraer del DOM
    if (allCandidates.length === 0) {
      console.log('\n🔍 Intentando extraer del DOM...')
      const domCandidates = await extractFromDOM(page, cargoName)
      allCandidates.push(...domCandidates)
    }

    // Guardar screenshot para debug
    const screenshotPath = `debug-${cargoName.toLowerCase().replace(/\s+/g, '-')}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`📸 Screenshot: ${screenshotPath}`)

    // Guardar HTML para debug
    const html = await page.content()
    fs.writeFileSync(`debug-${cargoName.toLowerCase().replace(/\s+/g, '-')}.html`, html)

    console.log(`\n✅ Total candidatos extraídos: ${allCandidates.length}`)

    return allCandidates

  } catch (error) {
    console.error(`❌ Error:`, error)
    return []
  }
}

async function extractFromDOM(page: Page, cargoName: string): Promise<CandidateData[]> {
  return await page.evaluate((cargo) => {
    const candidates: CandidateData[] = []

    // Buscar tarjetas de candidatos con varios selectores
    const selectors = [
      'app-card-formula',
      'app-card-candidato',
      '[class*="card-formula"]',
      '[class*="card-candidato"]',
      '[class*="tarjeta"]',
      '.mat-card',
      '[class*="formula"]'
    ]

    for (const selector of selectors) {
      const cards = document.querySelectorAll(selector)

      cards.forEach((card, index) => {
        const text = card.textContent || ''
        if (text.length < 20) return

        // Buscar nombre
        const nameSelectors = ['h3', 'h4', 'h5', '.nombre', '[class*="nombre"]', '.title', '.mat-card-title']
        let name = ''
        for (const ns of nameSelectors) {
          const el = card.querySelector(ns)
          if (el && el.textContent && el.textContent.trim().length > 3) {
            name = el.textContent.trim()
            break
          }
        }

        // Buscar partido
        const partySelectors = ['.partido', '[class*="partido"]', '[class*="organizacion"]', '.subtitle']
        let party = ''
        for (const ps of partySelectors) {
          const el = card.querySelector(ps)
          if (el && el.textContent) {
            party = el.textContent.trim()
            break
          }
        }

        // Buscar foto
        const img = card.querySelector('img')
        const photo = img?.src || ''

        // Buscar enlace a hoja de vida
        const link = card.querySelector('a[href*="hoja-vida"]')
        let idHojaVida = 0
        let idOrganizacion = 0

        if (link) {
          const href = link.getAttribute('href') || ''
          const match = href.match(/hoja-vida\/(\d+)\/(\d+)/)
          if (match) {
            idOrganizacion = parseInt(match[1])
            idHojaVida = parseInt(match[2])
          }
        }

        if (name) {
          candidates.push({
            idHojaVida,
            idOrganizacionPolitica: idOrganizacion,
            strNombreCompleto: name,
            strOrganizacionPolitica: party,
            strCargo: cargo,
            strFoto: photo,
            intPosicion: index + 1
          })
        }
      })

      if (candidates.length > 0) break
    }

    return candidates
  }, cargoName)
}

async function saveToDatabase(candidates: CandidateData[]): Promise<void> {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('GUARDANDO EN BASE DE DATOS')
  console.log('═'.repeat(70))

  let created = 0
  let updated = 0
  let errors = 0

  for (const c of candidates) {
    try {
      const slug = c.strNombreCompleto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Determinar cargo normalizado
      let cargo = 'diputado'
      const cargoLower = c.strCargo.toLowerCase()
      if (cargoLower.includes('presidente') && !cargoLower.includes('vice')) {
        cargo = 'presidente'
      } else if (cargoLower.includes('vicepresidente') || cargoLower.includes('vice')) {
        cargo = 'vicepresidente'
      } else if (cargoLower.includes('senador')) {
        cargo = 'senador'
      } else if (cargoLower.includes('andino') || cargoLower.includes('parlamento')) {
        cargo = 'parlamento_andino'
      }

      // Buscar o crear partido
      let partyId: string | null = null
      if (c.strOrganizacionPolitica) {
        const party = await sql`
          SELECT id FROM parties
          WHERE LOWER(name) LIKE ${`%${c.strOrganizacionPolitica.toLowerCase().substring(0, 15)}%`}
          LIMIT 1
        `
        if (party.length > 0) {
          partyId = party[0].id
        } else {
          const newParty = await sql`
            INSERT INTO parties (name, short_name)
            VALUES (${c.strOrganizacionPolitica}, ${c.strOrganizacionPolitica.substring(0, 20)})
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
          `
          partyId = newParty[0]?.id || null
        }
      }

      // Buscar candidato existente
      const existing = await sql`
        SELECT id FROM candidates
        WHERE slug = ${slug}
           OR (dni IS NOT NULL AND dni = ${c.strDni || ''})
        LIMIT 1
      `

      // Construir URL de hoja de vida
      const djhvUrl = c.idOrganizacionPolitica && c.idHojaVida
        ? `${VOTO_INFORMADO_BASE}/hoja-vida/${c.idOrganizacionPolitica}/${c.idHojaVida}`
        : null

      if (existing.length > 0) {
        await sql`
          UPDATE candidates SET
            full_name = ${c.strNombreCompleto},
            photo_url = COALESCE(${c.strFoto || null}, photo_url),
            cargo = ${cargo},
            party_id = COALESCE(${partyId}::uuid, party_id),
            dni = COALESCE(${c.strDni || null}, dni),
            jne_id = COALESCE(${c.idHojaVida ? String(c.idHojaVida) : null}, jne_id),
            djhv_url = COALESCE(${djhvUrl}, djhv_url),
            data_source = 'jne',
            is_active = true,
            last_updated = NOW()
          WHERE id = ${existing[0].id}::uuid
        `
        updated++
      } else {
        // Verificar que el slug no exista
        const slugExists = await sql`SELECT id FROM candidates WHERE slug = ${slug} LIMIT 1`

        if (slugExists.length > 0) {
          // Actualizar existente por slug
          await sql`
            UPDATE candidates SET
              photo_url = COALESCE(${c.strFoto || null}, photo_url),
              dni = COALESCE(${c.strDni || null}, dni),
              jne_id = COALESCE(${c.idHojaVida ? String(c.idHojaVida) : null}, jne_id),
              djhv_url = COALESCE(${djhvUrl}, djhv_url),
              data_source = 'jne',
              last_updated = NOW()
            WHERE slug = ${slug}
          `
          updated++
        } else {
          await sql`
            INSERT INTO candidates (
              full_name, slug, cargo, party_id, photo_url, dni, jne_id, djhv_url,
              is_active, data_source, inscription_status
            ) VALUES (
              ${c.strNombreCompleto}, ${slug}, ${cargo}, ${partyId}::uuid,
              ${c.strFoto || null}, ${c.strDni || null},
              ${c.idHojaVida ? String(c.idHojaVida) : null}, ${djhvUrl},
              true, 'jne', 'inscrito'
            )
          `
          created++
        }
      }

      console.log(`  ✓ ${c.strNombreCompleto}`)

    } catch (error) {
      console.error(`  ✗ ${c.strNombreCompleto}:`, error)
      errors++
    }
  }

  console.log(`\nResultados: ${created} creados, ${updated} actualizados, ${errors} errores`)
}

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' SCRAPER JNE VOTO INFORMADO - CAPTURA DE RED '.padStart(53).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  const pagesToScrape = [
    { url: `${VOTO_INFORMADO_BASE}/presidente-vicepresidentes`, name: 'Presidentes' },
    // { url: `${VOTO_INFORMADO_BASE}/senadores`, name: 'Senadores' },
    // { url: `${VOTO_INFORMADO_BASE}/diputados`, name: 'Diputados' },
    // { url: `${VOTO_INFORMADO_BASE}/parlamento-andino`, name: 'Parlamento Andino' },
  ]

  let browser: Browser | null = null

  try {
    console.log('\n🚀 Iniciando navegador...')
    const result = await setupBrowserWithNetworkCapture()
    browser = result.browser
    const { page, networkCalls } = result
    console.log('✓ Navegador listo')

    const allCandidates: CandidateData[] = []

    for (const pageConfig of pagesToScrape) {
      const candidates = await scrapePage(page, networkCalls, pageConfig.url, pageConfig.name)
      allCandidates.push(...candidates)
      await delay(2000)
    }

    // Guardar JSON
    if (allCandidates.length > 0) {
      fs.writeFileSync('jne-scraped-candidates.json', JSON.stringify(allCandidates, null, 2))
      console.log(`\n📄 Datos guardados en: jne-scraped-candidates.json`)

      // Guardar en BD
      await saveToDatabase(allCandidates)
    }

    console.log(`\n${'═'.repeat(70)}`)
    console.log('RESUMEN FINAL')
    console.log('═'.repeat(70))
    console.log(`Total candidatos: ${allCandidates.length}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

main().catch(console.error)
