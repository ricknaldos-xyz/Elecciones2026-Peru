import puppeteer from 'puppeteer'

async function interceptJNEApi() {
  console.log('🔍 Interceptando llamadas API del JNE...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  // Intercept network requests
  const apiCalls: Array<{url: string, method: string, postData?: string, response?: string}> = []

  await page.setRequestInterception(true)

  page.on('request', request => {
    const url = request.url()

    // Log API calls
    if (url.includes('api') || url.includes('Api') ||
        url.includes('candidato') || url.includes('Candidato') ||
        url.includes('buscar') || url.includes('search') ||
        url.includes('GetCandidato') || url.includes('Get')) {
      apiCalls.push({
        url,
        method: request.method(),
        postData: request.postData()
      })
      console.log(`📡 ${request.method()} ${url}`)
      if (request.postData()) {
        console.log(`   Body: ${request.postData()?.substring(0, 200)}`)
      }
    }

    request.continue()
  })

  page.on('response', async response => {
    const url = response.url()
    if (url.includes('api') || url.includes('Api') ||
        url.includes('candidato') || url.includes('Candidato') ||
        url.includes('GetCandidato')) {
      try {
        const text = await response.text()
        if (text.length < 5000) {
          console.log(`📥 Response from ${url.substring(0, 80)}:`)
          console.log(`   ${text.substring(0, 500)}`)
        } else {
          console.log(`📥 Response from ${url.substring(0, 80)}: ${text.length} bytes`)
        }
      } catch (e) {
        // Ignore
      }
    }
  })

  try {
    // Go to advanced candidate search
    console.log('📡 Navegando a búsqueda avanzada de candidatos...')
    await page.goto('https://plataformaelectoral.jne.gob.pe/candidatos/busqueda-avanzada/buscar', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await new Promise(resolve => setTimeout(resolve, 3000))

    // Take screenshot
    await page.screenshot({ path: 'jne-advanced-search.png', fullPage: true })
    console.log('📸 Screenshot: jne-advanced-search.png')

    // Get all form elements
    const formElements = await page.evaluate(() => {
      const elements: Array<{tag: string, id: string, name: string, type?: string, options?: string[]}> = []

      // Selects
      document.querySelectorAll('select').forEach((el) => {
        const options = Array.from(el.options).map(o => `${o.value}: ${o.textContent?.trim()}`)
        elements.push({
          tag: 'select',
          id: el.id,
          name: el.name,
          options: options.slice(0, 10)
        })
      })

      // Inputs
      document.querySelectorAll('input').forEach((el) => {
        elements.push({
          tag: 'input',
          id: el.id,
          name: el.name,
          type: el.type
        })
      })

      // Buttons
      document.querySelectorAll('button').forEach((el) => {
        elements.push({
          tag: 'button',
          id: el.id,
          name: el.textContent?.trim() || ''
        })
      })

      return elements
    })

    console.log('\n📋 Elementos del formulario:')
    formElements.forEach(el => {
      console.log(`  ${el.tag}: id="${el.id}" name="${el.name}" ${el.type || ''}`)
      if (el.options) {
        el.options.forEach(o => console.log(`    - ${o}`))
      }
    })

    // Try to select process and search
    console.log('\n🔍 Intentando buscar candidatos presidenciales...')

    // Wait for selects to be available
    await page.waitForSelector('select')

    // Get select elements
    const selects = await page.$$('select')
    console.log(`  Encontrados ${selects.length} selectores`)

    // Try to select EG2026 (124) in first select
    if (selects.length > 0) {
      await selects[0].select('124')
      console.log('  ✓ Seleccionado proceso 124 (EG2026)')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // After selecting process, more selects might appear
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Get updated form elements
    const updatedSelects = await page.$$('select')
    console.log(`  Ahora hay ${updatedSelects.length} selectores`)

    // Find cargo selector and select president
    for (let i = 0; i < updatedSelects.length; i++) {
      const options = await page.evaluate((idx) => {
        const selects = document.querySelectorAll('select')
        const select = selects[idx]
        return Array.from(select.options).map(o => ({ value: o.value, text: o.textContent?.trim() }))
      }, i)

      console.log(`\n  Select ${i}:`)
      options.slice(0, 5).forEach(o => console.log(`    - ${o.value}: ${o.text}`))

      // Check if this is the cargo selector
      const hasPresidente = options.some(o =>
        o.text?.toLowerCase().includes('presidente') ||
        o.text?.toLowerCase().includes('presidential')
      )

      if (hasPresidente) {
        const presidenteOption = options.find(o => o.text?.toLowerCase().includes('presidente'))
        if (presidenteOption) {
          await updatedSelects[i].select(presidenteOption.value)
          console.log(`  ✓ Seleccionado: ${presidenteOption.text}`)
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Click search button
    const searchButton = await page.$('button[type="submit"], button:contains("Buscar"), .btn-search, [class*="buscar"]')
    if (searchButton) {
      await searchButton.click()
      console.log('  ✓ Click en botón buscar')
    } else {
      // Try clicking any button with "Buscar" text
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const searchBtn = buttons.find(b => b.textContent?.toLowerCase().includes('buscar'))
        if (searchBtn) searchBtn.click()
      })
      console.log('  ✓ Click en botón buscar (via evaluate)')
    }

    // Wait for results
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Take screenshot of results
    await page.screenshot({ path: 'jne-results.png', fullPage: true })
    console.log('📸 Screenshot: jne-results.png')

    // Extract any visible candidate data
    const candidates = await page.evaluate(() => {
      const results: Array<{name: string, party: string, link?: string}> = []

      // Try different selectors for candidate data
      const selectors = [
        'table tbody tr',
        '[class*="candidato"]',
        '[class*="card"]',
        '[class*="result"]',
        '.ng-star-inserted'
      ]

      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent?.trim() || ''
          if (text.length > 10 && text.length < 500) {
            const link = el.querySelector('a')?.getAttribute('href')
            results.push({
              name: text.substring(0, 200),
              party: '',
              link
            })
          }
        })
      }

      return results.slice(0, 20)
    })

    console.log('\n📋 Candidatos encontrados:')
    candidates.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name}`)
      if (c.link) console.log(`     Link: ${c.link}`)
    })

    // Get page HTML for analysis
    const html = await page.content()
    console.log(`\n📄 HTML total: ${html.length} caracteres`)

    // Look for Angular/React data
    const appState = await page.evaluate(() => {
      // @ts-ignore
      const ngState = window.ng?.probe?.(document.body)?.componentInstance
      // @ts-ignore
      const reactState = document.querySelector('[data-reactroot]')?.__reactInternalInstance$
      return {
        hasAngular: typeof window['ng'] !== 'undefined',
        hasReact: !!document.querySelector('[data-reactroot]'),
        ngState: ngState ? 'found' : 'not found'
      }
    })
    console.log('\n🔧 Framework detectado:')
    console.log(`  Angular: ${appState.hasAngular}`)
    console.log(`  React: ${appState.hasReact}`)

    console.log('\n📡 Resumen de llamadas API capturadas:')
    apiCalls.forEach((call, i) => {
      console.log(`  ${i + 1}. ${call.method} ${call.url}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
    console.log('\n✅ Exploración completada')
  }
}

interceptJNEApi()
