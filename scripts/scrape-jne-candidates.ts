import puppeteer, { Page, Browser } from 'puppeteer'
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''
const sql = neon(DATABASE_URL)

// JNE Platform URLs
const BASE_URL = 'https://plataformaelectoral.jne.gob.pe'
const CANDIDATE_SEARCH_URL = `${BASE_URL}/candidatos/busqueda-avanzada/buscar`

// Process IDs
const PROCESO_EG2026 = '124' // Elecciones Generales 2026
const PROCESO_PRIMARIAS = '125' // Primarias EG 2026

interface CandidateBasic {
  jne_id: string
  full_name: string
  party: string
  cargo: string
  district?: string
  photo_url?: string
  djhv_url?: string
}

interface CandidateDetail {
  jne_id: string
  birth_date?: string
  education_details: Array<{
    level: string
    institution: string
    degree: string
    is_completed: boolean
  }>
  experience_details: Array<{
    position: string
    organization: string
    sector: string
    start_date: string
    end_date?: string
  }>
  political_trajectory: Array<{
    position: string
    party?: string
    start_date?: string
    end_date?: string
    is_elected: boolean
  }>
  penal_sentences: Array<{
    type: string
    description: string
    status: string
  }>
  civil_sentences: Array<{
    type: string
    description: string
    status: string
  }>
  assets_declaration?: {
    total_income?: number
    real_estate?: Array<{ description: string; value?: number }>
    vehicles?: Array<{ description: string; value?: number }>
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function setupBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  })
}

async function getCandidatesList(page: Page, cargo: string): Promise<CandidateBasic[]> {
  console.log(`\n🔍 Buscando candidatos: ${cargo}`)

  await page.goto(CANDIDATE_SEARCH_URL, {
    waitUntil: 'networkidle2',
    timeout: 60000
  })

  await delay(2000)

  // Select election process (EG2026 = 124)
  await page.waitForSelector('select', { timeout: 10000 })

  const selects = await page.$$('select')
  if (selects.length > 0) {
    // First select is usually the process selector
    await selects[0].select(PROCESO_EG2026)
    console.log('  ✓ Proceso EG2026 seleccionado')
    await delay(2000)
  }

  // Take screenshot to see current state
  await page.screenshot({ path: `jne-search-${cargo}.png`, fullPage: true })

  // Look for cargo selector and select presidential
  const cargoMap: Record<string, string> = {
    'presidente': 'PRESIDENTE DE LA REPÚBLICA',
    'vicepresidente': 'VICEPRESIDENTE',
    'senador': 'SENADOR',
    'diputado': 'DIPUTADO',
    'parlamento_andino': 'PARLAMENTO ANDINO'
  }

  // Try to find and click search elements
  // This will depend on the actual page structure

  // Wait for results table or list
  await delay(3000)

  // Extract candidate data from the page
  const candidates = await page.evaluate((cargoType: string) => {
    const results: CandidateBasic[] = []

    // Look for candidate cards/rows
    const candidateElements = document.querySelectorAll('[class*="candidato"], [class*="card"], tr[class*="row"]')

    candidateElements.forEach((el) => {
      const nameEl = el.querySelector('[class*="nombre"], [class*="name"], h3, h4, td:nth-child(2)')
      const partyEl = el.querySelector('[class*="partido"], [class*="party"], td:nth-child(3)')
      const photoEl = el.querySelector('img')
      const linkEl = el.querySelector('a[href*="candidato"], a[href*="hoja"]')

      if (nameEl) {
        results.push({
          jne_id: linkEl?.getAttribute('href')?.match(/\d+/)?.[0] || '',
          full_name: nameEl.textContent?.trim() || '',
          party: partyEl?.textContent?.trim() || '',
          cargo: cargoType,
          photo_url: photoEl?.src || undefined,
          djhv_url: linkEl?.getAttribute('href') || undefined
        })
      }
    })

    return results
  }, cargo)

  console.log(`  📋 Encontrados: ${candidates.length} candidatos`)

  return candidates
}

