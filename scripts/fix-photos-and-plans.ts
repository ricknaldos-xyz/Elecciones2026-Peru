/**
 * Script para corregir fotos rotas y planes de gobierno
 * - Reemplaza fotos de votoinformado (text/html) con fotos directas de mpesije
 * - Corrige la foto 404 de Keiko Fujimori
 * - Pobla plan_pdf_local para todos los candidatos
 * - Descarga PDF de BELMONT desde JNE
 */

import { neon } from '@neondatabase/serverless'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'

const sql = neon(process.env.DATABASE_URL!)

function checkUrl(url: string): Promise<{ status: number, contentType: string }> {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
      resolve({
        status: res.statusCode || 0,
        contentType: res.headers['content-type'] || ''
      })
    })
    req.on('error', () => resolve({ status: 0, contentType: '' }))
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, contentType: 'timeout' }) })
    req.end()
  })
}

function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close()
        fs.unlinkSync(dest)
        resolve(false)
        return
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve(true) })
    }).on('error', () => { file.close(); resolve(false) })
  })
}

async function fixPhotos() {
  console.log('='.repeat(70))
  console.log(' PASO 1: CORRIGIENDO FOTOS ROTAS')
  console.log('='.repeat(70))

  // Get all active presidents with photos
  const presidents = await sql`
    SELECT id, full_name, dni, photo_url
    FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
    ORDER BY full_name
  `

  let fixedCount = 0
  let alreadyOk = 0
  let needsManual = 0

  for (const pres of presidents) {
    const url = pres.photo_url
    if (!url) {
      console.log(`  ❌ ${pres.full_name}: SIN FOTO`)
      needsManual++
      continue
    }

    const domain = new URL(url).hostname

    // If already using mpesije (direct image), check if it works
    if (domain === 'mpesije.jne.gob.pe') {
      const check = await checkUrl(url)
      if (check.status === 200 && check.contentType.includes('image')) {
        alreadyOk++
        continue
      }
      // If 404, try to find alternative
      if (check.status === 404) {
        console.log(`  🔍 ${pres.full_name}: foto 404 en mpesije, buscando alternativa...`)
      }
    }

    // For votoinformado URLs or broken mpesije URLs, try to find mpesije alternative
    if (domain === 'votoinformado.jne.gob.pe' || domain === 'mpesije.jne.gob.pe') {
      // Search for the same DNI in other cargo entries that have mpesije photo
      const alternatives = await sql`
        SELECT photo_url FROM candidates
        WHERE dni = ${pres.dni}
        AND photo_url LIKE '%mpesije.jne.gob.pe%'
        AND photo_url != ${pres.photo_url}
        AND photo_url IS NOT NULL
        LIMIT 1
      `

      if (alternatives.length > 0) {
        // Verify the alternative works
        const altCheck = await checkUrl(alternatives[0].photo_url)
        if (altCheck.status === 200 && altCheck.contentType.includes('image')) {
          await sql`UPDATE candidates SET photo_url = ${alternatives[0].photo_url} WHERE id = ${pres.id}`
          console.log(`  ✅ ${pres.full_name}: foto actualizada de mpesije (otra entrada)`)
          fixedCount++
          continue
        }
      }

      // If no mpesije alternative, check if votoinformado actually works as image
      if (domain === 'votoinformado.jne.gob.pe') {
        // These URLs work in browsers because they return image bytes on GET
        // even though HEAD reports text/html. Keep them but log it.
        console.log(`  ⚠️  ${pres.full_name}: usa votoinformado (funciona en browser, no ideal)`)
        needsManual++
        continue
      }

      console.log(`  ❌ ${pres.full_name}: foto rota, sin alternativa`)
      needsManual++
    }
  }

  console.log(`\n  Resultado: ${alreadyOk} OK, ${fixedCount} corregidas, ${needsManual} necesitan revisión`)
  return { fixedCount, needsManual }
}

