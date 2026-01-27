/**
 * Fix remaining issues:
 * 1. Merge duplicate candidates
 * 2. Fix fake DNIs with real ones from JNE data
 * 3. Fetch remaining hojas de vida
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return match ? match[1] : ''
}

const sql = neon(loadEnv())

// Known duplicates: [keeper slug, duplicate slug]
// Keeper has the plan/proposals, duplicate has the JNE data
const DUPLICATES = [
  { keeperSlug: 'keiko-fujimori', duplicateFullName: 'FUJIMORI HIGUCHI KEIKO SOFIA' },
  { keeperSlug: 'jorge-nieto', duplicateFullName: 'NIETO MONTESINOS JORGE' },
]

// Known DNI corrections (from captured JNE data)
const DNI_FIXES: Record<string, string> = {
  'george-forsyth': '41265978',
  'jose-williams': '08517735',
  'yonhy-lescano': '01211014',
}

async function mergeDuplicates(): Promise<void> {
  console.log('\n📋 1. Fusionando duplicados...')

  for (const dup of DUPLICATES) {
    const keeper = await sql`
      SELECT id, full_name FROM candidates WHERE slug = ${dup.keeperSlug} LIMIT 1
    `
    const duplicate = await sql`
      SELECT id, full_name, dni, jne_id, education_details, experience_details,
             political_trajectory, penal_sentences, civil_sentences,
             assets_declaration, party_resignations, birth_date, djhv_url,
             education_level
      FROM candidates WHERE full_name = ${dup.duplicateFullName} LIMIT 1
    `

    if (keeper.length === 0 || duplicate.length === 0) {
      console.log(`  ⚠ No encontrado: ${dup.keeperSlug} o ${dup.duplicateFullName}`)
      continue
    }

    const k = keeper[0]
    const d = duplicate[0]

    console.log(`  Fusionando "${d.full_name}" → "${k.full_name}"`)

    // Copy JNE data from duplicate to keeper
    await sql`
      UPDATE candidates SET
        dni = COALESCE(${d.dni}, dni),
        jne_id = COALESCE(${d.jne_id}, jne_id),
        birth_date = COALESCE(${d.birth_date}, birth_date),
        education_level = COALESCE(${d.education_level}, education_level),
        education_details = COALESCE(${JSON.stringify(d.education_details)}::jsonb, education_details),
        experience_details = COALESCE(${JSON.stringify(d.experience_details)}::jsonb, experience_details),
        political_trajectory = COALESCE(${JSON.stringify(d.political_trajectory)}::jsonb, political_trajectory),
        penal_sentences = COALESCE(${JSON.stringify(d.penal_sentences)}::jsonb, penal_sentences),
        civil_sentences = COALESCE(${JSON.stringify(d.civil_sentences)}::jsonb, civil_sentences),
        assets_declaration = COALESCE(${JSON.stringify(d.assets_declaration)}::jsonb, assets_declaration),
        party_resignations = COALESCE(${d.party_resignations}, party_resignations),
        djhv_url = COALESCE(${d.djhv_url}, djhv_url),
        data_verified = true,
        verification_date = NOW(),
        last_updated = NOW()
      WHERE id = ${k.id}::uuid
    `

    // Delete duplicate
    await sql`DELETE FROM candidates WHERE id = ${d.id}::uuid`
    console.log(`  ✓ Fusionado y eliminado duplicado`)
  }
}

async function fixDNIs(): Promise<void> {
  console.log('\n📋 2. Corrigiendo DNIs...')

  for (const [slug, realDni] of Object.entries(DNI_FIXES)) {
    try {
      await sql`
        UPDATE candidates SET
          dni = ${realDni},
          last_updated = NOW()
        WHERE slug = ${slug}
      `
      console.log(`  ✓ ${slug}: DNI → ${realDni}`)
    } catch (e) {
      console.log(`  ⚠ Error con ${slug}: ${e}`)
    }
  }
}

async function showFinalStatus(): Promise<void> {
  console.log('\n📋 3. Estado final...')

  const [stats] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN education_details IS NOT NULL AND jsonb_array_length(education_details) > 0 THEN 1 END) as with_edu,
      COUNT(CASE WHEN experience_details IS NOT NULL AND jsonb_array_length(experience_details) > 0 THEN 1 END) as with_exp,
      COUNT(CASE WHEN assets_declaration IS NOT NULL AND assets_declaration <> '{}'::jsonb THEN 1 END) as with_assets,
      COUNT(CASE WHEN djhv_url IS NOT NULL AND djhv_url <> '' THEN 1 END) as with_djhv
    FROM candidates
    WHERE cargo IN ('presidente', 'vicepresidente')
  `

  console.log(`  Total: ${stats.total}`)
  console.log(`  Con educación: ${stats.with_edu} (${((Number(stats.with_edu) / Number(stats.total)) * 100).toFixed(1)}%)`)
  console.log(`  Con experiencia: ${stats.with_exp} (${((Number(stats.with_exp) / Number(stats.total)) * 100).toFixed(1)}%)`)
  console.log(`  Con patrimonio: ${stats.with_assets} (${((Number(stats.with_assets) / Number(stats.total)) * 100).toFixed(1)}%)`)
  console.log(`  Con URL HV: ${stats.with_djhv} (${((Number(stats.with_djhv) / Number(stats.total)) * 100).toFixed(1)}%)`)

  // Show remaining candidates without education
  const missing = await sql`
    SELECT full_name, dni, slug FROM candidates
    WHERE cargo IN ('presidente', 'vicepresidente')
    AND (education_details IS NULL OR jsonb_array_length(education_details) = 0)
    ORDER BY full_name
  `

  if (missing.length > 0) {
    console.log(`\n  Candidatos sin educación (${missing.length}):`)
    for (const c of missing) {
      console.log(`    - ${c.full_name} (${c.slug}, DNI: ${c.dni || 'N/A'})`)
    }
  }
}

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' CORREGIR PROBLEMAS RESTANTES '.padStart(44).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  await mergeDuplicates()
  await fixDNIs()
  await showFinalStatus()
}

main().catch(console.error)
