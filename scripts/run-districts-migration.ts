import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL || ''

const sql = neon(DATABASE_URL)

async function runMigration() {
  console.log('🚀 Ejecutando migración de distritos...\n')

  try {
    // Leer el archivo SQL
    const migrationPath = join(__dirname, '../supabase/migrations/006_districts_data.sql')
    const migrationSql = readFileSync(migrationPath, 'utf-8')

    // Ejecutar cada statement separado por punto y coma
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.includes('DELETE FROM districts') || statement.includes('INSERT INTO districts')) {
        await sql(statement)
        console.log('✅ Statement ejecutado')
      }
    }

    // Verificar los datos insertados
    const districts = await sql`SELECT name, type, deputies_count FROM districts ORDER BY deputies_count DESC`
    console.log(`\n📊 ${districts.length} distritos creados:`)
    districts.forEach(d => {
      console.log(`  - ${d.name} (${d.type}): ${d.deputies_count} diputados`)
    })

    const totalDeputies = await sql`SELECT SUM(deputies_count) as total FROM districts`
    console.log(`\n🎯 Total de escaños de diputados: ${totalDeputies[0].total}`)

    console.log('\n✅ Migración completada exitosamente!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

runMigration()