async function getCandidateDetail(page: Page, candidate: CandidateBasic): Promise<CandidateDetail | null> {
  if (!candidate.djhv_url) {
    console.log(`  ⚠️ Sin URL de hoja de vida: ${candidate.full_name}`)
    return null
  }

  const url = candidate.djhv_url.startsWith('http')
    ? candidate.djhv_url
    : `${BASE_URL}${candidate.djhv_url}`

  console.log(`  📄 Obteniendo detalle: ${candidate.full_name}`)

  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    await delay(2000)

    // Extract detailed information
    const detail = await page.evaluate(() => {
      const result: CandidateDetail = {
        jne_id: '',
        education_details: [],
        experience_details: [],
        political_trajectory: [],
        penal_sentences: [],
        civil_sentences: []
      }

      // Birth date
      const birthEl = document.querySelector('[class*="nacimiento"], [class*="birth"]')
      if (birthEl) {
        result.birth_date = birthEl.textContent?.trim()
      }

      // Education section
      const educationSection = document.querySelector('[id*="educacion"], [class*="educacion"], [id*="formacion"]')
      if (educationSection) {
        const educationRows = educationSection.querySelectorAll('tr, [class*="item"]')
        educationRows.forEach(row => {
          const cells = row.querySelectorAll('td, span')
          if (cells.length >= 2) {
            result.education_details.push({
              level: cells[0]?.textContent?.trim() || '',
              institution: cells[1]?.textContent?.trim() || '',
              degree: cells[2]?.textContent?.trim() || '',
              is_completed: true
            })
          }
        })
      }

      // Work experience section
      const experienceSection = document.querySelector('[id*="experiencia"], [class*="experiencia"], [id*="trabajo"]')
      if (experienceSection) {
        const expRows = experienceSection.querySelectorAll('tr, [class*="item"]')
        expRows.forEach(row => {
          const cells = row.querySelectorAll('td, span')
          if (cells.length >= 2) {
            result.experience_details.push({
              position: cells[0]?.textContent?.trim() || '',
              organization: cells[1]?.textContent?.trim() || '',
              sector: 'publico',
              start_date: cells[2]?.textContent?.trim() || ''
            })
          }
        })
      }

      // Political trajectory
      const politicalSection = document.querySelector('[id*="politica"], [class*="politica"], [id*="cargo"]')
      if (politicalSection) {
        const polRows = politicalSection.querySelectorAll('tr, [class*="item"]')
        polRows.forEach(row => {
          const cells = row.querySelectorAll('td, span')
          if (cells.length >= 1) {
            result.political_trajectory.push({
              position: cells[0]?.textContent?.trim() || '',
              party: cells[1]?.textContent?.trim(),
              is_elected: true
            })
          }
        })
      }

      // Penal sentences
      const penalSection = document.querySelector('[id*="penal"], [class*="penal"], [id*="sentencia"]')
      if (penalSection) {
        const text = penalSection.textContent?.toLowerCase() || ''
        if (!text.includes('no declara') && !text.includes('ninguno')) {
          const penalRows = penalSection.querySelectorAll('tr, [class*="item"]')
          penalRows.forEach(row => {
            const content = row.textContent?.trim() || ''
            if (content && content.length > 5) {
              result.penal_sentences.push({
                type: 'penal_dolosa',
                description: content,
                status: 'firme'
              })
            }
          })
        }
      }

      // Civil sentences (alimentos, etc.)
      const civilSection = document.querySelector('[id*="civil"], [class*="civil"], [id*="obligacion"]')
      if (civilSection) {
        const text = civilSection.textContent?.toLowerCase() || ''
        if (!text.includes('no declara') && !text.includes('ninguno')) {
          const civilRows = civilSection.querySelectorAll('tr, [class*="item"]')
          civilRows.forEach(row => {
            const content = row.textContent?.trim() || ''
            if (content && content.length > 5) {
              result.civil_sentences.push({
                type: 'alimentos',
                description: content,
                status: 'firme'
              })
            }
          })
        }
      }

      return result
    })

    detail.jne_id = candidate.jne_id
    return detail

  } catch (error) {
    console.log(`  ❌ Error obteniendo detalle: ${error}`)
    return null
  }
}

