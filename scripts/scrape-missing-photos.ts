/**
 * Scrape missing photos for diputados from JNE Voto Informado.
 *
 * Strategy:
 * 1. Navigate to /diputados on votoinformado Angular app
 * 2. Click through each district in the mat-select dropdown
 * 3. Capture ListaCandidatos API responses which include strGuidFoto
 * 4. Match by DNI against DB candidates missing photos
 */

import {
  createDb,
  setupBrowser,
  delay,
  CandidateListItem,
  VOTO_INFORMADO_BASE,
} from './lib/scraper-utils'
import { Page, HTTPResponse } from 'puppeteer'

const sql = createDb()

async function captureAllDiputados(page: Page): Promise<CandidateListItem[]> {
  const allCandidates: CandidateListItem[] = []
  const seenDnis = new Set<string>()

  function addCandidate(c: any, district?: string) {
    const dni = c.strDocumentoIdentidad || c.strDNI || ''
    if (!dni || seenDnis.has(dni)) return
    seenDnis.add(dni)
    allCandidates.push({
      dni,
      orgId: c.idOrganizacionPolitica || 0,
      fullName: [c.strApellidoPaterno, c.strApellidoMaterno, c.strNombres]
        .filter(Boolean).join(' ') || c.strNombreCompleto || '',
      party: c.strOrganizacionPolitica || '',
      cargo: c.strCargo || 'DIPUTADO',
      jneId: c.idHojaVida || 0,
      photoGuid: c.strGuidFoto || '',
      district: c.strDistrito || district || undefined,
      position: c.intPosicion || undefined,
    })
  }

  // Global response handler to capture ALL ListaCandidatos responses
  const handler = async (response: HTTPResponse) => {
    const url = response.url()
    if (response.request().method() !== 'POST') return
    if (!url.includes('ListaCandidatos') && !url.includes('candidato/avanzada')) return

    try {
      const text = await response.text()
      const data = JSON.parse(text)
      const items = Array.isArray(data?.data) ? data.data : []
      for (const c of items) addCandidate(c)
    } catch (e) {}
  }

  page.on('response', handler)

  try {
    // Step 1: Navigate to /diputados
    console.log('  Navegando a /diputados...')
    await page.goto(`${VOTO_INFORMADO_BASE}/diputados`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })
    await delay(5000)
    console.log(`  Captura inicial: ${allCandidates.length} candidatos`)

    // Step 2: Find and click through the district dropdown
    console.log('  Buscando dropdown de distritos...')

    // Try mat-select first (Angular Material)
    const matSelect = await page.$('mat-select')
    if (matSelect) {
      console.log('  Encontrado mat-select, iterando opciones...')
      await matSelect.click()
      await delay(1500)

      // Get all option texts first
      const optionTexts = await page.$$eval('mat-option', els =>
        els.map(el => el.textContent?.trim() || '')
      )
      console.log(`  Opciones disponibles: ${optionTexts.length}`)

      // Close dropdown
      await page.keyboard.press('Escape')
      await delay(500)

      for (let i = 0; i < optionTexts.length; i++) {
        const optText = optionTexts[i]
        if (!optText || optText.includes('Seleccione') || optText.includes('Todos') || optText.length < 3) continue

        const beforeCount = allCandidates.length

        // Open dropdown
        const sel = await page.$('mat-select')
        if (!sel) break
        await sel.click()
        await delay(800)

        // Click the specific option
        const options = await page.$$('mat-option')
        for (const opt of options) {
          const text = await page.evaluate(el => el.textContent?.trim() || '', opt)
          if (text === optText) {
            await opt.click()
            break
          }
        }

        await delay(4000) // Wait for API response

        const newCount = allCandidates.length - beforeCount
        if (newCount > 0) {
          console.log(`  ${optText}: +${newCount} (total: ${allCandidates.length})`)
        }
      }
    } else {
      // Try regular select
      const select = await page.$('select')
      if (select) {
        console.log('  Encontrado select nativo, iterando opciones...')
        const optionValues = await page.$$eval('select option', els =>
          els.map(el => ({ value: (el as HTMLOptionElement).value, text: el.textContent?.trim() || '' }))
        )

        for (const opt of optionValues) {
          if (!opt.value || opt.text.includes('Seleccione') || opt.text.includes('Todos')) continue

          const beforeCount = allCandidates.length
          await page.select('select', opt.value)
          await delay(4000)

          const newCount = allCandidates.length - beforeCount
          if (newCount > 0) {
            console.log(`  ${opt.text}: +${newCount} (total: ${allCandidates.length})`)
          }
        }
      } else {
        console.log('  No se encontro dropdown de distritos')
      }
    }
  } catch (e) {
    console.log(`  Error en captura: ${e}`)
  } finally {
    page.off('response', handler)
  }

  return allCandidates
}

