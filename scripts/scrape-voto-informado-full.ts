/**
 * Scraper completo para JNE Voto Informado
 * Extrae datos de candidatos de las páginas oficiales del JNE
 *
 * URLs a scrapear:
 * - https://votoinformado.jne.gob.pe/presidente-vicepresidentes
 * - https://votoinformado.jne.gob.pe/diputados
 * - https://votoinformado.jne.gob.pe/senadores
 * - https://votoinformado.jne.gob.pe/parlamento-andino
 */

import puppeteer, { Page, Browser } from 'puppeteer'
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const sql = neon(process.env.DATABASE_URL || '')

const VOTO_INFORMADO_BASE = 'https://votoinformado.jne.gob.pe'
const DELAY_MS = 2000

// Páginas a scrapear
const PAGES_TO_SCRAPE = [
  { url: '/presidente-vicepresidentes', cargo: 'presidente', name: 'Presidentes' },
  { url: '/senadores', cargo: 'senador', name: 'Senadores' },
  { url: '/diputados', cargo: 'diputado', name: 'Diputados' },
  { url: '/parlamento-andino', cargo: 'parlamento_andino', name: 'Parlamento Andino' },
]

interface CandidateData {
  full_name: string
  party_name: string
  party_short_name?: string
  cargo: string
  district?: string
  photo_url?: string
  jne_id?: string
  dni?: string
  position_number?: number
  education_details?: any[]
  experience_details?: any[]
  political_trajectory?: any[]
  penal_sentences?: any[]
  civil_sentences?: any[]
  assets_declaration?: any
  party_resignations?: number
}

