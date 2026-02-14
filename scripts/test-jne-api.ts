/**
 * Dig into specific issues found by audit
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const sql = neon(dbMatch![1])

async function main() {
  // 1. Check Masse's API penal sentences in detail
  console.log('=== MASSE FERNANDEZ - API Penal Sentences ===')
  const masseResp = await fetch('https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida?idHojaVida=244662', {
    headers: { 'Accept': 'application/json', 'Origin': 'https://votoinformado.jne.gob.pe', 'Referer': 'https://votoinformado.jne.gob.pe/' }
  })
  const masseData = await masseResp.json()
  console.log('sentenciaPenal:', JSON.stringify(masseData.sentenciaPenal, null, 2))
  console.log('sentenciaObliga:', JSON.stringify(masseData.sentenciaObliga, null, 2))

  // DB data
  const masseDb = await sql`SELECT penal_sentences, civil_sentences FROM candidates WHERE slug = 'masse-fernandez-armando-joaquin'`
  console.log('\nDB penal_sentences:', JSON.stringify(masseDb[0]?.penal_sentences, null, 2))
  console.log('DB civil_sentences:', JSON.stringify(masseDb[0]?.civil_sentences, null, 2))

  // 2. Check Cerron's API
  console.log('\n\n=== CERRON ROJAS - API Penal Sentences ===')
  const cerronResp = await fetch('https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida?idHojaVida=244668', {
    headers: { 'Accept': 'application/json', 'Origin': 'https://votoinformado.jne.gob.pe', 'Referer': 'https://votoinformado.jne.gob.pe/' }
  })
  const cerronData = await cerronResp.json()
  console.log('sentenciaPenal:', JSON.stringify(cerronData.sentenciaPenal, null, 2))

  const cerronDb = await sql`SELECT penal_sentences FROM candidates WHERE slug = 'cerron-rojas-vladimir-roy'`
  console.log('\nDB penal_sentences:', JSON.stringify(cerronDb[0]?.penal_sentences, null, 2))

  // 3. Check Lopez Aliaga's API
  console.log('\n\n=== LOPEZ ALIAGA - API Penal Sentences ===')
  const laResp = await fetch('https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida?idHojaVida=245620', {
    headers: { 'Accept': 'application/json', 'Origin': 'https://votoinformado.jne.gob.pe', 'Referer': 'https://votoinformado.jne.gob.pe/' }
  })
  const laData = await laResp.json()
  console.log('sentenciaPenal:', JSON.stringify(laData.sentenciaPenal, null, 2))

  const laDb = await sql`SELECT penal_sentences FROM candidates WHERE slug = 'lopez-aliaga-cazorla-rafael-bernardo'`
  console.log('\nDB penal_sentences:', JSON.stringify(laDb[0]?.penal_sentences, null, 2))

  // 4. Check Vizcarra's API
  console.log('\n\n=== VIZCARRA - API Penal Sentences ===')
  const vizResp = await fetch('https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida?idHojaVida=245614', {
    headers: { 'Accept': 'application/json', 'Origin': 'https://votoinformado.jne.gob.pe', 'Referer': 'https://votoinformado.jne.gob.pe/' }
  })
  const vizData = await vizResp.json()
  console.log('sentenciaPenal:', JSON.stringify(vizData.sentenciaPenal, null, 2))

  const vizDb = await sql`SELECT penal_sentences FROM candidates WHERE slug = 'vizcarra-cornejo-mario-enrique'`
  console.log('\nDB penal_sentences:', JSON.stringify(vizDb[0]?.penal_sentences, null, 2))

  // 5. Education: Check Carrasco's DB ed vs API
  console.log('\n\n=== CARRASCO SALAZAR - Education Comparison ===')
  const csResp = await fetch('https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida?idHojaVida=252874', {
    headers: { 'Accept': 'application/json', 'Origin': 'https://votoinformado.jne.gob.pe', 'Referer': 'https://votoinformado.jne.gob.pe/' }
  })
  const csData = await csResp.json()
  console.log('API formacionAcademica.educacionPosgrado:', JSON.stringify(csData.formacionAcademica?.educacionPosgrado, null, 2))
  console.log('API formacionAcademica.educacionPosgradoOtro:', JSON.stringify(csData.formacionAcademica?.educacionPosgradoOtro, null, 2))

  const csDb = await sql`SELECT education_level, education_details FROM candidates WHERE slug = 'carrasco-salazar-charlie'`
  console.log('\nDB education_level:', csDb[0]?.education_level)
  console.log('DB education_details:', JSON.stringify(csDb[0]?.education_details, null, 2))

  // 6. Check ESPA education mismatch (DB=Univ Complete, API=Maestria)
  console.log('\n\n=== ESPA Y GARCES-ALVEAR - Education Comparison ===')
  const espaResp = await fetch('https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida?idHojaVida=247389', {
    headers: { 'Accept': 'application/json', 'Origin': 'https://votoinformado.jne.gob.pe', 'Referer': 'https://votoinformado.jne.gob.pe/' }
  })
  const espaData = await espaResp.json()
  console.log('API educacionPosgrado:', JSON.stringify(espaData.formacionAcademica?.educacionPosgrado, null, 2))
  console.log('API educacionPosgradoOtro:', JSON.stringify(espaData.formacionAcademica?.educacionPosgradoOtro, null, 2))
  const espaDb = await sql`SELECT education_level, education_details FROM candidates WHERE slug = 'espa-y-garces-alvear-alfonso-carlos'`
  console.log('\nDB education_level:', espaDb[0]?.education_level)
  console.log('DB education_details (levels):', (espaDb[0]?.education_details || []).map((e: any) => e.level))

  // 7. Slug issues - bad slugs
  console.log('\n\n=== SLUG ISSUES ===')
  const badSlugs = await sql`
    SELECT full_name, slug FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
    AND (slug LIKE '%-%-%-%-%-%' OR slug LIKE '%.jpg' OR slug LIKE '%.png')
    ORDER BY full_name
  `
  for (const c of badSlugs) {
    console.log(`  ${c.full_name}: slug="${c.slug}"`)
  }
}

main().catch(console.error)
