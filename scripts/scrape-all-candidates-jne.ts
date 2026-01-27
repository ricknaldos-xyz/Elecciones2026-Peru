/**
 * Master scraper: Get ALL candidate listings from JNE Voto Informado
 * Navigates to each section and captures ListaCandidatos API responses
 * Saves manifest to scripts/checkpoints/candidate-manifest.json
 * Upserts candidates into database
 */

import * as fs from 'fs'
import * as path from 'path'
import { Page, HTTPResponse } from 'puppeteer'
import {
  VOTO_INFORMADO_BASE,
  createDb,
  setupBrowser,
  delay,
  createSlug,
  normalizeCargo,
  ensureCheckpointsDir,
  CHECKPOINTS_DIR,
  CandidateListItem,
  captureListaCandidatos,
} from './lib/scraper-utils'

const sql = createDb()

interface ManifestCandidate extends CandidateListItem {
  cargoNormalized: string
}

// ============================================
// Capture candidates from a section page
// ============================================

async function captureSectionCandidates(
  page: Page,
  urlPath: string,
  defaultCargo: string
): Promise<ManifestCandidate[]> {
  console.log(`\n  Navegando a ${urlPath}...`)
  const raw = await captureListaCandidatos(page, urlPath)
  console.log(`  Capturados: ${raw.length} candidatos`)

  return raw.map(c => ({
    ...c,
    cargoNormalized: c.cargo ? normalizeCargo(c.cargo) : defaultCargo,
  }))
}

// ============================================
// For deputies, we may need to capture from API responses more broadly
// ============================================

async function captureCandidatesFromAPI(
  page: Page,
  urlPath: string,
  defaultCargo: string
): Promise<ManifestCandidate[]> {
  const candidates: ManifestCandidate[] = []

  // Capture both ListaCandidatos and candidato/avanzada responses
  const handler = async (response: HTTPResponse) => {
    const url = response.url()
    const method = response.request().method()

    if (method !== 'POST') return

    if (url.includes('ListaCandidatos') || url.includes('candidato/avanzada')) {
      try {
        const text = await response.text()
        const data = JSON.parse(text)
        const items = Array.isArray(data?.data) ? data.data : []

        for (const c of items) {
          const dni = c.strDocumentoIdentidad || c.strDNI || ''
          const orgId = c.idOrganizacionPolitica || c.idOP || 0
          if (!dni || !orgId) continue

          candidates.push({
            dni,
            orgId,
            fullName: [c.strApellidoPaterno, c.strApellidoMaterno, c.strNombres]
              .filter(Boolean).join(' ') || c.strNombreCompleto || '',
            party: c.strOrganizacionPolitica || '',
            cargo: c.strCargo || defaultCargo,
            cargoNormalized: c.strCargo ? normalizeCargo(c.strCargo) : defaultCargo,
            jneId: c.idHojaVida || 0,
            photoGuid: c.strGuidFoto || '',
            district: c.strDistrito || undefined,
            position: c.intPosicion || undefined,
          })
        }
      } catch (e) {}
    }
  }

  page.on('response', handler)

  try {
    await page.goto(`${VOTO_INFORMADO_BASE}${urlPath}`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })
    await delay(5000)
  } catch (e) {
    console.log(`  Error navegando: ${e}`)
  } finally {
    page.off('response', handler)
  }

  return candidates
}

// ============================================
// Try to capture deputy candidates by selecting districts
// ============================================

