import puppeteer, { Page, Browser } from 'puppeteer'
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
const sql = neon(DATABASE_URL)

// URLs
const VOTO_INFORMADO = 'https://votoinformado.jne.gob.pe'
const INFOGOB = 'https://infogob.jne.gob.pe'

interface CandidateData {
  full_name: string
  party: string
  cargo: string
  district?: string
  photo_url?: string
  birth_date?: string
  education_level?: string
  education_details: any[]
  experience_details: any[]
  political_trajectory: any[]
  penal_sentences: any[]
  civil_sentences: any[]
  jne_id?: string
  djhv_url?: string
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

async function setupBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  })
}

async function scrapeCandidatesFromVotoInformado(page: Page, cargo: string): Promise<CandidateData[]> {
  const cargoUrls: Record<string, string> = {
    'presidente': `${VOTO_INFORMADO}/presidente-vicepresidentes`,
    'senador': `${VOTO_INFORMADO}/senadores`,
    'diputado': `${VOTO_INFORMADO}/diputados`,
    'parlamento_andino': `${VOTO_INFORMADO}/parlamento-andino`
  }

  const url = cargoUrls[cargo]
  if (!url) {
    console.log(`  ⚠️ URL no encontrada para cargo: ${cargo}`)
    return []
  }

  console.log(`\n📡 Accediendo a: ${url}`)

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000
  })

  await delay(5000)
  await page.screenshot({ path: `scrape-${cargo}.png`, fullPage: true })
  console.log(`  📸 Screenshot: scrape-${cargo}.png`)

  // Wait for content to load
  await delay(3000)

  // Extract candidate data from the page
  const candidates = await page.evaluate((cargoType) => {
    const results: CandidateData[] = []

    // Look for candidate cards/items
    const selectors = [
      '[class*="candidato"]',
      '[class*="card"]',
      '[class*="item"]',
      '.mat-card',
      '.ng-star-inserted'
    ]

    let elements: Element[] = []
    for (const selector of selectors) {
      const found = document.querySelectorAll(selector)
      if (found.length > 0) {
        elements = Array.from(found)
        break
      }
    }

    // Try to find candidate info in the page
    const textContent = document.body.innerText

    // Look for name patterns (assuming format: "NOMBRE APELLIDO - PARTIDO")
    const namePatterns = textContent.match(/[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+(?:\s[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ]+)+/g)

    // Extract from visible cards
    document.querySelectorAll('img').forEach(img => {
      const src = img.src
      const parent = img.closest('[class*="card"]') || img.parentElement?.parentElement

      if (parent) {
        const text = parent.textContent?.trim() || ''
        // Look for name and party info
        const lines = text.split('\n').filter(l => l.trim())

        if (lines.length > 0) {
          const nameCandidate = lines.find(l => l.length > 5 && l.length < 60)
          const partyCandidate = lines.find(l =>
            l.toLowerCase().includes('partido') ||
            l.toLowerCase().includes('alianza') ||
            l.toLowerCase().includes('popular') ||
            l.toLowerCase().includes('perú')
          )

          if (nameCandidate) {
            results.push({
              full_name: nameCandidate.trim(),
              party: partyCandidate?.trim() || 'Sin partido',
              cargo: cargoType,
              photo_url: src.startsWith('http') ? src : undefined,
              education_details: [],
              experience_details: [],
              political_trajectory: [],
              penal_sentences: [],
              civil_sentences: []
            })
          }
        }
      }
    })

    return results
  }, cargo)

  console.log(`  📋 Encontrados: ${candidates.length} candidatos`)

  return candidates
}

