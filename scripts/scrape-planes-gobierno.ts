/**
 * Scraper para obtener los planes de gobierno de todos los candidatos presidenciales
 * Navega a cada perfil y extrae la URL del PDF del plan de gobierno
 */

import puppeteer, { Page, Browser } from 'puppeteer'
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const sql = neon(process.env.DATABASE_URL || '')

const VOTO_INFORMADO = 'https://votoinformado.jne.gob.pe'
const DELAY_MS = 2000

interface PlanGobierno {
  candidato: string
  partido: string
  plan_url?: string
  hoja_vida_url?: string
  foto_url?: string
  cargo: string
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function scrapePlanesGobierno() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' EXTRACTOR DE PLANES DE GOBIERNO - JNE VOTO INFORMADO '.padStart(45).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

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

  // Interceptar respuestas para capturar datos de API
  const apiResponses: any[] = []
  page.on('response', async response => {
    const url = response.url()
    if (url.includes('ListaCandidatos') || url.includes('Candidato') || url.includes('Plan')) {
      try {
        const contentType = response.headers()['content-type'] || ''
        if (contentType.includes('application/json')) {
          const data = await response.json()
          apiResponses.push({ url, data })
        }
      } catch (e) {}
    }
  })

  const planes: PlanGobierno[] = []

