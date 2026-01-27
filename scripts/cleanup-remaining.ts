/**
 * Cleanup remaining data issues:
 * 1. Transfer proposals from old inactive presidential candidates to new JNE ones
 * 2. Link diputados to their electoral districts
 *
 * Usage:
 *   npx tsx scripts/cleanup-remaining.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  createDb,
  setupBrowser,
  delay,
  DELAY_MS,
  VOTO_INFORMADO_BASE,
} from './lib/scraper-utils'
import { HTTPResponse } from 'puppeteer'

const sql = createDb()

// ============================================
// Part 1: Transfer proposals
// ============================================

function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z\s]/g, '')        // only letters and spaces
    .replace(/\s+/g, ' ')
    .trim()
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeForMatch(a)
  const nb = normalizeForMatch(b)

  // Exact match
  if (na === nb) return 1.0

  // Check if all words from shorter name appear in longer name
  const wordsA = na.split(' ')
  const wordsB = nb.split(' ')
  const shorter = wordsA.length <= wordsB.length ? wordsA : wordsB
  const longer = wordsA.length > wordsB.length ? wordsA : wordsB

  let matched = 0
  for (const w of shorter) {
    if (longer.includes(w)) matched++
  }

  return matched / Math.max(shorter.length, longer.length)
}

async function transferProposals() {
  console.log('='.repeat(70))
  console.log(' PART 1: TRANSFERIR PROPUESTAS')
  console.log('='.repeat(70))

  // Get old inactive presidents with proposals
  const oldCandidates = await sql`
    SELECT c.id, c.full_name, c.dni, c.slug,
      COUNT(cp.id) as proposal_count
    FROM candidates c
    JOIN candidate_proposals cp ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente'
    AND c.is_active = false
    GROUP BY c.id, c.full_name, c.dni, c.slug
    ORDER BY c.full_name
  `

  // Get new active JNE presidents
  const newCandidates = await sql`
    SELECT id, full_name, dni, slug
    FROM candidates
    WHERE cargo = 'presidente'
    AND is_active = true
    AND data_source = 'jne'
    ORDER BY full_name
  `

  console.log(`\nCandidatos viejos con propuestas: ${oldCandidates.length}`)
  console.log(`Candidatos JNE activos: ${newCandidates.length}`)

  let transferred = 0
  let notFound = 0
  const transfers: Array<{old: string, new: string, proposals: number}> = []

  for (const old of oldCandidates) {
    // Try to find matching new candidate
    let bestMatch: any = null
    let bestScore = 0

    for (const nc of newCandidates) {
      const score = nameSimilarity(old.full_name, nc.full_name)
      if (score > bestScore) {
        bestScore = score
        bestMatch = nc
      }
    }

    if (bestMatch && bestScore >= 0.6) {
      // Check if new candidate already has proposals
      const [existing] = await sql`
        SELECT COUNT(*) as cnt FROM candidate_proposals WHERE candidate_id = ${bestMatch.id}
      `

      if (Number(existing.cnt) > 0) {
        console.log(`  ${old.full_name} -> ${bestMatch.full_name} (score: ${bestScore.toFixed(2)}) - YA TIENE ${existing.cnt} propuestas, omitido`)
        continue
      }

      console.log(`  ${old.full_name} -> ${bestMatch.full_name} (score: ${bestScore.toFixed(2)}) - Transfiriendo ${old.proposal_count} propuestas`)

      // Transfer proposals
      await sql`
        UPDATE candidate_proposals
        SET candidate_id = ${bestMatch.id}
        WHERE candidate_id = ${old.id}
      `

      transferred++
      transfers.push({
        old: old.full_name,
        new: bestMatch.full_name,
        proposals: Number(old.proposal_count)
      })
    } else {
      console.log(`  ${old.full_name} -> NO MATCH (best: ${bestMatch?.full_name || 'none'}, score: ${bestScore.toFixed(2)})`)
      notFound++
    }
  }

  console.log(`\nTransferidos: ${transferred}`)
  console.log(`Sin match: ${notFound}`)

  // Verify
  const [stats] = await sql`
    SELECT
      COUNT(DISTINCT cp.candidate_id) as candidates_with_proposals,
      COUNT(cp.id) as total_proposals
    FROM candidate_proposals cp
    JOIN candidates c ON c.id = cp.candidate_id
    WHERE c.is_active = true AND c.cargo = 'presidente'
  `
  console.log(`\nPresidentes activos con propuestas: ${stats.candidates_with_proposals}`)
  console.log(`Total propuestas en activos: ${stats.total_proposals}`)
}

// ============================================
// Part 2: Link diputados to districts
// ============================================

async function linkDistricts() {
  console.log('\n' + '='.repeat(70))
  console.log(' PART 2: VINCULAR DIPUTADOS A DISTRITOS')
  console.log('='.repeat(70))

  // Get all districts
  const districts = await sql`SELECT id, name, slug FROM districts ORDER BY name`
  console.log(`\nDistritos en BD: ${districts.length}`)

  // We need to scrape district info from JNE
  // The diputados page has candidates grouped by district
  console.log('\nScrapeando distritos desde JNE...')

  const { browser, page } = await setupBrowser()

  try {
    // Intercept the ListaCandidatos API which returns district info
    const candidatesByDistrict = new Map<string, string[]>()

    const handler = async (response: HTTPResponse) => {
      const url = response.url()
      if (!url.includes('ListaCandidatos') && !url.includes('candidato')) return
      if (response.request().method() !== 'POST') return

      try {
        const text = await response.text()
        const data = JSON.parse(text)

        // Find the items array
        const items = Array.isArray(data) ? data :
          data?.lListaCandidato || data?.data || []

        for (const item of items) {
          const dni = item.strDocumentoIdentidad || ''
          const district = item.strDistritoElectoral || item.strDistrito || ''
          if (dni && district) {
            if (!candidatesByDistrict.has(district)) {
              candidatesByDistrict.set(district, [])
            }
            candidatesByDistrict.get(district)!.push(dni)
          }
        }
      } catch (e) {}
    }

    page.on('response', handler)

    // Navigate to diputados page
    console.log('  Navegando a /diputados...')
    await page.goto(`${VOTO_INFORMADO_BASE}/diputados`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })
    await delay(5000)

    // Check if we got any data
    console.log(`  Distritos capturados: ${candidatesByDistrict.size}`)

    // If the initial load didn't give district info, we need to check each district dropdown
    if (candidatesByDistrict.size === 0) {
      console.log('  No se obtuvieron distritos desde la carga inicial.')
      console.log('  Intentando seleccionar distritos en el dropdown...')

      // Try to find the district dropdown/selector
      const dropdownSelectors = [
        'select', 'mat-select', '.dropdown', '[formcontrolname]',
        'select[id*="distrito"]', 'select[id*="district"]',
        'mat-select[id*="distrito"]', '.mat-select'
      ]

      let dropdownFound = false
      for (const sel of dropdownSelectors) {
        const el = await page.$(sel)
        if (el) {
          console.log(`  Encontrado selector: ${sel}`)
          dropdownFound = true

          // Try to get options
          const options = await page.$$eval(`${sel} option, ${sel} mat-option`, (opts: any[]) =>
            opts.map(o => ({ value: o.value || o.getAttribute('value'), text: o.textContent?.trim() }))
          ).catch(() => [])

          console.log(`  Opciones encontradas: ${options.length}`)
          for (const opt of options.slice(0, 5)) {
            console.log(`    ${opt.value}: ${opt.text}`)
          }
          break
        }
      }

      if (!dropdownFound) {
        // Try to get page content for debugging
        const pageContent = await page.evaluate(() => {
          const selects = document.querySelectorAll('select, mat-select, [role="listbox"]')
          return Array.from(selects).map(s => ({
            tag: s.tagName,
            id: s.id,
            classes: s.className,
            children: s.children.length
          }))
        })
        console.log('  Selectores en pagina:', JSON.stringify(pageContent, null, 2))

        // Try Angular-specific approach
        const allText = await page.evaluate(() => {
          const elements = document.querySelectorAll('a, button, span, div, li, option')
          const texts: string[] = []
          elements.forEach(el => {
            const t = el.textContent?.trim()
            if (t && t.length > 2 && t.length < 50 && /[A-Z]/.test(t)) {
              texts.push(`${el.tagName}: ${t}`)
            }
          })
          return texts.slice(0, 100)
        })
        console.log('  Textos relevantes en pagina:')
        for (const t of allText.slice(0, 30)) {
          console.log(`    ${t}`)
        }
      }
    }

    page.off('response', handler)

    // If we got district data, map it to our DB districts
    if (candidatesByDistrict.size > 0) {
      console.log('\nVinculando candidatos a distritos...')

      let totalLinked = 0
      for (const [jneDistrict, dnis] of candidatesByDistrict) {
        // Match JNE district name to our DB district
        const normalized = normalizeForMatch(jneDistrict)
        let bestDist: any = null
        let bestScore = 0

        for (const d of districts) {
          const score = nameSimilarity(jneDistrict, d.name)
          if (score > bestScore) {
            bestScore = score
            bestDist = d
          }
        }

        if (bestDist && bestScore >= 0.5) {
          const result = await sql`
            UPDATE candidates SET
              district_id = ${bestDist.id},
              last_updated = NOW()
            WHERE dni = ANY(${dnis})
            AND cargo = 'diputado'
            AND is_active = true
            AND district_id IS NULL
          `
          const count = (result as any).count || dnis.length
          console.log(`  ${jneDistrict} -> ${bestDist.name}: ${count} candidatos`)
          totalLinked += Number(count) || 0
        } else {
          console.log(`  ${jneDistrict} -> NO MATCH (best: ${bestDist?.name}, score: ${bestScore.toFixed(2)})`)
        }
      }

      console.log(`\nTotal vinculados: ${totalLinked}`)
    } else {
      // Fallback: try using the JNE API directly from the page context
      console.log('\n  Intentando API directa para distritos...')

      const districtData = await page.evaluate(async () => {
        // Try to fetch the candidate list with district info
        const results: any[] = []
        try {
          const resp = await fetch('https://sije.jne.gob.pe/ServiciosWeb/WSCandidato/ListaCandidatos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idProcesoElectoral: 124,
              idTipoEleccion: 4, // Diputados
              idDistritoElectoral: 0
            })
          })
          if (resp.ok) {
            const data = await resp.json()
            const items = data?.lListaCandidato || data?.data || (Array.isArray(data) ? data : [])
            for (const item of items) {
              if (item.strDocumentoIdentidad && item.strDistritoElectoral) {
                results.push({
                  dni: item.strDocumentoIdentidad,
                  district: item.strDistritoElectoral
                })
              }
            }
          }
        } catch (e) {}
        return results
      })

      console.log(`  Datos de API directa: ${districtData.length} candidatos con distrito`)

      if (districtData.length > 0) {
        // Group by district
        const byDist = new Map<string, string[]>()
        for (const d of districtData) {
          if (!byDist.has(d.district)) byDist.set(d.district, [])
          byDist.get(d.district)!.push(d.dni)
        }

        let totalLinked = 0
        for (const [jneDistrict, dnis] of byDist) {
          let bestDist: any = null
          let bestScore = 0

          for (const d of districts) {
            const score = nameSimilarity(jneDistrict, d.name)
            if (score > bestScore) {
              bestScore = score
              bestDist = d
            }
          }

          if (bestDist && bestScore >= 0.4) {
            const result = await sql`
              UPDATE candidates SET
                district_id = ${bestDist.id},
                last_updated = NOW()
              WHERE dni = ANY(${dnis})
              AND cargo = 'diputado'
              AND is_active = true
              AND district_id IS NULL
            `
            const count = (result as any).count || 0
            console.log(`  ${jneDistrict} -> ${bestDist.name}: ${count} candidatos`)
            totalLinked += Number(count) || 0
          } else {
            console.log(`  ${jneDistrict} -> NO MATCH`)
          }
        }
        console.log(`\nTotal vinculados: ${totalLinked}`)
      }
    }
  } finally {
    await browser.close()
    console.log('\nNavegador cerrado')
  }

  // Final stats
  const [stats] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(district_id) as with_district
    FROM candidates
    WHERE cargo = 'diputado' AND is_active = true
  `
  console.log(`\nDiputados: ${stats.with_district}/${stats.total} con distrito`)
}

// ============================================
// Main
// ============================================

async function main() {
  await transferProposals()
  await linkDistricts()

  console.log('\n' + '='.repeat(70))
  console.log(' LIMPIEZA COMPLETADA')
  console.log('='.repeat(70))
}

main().catch(console.error)