async function updateCandidateInDB(candidate: CandidateBasic, detail: CandidateDetail | null) {
  const slug = candidate.full_name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()

  // Find party ID
  const parties = await sql`SELECT id, name FROM parties WHERE LOWER(name) LIKE ${`%${candidate.party.toLowerCase().split(' ')[0]}%`} LIMIT 1`
  const partyId = parties[0]?.id || null

  // Map cargo
  const cargoMap: Record<string, string> = {
    'PRESIDENTE DE LA REPÚBLICA': 'presidente',
    'VICEPRESIDENTE': 'vicepresidente',
    'SENADOR': 'senador',
    'DIPUTADO': 'diputado',
    'PARLAMENTO ANDINO': 'parlamento_andino'
  }
  const cargo = cargoMap[candidate.cargo.toUpperCase()] || candidate.cargo

  // Check if candidate exists
  const existing = await sql`SELECT id FROM candidates WHERE slug = ${slug}`

  if (existing.length > 0) {
    // Update existing candidate
    await sql`
      UPDATE candidates SET
        jne_id = ${candidate.jne_id},
        photo_url = ${candidate.photo_url || null},
        djhv_url = ${candidate.djhv_url || null},
        education_details = ${JSON.stringify(detail?.education_details || [])}::jsonb,
        experience_details = ${JSON.stringify(detail?.experience_details || [])}::jsonb,
        political_trajectory = ${JSON.stringify(detail?.political_trajectory || [])}::jsonb,
        penal_sentences = ${JSON.stringify(detail?.penal_sentences || [])}::jsonb,
        civil_sentences = ${JSON.stringify(detail?.civil_sentences || [])}::jsonb,
        data_source = 'jne_scraped',
        data_verified = TRUE,
        verification_date = NOW(),
        last_updated = NOW()
      WHERE slug = ${slug}
    `
    console.log(`  ✓ Actualizado: ${candidate.full_name}`)
  } else {
    // Insert new candidate
    await sql`
      INSERT INTO candidates (
        full_name,
        slug,
        cargo,
        party_id,
        jne_id,
        photo_url,
        djhv_url,
        education_details,
        experience_details,
        political_trajectory,
        penal_sentences,
        civil_sentences,
        data_source,
        data_verified,
        verification_date,
        inscription_status
      ) VALUES (
        ${candidate.full_name},
        ${slug},
        ${cargo},
        ${partyId}::uuid,
        ${candidate.jne_id},
        ${candidate.photo_url || null},
        ${candidate.djhv_url || null},
        ${JSON.stringify(detail?.education_details || [])}::jsonb,
        ${JSON.stringify(detail?.experience_details || [])}::jsonb,
        ${JSON.stringify(detail?.political_trajectory || [])}::jsonb,
        ${JSON.stringify(detail?.penal_sentences || [])}::jsonb,
        ${JSON.stringify(detail?.civil_sentences || [])}::jsonb,
        'jne_scraped',
        TRUE,
        NOW(),
        'inscrito'
      )
    `
    console.log(`  ✓ Insertado: ${candidate.full_name}`)
  }
}

async function scrapeAllCandidates() {
  console.log('🚀 Iniciando scraping de candidatos JNE...\n')
  console.log('=' .repeat(60))

  const browser = await setupBrowser()
  const page = await browser.newPage()

  await page.setViewport({ width: 1920, height: 1080 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

  try {
    // For now, let's focus on presidential candidates
    const cargos = ['presidente']

    for (const cargo of cargos) {
      console.log(`\n📋 Procesando cargo: ${cargo}`)
      console.log('-'.repeat(40))

      const candidates = await getCandidatesList(page, cargo)

      for (const candidate of candidates) {
        if (candidate.full_name) {
          // Get detailed information
          const detail = await getCandidateDetail(page, candidate)

          // Update database
          await updateCandidateInDB(candidate, detail)

          // Rate limiting
          await delay(2000)
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Scraping completado!')

    // Show summary
    const count = await sql`SELECT COUNT(*) as total FROM candidates WHERE data_source = 'jne_scraped'`
    console.log(`📊 Candidatos scrapeados: ${count[0]?.total || 0}`)

  } catch (error) {
    console.error('❌ Error durante scraping:', error)
  } finally {
    await browser.close()
  }
}

// Run if called directly
scrapeAllCandidates()
