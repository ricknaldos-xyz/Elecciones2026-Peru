/**
 * Fetch real presidential plan de gobierno PDFs from JNE API
 *
 * The previous PDFs were from local/municipal elections (2019-2022).
 * This script fetches the actual presidential plans for 2026.
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  if (match) return match[1]
  throw new Error('DATABASE_URL not found')
}

const sql = neon(loadEnv())

const AUTH_TOKEN = '1454eebb-4b05-4400-93ac-25f0d0690d4b'
const USER_ID = 1381
const PROCESO_ELECTORAL = 124 // Elecciones Generales 2026

interface President {
  name: string
  orgId: number
  party: string
  dni: string
}

interface PlanResult {
  orgId: number
  party: string
  idPlanGobierno: number
  urlPlanCompleto: string
  urlResumen: string
  pesoArchivo: number
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function getPresidents(): Promise<President[]> {
  const response = await fetch('https://sije.jne.gob.pe/ServiciosWeb/WSCandidato/ListaCandidatos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      oToken: { AuthToken: AUTH_TOKEN, UserId: USER_ID },
      oFiltro: { idProcesoElectoral: PROCESO_ELECTORAL, strUbiDepartamento: '', idTipoEleccion: 1 }
    })
  })

  const data = await response.json() as any
  return data.data
    .filter((c: any) => c.strCargo === 'PRESIDENTE DE LA REPÚBLICA')
    .map((c: any) => ({
      name: `${c.strApellidoPaterno} ${c.strApellidoMaterno} ${c.strNombres}`.trim(),
      orgId: c.idOrganizacionPolitica,
      party: c.strOrganizacionPolitica,
      dni: c.strDocumentoIdentidad
    }))
}

async function getPlanGobierno(orgId: number): Promise<PlanResult | null> {
  try {
    const response = await fetch('https://apiplataformaelectoral9.jne.gob.pe/api/v1/plan-gobierno/busqueda-avanzada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageSize: 10,
        skip: 1,
        filter: {
          idProcesoElectoral: PROCESO_ELECTORAL,
          idTipoEleccion: '1',
          idOrganizacionPolitica: orgId.toString(),
          txDatoCandidato: '',
          idJuradoElectoral: '0'
        }
      })
    })

    const data = await response.json() as any
    if (data.data && data.data.length > 0) {
      const plan = data.data[0]
      return {
        orgId,
        party: plan.txOrganizacionPolitica,
        idPlanGobierno: plan.idPlanGobierno,
        urlPlanCompleto: plan.txRutaCompleto,
        urlResumen: plan.txRutaResumen,
        pesoArchivo: plan.pesoArchivo
      }
    }
    return null
  } catch (error) {
    console.error(`Error fetching plan for org ${orgId}:`, error)
    return null
  }
}

async function downloadPdf(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VotoInformado/1.0)' }
    })

    if (!response.ok) {
      console.error(`  Failed to download: ${response.status}`)
      return false
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    // Verify it's a PDF
    if (buffer.length < 100 || buffer.toString('utf-8', 0, 5) !== '%PDF-') {
      console.error(`  Not a valid PDF (${buffer.length} bytes)`)
      return false
    }

    fs.writeFileSync(outputPath, buffer)
    return true
  } catch (error) {
    console.error(`  Download error:`, error)
    return false
  }
}

async function main() {
  console.log('='.repeat(70))
  console.log(' DESCARGA DE PLANES DE GOBIERNO PRESIDENCIALES 2026')
  console.log(' Fuente: API JNE Plataforma Electoral')
  console.log('='.repeat(70))

  // Step 1: Get all presidents
  console.log('\n1. Obteniendo candidatos presidenciales...')
  const presidents = await getPresidents()
  console.log(`   ${presidents.length} candidatos encontrados`)

  // Step 2: Get plan gobierno for each
  console.log('\n2. Buscando planes de gobierno...')
  const plans: PlanResult[] = []
  const noPlan: President[] = []

  for (const pres of presidents) {
    await delay(500)
    const plan = await getPlanGobierno(pres.orgId)
    if (plan) {
      plans.push(plan)
      console.log(`   [OK] ${pres.name} - ${plan.pesoArchivo}MB`)
    } else {
      noPlan.push(pres)
      console.log(`   [--] ${pres.name} - Sin plan`)
    }
  }

  console.log(`\n   Con plan: ${plans.length} | Sin plan: ${noPlan.length}`)

  // Step 3: Download PDFs
  console.log('\n3. Descargando PDFs...')
  const planesDir = path.join(process.cwd(), 'public', 'planes')

  // Ensure directory exists
  if (!fs.existsSync(planesDir)) {
    fs.mkdirSync(planesDir, { recursive: true })
  }

  let downloaded = 0
  let failed = 0

  for (const plan of plans) {
    const slug = slugify(plan.party)
    const pdfPath = path.join(planesDir, `${slug}.pdf`)
    const sizeStr = plan.pesoArchivo ? `${plan.pesoArchivo}MB` : 'unknown size'

    console.log(`\n   ${plan.party} (${sizeStr})`)
    console.log(`   URL: ${plan.urlPlanCompleto}`)

    const success = await downloadPdf(plan.urlPlanCompleto, pdfPath)
    if (success) {
      const fileSize = fs.statSync(pdfPath).size
      console.log(`   -> ${slug}.pdf (${Math.round(fileSize / 1024)}KB)`)
      downloaded++
    } else {
      console.log(`   -> FAILED`)
      failed++
    }

    await delay(1000)
  }

  console.log(`\n   Downloaded: ${downloaded} | Failed: ${failed}`)

  // Step 4: Update database
  console.log('\n4. Actualizando base de datos...')
  let updated = 0

  for (const plan of plans) {
    const slug = slugify(plan.party)
    const localPath = `/planes/${slug}.pdf`
    const pdfPath = path.join(planesDir, `${slug}.pdf`)

    if (!fs.existsSync(pdfPath)) continue

    // Find candidate by party org ID or name
    const candidates = await sql`
      SELECT c.id, c.full_name
      FROM candidates c
      JOIN parties p ON c.party_id = p.id
      WHERE p.name ILIKE ${`%${plan.party.split(' ')[0]}%`}
      AND c.cargo = 'presidente'
      AND c.is_active = true
    `

    if (candidates.length === 0) {
      // Try by party name more broadly
      const words = plan.party.split(' ').filter(w => w.length > 3).slice(0, 2)
      if (words.length >= 2) {
        const found = await sql`
          SELECT c.id, c.full_name
          FROM candidates c
          JOIN parties p ON c.party_id = p.id
          WHERE p.name ILIKE ${`%${words[0]}%`}
          AND p.name ILIKE ${`%${words[1]}%`}
          AND c.cargo = 'presidente'
        `
        if (found.length > 0) {
          for (const c of found) {
            await sql`
              UPDATE candidates SET
                plan_gobierno_url = ${plan.urlPlanCompleto},
                plan_pdf_local = ${localPath},
                last_updated = NOW()
              WHERE id = ${c.id}
            `
            console.log(`   [OK] ${c.full_name} -> ${localPath}`)
            updated++
          }
        } else {
          console.log(`   [??] No match for ${plan.party}`)
        }
      }
    } else {
      for (const c of candidates) {
        await sql`
          UPDATE candidates SET
            plan_gobierno_url = ${plan.urlPlanCompleto},
            plan_pdf_local = ${localPath},
            last_updated = NOW()
          WHERE id = ${c.id}
        `
        console.log(`   [OK] ${c.full_name} -> ${localPath}`)
        updated++
      }
    }
  }

  // Also save the resumen URLs
  console.log('\n5. Guardando URLs de resumen...')
  for (const plan of plans) {
    if (plan.urlResumen) {
      const candidates = await sql`
        SELECT c.id FROM candidates c
        JOIN parties p ON c.party_id = p.id
        WHERE c.plan_gobierno_url = ${plan.urlPlanCompleto}
        AND c.cargo = 'presidente'
      `
      // Store resumen URL in a metadata field if needed
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(70))
  console.log(' RESUMEN FINAL')
  console.log('='.repeat(70))
  console.log(`  Candidatos: ${presidents.length}`)
  console.log(`  Con plan: ${plans.length}`)
  console.log(`  Sin plan: ${noPlan.length}`)
  console.log(`  PDFs descargados: ${downloaded}`)
  console.log(`  BD actualizados: ${updated}`)

  if (noPlan.length > 0) {
    console.log('\n  Sin plan de gobierno:')
    noPlan.forEach(p => console.log(`    - ${p.name} (${p.party})`))
  }

  // Save plan URLs mapping for reference
  const mapping = plans.map(p => ({
    party: p.party,
    orgId: p.orgId,
    urlPlanCompleto: p.urlPlanCompleto,
    urlResumen: p.urlResumen,
    pesoArchivo: p.pesoArchivo
  }))
  fs.writeFileSync(path.join(process.cwd(), 'planes-gobierno-2026.json'), JSON.stringify(mapping, null, 2))
  console.log('\n  Mapping guardado en planes-gobierno-2026.json')
}

main().catch(console.error)
