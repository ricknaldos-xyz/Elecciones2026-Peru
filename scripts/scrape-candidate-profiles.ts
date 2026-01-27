/**
 * Scraper para perfiles individuales de candidatos en Voto Informado
 * Extrae detalles completos: educación, experiencia, sentencias, plan de gobierno
 */

import puppeteer, { Page, Browser } from 'puppeteer'
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const sql = neon(process.env.DATABASE_URL || '')

const VOTO_INFORMADO = 'https://votoinformado.jne.gob.pe'
const DELAY_MS = 3000

interface CandidateProfile {
  full_name: string
  education: Array<{
    level: string
    institution: string
    career?: string
    year?: number
    completed: boolean
  }>
  experience: Array<{
    entity: string
    position: string
    sector: string
    year_start?: number
    year_end?: number
  }>
  political: Array<{
    party: string
    position: string
    year_start?: number
    year_end?: number
  }>
  penal_sentences: Array<{
    type: string
    description: string
    status: string
    expediente?: string
  }>
  civil_sentences: Array<{
    type: string
    description: string
    amount?: number
  }>
  assets?: {
    total: number
    properties: number
    vehicles: number
  }
  party_resignations: number
  plan_gobierno_url?: string
  hoja_vida_url?: string
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function scrapeProfiles() {
  console.log('='.repeat(70))
  console.log('EXTRAYENDO PERFILES DETALLADOS DE CANDIDATOS')
  console.log('='.repeat(70))

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  const profiles: CandidateProfile[] = []

  try {
    // Navegar a presidente-vicepresidentes
    console.log('\nNavegando a la página de candidatos...')
    await page.goto(`${VOTO_INFORMADO}/presidente-vicepresidentes`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await delay(5000)

    // Obtener número de tarjetas de candidatos
    const cardCount = await page.evaluate(() => {
      return document.querySelectorAll('app-card-formula, [class*="card-formula"]').length
    })

    console.log(`Tarjetas de fórmulas encontradas: ${cardCount}`)

    // Procesar cada tarjeta (fórmula presidencial)
    for (let i = 0; i < Math.min(cardCount, 36); i++) {
      console.log(`\n${'─'.repeat(50)}`)
      console.log(`Procesando fórmula ${i + 1}/${cardCount}`)

      try {
        // Hacer clic en la tarjeta para abrir detalles
        await page.evaluate((index) => {
          const cards = document.querySelectorAll('app-card-formula, [class*="card-formula"]')
          const card = cards[index]
          if (card) {
            // Buscar botón "Ver más" o hacer clic en la tarjeta
            const btn = card.querySelector('button, a, [class*="ver"]')
            if (btn) {
              (btn as HTMLElement).click()
            } else {
              (card as HTMLElement).click()
            }
          }
        }, i)

        await delay(2000)

        // Extraer información del modal/panel abierto
        const profileData = await page.evaluate(() => {
          const data: any = {
            full_name: '',
            education: [],
            experience: [],
            political: [],
            penal_sentences: [],
            civil_sentences: [],
            party_resignations: 0
          }

          // Buscar nombre del candidato en el modal
          const nameEl = document.querySelector('.modal h2, .dialog h2, [mat-dialog-title], .nombre-candidato')
          if (nameEl) {
            data.full_name = nameEl.textContent?.trim() || ''
          }

          // Buscar secciones expandibles
          const panels = document.querySelectorAll('mat-expansion-panel, .accordion-item, [class*="expansion"]')

          panels.forEach(panel => {
            const header = panel.querySelector('mat-expansion-panel-header, .accordion-header')?.textContent?.toLowerCase() || ''
            const content = panel.querySelector('.mat-expansion-panel-content, .accordion-body')

            // Educación
            if (header.includes('formación') || header.includes('educación') || header.includes('estudios')) {
              const rows = content?.querySelectorAll('tr, .item, li') || []
              rows.forEach(row => {
                const text = row.textContent?.trim() || ''
                if (text.length > 5) {
                  const cells = row.querySelectorAll('td, span')
                  data.education.push({
                    level: cells[0]?.textContent?.trim() || text.split('-')[0]?.trim() || '',
                    institution: cells[1]?.textContent?.trim() || '',
                    career: cells[2]?.textContent?.trim() || '',
                    completed: !text.toLowerCase().includes('inconcluso')
                  })
                }
              })
            }

            // Experiencia
            if (header.includes('experiencia') || header.includes('laboral') || header.includes('trabajo')) {
              const rows = content?.querySelectorAll('tr, .item, li') || []
              rows.forEach(row => {
                const text = row.textContent?.trim() || ''
                if (text.length > 5) {
                  const cells = row.querySelectorAll('td, span')
                  data.experience.push({
                    entity: cells[0]?.textContent?.trim() || '',
                    position: cells[1]?.textContent?.trim() || '',
                    sector: text.toLowerCase().includes('público') ? 'publico' : 'privado'
                  })
                }
              })
            }

            // Trayectoria política
            if (header.includes('trayectoria') || header.includes('político') || header.includes('partidaria')) {
              const rows = content?.querySelectorAll('tr, .item, li') || []
              rows.forEach(row => {
                const text = row.textContent?.trim() || ''
                if (text.length > 5) {
                  const cells = row.querySelectorAll('td, span')
                  data.political.push({
                    party: cells[0]?.textContent?.trim() || '',
                    position: cells[1]?.textContent?.trim() || ''
                  })
                }
              })
            }

            // Sentencias penales
            if (header.includes('penal') || header.includes('sentencia')) {
              const rows = content?.querySelectorAll('tr, .item, li') || []
              const noSentences = content?.textContent?.toLowerCase().includes('no tiene') ||
                                  content?.textContent?.toLowerCase().includes('ninguna') ||
                                  content?.textContent?.toLowerCase().includes('no registra')

              if (!noSentences) {
                rows.forEach(row => {
                  const text = row.textContent?.trim() || ''
                  if (text.length > 10) {
                    data.penal_sentences.push({
                      type: 'Sentencia penal',
                      description: text.substring(0, 500),
                      status: text.toLowerCase().includes('firme') ? 'firme' : 'proceso'
                    })
                  }
                })
              }
            }

            // Sentencias civiles / Obligaciones
            if (header.includes('civil') || header.includes('obligacion') || header.includes('deuda')) {
              const rows = content?.querySelectorAll('tr, .item, li') || []
              const noSentences = content?.textContent?.toLowerCase().includes('no tiene') ||
                                  content?.textContent?.toLowerCase().includes('ninguna')

              if (!noSentences) {
                rows.forEach(row => {
                  const text = row.textContent?.trim() || ''
                  if (text.length > 10) {
                    data.civil_sentences.push({
                      type: 'Obligación civil',
                      description: text.substring(0, 500)
                    })
                  }
                })
              }
            }

            // Renuncias a partidos
            if (header.includes('renuncia') || header.includes('desafiliación')) {
              const rows = content?.querySelectorAll('tr, .item, li') || []
              data.party_resignations = rows.length
            }

            // Bienes
            if (header.includes('bien') || header.includes('patrimonio') || header.includes('declaración')) {
              const text = content?.textContent || ''
              const totalMatch = text.match(/total[:\s]*S\/?\s*([\d,]+)/i)
              if (totalMatch) {
                data.assets = {
                  total: parseFloat(totalMatch[1].replace(/,/g, ''))
                }
              }
            }
          })

          // Buscar enlaces a PDFs (plan de gobierno, hoja de vida)
          const pdfLinks = document.querySelectorAll('a[href*=".pdf"], a[href*="plan"], a[href*="Plan"], a[download]')
          pdfLinks.forEach(link => {
            const href = link.getAttribute('href') || ''
            const text = link.textContent?.toLowerCase() || ''

            if (text.includes('plan') || href.toLowerCase().includes('plan')) {
              data.plan_gobierno_url = href.startsWith('http') ? href : `https://votoinformado.jne.gob.pe${href}`
            }
            if (text.includes('hoja') || text.includes('vida')) {
              data.hoja_vida_url = href.startsWith('http') ? href : `https://votoinformado.jne.gob.pe${href}`
            }
          })

          return data
        })

        if (profileData.full_name || profileData.education.length > 0) {
          profiles.push(profileData)
          console.log(`  Candidato: ${profileData.full_name || 'Sin nombre'}`)
          console.log(`  Educación: ${profileData.education.length}`)
          console.log(`  Experiencia: ${profileData.experience.length}`)
          console.log(`  Sentencias penales: ${profileData.penal_sentences.length}`)
          console.log(`  Plan de gobierno: ${profileData.plan_gobierno_url ? 'Sí' : 'No'}`)
        }

        // Cerrar modal
        await page.evaluate(() => {
          const closeBtn = document.querySelector('[mat-dialog-close], .close, .cerrar, button[aria-label="Close"]')
          if (closeBtn) (closeBtn as HTMLElement).click()

          // También intentar presionar Escape
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        })

        await delay(1000)

      } catch (error) {
        console.log(`  Error: ${error}`)
      }
    }

    // Tomar screenshot final
    await page.screenshot({ path: 'voto-informado-final.png', fullPage: true })

  } catch (error) {
    console.error('Error general:', error)
  } finally {
    await browser.close()
  }

  // Guardar datos
  fs.writeFileSync('candidate-profiles.json', JSON.stringify(profiles, null, 2))
  console.log(`\nPerfiles guardados: ${profiles.length}`)
  console.log('Archivo: candidate-profiles.json')

  // Actualizar base de datos
  await updateDatabase(profiles)
}

async function updateDatabase(profiles: CandidateProfile[]) {
  console.log('\n' + '='.repeat(70))
  console.log('ACTUALIZANDO BASE DE DATOS')
  console.log('='.repeat(70))

  let updated = 0

  for (const profile of profiles) {
    if (!profile.full_name) continue

    try {
      // Buscar candidato
      const candidates = await sql`
        SELECT id, full_name FROM candidates
        WHERE LOWER(full_name) LIKE ${`%${profile.full_name.toLowerCase().split(' ')[0]}%`}
        LIMIT 1
      `

      if (candidates.length > 0) {
        await sql`
          UPDATE candidates SET
            education_details = ${JSON.stringify(profile.education)}::jsonb,
            experience_details = ${JSON.stringify(profile.experience)}::jsonb,
            political_trajectory = ${JSON.stringify(profile.political)}::jsonb,
            penal_sentences = ${JSON.stringify(profile.penal_sentences)}::jsonb,
            civil_sentences = ${JSON.stringify(profile.civil_sentences)}::jsonb,
            party_resignations = ${profile.party_resignations},
            djhv_url = ${profile.hoja_vida_url || null},
            last_updated = NOW()
          WHERE id = ${candidates[0].id}::uuid
        `
        console.log(`✓ ${candidates[0].full_name}`)
        updated++
      }
    } catch (error) {
      console.error(`Error con ${profile.full_name}:`, error)
    }
  }

  console.log(`\nCandidatos actualizados: ${updated}`)
}

scrapeProfiles().catch(console.error)