interface ApiCall {
  url: string
  method: string
  postData?: string
  response?: any
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function setupPage(browser: Browser): Promise<{ page: Page; apiCalls: ApiCall[] }> {
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  const apiCalls: ApiCall[] = []

  // Interceptar llamadas de red
  await page.setRequestInterception(true)

  page.on('request', request => {
    const url = request.url()

    // Log API calls
    if (url.includes('api') || url.includes('Api') ||
        url.includes('candidato') || url.includes('Candidato') ||
        url.includes('formula') || url.includes('Formula') ||
        url.includes('lista') || url.includes('Lista')) {
      apiCalls.push({
        url,
        method: request.method(),
        postData: request.postData()
      })
    }

    request.continue()
  })

  page.on('response', async response => {
    const url = response.url()
    if (url.includes('api') || url.includes('candidato') ||
        url.includes('formula') || url.includes('lista')) {
      try {
        const contentType = response.headers()['content-type'] || ''
        if (contentType.includes('application/json')) {
          const json = await response.json()
          const call = apiCalls.find(c => c.url === url)
          if (call) {
            call.response = json
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  })

  return { page, apiCalls }
}

async function extractCandidatesFromPage(page: Page, cargo: string): Promise<CandidateData[]> {
  const candidates: CandidateData[] = []

  // Esperar a que cargue el contenido dinámico
  await delay(5000)

  // Intentar extraer datos de la página
  const pageData = await page.evaluate(() => {
    const results: any[] = []

    // Buscar tarjetas de candidatos
    const cardSelectors = [
      '.candidate-card',
      '.candidato-card',
      '[class*="card"]',
      '[class*="candidato"]',
      '.mat-card',
      '.ng-star-inserted',
      'app-card-formula',
      'app-card-candidato',
    ]

    for (const selector of cardSelectors) {
      const cards = document.querySelectorAll(selector)
      cards.forEach(card => {
        const text = card.textContent?.trim() || ''
        if (text.length > 20 && text.length < 2000) {
          // Extraer imagen
          const img = card.querySelector('img')
          const photoUrl = img?.src || img?.getAttribute('data-src')

          // Extraer nombre (buscar en diferentes elementos)
          let name = ''
          const nameEl = card.querySelector('h3, h4, h5, .nombre, .name, [class*="nombre"]')
          if (nameEl) {
            name = nameEl.textContent?.trim() || ''
          }

          // Extraer partido
          let party = ''
          const partyEl = card.querySelector('.partido, .party, [class*="partido"]')
          if (partyEl) {
            party = partyEl.textContent?.trim() || ''
          }

          // Extraer enlace al perfil
          const link = card.querySelector('a')?.href

          if (name || text.length > 50) {
            results.push({
              name: name || text.substring(0, 100),
              party,
              photoUrl,
              link,
              rawText: text.substring(0, 500)
            })
          }
        }
      })
    }

    // También buscar en tablas
    document.querySelectorAll('table tbody tr').forEach(row => {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 2) {
        const name = cells[0]?.textContent?.trim() || cells[1]?.textContent?.trim()
        const party = cells[1]?.textContent?.trim() || cells[2]?.textContent?.trim()
        const img = row.querySelector('img')

        if (name && name.length > 3) {
          results.push({
            name,
            party,
            photoUrl: img?.src,
            rawText: row.textContent?.trim()?.substring(0, 300)
          })
        }
      }
    })

    return results
  })

  // Convertir a CandidateData
  for (const data of pageData) {
    if (data.name && data.name.length > 3) {
      candidates.push({
        full_name: data.name,
        party_name: data.party || 'Sin partido',
        cargo,
        photo_url: data.photoUrl,
        jne_id: data.link ? extractIdFromUrl(data.link) : undefined,
      })
    }
  }

  return candidates
}

function extractIdFromUrl(url: string): string | undefined {
  // Intentar extraer ID de diferentes formatos de URL
  const patterns = [
    /\/candidato\/(\d+)/i,
    /\/formula\/(\d+)/i,
    /id=(\d+)/i,
    /\/(\d+)$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return undefined
}

async function scrapePage(browser: Browser, pageConfig: typeof PAGES_TO_SCRAPE[0]): Promise<CandidateData[]> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Scrapeando: ${pageConfig.name}`)
  console.log(`URL: ${VOTO_INFORMADO_BASE}${pageConfig.url}`)
  console.log('='.repeat(60))

  const { page, apiCalls } = await setupPage(browser)
  const candidates: CandidateData[] = []

  try {
    // Navegar a la página
    console.log('Navegando...')
    await page.goto(`${VOTO_INFORMADO_BASE}${pageConfig.url}`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    // Esperar que cargue
    await delay(5000)

    // Screenshot para debug
    const screenshotPath = `voto-informado-${pageConfig.cargo}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`Screenshot: ${screenshotPath}`)

    // Obtener título de la página
    const title = await page.title()
    console.log(`Título: ${title}`)

    // Extraer candidatos del DOM
    const domCandidates = await extractCandidatesFromPage(page, pageConfig.cargo)
    console.log(`Candidatos encontrados en DOM: ${domCandidates.length}`)

    // Verificar llamadas API capturadas
    console.log(`\nLlamadas API capturadas: ${apiCalls.length}`)

    for (const call of apiCalls) {
      console.log(`  ${call.method} ${call.url.substring(0, 80)}...`)

      if (call.response) {
        // Si hay respuesta JSON, intentar extraer candidatos
        const data = call.response

        if (Array.isArray(data)) {
          console.log(`    -> Array con ${data.length} elementos`)
          for (const item of data) {
            if (item.nombre || item.nombreCompleto || item.full_name) {
              candidates.push({
                full_name: item.nombre || item.nombreCompleto || item.full_name,
                party_name: item.partido || item.organizacionPolitica || 'Sin partido',
                cargo: pageConfig.cargo,
                photo_url: item.foto || item.urlFoto || item.photo_url,
                jne_id: String(item.id || item.idCandidato || ''),
                dni: item.dni,
              })
            }
          }
        } else if (data.data && Array.isArray(data.data)) {
          console.log(`    -> data.data con ${data.data.length} elementos`)
          for (const item of data.data) {
            if (item.nombre || item.nombreCompleto) {
              candidates.push({
                full_name: item.nombre || item.nombreCompleto,
                party_name: item.partido || item.organizacionPolitica || 'Sin partido',
                cargo: pageConfig.cargo,
                photo_url: item.foto || item.urlFoto,
                jne_id: String(item.id || item.idCandidato || ''),
                dni: item.dni,
              })
            }
          }
        } else if (data.formulas && Array.isArray(data.formulas)) {
          console.log(`    -> formulas con ${data.formulas.length} elementos`)
          for (const formula of data.formulas) {
            // Cada fórmula tiene presidente y vicepresidentes
            if (formula.presidente) {
              candidates.push({
                full_name: formula.presidente.nombre || formula.presidente.nombreCompleto,
                party_name: formula.organizacionPolitica || formula.partido || 'Sin partido',
                cargo: 'presidente',
                photo_url: formula.presidente.foto || formula.presidente.urlFoto,
                jne_id: String(formula.presidente.id || ''),
              })
            }
            if (formula.vicepresidentes) {
              for (const vp of formula.vicepresidentes) {
                candidates.push({
                  full_name: vp.nombre || vp.nombreCompleto,
                  party_name: formula.organizacionPolitica || formula.partido || 'Sin partido',
                  cargo: 'vicepresidente',
                  photo_url: vp.foto || vp.urlFoto,
                  jne_id: String(vp.id || ''),
                })
              }
            }
          }
        }
      }
    }

    // Si no encontramos candidatos en API, usar los del DOM
    if (candidates.length === 0 && domCandidates.length > 0) {
      candidates.push(...domCandidates)
    }

    // Scroll para cargar más contenido si hay paginación
    let previousHeight = 0
    let scrollAttempts = 0
    const maxScrollAttempts = 5

    while (scrollAttempts < maxScrollAttempts) {
      const currentHeight = await page.evaluate(() => document.body.scrollHeight)
      if (currentHeight === previousHeight) break

      previousHeight = currentHeight
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await delay(2000)
      scrollAttempts++

      // Extraer más candidatos después del scroll
      const moreCandidates = await extractCandidatesFromPage(page, pageConfig.cargo)
      for (const c of moreCandidates) {
        if (!candidates.find(existing => existing.full_name === c.full_name)) {
          candidates.push(c)
        }
      }
    }

    console.log(`\nTotal candidatos extraídos: ${candidates.length}`)

  } catch (error) {
    console.error(`Error scrapeando ${pageConfig.name}:`, error)
  } finally {
    await page.close()
  }

  return candidates
}

async function saveToDatabase(candidates: CandidateData[]): Promise<void> {
  console.log(`\nGuardando ${candidates.length} candidatos en la base de datos...`)

  let created = 0
  let updated = 0
  let skipped = 0

  for (const candidate of candidates) {
    try {
      // Verificar si ya existe
      const existing = await sql`
        SELECT id FROM candidates
        WHERE LOWER(full_name) = LOWER(${candidate.full_name})
        LIMIT 1
      `

      if (existing.length > 0) {
        // Actualizar
        await sql`
          UPDATE candidates SET
            photo_url = COALESCE(${candidate.photo_url}, photo_url),
            jne_id = COALESCE(${candidate.jne_id}, jne_id),
            last_updated = NOW()
          WHERE id = ${existing[0].id}::uuid
        `
        updated++
      } else {
        // Buscar o crear partido
        let partyId = null
        if (candidate.party_name && candidate.party_name !== 'Sin partido') {
          const party = await sql`
            SELECT id FROM parties
            WHERE LOWER(name) LIKE ${`%${candidate.party_name.toLowerCase()}%`}
            OR LOWER(short_name) LIKE ${`%${candidate.party_name.toLowerCase()}%`}
            LIMIT 1
          `

          if (party.length > 0) {
            partyId = party[0].id
          } else {
            // Crear partido
            const newParty = await sql`
              INSERT INTO parties (name, short_name)
              VALUES (${candidate.party_name}, ${candidate.party_short_name || candidate.party_name.substring(0, 10)})
              RETURNING id
            `
            partyId = newParty[0].id
          }
        }

        // Crear candidato
        const slug = candidate.full_name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        await sql`
          INSERT INTO candidates (
            full_name, slug, cargo, party_id, photo_url, jne_id,
            is_active, data_source
          ) VALUES (
            ${candidate.full_name},
            ${slug},
            ${candidate.cargo},
            ${partyId}::uuid,
            ${candidate.photo_url},
            ${candidate.jne_id},
            true,
            'jne'
          )
          ON CONFLICT (slug) DO UPDATE SET
            photo_url = COALESCE(EXCLUDED.photo_url, candidates.photo_url),
            jne_id = COALESCE(EXCLUDED.jne_id, candidates.jne_id),
            last_updated = NOW()
        `
        created++
      }
    } catch (error) {
      console.error(`Error guardando ${candidate.full_name}:`, error)
      skipped++
    }
  }

  console.log(`Resultados: ${created} creados, ${updated} actualizados, ${skipped} omitidos`)
}

async function main() {
  console.log('='.repeat(60))
  console.log('SCRAPER VOTO INFORMADO JNE')
  console.log('Extrayendo datos oficiales de candidatos')
  console.log('='.repeat(60))

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })

