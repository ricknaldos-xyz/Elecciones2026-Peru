/**
 * Scrape ALL diputados from each electoral district on JNE,
 * insert missing candidates, and set district_id.
 *
 * Uses direct API calls with captured auth token.
 *
 * Usage:
 *   npx tsx scripts/link-districts.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  createDb,
  setupBrowser,
  delay,
  VOTO_INFORMADO_BASE,
  createSlug,
  CHECKPOINTS_DIR,
  ensureCheckpointsDir,
} from './lib/scraper-utils'

const sql = createDb()

function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchDistrict(jneName: string, districts: any[]): any | null {
  const norm = normalizeForMatch(jneName)

  for (const d of districts) {
    const normDB = normalizeForMatch(d.name)
    if (norm === normDB) return d
  }

  // Substring match (but only if both are long enough to avoid false positives like "ica" in "huancavelica")
  for (const d of districts) {
    const normDB = normalizeForMatch(d.name)
    if (norm.length > 4 && (norm.includes(normDB) || normDB.includes(norm))) return d
  }

  const specialMap: Record<string, string> = {
    'peruanos residentes en el extranjero': 'extranjero',
    'lima provincias': 'lima-provincias',
    'lima metropolitana': 'lima-metropolitana',
    'ica': 'ica',
  }
  if (specialMap[norm]) {
    return districts.find((d: any) => d.slug === specialMap[norm]) || null
  }

  const words = norm.split(' ')
  for (const d of districts) {
    const dbWords = normalizeForMatch(d.name).split(' ')
    if (words.some(w => w.length > 3 && dbWords.includes(w))) return d
  }

  return null
}

interface JNECandidate {
  dni: string
  fullName: string
  orgId: number
  party: string
  jneId: number
  districtCode: string
  districtName: string
}

async function main() {
  console.log('='.repeat(70))
  console.log(' SCRAPE DIPUTADOS POR DISTRITO')
  console.log('='.repeat(70))

  ensureCheckpointsDir()

  const districts = await sql`SELECT id, name, slug, deputies_count FROM districts ORDER BY name`
  console.log(`Distritos en BD: ${districts.length}`)

  const { browser, page } = await setupBrowser()
  const allCandidates: JNECandidate[] = []

  try {
    console.log('\nNavegando a /diputados...')
    await page.goto(`${VOTO_INFORMADO_BASE}/diputados`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })
    await delay(3000)

    // Capture the auth token from any API request
    let authToken = ''
    let userId = 0

    const requestHandler = (request: any) => {
      if (request.url().includes('ListaCandidatos') && request.method() === 'POST') {
        try {
          const body = JSON.parse(request.postData() || '{}')
          if (body.oToken) {
            authToken = body.oToken.AuthToken
            userId = body.oToken.UserId
          }
        } catch (e) {}
      }
    }

    page.on('request', requestHandler)
    // Trigger initial API call by selecting first district
    const options: Array<{value: string, text: string}> = await page.$$eval('select option', (opts: any[]) =>
      opts.map(o => ({ value: o.value, text: o.textContent?.trim() || '' }))
        .filter(o => o.value && o.text)
    )
    await page.select('select', options[0].value)
    await delay(3000)
    page.off('request', requestHandler)

    console.log(`Auth token: ${authToken ? authToken.slice(0, 10) + '...' : 'NOT FOUND'}`)
    console.log(`User ID: ${userId}`)
    console.log(`Distritos: ${options.length}`)

    if (!authToken) {
      console.log('ERROR: No auth token captured')
      return
    }

    // For each district, make direct API call from page context
    for (let i = 0; i < options.length; i++) {
      const opt = options[i]
      console.log(`\n[${i + 1}/${options.length}] ${opt.text} (${opt.value})`)

      const candidates: any[] = await page.evaluate(async (token: string, uid: number, distCode: string) => {
        try {
          const resp = await fetch('https://sije.jne.gob.pe/ServiciosWeb/WSCandidato/ListaCandidatos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              oToken: { AuthToken: token, UserId: uid },
              oFiltro: {
                idProcesoElectoral: 124,
                strUbiDepartamento: distCode,
                idTipoEleccion: 15
              }
            })
          })

          if (!resp.ok) return []
          const data = await resp.json()
          const items = Array.isArray(data) ? data :
            Array.isArray(data?.data) ? data.data :
            data?.lListaCandidato || []

          return items.map((item: any) => ({
            dni: item.strDocumentoIdentidad || '',
            lastName1: item.strApellidoPaterno || '',
            lastName2: item.strApellidoMaterno || '',
            firstName: item.strNombres || '',
            orgId: item.idOrganizacionPolitica || 0,
            party: item.strOrganizacionPolitica || '',
            jneId: item.idHojaVida || 0,
          })).filter((c: any) => c.dni)
        } catch (e) {
          return []
        }
      }, authToken, userId, opt.value)

      console.log(`  Candidatos: ${candidates.length}`)

      for (const c of candidates) {
        const fullName = `${c.lastName1} ${c.lastName2} ${c.firstName}`.trim()
        allCandidates.push({
          dni: c.dni,
          fullName,
          orgId: c.orgId,
          party: c.party,
          jneId: c.jneId,
          districtCode: opt.value,
          districtName: opt.text,
        })
      }

      await delay(1500) // Rate limit
    }
  } finally {
    await browser.close()
    console.log('\nNavegador cerrado')
  }

  // Deduplicate by DNI
  const uniqueByDni = new Map<string, JNECandidate>()
  for (const c of allCandidates) {
    if (!uniqueByDni.has(c.dni)) {
      uniqueByDni.set(c.dni, c)
    }
  }
  console.log(`\nTotal candidatos unicos: ${uniqueByDni.size}`)

  // Save manifest
  const manifestPath = path.join(CHECKPOINTS_DIR, 'diputados-by-district.json')
  fs.writeFileSync(manifestPath, JSON.stringify(allCandidates, null, 2))

  // Summary by district
  const byDistrict = new Map<string, number>()
  for (const c of allCandidates) {
    byDistrict.set(c.districtName, (byDistrict.get(c.districtName) || 0) + 1)
  }
  console.log('\nPor distrito (JNE):')
  for (const [name, count] of byDistrict) {
    console.log(`  ${name}: ${count}`)
  }

  // Check existing in DB
  const existingDiputados = await sql`
    SELECT dni, id FROM candidates
    WHERE cargo = 'diputado' AND is_active = true AND dni IS NOT NULL
  `
  const existingDnis = new Set(existingDiputados.map(c => c.dni))
  console.log(`\nDiputados existentes en BD: ${existingDiputados.length}`)

  // Insert missing candidates
  const newCandidates = [...uniqueByDni.values()].filter(c => !existingDnis.has(c.dni))
  console.log(`Nuevos candidatos a insertar: ${newCandidates.length}`)

  let inserted = 0
  for (const c of newCandidates) {
    const slug = createSlug(c.fullName)
    const [existing] = await sql`SELECT id FROM candidates WHERE slug = ${slug} LIMIT 1`
    const finalSlug = existing ? `${slug}-diputado-${c.dni}` : slug

    try {
      await sql`
        INSERT INTO candidates (
          slug, full_name, cargo, dni, jne_org_id, data_source, is_active
        ) VALUES (
          ${finalSlug}, ${c.fullName}, 'diputado', ${c.dni},
          ${c.orgId}, 'jne', true
        )
      `
      inserted++
    } catch (e: any) {
      // Try with extra unique slug
      try {
        await sql`
          INSERT INTO candidates (
            slug, full_name, cargo, dni, jne_org_id, data_source, is_active
          ) VALUES (
            ${finalSlug + '-' + Date.now()}, ${c.fullName}, 'diputado', ${c.dni},
            ${c.orgId}, 'jne', true
          )
        `
        inserted++
      } catch (e2) {
        console.log(`  Error: ${c.fullName} (${c.dni}): ${e2}`)
      }
    }
  }
  console.log(`Insertados: ${inserted}`)

  // Link districts
  console.log('\n' + '='.repeat(70))
  console.log('VINCULANDO DISTRITOS')
  console.log('='.repeat(70))

  // Reset
  await sql`
    UPDATE candidates SET district_id = NULL
    WHERE cargo = 'diputado' AND is_active = true
  `

  let totalLinked = 0
  const districtDnis = new Map<string, string[]>()
  for (const c of allCandidates) {
    if (!districtDnis.has(c.districtName)) {
      districtDnis.set(c.districtName, [])
    }
    districtDnis.get(c.districtName)!.push(c.dni)
  }

  for (const [distName, dnis] of districtDnis) {
    const uniqueDnis = [...new Set(dnis)]
    const matchedDist = matchDistrict(distName, districts)

    if (!matchedDist) {
      console.log(`  ${distName}: NO MATCH`)
      continue
    }

    const updated = await sql`
      UPDATE candidates SET
        district_id = ${matchedDist.id},
        last_updated = NOW()
      WHERE dni = ANY(${uniqueDnis})
      AND cargo = 'diputado'
      AND is_active = true
      RETURNING id
    `
    console.log(`  ${distName} -> ${matchedDist.name}: ${updated.length}`)
    totalLinked += updated.length
  }

  console.log(`\nTotal vinculados: ${totalLinked}`)

  // Final stats
  const [stats] = await sql`
    SELECT COUNT(*) as total, COUNT(district_id) as with_district
    FROM candidates WHERE cargo = 'diputado' AND is_active = true
  `
  console.log(`\nDiputados: ${stats.with_district}/${stats.total} con distrito`)

  const breakdown = await sql`
    SELECT d.name, d.deputies_count as expected, COUNT(c.id) as actual
    FROM districts d
    LEFT JOIN candidates c ON c.district_id = d.id AND c.cargo = 'diputado' AND c.is_active = true
    GROUP BY d.id, d.name, d.deputies_count ORDER BY d.name
  `
  console.log('\nPor distrito:')
  for (const b of breakdown) {
    console.log(`  ${b.name}: ${b.actual} candidatos (${b.expected} escanos)`)
  }

  const [unlinked] = await sql`
    SELECT COUNT(*) as cnt FROM candidates
    WHERE cargo = 'diputado' AND is_active = true AND district_id IS NULL
  `
  if (Number(unlinked.cnt) > 0) {
    console.log(`\nSin distrito: ${unlinked.cnt}`)
  }

  // Overall
  const totals = await sql`
    SELECT cargo, COUNT(*) as cnt FROM candidates WHERE is_active = true
    GROUP BY cargo ORDER BY cargo
  `
  console.log('\nTotal candidatos activos:')
  for (const c of totals) {
    console.log(`  ${c.cargo}: ${c.cnt}`)
  }
}

main().catch(console.error)