  try {
    // Navegar a la página de candidatos presidenciales
    console.log('\n📡 Navegando a presidente-vicepresidentes...')
    await page.goto(`${VOTO_INFORMADO}/presidente-vicepresidentes`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await delay(5000)
    console.log('✓ Página cargada')

    // Esperar a que se cargue el contenido
    await page.waitForSelector('img', { timeout: 10000 }).catch(() => {})

    // Tomar screenshot inicial
    await page.screenshot({ path: 'planes-1-inicial.png', fullPage: true })
    console.log('📸 Screenshot: planes-1-inicial.png')

    // Obtener el HTML de la página para análisis
    const pageContent = await page.content()
    fs.writeFileSync('page-content.html', pageContent)

    // Buscar todos los candidatos visibles
    const candidatosVisibles = await page.evaluate(() => {
      const results: any[] = []

      // Buscar imágenes de candidatos (cada imagen representa un candidato)
      const imgs = document.querySelectorAll('img[src*="mpesije"], img[src*="jne"]')
      imgs.forEach((img, index) => {
        const parent = img.closest('div')
        const text = parent?.textContent || ''
        results.push({
          index,
          src: (img as HTMLImageElement).src,
          text: text.substring(0, 200)
        })
      })

      // Buscar nombres de candidatos en el texto
      const bodyText = document.body.innerText
      const lines = bodyText.split('\n').filter(l => l.trim().length > 0)

      return { imgs: results, totalLines: lines.length, sampleLines: lines.slice(0, 50) }
    })

    console.log(`\n📋 Imágenes de candidatos encontradas: ${candidatosVisibles.imgs.length}`)

    // Buscar elementos clickeables (fórmulas presidenciales)
    const formulas = await page.evaluate(() => {
      const elements: any[] = []

      // Buscar contenedores de fórmulas
      document.querySelectorAll('div').forEach((div, index) => {
        const text = div.textContent || ''
        const hasImage = div.querySelector('img[src*="jne"]') !== null

        // Si tiene imagen de JNE y texto razonable, probablemente es una fórmula
        if (hasImage && text.length > 50 && text.length < 2000) {
          // Verificar si contiene nombre de candidato conocido
          const keywords = ['PRESIDENTE', 'VICEPRESIDENTE', 'FUERZA POPULAR', 'ALIANZA', 'PARTIDO']
          const hasKeyword = keywords.some(k => text.toUpperCase().includes(k))

          if (hasKeyword) {
            elements.push({
              index,
              classes: div.className,
              textPreview: text.substring(0, 150),
              hasClickable: div.querySelector('button, a') !== null
            })
          }
        }
      })

      return elements.slice(0, 50)
    })

    console.log(`📋 Posibles fórmulas presidenciales: ${formulas.length}`)

    // Procesar datos de la API capturada
    if (apiResponses.length > 0) {
      console.log(`\n📡 Respuestas API capturadas: ${apiResponses.length}`)

      for (const resp of apiResponses) {
        if (resp.data && resp.data.data && Array.isArray(resp.data.data)) {
          console.log(`\n✓ Procesando ${resp.data.data.length} candidatos de la API...`)

          for (const candidato of resp.data.data) {
            // Solo procesar presidentes
            if (!candidato.strCargo?.includes('PRESIDENTE')) continue

            const nombre = `${candidato.strApellidoPaterno} ${candidato.strApellidoMaterno} ${candidato.strNombres}`.trim()
            const partido = candidato.strOrganizacionPolitica || ''

            // Construir URLs
            const fotoUrl = candidato.strGuidFoto
              ? `https://mpesije.jne.gob.pe/apidocs/${candidato.strGuidFoto}.jpg`
              : ''

            // Buscar plan de gobierno basado en la organización política
            const orgId = candidato.idOrganizacionPolitica
            const planUrl = orgId
              ? `https://declara.jne.gob.pe/ASSETS/PLANGOBIERNO/FILEPLANGOBIERNO/${orgId}.pdf`
              : undefined

            planes.push({
              candidato: nombre,
              partido,
              cargo: candidato.strCargo,
              foto_url: fotoUrl,
              plan_url: planUrl
            })

            console.log(`  ✓ ${nombre} (${partido})`)
          }
        }
      }
    }

    // Si no encontramos datos de la API, intentar extraer del DOM
    if (planes.length === 0) {
      console.log('\n⚠ No se encontraron datos de API, extrayendo del DOM...')

      // Intentar hacer clic en cada tarjeta para ver detalles
      const tarjetas = await page.$$('div[class*="card"], div[class*="formula"]')
      console.log(`Tarjetas encontradas: ${tarjetas.length}`)

      for (let i = 0; i < Math.min(tarjetas.length, 40); i++) {
        try {
          // Re-obtener las tarjetas (el DOM puede cambiar)
          const currentTarjetas = await page.$$('div[class*="card"], div[class*="formula"]')
          if (i >= currentTarjetas.length) break

          // Hacer clic
          await currentTarjetas[i].click()
          await delay(1500)

          // Buscar información en el modal/panel abierto
          const modalData = await page.evaluate(() => {
            const modal = document.querySelector('.modal, [role="dialog"], .mat-dialog-container, .cdk-overlay-pane')
            if (!modal) return null

            const text = modal.textContent || ''
            const pdfLink = modal.querySelector('a[href*=".pdf"], a[href*="plan"]')

            return {
              text: text.substring(0, 500),
              pdfUrl: pdfLink?.getAttribute('href')
            }
          })

          if (modalData) {
            console.log(`  Tarjeta ${i + 1}: ${modalData.text.substring(0, 100)}...`)
            if (modalData.pdfUrl) {
              console.log(`  📄 PDF: ${modalData.pdfUrl}`)
            }
          }

          // Cerrar modal
          await page.keyboard.press('Escape')
          await delay(500)

        } catch (e) {
          // Continuar con la siguiente
        }
      }
    }

    // Buscar planes de gobierno en URLs conocidas
    console.log('\n🔍 Buscando planes de gobierno en URLs conocidas...')

    const knownParties = [
      { id: 2898, name: 'FE EN EL PERU' },
      { id: 2921, name: 'PARTIDO POLITICO PRIN' },
      { id: 2956, name: 'PARTIDO PAIS PARA TODOS' },
      { id: 14, name: 'PARTIDO DEMOCRATICO SOMOS PERU' },
      { id: 1, name: 'FUERZA POPULAR' },
      { id: 2, name: 'ALIANZA PARA EL PROGRESO' },
      { id: 3, name: 'RENOVACION POPULAR' },
      { id: 4, name: 'PARTIDO MORADO' },
      { id: 5, name: 'ACCION POPULAR' },
      { id: 6, name: 'PERU LIBRE' },
    ]

    // Intentar construir URLs de planes de gobierno
    const planUrls = [
      'https://declara.jne.gob.pe/ASSETS/PLANGOBIERNO/',
      'https://plataformaelectoral.jne.gob.pe/Candidato/DescargarPlanGobierno/',
      'https://votoinformado.jne.gob.pe/assets/planes/',
    ]

    // Screenshot final
    await page.screenshot({ path: 'planes-2-final.png', fullPage: true })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
  }

  // Guardar resultados
  console.log('\n' + '═'.repeat(70))
  console.log('RESUMEN')
  console.log('═'.repeat(70))
  console.log(`Total planes encontrados: ${planes.length}`)

  // Filtrar solo presidentes (no vicepresidentes)
  const presidentes = planes.filter(p => p.cargo === 'PRESIDENTE DE LA REPÚBLICA')
  console.log(`Candidatos presidenciales: ${presidentes.length}`)

  fs.writeFileSync('planes-gobierno.json', JSON.stringify(planes, null, 2))
  console.log('\nDatos guardados en: planes-gobierno.json')

  // Mostrar candidatos con planes
  console.log('\n─'.repeat(70))
  console.log('CANDIDATOS PRESIDENCIALES:')
  console.log('─'.repeat(70))

  presidentes.forEach((p, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${p.candidato}`)
    console.log(`    Partido: ${p.partido}`)
    if (p.plan_url) {
      console.log(`    Plan: ${p.plan_url}`)
    }
  })

  // Actualizar base de datos
  await updateDatabase(planes)

  return planes
}

async function updateDatabase(planes: PlanGobierno[]) {
  console.log('\n' + '═'.repeat(70))
  console.log('ACTUALIZANDO BASE DE DATOS')
  console.log('═'.repeat(70))

  let updated = 0

  for (const plan of planes) {
    if (!plan.candidato || !plan.foto_url) continue

    try {
      // Buscar candidato por nombre
      const nameParts = plan.candidato.split(' ')
      const candidates = await sql`
        SELECT id, full_name FROM candidates
        WHERE LOWER(full_name) LIKE ${`%${nameParts[0].toLowerCase()}%`}
        AND LOWER(full_name) LIKE ${`%${nameParts[1]?.toLowerCase() || ''}%`}
        LIMIT 1
      `

      if (candidates.length > 0) {
        await sql`
          UPDATE candidates SET
            photo_url = COALESCE(${plan.foto_url}, photo_url),
            djhv_url = COALESCE(${plan.plan_url || null}, djhv_url),
            data_source = 'jne',
            last_updated = NOW()
          WHERE id = ${candidates[0].id}::uuid
        `
        console.log(`✓ ${candidates[0].full_name}`)
        updated++
      }
    } catch (error) {
      // Continuar
    }
  }

  console.log(`\nCandidatos actualizados: ${updated}`)
}

scrapePlanesGobierno().catch(console.error)