  const allCandidates: CandidateData[] = []

  try {
    for (const pageConfig of PAGES_TO_SCRAPE) {
      const candidates = await scrapePage(browser, pageConfig)
      allCandidates.push(...candidates)

      // Delay entre páginas
      await delay(DELAY_MS)
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`RESUMEN TOTAL`)
    console.log(`${'='.repeat(60)}`)
    console.log(`Total candidatos encontrados: ${allCandidates.length}`)

    // Deduplicar por nombre
    const uniqueCandidates = allCandidates.filter((c, i, arr) =>
      arr.findIndex(x => x.full_name === c.full_name) === i
    )
    console.log(`Candidatos únicos: ${uniqueCandidates.length}`)

    // Mostrar algunos ejemplos
    console.log('\nEjemplos de candidatos encontrados:')
    uniqueCandidates.slice(0, 10).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.full_name} (${c.party_name}) - ${c.cargo}`)
      if (c.photo_url) console.log(`     Foto: ${c.photo_url.substring(0, 60)}...`)
    })

    // Guardar en base de datos
    if (uniqueCandidates.length > 0) {
      await saveToDatabase(uniqueCandidates)
    }

    // Guardar JSON para referencia
    fs.writeFileSync('voto-informado-candidates.json', JSON.stringify(uniqueCandidates, null, 2))
    console.log('\nDatos guardados en: voto-informado-candidates.json')

  } catch (error) {
    console.error('Error general:', error)
  } finally {
    await browser.close()
    console.log('\nScraping completado')
  }
}

main().catch(console.error)
