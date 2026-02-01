/**
 * Completa los detalles de hojas de vida para candidatos existentes
 * Usa la información del scraping previo para obtener datos de educación,
 * experiencia, sentencias y patrimonio
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
const DELAY_MS = 3000

interface CandidateToComplete {
  id: string
  full_name: string
  dni: string | null
  jne_id: string | null
  djhv_url: string | null
}

interface HojaVidaDetails {
  education_details: any[]
  experience_details: any[]
  political_trajectory: any[]
  penal_sentences: any[]
  civil_sentences: any[]
  assets_declaration: any
  party_resignations: number
  birth_date?: string
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getCandidatesToComplete(): Promise<CandidateToComplete[]> {
  // Obtener candidatos que necesitan más datos
  const candidates = await sql`
    SELECT id, full_name, dni, jne_id, djhv_url
    FROM candidates
    WHERE cargo IN ('presidente', 'vicepresidente')
    AND (
      education_details IS NULL
      OR jsonb_array_length(education_details) = 0
      OR experience_details IS NULL
      OR jsonb_array_length(experience_details) = 0
    )
    ORDER BY full_name
  `

  return candidates.map(c => ({
    id: c.id,
    full_name: c.full_name,
    dni: c.dni,
    jne_id: c.jne_id,
    djhv_url: c.djhv_url
  }))
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

async function findHojaVidaUrl(
  page: Page,
  candidate: CandidateToComplete
): Promise<string | null> {
  // Si ya tiene URL, usarla
  if (candidate.djhv_url) {
    return candidate.djhv_url
  }

  // Buscar en la página de presidentes
  try {
    await page.goto(`${VOTO_INFORMADO_BASE}/presidente-vicepresidentes`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await delay(3000)

    // Buscar el enlace del candidato por nombre
    const normalizedName = candidate.full_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    const hojaVidaUrl = await page.evaluate((searchName) => {
      const links = document.querySelectorAll('a[href*="hoja-vida"]')
      for (const link of links) {
        const text = link.textContent?.toLowerCase() || ''
        const card = link.closest('[class*="card"]')
        const cardText = card?.textContent?.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') || ''

        // Buscar por partes del nombre
        const nameParts = searchName.split(' ').filter((p: string) => p.length > 2)
        const matches = nameParts.filter((part: string) => cardText.includes(part))

        if (matches.length >= 2) {
          return link.getAttribute('href')
        }
      }
      return null
    }, normalizedName)

    if (hojaVidaUrl) {
      return hojaVidaUrl.startsWith('http')
        ? hojaVidaUrl
        : `${VOTO_INFORMADO_BASE}${hojaVidaUrl}`
    }

  } catch (error) {
    console.error(`  Error buscando URL para ${candidate.full_name}:`, error)
  }

  return null
}

async function extractHojaVidaDetails(
  page: Page,
  url: string
): Promise<HojaVidaDetails | null> {
  try {
    // Capturar respuestas de API
    const apiData: any[] = []

    page.on('response', async (response: HTTPResponse) => {
      const resUrl = response.url()
      const contentType = response.headers()['content-type'] || ''

      if (contentType.includes('json') &&
          (resUrl.includes('Candidato') || resUrl.includes('HojaVida') ||
           resUrl.includes('Detalle') || resUrl.includes('sije'))) {
        try {
          const data = await response.json()
          apiData.push(data)
        } catch {}
      }
    })

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await delay(5000)

    // Intentar expandir todas las secciones
    await page.evaluate(() => {
      document.querySelectorAll('mat-expansion-panel-header, .accordion-header, [class*="expansion"]')
        .forEach(el => (el as HTMLElement).click())
    })

    await delay(2000)

    // Extraer datos del DOM
    const domData = await page.evaluate(() => {
      const result: HojaVidaDetails = {
        education_details: [],
        experience_details: [],
        political_trajectory: [],
        penal_sentences: [],
        civil_sentences: [],
        assets_declaration: {},
        party_resignations: 0
      }

      // Buscar secciones por título
      const sections = document.querySelectorAll(
        '.mat-expansion-panel, [class*="seccion"], [class*="section"], .card'
      )

      sections.forEach(section => {
        const title = section.querySelector('h3, h4, .titulo, mat-panel-title')?.textContent?.toLowerCase() || ''
        const rows = section.querySelectorAll('tr:not(:first-child), li, .item-row')

        // Educación
        if (title.includes('educación') || title.includes('formación') || title.includes('estudios')) {
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, span, .cell')
            if (cells.length >= 2) {
              const text = row.textContent || ''
              result.education_details.push({
                level: cells[0]?.textContent?.trim() || '',
                institution: cells[1]?.textContent?.trim() || '',
                degree: cells[2]?.textContent?.trim() || '',
                is_completed: !text.toLowerCase().includes('inconcluso'),
                source: 'jne'
              })
            }
          })
        }

        // Experiencia
        if (title.includes('experiencia') || title.includes('laboral') || title.includes('trabajo')) {
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, span, .cell')
            if (cells.length >= 2) {
              const text = row.textContent || ''
              result.experience_details.push({
                organization: cells[0]?.textContent?.trim() || '',
                position: cells[1]?.textContent?.trim() || '',
                sector: text.toLowerCase().includes('público') ? 'publico' : 'privado',
                is_current: text.toLowerCase().includes('actual'),
                source: 'jne'
              })
            }
          })
        }

        // Trayectoria política
        if (title.includes('trayectoria') || title.includes('política') || title.includes('cargos')) {
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, span, .cell')
            if (cells.length >= 2) {
              result.political_trajectory.push({
                party: cells[0]?.textContent?.trim() || '',
                position: cells[1]?.textContent?.trim() || '',
                is_elected: row.textContent?.toLowerCase().includes('electo') || false,
                source: 'jne'
              })
            }
          })
        }

        // Sentencias penales
        if (title.includes('penal') || title.includes('sentencia')) {
          rows.forEach(row => {
            const text = row.textContent?.trim() || ''
            if (text.length > 10 && !text.toLowerCase().includes('no declara') && !text.toLowerCase().includes('ninguna')) {
              const cells = row.querySelectorAll('td, span')
              result.penal_sentences.push({
                delito: cells[1]?.textContent?.trim() || text.substring(0, 200),
                estado: text.toLowerCase().includes('firme') ? 'firme' : 'proceso'
              })
            }
          })
        }

        // Sentencias civiles
        if (title.includes('civil') || title.includes('obligación')) {
          rows.forEach(row => {
            const text = row.textContent?.trim() || ''
            if (text.length > 10 && !text.toLowerCase().includes('no declara')) {
              result.civil_sentences.push({
                tipo: 'contractual',
                descripcion: text.substring(0, 200),
                estado: 'proceso'
              })
            }
          })
        }

        // Renuncias
        if (title.includes('renuncia') || title.includes('militancia')) {
          result.party_resignations = rows.length
        }

        // Patrimonio
        if (title.includes('bien') || title.includes('patrimonio') || title.includes('ingreso')) {
          const text = section.textContent || ''
          const totalMatch = text.match(/total[:\s]*S\/?\s*([\d,.]+)/i)
          const ingresosMatch = text.match(/ingreso[s]?[:\s]*S\/?\s*([\d,.]+)/i)

          result.assets_declaration = {
            total_assets: totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : null,
            total_income: ingresosMatch ? parseFloat(ingresosMatch[1].replace(/,/g, '')) : null,
            is_complete: true,
            source: 'jne'
          }
        }
      })

      return result
    })

    // Si hay datos de API, usarlos para complementar
    for (const data of apiData) {
      if (data.educacion && Array.isArray(data.educacion) && data.educacion.length > 0) {
        domData.education_details = data.educacion.map((e: any) => ({
          level: e.strNivelEstudio || e.nivel || '',
          institution: e.strCentroEstudio || e.institucion || '',
          degree: e.strCarrera || e.carrera || '',
          is_completed: e.blnConcluido !== false,
          source: 'jne'
        }))
      }

      if (data.experiencia && Array.isArray(data.experiencia) && data.experiencia.length > 0) {
        domData.experience_details = data.experiencia.map((e: any) => ({
          organization: e.strCentroTrabajo || e.entidad || '',
          position: e.strOcupacion || e.cargo || '',
          sector: (e.strSector || '').toLowerCase().includes('público') ? 'publico' : 'privado',
          is_current: !e.intAnioFin,
          source: 'jne'
        }))
      }
    }

    return domData

  } catch (error) {
    console.error(`  Error extrayendo detalles:`, error)
    return null
  }
}

async function updateCandidateDetails(
  candidateId: string,
  details: HojaVidaDetails,
  djhvUrl: string | null
): Promise<boolean> {
  try {
    await sql`
      UPDATE candidates SET
        education_details = ${JSON.stringify(details.education_details)}::jsonb,
        experience_details = ${JSON.stringify(details.experience_details)}::jsonb,
        political_trajectory = ${JSON.stringify(details.political_trajectory)}::jsonb,
        penal_sentences = ${JSON.stringify(details.penal_sentences)}::jsonb,
        civil_sentences = ${JSON.stringify(details.civil_sentences)}::jsonb,
        assets_declaration = ${JSON.stringify(details.assets_declaration)}::jsonb,
        party_resignations = ${details.party_resignations},
        djhv_url = COALESCE(${djhvUrl}, djhv_url),
        data_verified = true,
        verification_date = NOW(),
        last_updated = NOW()
      WHERE id = ${candidateId}::uuid
    `
    return true
  } catch (error) {
    console.error(`  Error actualizando:`, error)
    return false
  }
}

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' COMPLETAR DETALLES DE HOJAS DE VIDA '.padStart(49).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  // Obtener candidatos que necesitan datos
  const candidates = await getCandidatesToComplete()
  console.log(`\n📋 Candidatos a completar: ${candidates.length}`)

  if (candidates.length === 0) {
    console.log('\n✅ Todos los candidatos tienen datos completos')
    return
  }

  const { browser, page } = await setupBrowser()

  let completed = 0
  let failed = 0

  try {
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i]
      console.log(`\n[${i + 1}/${candidates.length}] ${candidate.full_name}`)

      // Buscar URL de hoja de vida
      let url = candidate.djhv_url

      if (!url) {
        console.log('  🔍 Buscando URL...')
        url = await findHojaVidaUrl(page, candidate)
      }

      if (!url) {
        console.log('  ⚠ No se encontró URL de hoja de vida')
        failed++
        continue
      }

      console.log(`  📄 ${url.substring(0, 60)}...`)

      // Extraer detalles
      const details = await extractHojaVidaDetails(page, url)

      if (!details) {
        console.log('  ⚠ No se pudieron extraer detalles')
        failed++
        continue
      }

      // Verificar que hay datos útiles
      const hasData = details.education_details.length > 0 ||
                      details.experience_details.length > 0 ||
                      details.political_trajectory.length > 0

      if (!hasData) {
        console.log('  ⚠ No se encontraron datos en la hoja de vida')
        failed++
        continue
      }

      // Actualizar en BD
      const success = await updateCandidateDetails(candidate.id, details, url)

      if (success) {
        completed++
        console.log(`  ✓ Educación: ${details.education_details.length}`)
        console.log(`  ✓ Experiencia: ${details.experience_details.length}`)
        console.log(`  ✓ Trayectoria: ${details.political_trajectory.length}`)
      } else {
        failed++
      }

      // Pausa entre candidatos
      await delay(DELAY_MS)
    }

  } finally {
    await browser.close()
  }

  console.log('\n' + '═'.repeat(70))
  console.log('RESUMEN')
  console.log('═'.repeat(70))
  console.log(`Completados: ${completed}`)
  console.log(`Fallidos: ${failed}`)
}

main().catch(console.error)
