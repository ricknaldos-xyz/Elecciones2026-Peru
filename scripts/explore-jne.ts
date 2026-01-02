import puppeteer from 'puppeteer'

async function exploreJNE() {
  console.log('🔍 Explorando plataforma JNE...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  try {
    // Go to the electoral platform
    console.log('📡 Navegando a plataformaelectoral.jne.gob.pe...')
    await page.goto('https://plataformaelectoral.jne.gob.pe', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    // Take initial screenshot
    await page.screenshot({ path: 'jne-home.png', fullPage: true })
    console.log('📸 Screenshot guardado: jne-home.png')

    // Wait for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Get page title
    const title = await page.title()
    console.log(`📄 Título: ${title}`)

    // Get all links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent?.trim(),
        href: a.href
      })).filter(l => l.href && l.text)
    })
    console.log('\n🔗 Enlaces encontrados:')
    links.slice(0, 20).forEach(l => console.log(`  - ${l.text}: ${l.href}`))

    // Get all buttons
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        id: b.id,
        class: b.className
      })).filter(b => b.text)
    })
    console.log('\n🔘 Botones encontrados:')
    buttons.forEach(b => console.log(`  - ${b.text} (id: ${b.id})`))

    // Look for election process selector
    const selects = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('select')).map(s => ({
        id: s.id,
        name: s.name,
        options: Array.from(s.options).map(o => ({ value: o.value, text: o.textContent }))
      }))
    })
    console.log('\n📋 Selectores encontrados:')
    selects.forEach(s => {
      console.log(`  - ${s.id || s.name}:`)
      s.options.slice(0, 5).forEach(o => console.log(`    • ${o.text} (${o.value})`))
    })

    // Try to find the EG2026 process
    console.log('\n🔍 Buscando proceso EG2026...')

    // Look for any input fields
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(i => ({
        type: i.type,
        id: i.id,
        name: i.name,
        placeholder: i.placeholder
      }))
    })
    console.log('\n📝 Inputs encontrados:')
    inputs.forEach(i => console.log(`  - ${i.type}: ${i.id || i.name} (${i.placeholder})`))

    // Get page HTML structure (main sections)
    const mainSections = await page.evaluate(() => {
      const sections: string[] = []
      document.querySelectorAll('div[class*="container"], div[class*="main"], section, nav').forEach(el => {
        const className = el.className
        const id = el.id
        if (className || id) {
          sections.push(`${el.tagName.toLowerCase()}#${id}.${className}`)
        }
      })
      return sections.slice(0, 20)
    })
    console.log('\n🏗️ Estructura principal:')
    mainSections.forEach(s => console.log(`  - ${s}`))

    // Try navigating to specific candidate search
    console.log('\n🔍 Intentando acceder a búsqueda de candidatos...')

    // Check if there's a search functionality
    const searchUrls = [
      'https://plataformaelectoral.jne.gob.pe/Consulta/Candidato',
      'https://plataformaelectoral.jne.gob.pe/candidato',
      'https://plataformaelectoral.jne.gob.pe/buscar'
    ]

    for (const url of searchUrls) {
      try {
        console.log(`  Probando: ${url}`)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })
        const pageTitle = await page.title()
        console.log(`  ✓ Accesible - Título: ${pageTitle}`)
        await page.screenshot({ path: `jne-${url.split('/').pop()}.png`, fullPage: true })
        break
      } catch (e) {
        console.log(`  ✗ No accesible`)
      }
    }

    // Try the direct API endpoint for candidates
    console.log('\n🔍 Explorando API...')
    const apiUrls = [
      'https://plataformaelectoral.jne.gob.pe/api/candidato',
      'https://plataformaelectoral.jne.gob.pe/api/v1/candidato',
      'https://plataformaelectoral.jne.gob.pe/Candidato/GetCandidatos'
    ]

    const client = await page.createCDPSession()

    // Enable network tracking
    await page.setRequestInterception(true)
    const apiRequests: string[] = []

    page.on('request', request => {
      const url = request.url()
      if (url.includes('api') || url.includes('candidato') || url.includes('Candidato')) {
        apiRequests.push(url)
      }
      request.continue()
    })

    // Navigate back to home and interact
    await page.goto('https://plataformaelectoral.jne.gob.pe', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await new Promise(resolve => setTimeout(resolve, 5000))

    console.log('\n📡 Requests API detectados:')
    apiRequests.forEach(url => console.log(`  - ${url}`))

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
    console.log('\n✅ Exploración completada')
  }
}

exploreJNE()