async function main() {
  console.log('='.repeat(70))
  console.log(' SCRAPE MISSING PHOTOS FROM JNE')
  console.log('='.repeat(70))

  // Step 1: Get candidates missing photos from DB
  const missing = await sql`
    SELECT id, full_name, dni, cargo
    FROM candidates
    WHERE is_active = true
    AND (photo_url IS NULL OR photo_url = '')
    AND dni IS NOT NULL AND dni <> ''
    ORDER BY cargo, full_name
  `

  console.log(`\nCandidatos sin foto en DB: ${missing.length}`)

  const byCargo: Record<string, number> = {}
  for (const c of missing) {
    byCargo[c.cargo] = (byCargo[c.cargo] || 0) + 1
  }
  for (const [cargo, count] of Object.entries(byCargo)) {
    console.log(`  ${cargo}: ${count}`)
  }

  if (missing.length === 0) {
    console.log('\nTodos los candidatos tienen foto!')
    return
  }

  // Build DNI lookup
  const missingByDni = new Map<string, typeof missing[0]>()
  for (const c of missing) {
    missingByDni.set(c.dni, c)
  }

  // Step 2: Scrape JNE for photo GUIDs
  console.log('\nScrapeando JNE para obtener GUIDs de fotos...')
  const { browser, page } = await setupBrowser()

  let jneCandidates: CandidateListItem[] = []
  try {
    jneCandidates = await captureAllDiputados(page)

    // Also scrape other sections in case
    for (const section of ['/presidente-vicepresidentes', '/senadores', '/parlamento-andino']) {
      try {
        console.log(`  Navegando a ${section}...`)
        const sectionCandidates: CandidateListItem[] = []

        const sHandler = async (response: HTTPResponse) => {
          if (response.request().method() !== 'POST') return
          if (!response.url().includes('ListaCandidatos')) return
          try {
            const text = await response.text()
            const data = JSON.parse(text)
            const items = Array.isArray(data?.data) ? data.data : []
            for (const c of items) {
              const dni = c.strDocumentoIdentidad || ''
              if (!dni) continue
              sectionCandidates.push({
                dni,
                orgId: c.idOrganizacionPolitica || 0,
                fullName: [c.strApellidoPaterno, c.strApellidoMaterno, c.strNombres].filter(Boolean).join(' '),
                party: c.strOrganizacionPolitica || '',
                cargo: c.strCargo || '',
                jneId: c.idHojaVida || 0,
                photoGuid: c.strGuidFoto || '',
              })
            }
          } catch (e) {}
        }

        page.on('response', sHandler)
        await page.goto(`${VOTO_INFORMADO_BASE}${section}`, {
          waitUntil: 'networkidle2',
          timeout: 60000
        })
        await delay(3000)
        page.off('response', sHandler)

        jneCandidates.push(...sectionCandidates)
        console.log(`  ${section}: ${sectionCandidates.length}`)
      } catch (e) {}
    }

    console.log(`\nTotal candidatos capturados del JNE: ${jneCandidates.length}`)
  } finally {
    await browser.close()
    console.log('Navegador cerrado')
  }

  // Step 3: Match and update
  console.log('\nActualizando fotos...')
  let updated = 0
  let noGuid = 0
  let noMatch = 0

  // Build JNE lookup by DNI (prefer entries with photo GUID)
  const jneByDni = new Map<string, CandidateListItem>()
  for (const c of jneCandidates) {
    const existing = jneByDni.get(c.dni)
    if (!existing || (c.photoGuid && !existing.photoGuid)) {
      jneByDni.set(c.dni, c)
    }
  }

  console.log(`  DNIs unicos en JNE: ${jneByDni.size}`)
  console.log(`  Con GUID de foto: ${[...jneByDni.values()].filter(c => c.photoGuid).length}`)

  for (const [dni, dbCandidate] of missingByDni) {
    const jneCandidate = jneByDni.get(dni)

    if (!jneCandidate) {
      noMatch++
      continue
    }

    if (!jneCandidate.photoGuid) {
      noGuid++
      continue
    }

    const photoUrl = `https://votoinformado.jne.gob.pe/assets/fotocandidato/${jneCandidate.photoGuid}`

    try {
      await sql`
        UPDATE candidates
        SET photo_url = ${photoUrl},
            jne_org_id = COALESCE(jne_org_id, ${jneCandidate.orgId}),
            last_updated = NOW()
        WHERE id = ${dbCandidate.id}::uuid
      `
      updated++

      if (updated % 200 === 0) {
        console.log(`  Progreso: ${updated} actualizados`)
      }
    } catch (e) {
      console.log(`  Error actualizando ${dbCandidate.full_name}: ${e}`)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70))
  console.log(`  Candidatos sin foto: ${missing.length}`)
  console.log(`  DNIs en JNE: ${jneByDni.size}`)
  console.log(`  Fotos actualizadas: ${updated}`)
  console.log(`  Sin match en JNE: ${noMatch}`)
  console.log(`  Sin GUID de foto: ${noGuid}`)

  // Verify
  const [stats] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN photo_url IS NOT NULL AND photo_url <> '' THEN 1 END) as with_photo,
      COUNT(CASE WHEN cargo = 'diputado' AND (photo_url IS NULL OR photo_url = '') THEN 1 END) as diputados_sin_foto
    FROM candidates
    WHERE is_active = true
  `
  console.log(`\nEstado post-fix:`)
  console.log(`  Total con foto: ${stats.with_photo}/${stats.total}`)
  console.log(`  Diputados sin foto: ${stats.diputados_sin_foto}`)
}

main().catch(console.error)