async function captureDeputyCandidates(page: Page): Promise<ManifestCandidate[]> {
  console.log('\n  Navegando a /diputados...')

  // First, try direct navigation to see what the page structure looks like
  const allCandidates: ManifestCandidate[] = []

  // Try capturing from the initial page load first
  const initial = await captureCandidatesFromAPI(page, '/diputados', 'diputado')
  if (initial.length > 0) {
    console.log(`  Captura inicial: ${initial.length} diputados`)
    allCandidates.push(...initial)
  }

  // If we got a lot of candidates already, we may have them all
  if (allCandidates.length > 500) {
    console.log(`  Ya tenemos ${allCandidates.length} diputados, no es necesario iterar por distrito`)
    return allCandidates
  }

  // Try clicking district dropdown to load more candidates
  console.log('  Intentando seleccionar distritos...')

  // Get district names from the page
  const districtNames = await page.evaluate(() => {
    const options: string[] = []
    // Try mat-select options
    const selects = document.querySelectorAll('mat-select, select, [role="combobox"], [role="listbox"]')
    selects.forEach(sel => {
      const opts = sel.querySelectorAll('mat-option, option')
      opts.forEach(opt => {
        const text = opt.textContent?.trim()
        if (text && text.length > 2 && !text.includes('Seleccione') && !text.includes('Todos')) {
          options.push(text)
        }
      })
    })

    // Also try dropdown/filter buttons
    const buttons = document.querySelectorAll('button, a, div[class*="filtro"], div[class*="filter"]')
    buttons.forEach(btn => {
      const text = btn.textContent?.trim()
      if (text && text.length > 2 && text.length < 50) {
        // Look for department-like names
        const depts = ['Lima', 'Arequipa', 'Cusco', 'Piura', 'Cajamarca', 'Junin']
        if (depts.some(d => text.includes(d))) {
          options.push(text)
        }
      }
    })

    return options
  })

  if (districtNames.length > 0) {
    console.log(`  Encontrados ${districtNames.length} distritos en dropdown`)
  } else {
    console.log('  No se encontro dropdown de distritos, intentando con click...')

    // Try to find and click on a dropdown/filter element
    try {
      const dropdown = await page.$('mat-select, select, [role="combobox"]')
      if (dropdown) {
        await dropdown.click()
        await delay(1000)

        const options = await page.$$('mat-option, option, [role="option"]')
        console.log(`  Opciones encontradas en dropdown: ${options.length}`)

        for (let i = 0; i < options.length; i++) {
          const optText = await page.evaluate(el => el.textContent?.trim() || '', options[i])
          if (!optText || optText.includes('Seleccione') || optText.includes('Todos')) continue

          console.log(`  Seleccionando distrito: ${optText}`)

          // Click the option
          const newCandidates: ManifestCandidate[] = []

          const districtHandler = async (response: HTTPResponse) => {
            const url = response.url()
            const method = response.request().method()
            if (method !== 'POST') return
            if (url.includes('ListaCandidatos') || url.includes('candidato/avanzada')) {
              try {
                const text = await response.text()
                const data = JSON.parse(text)
                const items = Array.isArray(data?.data) ? data.data : []
                for (const c of items) {
                  const dni = c.strDocumentoIdentidad || ''
                  const orgId = c.idOrganizacionPolitica || 0
                  if (!dni || !orgId) continue
                  newCandidates.push({
                    dni,
                    orgId,
                    fullName: [c.strApellidoPaterno, c.strApellidoMaterno, c.strNombres]
                      .filter(Boolean).join(' ') || c.strNombreCompleto || '',
                    party: c.strOrganizacionPolitica || '',
                    cargo: c.strCargo || 'DIPUTADO',
                    cargoNormalized: 'diputado',
                    jneId: c.idHojaVida || 0,
                    photoGuid: c.strGuidFoto || '',
                    district: c.strDistrito || optText,
                    position: c.intPosicion || undefined,
                  })
                }
              } catch (e) {}
            }
          }

          page.on('response', districtHandler)

          try {
            await options[i].click()
            await delay(4000)
          } catch (e) {
            // Option may be stale after page changes
          } finally {
            page.off('response', districtHandler)
          }

          if (newCandidates.length > 0) {
            console.log(`    ${optText}: ${newCandidates.length} candidatos`)
            allCandidates.push(...newCandidates)
          }

          // Re-open dropdown for next selection
          try {
            const dd = await page.$('mat-select, select, [role="combobox"]')
            if (dd) await dd.click()
            await delay(500)
          } catch (e) {}
        }
      }
    } catch (e) {
      console.log(`  Error interactuando con dropdown: ${e}`)
    }
  }

  // Deduplicate by DNI
  const seen = new Set<string>()
  const unique = allCandidates.filter(c => {
    if (seen.has(c.dni)) return false
    seen.add(c.dni)
    return true
  })

  return unique
}

// ============================================
// Upsert candidates to database
// ============================================