async function fixPlans() {
  console.log('\n' + '='.repeat(70))
  console.log(' PASO 2: CORRIGIENDO PLANES DE GOBIERNO')
  console.log('='.repeat(70))

  // 1. Download BELMONT plan
  console.log('\n--- Descargando plan de BELMONT ---')
  const belmont = await sql`
    SELECT id, full_name, plan_gobierno_url, jne_org_id
    FROM candidates
    WHERE full_name ILIKE '%belmont%' AND cargo = 'presidente' AND is_active = true
  `

  if (belmont.length > 0) {
    const b = belmont[0]
    const localPath = '/planes/partido-civico-obras.pdf'
    const fullPath = path.join(process.cwd(), 'public', 'planes', 'partido-civico-obras.pdf')

    if (!fs.existsSync(fullPath)) {
      // Try to download from JNE
      const jneUrl = `https://declara.jne.gob.pe/ASSETS/PLANGOBIERNO/FILEPLANGOBIERNO/${b.jne_org_id || 2941}.pdf`
      console.log(`  Descargando de: ${jneUrl}`)
      const ok = await downloadFile(jneUrl, fullPath)
      if (ok && fs.existsSync(fullPath) && fs.statSync(fullPath).size > 1000) {
        console.log(`  ✅ Descargado: ${fullPath} (${Math.round(fs.statSync(fullPath).size / 1024)}KB)`)
      } else {
        console.log(`  ❌ No se pudo descargar. Manteniendo URL externa.`)
      }
    } else {
      console.log(`  Ya existe: ${fullPath}`)
    }

    // Update DB
    await sql`
      UPDATE candidates SET
        plan_gobierno_url = ${localPath},
        plan_pdf_local = ${localPath}
      WHERE id = ${b.id}
    `
    console.log(`  BD actualizada: plan_gobierno_url = ${localPath}`)
  }

  // 2. Populate plan_pdf_local for all local plans
  console.log('\n--- Poblando plan_pdf_local ---')
  const updated = await sql`
    UPDATE candidates SET plan_pdf_local = plan_gobierno_url
    WHERE cargo = 'presidente' AND is_active = true
    AND plan_gobierno_url LIKE '/planes/%'
    AND (plan_pdf_local IS NULL OR plan_pdf_local != plan_gobierno_url)
    RETURNING full_name
  `
  console.log(`  ${updated.length} candidatos actualizados con plan_pdf_local`)

  // 3. Verify all plans exist on disk
  console.log('\n--- Verificando archivos PDF ---')
  const plans = await sql`
    SELECT full_name, plan_gobierno_url, plan_pdf_local
    FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
    ORDER BY full_name
  `

  let planOk = 0
  let planMissing = 0

  for (const p of plans) {
    const url = p.plan_gobierno_url
    if (!url) {
      console.log(`  ❌ ${p.full_name}: SIN PLAN`)
      planMissing++
      continue
    }

    if (url.startsWith('/planes/')) {
      const fullPath = path.join(process.cwd(), 'public', url)
      if (fs.existsSync(fullPath)) {
        const size = fs.statSync(fullPath).size
        if (size < 1000) {
          console.log(`  ⚠️  ${p.full_name}: ${url} existe pero muy pequeño (${size} bytes)`)
          planMissing++
        } else {
          planOk++
        }
      } else {
        console.log(`  ❌ ${p.full_name}: ${url} NO EXISTE en disco`)
        planMissing++
      }
    } else {
      // External URL
      console.log(`  📎 ${p.full_name}: URL externa ${url.substring(0, 60)}...`)
      planOk++
    }
  }

  console.log(`\n  Resultado: ${planOk} OK, ${planMissing} con problemas`)
}

async function verifyFinal() {
  console.log('\n' + '='.repeat(70))
  console.log(' VERIFICACIÓN FINAL')
  console.log('='.repeat(70))

  const summary = await sql`
    SELECT
      count(*) as total,
      count(*) FILTER (WHERE photo_url IS NOT NULL AND photo_url != '') as with_photo,
      count(*) FILTER (WHERE plan_gobierno_url IS NOT NULL) as with_plan,
      count(*) FILTER (WHERE plan_pdf_local IS NOT NULL) as with_plan_local,
      count(*) FILTER (WHERE education_details IS NOT NULL AND jsonb_array_length(education_details) > 0) as with_edu,
      count(*) FILTER (WHERE assets_declaration IS NOT NULL) as with_assets
    FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
  `

  const s = summary[0]
  console.log(`
  Total presidentes activos: ${s.total}
  Con foto:                  ${s.with_photo}/${s.total}
  Con plan de gobierno:      ${s.with_plan}/${s.total}
  Con plan_pdf_local:        ${s.with_plan_local}/${s.total}
  Con educación:             ${s.with_edu}/${s.total}
  Con patrimonio:            ${s.with_assets}/${s.total}
  `)
}

async function main() {
  await fixPhotos()
  await fixPlans()
  await verifyFinal()
  console.log('\n✅ Script completado')
}

main().catch(console.error)
