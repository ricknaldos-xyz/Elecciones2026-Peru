import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'

const sql = neon(DATABASE_URL)

async function cleanFakeData() {
  console.log('🧹 Iniciando limpieza de datos fake...\n')

  try {
    // Step 1: Count current fake candidates
    const countBefore = await sql`SELECT COUNT(*) as total FROM candidates WHERE data_source = 'legacy_fake' OR data_verified = FALSE`
    console.log(`📊 Candidatos fake a eliminar: ${countBefore[0].total}`)

    // Step 2: Delete related records first (foreign key constraints)
    console.log('\n📝 Eliminando registros relacionados...')

    // Delete flags
    const flagsDeleted = await sql`
      DELETE FROM flags
      WHERE candidate_id IN (
        SELECT id FROM candidates WHERE data_source = 'legacy_fake' OR data_verified = FALSE
      )
      RETURNING id
    `
    console.log(`  ✅ Flags eliminados: ${flagsDeleted.length}`)

    // Delete score_breakdowns
    const breakdownsDeleted = await sql`
      DELETE FROM score_breakdowns
      WHERE candidate_id IN (
        SELECT id FROM candidates WHERE data_source = 'legacy_fake' OR data_verified = FALSE
      )
      RETURNING id
    `
    console.log(`  ✅ Score breakdowns eliminados: ${breakdownsDeleted.length}`)

    // Delete scores
    const scoresDeleted = await sql`
      DELETE FROM scores
      WHERE candidate_id IN (
        SELECT id FROM candidates WHERE data_source = 'legacy_fake' OR data_verified = FALSE
      )
      RETURNING id
    `
    console.log(`  ✅ Scores eliminados: ${scoresDeleted.length}`)

    // Delete news_mentions
    const newsDeleted = await sql`
      DELETE FROM news_mentions
      WHERE candidate_id IN (
        SELECT id FROM candidates WHERE data_source = 'legacy_fake' OR data_verified = FALSE
      )
      RETURNING id
    `
    console.log(`  ✅ News mentions eliminados: ${newsDeleted.length}`)

    // Delete data_hashes
    const hashesDeleted = await sql`
      DELETE FROM data_hashes
      WHERE entity_type = 'candidate' AND entity_id IN (
        SELECT id FROM candidates WHERE data_source = 'legacy_fake' OR data_verified = FALSE
      )
      RETURNING id
    `
    console.log(`  ✅ Data hashes eliminados: ${hashesDeleted.length}`)

    // Step 3: Delete fake candidates
    console.log('\n📝 Eliminando candidatos fake...')
    const candidatesDeleted = await sql`
      DELETE FROM candidates
      WHERE data_source = 'legacy_fake' OR data_verified = FALSE
      RETURNING id, full_name
    `
    console.log(`  ✅ Candidatos eliminados: ${candidatesDeleted.length}`)

    // Step 4: Verify remaining data
    console.log('\n📊 Verificando estado final...')
    const remainingCandidates = await sql`SELECT COUNT(*) as total FROM candidates`
    const remainingParties = await sql`SELECT COUNT(*) as total FROM parties`
    const remainingDistricts = await sql`SELECT COUNT(*) as total FROM districts`

    console.log(`  📋 Candidatos restantes: ${remainingCandidates[0].total}`)
    console.log(`  🏛️  Partidos restantes: ${remainingParties[0].total}`)
    console.log(`  📍 Distritos restantes: ${remainingDistricts[0].total}`)

    console.log('\n🎉 Limpieza completada exitosamente!')
    console.log('\n⚠️  La base de datos ahora está vacía de candidatos.')
    console.log('   Ejecuta el script de sincronización para poblar con datos reales.')

  } catch (error) {
    console.error('❌ Error durante limpieza:', error)
    process.exit(1)
  }
}

// Confirm before running
const args = process.argv.slice(2)
if (args.includes('--confirm')) {
  cleanFakeData()
} else {
  console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los candidatos fake de la base de datos.')
  console.log('   Esto incluye ~1650 candidatos y sus registros relacionados.')
  console.log('')
  console.log('   Para ejecutar, usa: npx tsx scripts/clean-fake-data.ts --confirm')
  console.log('')
}