async function upsertCandidate(candidate: ManifestCandidate): Promise<'created' | 'updated' | 'skipped'> {
  const slug = createSlug(candidate.fullName)
  const cargo = candidate.cargoNormalized

  // Check if exists by DNI + cargo
  const existingByDni = await sql`
    SELECT id FROM candidates
    WHERE dni = ${candidate.dni} AND cargo = ${cargo}
    LIMIT 1
  `

  if (existingByDni.length > 0) {
    // Update org ID and basic info
    await sql`
      UPDATE candidates SET
        jne_org_id = ${candidate.orgId},
        jne_id = COALESCE(${String(candidate.jneId)}, jne_id),
        list_position = COALESCE(${candidate.position || null}, list_position),
        last_updated = NOW()
      WHERE id = ${existingByDni[0].id}::uuid
    `
    return 'updated'
  }

  // Check by name + cargo
  const existingByName = await sql`
    SELECT id FROM candidates
    WHERE LOWER(full_name) = LOWER(${candidate.fullName}) AND cargo = ${cargo}
    LIMIT 1
  `

  if (existingByName.length > 0) {
    await sql`
      UPDATE candidates SET
        dni = ${candidate.dni},
        jne_org_id = ${candidate.orgId},
        jne_id = COALESCE(${String(candidate.jneId)}, jne_id),
        list_position = COALESCE(${candidate.position || null}, list_position),
        last_updated = NOW()
      WHERE id = ${existingByName[0].id}::uuid
    `
    return 'updated'
  }

  // Check by slug
  const existingBySlug = await sql`
    SELECT id FROM candidates WHERE slug = ${slug} LIMIT 1
  `

  let finalSlug = slug
  if (existingBySlug.length > 0) {
    // Slug conflict with different cargo - make unique
    finalSlug = `${slug}-${cargo}`
    const existingFinal = await sql`
      SELECT id FROM candidates WHERE slug = ${finalSlug} LIMIT 1
    `
    if (existingFinal.length > 0) {
      finalSlug = `${slug}-${cargo}-${candidate.dni.slice(-4)}`
    }
  }

  // Look up district_id if applicable
  let districtId = null
  if (candidate.district && (cargo === 'diputado' || cargo === 'senador')) {
    const districts = await sql`
      SELECT id FROM districts
      WHERE LOWER(name) = LOWER(${candidate.district})
      LIMIT 1
    `
    if (districts.length > 0) {
      districtId = districts[0].id
    }
  }

  // Look up or create party
  let partyId = null
  if (candidate.party) {
    const parties = await sql`
      SELECT id FROM parties
      WHERE LOWER(name) = LOWER(${candidate.party})
      LIMIT 1
    `
    if (parties.length > 0) {
      partyId = parties[0].id
    } else {
      const newParty = await sql`
        INSERT INTO parties (name)
        VALUES (${candidate.party})
        RETURNING id
      `
      partyId = newParty[0].id
    }
  }

  // Build photo URL from GUID
  let photoUrl = null
  if (candidate.photoGuid) {
    photoUrl = `https://votoinformado.jne.gob.pe/assets/fotocandidato/${candidate.photoGuid}`
  }

  // Insert new candidate
  await sql`
    INSERT INTO candidates (
      slug, full_name, cargo, dni, jne_id, jne_org_id,
      party_id, district_id, photo_url, list_position,
      data_source, is_active
    ) VALUES (
      ${finalSlug}, ${candidate.fullName}, ${cargo}, ${candidate.dni},
      ${String(candidate.jneId)}, ${candidate.orgId},
      ${partyId}, ${districtId}, ${photoUrl}, ${candidate.position || null},
      'jne', true
    )
  `

  // Create initial scores
  const newCandidate = await sql`
    SELECT id FROM candidates WHERE slug = ${finalSlug} LIMIT 1
  `
  if (newCandidate.length > 0) {
    const candidateId = newCandidate[0].id
    await sql`
      INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence,
                          score_balanced, score_merit, score_integrity)
      VALUES (${candidateId}::uuid, 0, 100, 0, 0, 0, 0, 0)
      ON CONFLICT (candidate_id) DO NOTHING
    `
    await sql`
      INSERT INTO score_breakdowns (candidate_id)
      VALUES (${candidateId}::uuid)
      ON CONFLICT (candidate_id) DO NOTHING
    `
  }

  return 'created'
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('=' .repeat(70))
  console.log(' SCRAPE ALL CANDIDATES FROM JNE VOTO INFORMADO')
  console.log('='.repeat(70))

  const { browser, page } = await setupBrowser()
  const allCandidates: ManifestCandidate[] = []

  try {
    // 1. Presidents & Vice-Presidents
    console.log('\n--- PRESIDENTES / VICEPRESIDENTES ---')
    const presidents = await captureSectionCandidates(page, '/presidente-vicepresidentes', 'presidente')
    allCandidates.push(...presidents)

    await delay(3000)

    // 2. Senators
    console.log('\n--- SENADORES ---')
    const senators = await captureSectionCandidates(page, '/senadores', 'senador')
    allCandidates.push(...senators)

    await delay(3000)

    // 3. Andean Parliament
    console.log('\n--- PARLAMENTO ANDINO ---')
    const andean = await captureSectionCandidates(page, '/parlamento-andino', 'parlamento_andino')
    allCandidates.push(...andean)

    await delay(3000)

    // 4. Deputies (most complex - need district iteration)
    console.log('\n--- DIPUTADOS ---')
    const deputies = await captureDeputyCandidates(page)
    console.log(`  Total diputados capturados: ${deputies.length}`)
    allCandidates.push(...deputies)

  } finally {
    await browser.close()
    console.log('\nNavegador cerrado')
  }

  // Deduplicate by DNI
  const seen = new Set<string>()
  const unique = allCandidates.filter(c => {
    const key = `${c.dni}-${c.cargoNormalized}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`\nTotal candidatos unicos: ${unique.length}`)

  // Summary by cargo
  const byCargo: Record<string, number> = {}
  for (const c of unique) {
    byCargo[c.cargoNormalized] = (byCargo[c.cargoNormalized] || 0) + 1
  }
  console.log('\nPor cargo:')
  for (const [cargo, count] of Object.entries(byCargo).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cargo}: ${count}`)
  }

  // Save manifest
  ensureCheckpointsDir()
  const manifestPath = path.join(CHECKPOINTS_DIR, 'candidate-manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(unique, null, 2))
  console.log(`\nManifiesto guardado: ${manifestPath}`)

  // Upsert to database
  console.log('\nInsertando/actualizando en base de datos...')
  let created = 0, updated = 0, skipped = 0, errors = 0

  for (let i = 0; i < unique.length; i++) {
    const c = unique[i]
    try {
      const result = await upsertCandidate(c)
      if (result === 'created') created++
      else if (result === 'updated') updated++
      else skipped++

      if ((i + 1) % 100 === 0) {
        console.log(`  Progreso: ${i + 1}/${unique.length} (C:${created} U:${updated} S:${skipped} E:${errors})`)
      }
    } catch (e) {
      errors++
      if (errors <= 10) {
        console.log(`  Error con ${c.fullName}: ${e}`)
      }
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70))
  console.log(`Total procesados: ${unique.length}`)
  console.log(`  Creados: ${created}`)
  console.log(`  Actualizados: ${updated}`)
  console.log(`  Omitidos: ${skipped}`)
  console.log(`  Errores: ${errors}`)

  // Final count from DB
  const [dbStats] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN cargo = 'presidente' THEN 1 END) as presidentes,
      COUNT(CASE WHEN cargo = 'vicepresidente' THEN 1 END) as vps,
      COUNT(CASE WHEN cargo = 'senador' THEN 1 END) as senadores,
      COUNT(CASE WHEN cargo = 'diputado' THEN 1 END) as diputados,
      COUNT(CASE WHEN cargo = 'parlamento_andino' THEN 1 END) as andinos
    FROM candidates
    WHERE is_active = true
  `

  console.log('\nEstado de la base de datos:')
  console.log(`  Total: ${dbStats.total}`)
  console.log(`  Presidentes: ${dbStats.presidentes}`)
  console.log(`  Vicepresidentes: ${dbStats.vps}`)
  console.log(`  Senadores: ${dbStats.senadores}`)
  console.log(`  Diputados: ${dbStats.diputados}`)
  console.log(`  Parlamento Andino: ${dbStats.andinos}`)
}

main().catch(console.error)
