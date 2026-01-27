/**
 * Explorador del sitio Voto Informado para entender la estructura
 */

import puppeteer from 'puppeteer'
import * as fs from 'fs'

const VOTO_INFORMADO = 'https://votoinformado.jne.gob.pe'

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function explore() {
  console.log('='.repeat(70))
  console.log('EXPLORANDO VOTO INFORMADO')
  console.log('='.repeat(70))

  const browser = await puppeteer.launch({
    headless: false, // Modo visible para debug
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  try {
    console.log('\nNavegando a presidente-vicepresidentes...')
    await page.goto(`${VOTO_INFORMADO}/presidente-vicepresidentes`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await delay(8000)

    // Screenshot inicial
    await page.screenshot({ path: 'explore-1-inicial.png', fullPage: true })
    console.log('Screenshot: explore-1-inicial.png')

    // Explorar estructura del DOM
    const domStructure = await page.evaluate(() => {
      const info: any = {
        title: document.title,
        bodyClasses: document.body.className,
        totalElements: document.querySelectorAll('*').length,
        angularComponents: [],
        allClasses: new Set<string>(),
        allTags: new Set<string>(),
        buttons: [],
        links: [],
        cards: [],
        images: []
      }

      // Buscar componentes Angular
      document.querySelectorAll('[_ngcontent], [ng-reflect], [class*="ng-"]').forEach(el => {
        info.angularComponents.push(el.tagName.toLowerCase())
      })

      // Buscar todas las clases únicas
      document.querySelectorAll('*').forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(c => {
            if (c) info.allClasses.add(c)
          })
        }
        info.allTags.add(el.tagName.toLowerCase())
      })

      // Buscar botones
      document.querySelectorAll('button').forEach(btn => {
        info.buttons.push({
          text: btn.textContent?.trim().substring(0, 50),
          classes: btn.className,
          id: btn.id
        })
      })

      // Buscar enlaces
      document.querySelectorAll('a').forEach(link => {
        if (link.href && link.href.includes('jne')) {
          info.links.push({
            text: link.textContent?.trim().substring(0, 50),
            href: link.href,
            classes: link.className
          })
        }
      })

      // Buscar elementos que parezcan tarjetas
      const cardSelectors = [
        '[class*="card"]',
        '[class*="formula"]',
        '[class*="candidato"]',
        '[class*="partido"]',
        '.mat-card',
        '.item',
        '.row > div'
      ]

      cardSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent?.trim() || ''
          if (text.length > 20 && text.length < 1000) {
            info.cards.push({
              selector,
              tagName: el.tagName.toLowerCase(),
              classes: el.className,
              textPreview: text.substring(0, 100)
            })
          }
        })
      })

      // Buscar imágenes de candidatos
      document.querySelectorAll('img').forEach(img => {
        if (img.src && (img.src.includes('jne') || img.src.includes('candidato'))) {
          info.images.push({
            src: img.src,
            alt: img.alt,
            classes: img.className
          })
        }
      })

      return {
        ...info,
        allClasses: Array.from(info.allClasses).filter((c: string) =>
          c.includes('card') || c.includes('formula') || c.includes('candidato') ||
          c.includes('partido') || c.includes('item') || c.includes('container')
        ),
        allTags: Array.from(info.allTags).filter((t: string) => t.startsWith('app-') || t.startsWith('mat-'))
      }
    })

    console.log('\n─'.repeat(50))
    console.log('ESTRUCTURA DEL DOM')
    console.log('─'.repeat(50))
    console.log(`Título: ${domStructure.title}`)
    console.log(`Total elementos: ${domStructure.totalElements}`)
    console.log(`\nComponentes Angular: ${domStructure.angularComponents.slice(0, 20).join(', ')}`)
    console.log(`\nTags personalizados: ${domStructure.allTags.join(', ')}`)
    console.log(`\nClases relevantes: ${domStructure.allClasses.slice(0, 30).join(', ')}`)

    console.log(`\nBotones (${domStructure.buttons.length}):`)
    domStructure.buttons.slice(0, 10).forEach((b: any) => console.log(`  - ${b.text} [${b.classes?.substring(0, 30)}]`))

    console.log(`\nTarjetas encontradas (${domStructure.cards.length}):`)
    domStructure.cards.slice(0, 10).forEach((c: any) => console.log(`  - ${c.tagName} .${c.classes?.substring(0, 50)}: ${c.textPreview?.substring(0, 50)}...`))

    console.log(`\nImágenes de candidatos (${domStructure.images.length}):`)
    domStructure.images.slice(0, 5).forEach((i: any) => console.log(`  - ${i.src}`))

    // Guardar estructura completa
    fs.writeFileSync('dom-structure.json', JSON.stringify(domStructure, null, 2))
    console.log('\nEstructura guardada en: dom-structure.json')

    // Intentar hacer scroll y ver si cargan más elementos
    console.log('\nHaciendo scroll...')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await delay(3000)
    await page.screenshot({ path: 'explore-2-scroll.png', fullPage: true })

    // Buscar un candidato específico en el DOM
    const candidateSearch = await page.evaluate(() => {
      const bodyText = document.body.innerText
      const keywords = ['Keiko', 'Fujimori', 'Acuña', 'López Aliaga', 'Forsyth', 'Cerrón']
      const found: string[] = []

      keywords.forEach(keyword => {
        if (bodyText.includes(keyword)) {
          found.push(keyword)
        }
      })

      return {
        found,
        bodyTextLength: bodyText.length,
        sampleText: bodyText.substring(0, 2000)
      }
    })

    console.log('\n─'.repeat(50))
    console.log('BÚSQUEDA DE CANDIDATOS EN TEXTO')
    console.log('─'.repeat(50))
    console.log(`Candidatos encontrados en texto: ${candidateSearch.found.join(', ')}`)
    console.log(`\nMuestra del texto visible:\n${candidateSearch.sampleText.substring(0, 1000)}`)

    // Mantener el navegador abierto para inspección manual
    console.log('\nNavegador abierto para inspección manual...')
    console.log('Presiona Ctrl+C para cerrar.')

    // Esperar 30 segundos para inspección
    await delay(30000)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await browser.close()
  }
}

explore().catch(console.error)