async function searchPoliticianOnInfogob(page: Page, name: string): Promise<Partial<CandidateData> | null> {
  console.log(`  🔍 Buscando en Infogob: ${name}`)

  try {
    await page.goto(`${INFOGOB}/Politico`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    await delay(2000)

    // Find search input and type name
    const searchInput = await page.$('input[type="text"], input[type="search"], input')
    if (searchInput) {
      await searchInput.click()
      await searchInput.type(name, { delay: 50 })
      await delay(1000)

      // Press Enter or click search
      await page.keyboard.press('Enter')
      await delay(3000)

      // Look for results
      const resultLink = await page.$('a[href*="Politico/Ficha"]')
      if (resultLink) {
        await resultLink.click()
        await delay(3000)

        // Extract data from profile
        const profileData = await page.evaluate(() => {
          const data: Partial<CandidateData> = {
            education_details: [],
            experience_details: [],
            political_trajectory: [],
            penal_sentences: [],
            civil_sentences: []
          }

          // Birth date
          const birthEl = document.querySelector('[class*="nacimiento"], [class*="birth"]')
          if (birthEl) data.birth_date = birthEl.textContent?.trim()

          // Photo
          const photoEl = document.querySelector('img[class*="foto"], img[class*="profile"]')
          if (photoEl) data.photo_url = (photoEl as HTMLImageElement).src

          // Look for different sections
          const sections = document.querySelectorAll('[class*="section"], [class*="panel"], [class*="card"]')

          sections.forEach(section => {
            const title = section.querySelector('h2, h3, h4, .title')?.textContent?.toLowerCase() || ''
            const content = section.textContent || ''

            if (title.includes('educación') || title.includes('formación')) {
              // Education section
              const items = section.querySelectorAll('li, tr, [class*="item"]')
              items.forEach(item => {
                const text = item.textContent?.trim()
                if (text && text.length > 5) {
                  data.education_details?.push({
                    level: 'universitario_completo',
                    institution: text,
                    degree: '',
                    is_completed: true
                  })
                }
              })
            }

            if (title.includes('experiencia') || title.includes('trabajo') || title.includes('laboral')) {
              const items = section.querySelectorAll('li, tr, [class*="item"]')
              items.forEach(item => {
                const text = item.textContent?.trim()
                if (text && text.length > 5) {
                  data.experience_details?.push({
                    position: text,
                    organization: '',
                    sector: 'publico',
                    start_date: ''
                  })
                }
              })
            }

            if (title.includes('cargo') || title.includes('político') || title.includes('trayectoria')) {
              const items = section.querySelectorAll('li, tr, [class*="item"]')
              items.forEach(item => {
                const text = item.textContent?.trim()
                if (text && text.length > 5) {
                  data.political_trajectory?.push({
                    position: text,
                    is_elected: true
                  })
                }
              })
            }

            if (title.includes('sentencia') || title.includes('penal') || title.includes('judicial')) {
              if (!content.toLowerCase().includes('no registra') && !content.toLowerCase().includes('ninguno')) {
                const items = section.querySelectorAll('li, tr, [class*="item"]')
                items.forEach(item => {
                  const text = item.textContent?.trim()
                  if (text && text.length > 5) {
                    data.penal_sentences?.push({
                      type: 'penal_dolosa',
                      description: text,
                      status: 'firme'
                    })
                  }
                })
              }
            }
          })

          return data
        })

        return profileData
      }
    }
  } catch (error) {
    console.log(`    ❌ Error buscando: ${error}`)
  }

  return null
}

async function updateDatabase(candidate: CandidateData): Promise<void> {
  const slug = createSlug(candidate.full_name)

  // Find party ID
  const partySearch = candidate.party.toLowerCase().split(' ')[0]
  const parties = await sql`
    SELECT id, name FROM parties
    WHERE LOWER(name) LIKE ${`%${partySearch}%`}
    OR LOWER(short_name) LIKE ${`%${partySearch}%`}
    LIMIT 1
  `
  const partyId = parties[0]?.id || null

  // Map education level
  let educationLevel = 'sin_informacion'
  if (candidate.education_details.length > 0) {
    const levels = candidate.education_details.map(e => e.level)
    if (levels.includes('doctorado')) educationLevel = 'doctorado'
    else if (levels.includes('maestria')) educationLevel = 'maestria'
    else if (levels.includes('titulo_profesional')) educationLevel = 'titulo_profesional'
    else if (levels.includes('universitario_completo')) educationLevel = 'universitario_completo'
  }

  // Check if exists
  const existing = await sql`SELECT id FROM candidates WHERE slug = ${slug}`

  if (existing.length > 0) {
    await sql`
      UPDATE candidates SET
        party_id = COALESCE(${partyId}::uuid, party_id),
        photo_url = COALESCE(${candidate.photo_url}, photo_url),
        birth_date = COALESCE(${candidate.birth_date}::date, birth_date),
        education_level = ${educationLevel},
        education_details = ${JSON.stringify(candidate.education_details)}::jsonb,
        experience_details = ${JSON.stringify(candidate.experience_details)}::jsonb,
        political_trajectory = ${JSON.stringify(candidate.political_trajectory)}::jsonb,
        penal_sentences = ${JSON.stringify(candidate.penal_sentences)}::jsonb,
        civil_sentences = ${JSON.stringify(candidate.civil_sentences)}::jsonb,
        djhv_url = COALESCE(${candidate.djhv_url}, djhv_url),
        jne_id = COALESCE(${candidate.jne_id}, jne_id),
        data_source = 'jne_scraped',
        data_verified = TRUE,
        verification_date = NOW(),
        last_updated = NOW()
      WHERE slug = ${slug}
    `
    console.log(`  ✓ Actualizado: ${candidate.full_name}`)
  } else {
    await sql`
      INSERT INTO candidates (
        full_name, slug, cargo, party_id, photo_url, birth_date,
        education_level, education_details, experience_details,
        political_trajectory, penal_sentences, civil_sentences,
        djhv_url, jne_id, data_source, data_verified, verification_date, inscription_status
      ) VALUES (
        ${candidate.full_name}, ${slug}, ${candidate.cargo},
        ${partyId}::uuid, ${candidate.photo_url}, ${candidate.birth_date}::date,
        ${educationLevel}, ${JSON.stringify(candidate.education_details)}::jsonb,
        ${JSON.stringify(candidate.experience_details)}::jsonb,
        ${JSON.stringify(candidate.political_trajectory)}::jsonb,
        ${JSON.stringify(candidate.penal_sentences)}::jsonb,
        ${JSON.stringify(candidate.civil_sentences)}::jsonb,
        ${candidate.djhv_url}, ${candidate.jne_id},
        'jne_scraped', TRUE, NOW(), 'inscrito'
      )
    `
    console.log(`  ✓ Insertado: ${candidate.full_name}`)
  }
}

async function main() {
  console.log('🚀 Iniciando scraping de candidatos reales del JNE...\n')
  console.log('='.repeat(60))

  const browser = await setupBrowser()
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

  try {
    // First, get existing candidates from DB to enrich
    const existingCandidates = await sql`
      SELECT id, full_name, slug, cargo FROM candidates
      WHERE data_source = 'jne_verified' OR data_source = 'jne_scraped'
      ORDER BY cargo, full_name
    `
    console.log(`📋 Candidatos existentes en BD: ${existingCandidates.length}`)

    // For each existing candidate, try to get more data from Infogob
    console.log('\n📡 Enriqueciendo datos desde Infogob...')

    for (const candidate of existingCandidates) {
      const extraData = await searchPoliticianOnInfogob(page, candidate.full_name)

      if (extraData && (
        extraData.education_details?.length ||
        extraData.experience_details?.length ||
        extraData.political_trajectory?.length
      )) {
        // Update candidate with extra data
        await sql`
          UPDATE candidates SET
            photo_url = COALESCE(${extraData.photo_url}, photo_url),
            birth_date = COALESCE(${extraData.birth_date}::date, birth_date),
            education_details = CASE
              WHEN ${JSON.stringify(extraData.education_details)}::jsonb != '[]'::jsonb
              THEN ${JSON.stringify(extraData.education_details)}::jsonb
              ELSE education_details
            END,
            experience_details = CASE
              WHEN ${JSON.stringify(extraData.experience_details)}::jsonb != '[]'::jsonb
              THEN ${JSON.stringify(extraData.experience_details)}::jsonb
              ELSE experience_details
            END,
            political_trajectory = CASE
              WHEN ${JSON.stringify(extraData.political_trajectory)}::jsonb != '[]'::jsonb
              THEN ${JSON.stringify(extraData.political_trajectory)}::jsonb
              ELSE political_trajectory
            END,
            penal_sentences = CASE
              WHEN ${JSON.stringify(extraData.penal_sentences)}::jsonb != '[]'::jsonb
              THEN ${JSON.stringify(extraData.penal_sentences)}::jsonb
              ELSE penal_sentences
            END,
            last_updated = NOW()
          WHERE id = ${candidate.id}::uuid
        `
        console.log(`  ✓ Enriquecido: ${candidate.full_name}`)
      }

      // Rate limiting
      await delay(2000)
    }

    // Now try to scrape from Voto Informado for any new candidates
    console.log('\n📡 Buscando nuevos candidatos en Voto Informado...')

    const cargos = ['presidente']
    for (const cargo of cargos) {
      console.log(`\n📋 Procesando: ${cargo}`)
      const candidates = await scrapeCandidatesFromVotoInformado(page, cargo)

      for (const candidate of candidates) {
        if (candidate.full_name && candidate.full_name.length > 3) {
          await updateDatabase(candidate)
          await delay(1000)
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Scraping completado!')

    // Show summary
    const finalCount = await sql`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN data_verified = TRUE THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN education_details::text != '[]' THEN 1 ELSE 0 END) as with_education,
        SUM(CASE WHEN experience_details::text != '[]' THEN 1 ELSE 0 END) as with_experience
      FROM candidates
    `

    console.log('\n📊 Resumen:')
    console.log(`  Total candidatos: ${finalCount[0]?.total || 0}`)
    console.log(`  Verificados: ${finalCount[0]?.verified || 0}`)
    console.log(`  Con educación: ${finalCount[0]?.with_education || 0}`)
    console.log(`  Con experiencia: ${finalCount[0]?.with_experience || 0}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
  }
}

main()
