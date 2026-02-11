import puppeteer from 'puppeteer'
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''
const sql = neon(DATABASE_URL)

// Voto Informado URLs
const VOTO_INFORMADO_URL = 'https://votoinformado.jne.gob.pe'
const INFOGOB_URL = 'https://infogob.jne.gob.pe'

interface CandidateData {
  full_name: string
  party: string
  cargo: string
  district?: string
  photo_url?: string
  birth_date?: string
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

async function scrapeVotoInformado() {
  console.log('🔍 Explorando Voto Informado JNE...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  // Track API calls
  const apiCalls: any[] = []
  page.on('response', async response => {
    const url = response.url()
    if (url.includes('api') || url.includes('candidato') || url.includes('Candidato')) {
      try {
        const text = await response.text()
        if (text.length < 10000) {
          apiCalls.push({ url, body: text })
        }
      } catch (e) {}
    }
  })

  try {
    // Try Voto Informado
    console.log('📡 Navegando a Voto Informado...')
    await page.goto(VOTO_INFORMADO_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await delay(3000)
    await page.screenshot({ path: 'voto-informado.png', fullPage: true })
    console.log('📸 Screenshot: voto-informado.png')

    // Get page content
    const title = await page.title()
    console.log(`📄 Título: ${title}`)

    // Get links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent?.trim()?.substring(0, 50),
        href: a.href
      })).filter(l => l.href && l.text)
    })

    console.log('\n🔗 Enlaces:')
    links.slice(0, 15).forEach(l => console.log(`  - ${l.text}: ${l.href}`))

    // Try Infogob
    console.log('\n📡 Navegando a Infogob...')
    await page.goto(INFOGOB_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await delay(3000)
    await page.screenshot({ path: 'infogob.png', fullPage: true })
    console.log('📸 Screenshot: infogob.png')

    const infogobTitle = await page.title()
    console.log(`📄 Título: ${infogobTitle}`)

    // Get links from Infogob
    const infogobLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent?.trim()?.substring(0, 50),
        href: a.href
      })).filter(l => l.href && l.text)
    })

    console.log('\n🔗 Enlaces Infogob:')
    infogobLinks.slice(0, 15).forEach(l => console.log(`  - ${l.text}: ${l.href}`))

    // Try to find politician profiles
    const politiciansLink = infogobLinks.find(l =>
      l.href.includes('politico') || l.href.includes('candidato') || l.href.includes('autoridad')
    )

    if (politiciansLink) {
      console.log(`\n📡 Navegando a: ${politiciansLink.href}`)
      await page.goto(politiciansLink.href, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await delay(3000)
      await page.screenshot({ path: 'infogob-politicos.png', fullPage: true })
    }

    // Try direct candidate URL patterns
    const candidateUrls = [
      `${INFOGOB_URL}/Politico`,
      `${INFOGOB_URL}/Autoridad`,
      `${INFOGOB_URL}/Candidato`,
      `${VOTO_INFORMADO_URL}/candidato`,
      `${VOTO_INFORMADO_URL}/eleccion`,
      'https://votoinformado.jne.gob.pe/voto/Elecciones/PresidenteRP',
      'https://declara.jne.gob.pe/'
    ]

    for (const url of candidateUrls) {
      try {
        console.log(`\n📡 Probando: ${url}`)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })
        const pageTitle = await page.title()
        console.log(`  ✓ Título: ${pageTitle}`)
        await page.screenshot({ path: `test-${url.split('/').slice(-2).join('-')}.png`, fullPage: true })

        // Get page structure
        const content = await page.evaluate(() => {
          return {
            links: Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => ({
              text: a.textContent?.trim()?.substring(0, 30),
              href: a.href
            })),
            text: document.body.innerText?.substring(0, 500)
          }
        })

        if (content.text) {
          console.log(`  Contenido: ${content.text.substring(0, 200)}...`)
        }
      } catch (e) {
        console.log(`  ✗ Error accediendo`)
      }
    }

    // Print captured API calls
    if (apiCalls.length > 0) {
      console.log('\n📋 API calls capturados:')
      apiCalls.forEach((call, i) => {
        console.log(`  ${i + 1}. ${call.url}`)
        console.log(`     ${call.body?.substring(0, 200)}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
    console.log('\n✅ Exploración completada')
  }
}

// Also try to fetch known candidate Hojas de Vida directly
async function scrapeHojasDeVida() {
  console.log('\n\n🔍 Buscando Hojas de Vida directas...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  // Known candidate names to search
  const candidates = [
    'Keiko Fujimori',
    'Rafael López Aliaga',
    'César Acuña',
    'Vladimir Cerrón'
  ]

  try {
    // Try searching on the main JNE electoral platform
    const searchUrl = 'https://plataformaelectoral.jne.gob.pe/candidatos/busqueda/buscar'

    console.log(`📡 Navegando a búsqueda simple: ${searchUrl}`)
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await delay(2000)
    await page.screenshot({ path: 'jne-busqueda-simple.png', fullPage: true })
    console.log('📸 Screenshot: jne-busqueda-simple.png')

    // Look for input fields
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        placeholder: i.placeholder
      }))
    })

    console.log('\n📝 Inputs encontrados:')
    inputs.forEach(i => console.log(`  - ${i.type}: ${i.id || i.name} (${i.placeholder})`))

    // Try to search for a candidate
    const searchInput = await page.$('input[type="text"]')
    if (searchInput) {
      await searchInput.type('Fujimori')
      console.log('✓ Texto ingresado: Fujimori')
      await delay(1000)

      // Find and click search
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button')
        btns.forEach(btn => {
          if (btn.textContent?.toLowerCase().includes('buscar')) {
            btn.click()
          }
        })
      })

      await delay(5000)
      await page.screenshot({ path: 'jne-busqueda-resultado.png', fullPage: true })
      console.log('📸 Screenshot: jne-busqueda-resultado.png')

      // Extract results
      const results = await page.evaluate(() => {
        const items: any[] = []
        document.querySelectorAll('table tr, [class*="card"], [class*="result"]').forEach(el => {
          const text = el.textContent?.trim()
          if (text && text.length > 10 && text.length < 500) {
            items.push(text.substring(0, 200))
          }
        })
        return items
      })

      console.log('\n📋 Resultados encontrados:')
      results.slice(0, 10).forEach((r, i) => console.log(`  ${i + 1}. ${r}`))
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
  }
}

// Run both
async function main() {
  await scrapeVotoInformado()
  await scrapeHojasDeVida()
}

main()
