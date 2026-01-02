import puppeteer from 'puppeteer'

const API_BASES = [
  'https://apiplataformaelectoral4.jne.gob.pe/api/v1',
  'https://apiplataformaelectoral5.jne.gob.pe/api/v1'
]

const PROCESO_EG2026 = 124

// Possible API endpoints for candidates
const CANDIDATE_ENDPOINTS = [
  '/candidato/buscar',
  '/candidato/lista',
  '/candidato',
  '/candidatos',
  '/candidato/GetCandidatos',
  '/hojavida/buscar',
  '/hoja-vida/buscar',
  '/expediente/candidato',
  '/expediente-candidato/buscar'
]

async function testJNEApi() {
  console.log('🔍 Probando endpoints de API JNE...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  // Set headers to mimic browser
  await page.setExtraHTTPHeaders({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Origin': 'https://plataformaelectoral.jne.gob.pe',
    'Referer': 'https://plataformaelectoral.jne.gob.pe/'
  })

  try {
    // First, get the process list to confirm API access
    console.log('📡 Verificando acceso a API...\n')

    // Test process electoral endpoint
    const processUrl = `${API_BASES[0]}/expediente/proceso-electoral`
    await page.goto(processUrl, { waitUntil: 'networkidle2', timeout: 10000 })
    const processContent = await page.content()
    console.log('✓ proceso-electoral accesible')

    // Test various candidate endpoints
    console.log('\n📡 Probando endpoints de candidatos...\n')

    for (const base of API_BASES) {
      console.log(`\nBase: ${base}`)
      console.log('-'.repeat(60))

      for (const endpoint of CANDIDATE_ENDPOINTS) {
        const url = `${base}${endpoint}`
        try {
          const response = await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 10000
          })

          const status = response?.status()
          const content = await page.content()
          const bodyText = await page.evaluate(() => document.body.innerText)

          if (status === 200 && bodyText && !bodyText.includes('error')) {
            console.log(`✓ ${endpoint} (${status})`)
            console.log(`  Response: ${bodyText.substring(0, 200)}...`)
          } else {
            console.log(`✗ ${endpoint} (${status})`)
          }
        } catch (e: any) {
          console.log(`✗ ${endpoint} (${e.message?.substring(0, 50)})`)
        }
      }
    }

    // Try POST requests with different payloads
    console.log('\n\n📡 Probando POST requests...\n')

    const postEndpoints = [
      { url: `${API_BASES[0]}/candidato/buscar`, body: { idProcesoElectoral: PROCESO_EG2026 } },
      { url: `${API_BASES[1]}/candidato/buscar`, body: { idProcesoElectoral: PROCESO_EG2026 } },
      { url: `${API_BASES[0]}/hojavida/buscar`, body: { idProcesoElectoral: PROCESO_EG2026 } },
      { url: `${API_BASES[1]}/hojavida/buscar`, body: { idProcesoElectoral: PROCESO_EG2026 } }
    ]

    for (const { url, body } of postEndpoints) {
      try {
        const response = await page.evaluate(async (url, body) => {
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(body)
            })
            const text = await res.text()
            return { status: res.status, body: text.substring(0, 500) }
          } catch (e: any) {
            return { status: 0, body: e.message }
          }
        }, url, body)

        console.log(`POST ${url}`)
        console.log(`  Status: ${response.status}`)
        console.log(`  Body: ${response.body}`)
        console.log('')
      } catch (e) {
        console.log(`POST ${url}: Error`)
      }
    }

    // Navigate to the platform and capture API calls during search
    console.log('\n📡 Capturando API calls durante búsqueda real...\n')

    const apiCalls: any[] = []

    page.on('response', async response => {
      const url = response.url()
      if (url.includes('api') && url.includes('jne.gob.pe')) {
        try {
          const text = await response.text()
          apiCalls.push({
            url,
            status: response.status(),
            body: text.substring(0, 1000)
          })
        } catch (e) {
          // Ignore
        }
      }
    })

    await page.goto('https://plataformaelectoral.jne.gob.pe/candidatos/busqueda-avanzada/buscar', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Select process
    await page.waitForSelector('select')
    const selects = await page.$$('select')
    if (selects.length > 0) {
      await selects[0].select('124')
      console.log('✓ Proceso EG2026 seleccionado')
    }

    await new Promise(resolve => setTimeout(resolve, 3000))

    // Click search button
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button')
      buttons.forEach(btn => {
        if (btn.textContent?.toLowerCase().includes('buscar')) {
          btn.click()
        }
      })
    })

    console.log('✓ Búsqueda ejecutada')

    await new Promise(resolve => setTimeout(resolve, 5000))

    console.log('\n📋 API calls capturados:')
    apiCalls.forEach((call, i) => {
      console.log(`\n${i + 1}. ${call.url}`)
      console.log(`   Status: ${call.status}`)
      console.log(`   Body: ${call.body}`)
    })

    // Take final screenshot
    await page.screenshot({ path: 'jne-final.png', fullPage: true })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
    console.log('\n✅ Pruebas completadas')
  }
}

testJNEApi()
