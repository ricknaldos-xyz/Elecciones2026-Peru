/**
 * Verify assets normalization for all candidates
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

// Copy of normalization from queries.ts
function normalizeAssetsDeclaration(raw: any): any | null {
  if (!raw || typeof raw !== 'object') return null
  if (Array.isArray(raw.assets)) return raw

  // Handle seed format
  if (raw.total != null && !raw.real_estate_count && !raw.source) {
    const totalVal = Math.max(0, Number(raw.total) || 0)
    return totalVal > 0 ? {
      assets: [{ type: 'Patrimonio', description: 'Declaración general', value: totalVal, currency: 'PEN' }],
      total_value: totalVal, total_liabilities: null, income: null, declaration_year: null, has_declaration: true,
    } : null
  }

  const assets: any[] = []
  const realEstateTotal = Math.max(0, Number(raw.real_estate_total) || 0)
  const realEstateCount = Math.max(0, Number(raw.real_estate_count) || 0)
  const vehicleTotal = Math.max(0, Number(raw.vehicle_total) || 0)
  const vehicleCount = Math.max(0, Number(raw.vehicle_count) || 0)

  if (realEstateCount > 0 || realEstateTotal > 0) {
    assets.push({ type: 'Inmuebles', description: `${realEstateCount} propiedad(es)`, value: realEstateTotal, currency: 'PEN' })
  }
  if (vehicleCount > 0 || vehicleTotal > 0) {
    assets.push({ type: 'Vehículos', description: `${vehicleCount} vehículo(s)`, value: vehicleTotal, currency: 'PEN' })
  }

  const totalIncome = Math.max(0, Number(raw.total_income) || 0)
  const publicIncome = Math.max(0, Number(raw.public_salary) || 0) + Math.max(0, Number(raw.public_rent) || 0) + Math.max(0, Number(raw.other_public) || 0)
  const privateIncome = Math.max(0, Number(raw.private_salary) || 0) + Math.max(0, Number(raw.private_rent) || 0) + Math.max(0, Number(raw.other_private) || 0)

  const totalValue = raw.total_assets != null ? Math.max(0, Number(raw.total_assets) || 0) : realEstateTotal + vehicleTotal
  const totalLiabilities = raw.total_liabilities != null ? Math.max(0, Number(raw.total_liabilities) || 0) : null

  if (totalValue === 0 && totalIncome === 0 && assets.length === 0 && !raw.source) return null

  const incomeSource = publicIncome > 0 && privateIncome > 0
    ? 'Sector público y privado' : publicIncome > 0 ? 'Sector público' : privateIncome > 0 ? 'Sector privado' : ''

  return {
    assets, total_value: totalValue, total_liabilities: totalLiabilities,
    income: totalIncome > 0 ? { annual_income: totalIncome, public_income: publicIncome, private_income: privateIncome, source: incomeSource } : null,
    declaration_year: raw.income_year ? parseInt(String(raw.income_year), 10) : null, has_declaration: true,
  }
}

async function main() {
  console.log('=' .repeat(60))
  console.log(' VERIFICATION: Assets Declaration Normalization')
  console.log('=' .repeat(60))

  const candidates = await sql`
    SELECT id, full_name, assets_declaration
    FROM candidates
    WHERE assets_declaration IS NOT NULL
  `

  let total = 0
  let normalized = 0
  let nulled = 0
  let withAssets = 0
  let withIncome = 0
  let withLiabilities = 0
  let withYear = 0
  let withIncomeBreakdown = 0
  let negativeValues = 0
  let errors = 0
  const formatCounts: Record<string, number> = { flat: 0, structured: 0, seed: 0, unknown: 0 }

  for (const c of candidates) {
    total++
    const raw = c.assets_declaration as any

    // Detect format
    if (Array.isArray(raw.assets)) formatCounts.structured++
    else if (raw.total != null && !raw.source) formatCounts.seed++
    else if (raw.real_estate_count != null || raw.source) formatCounts.flat++
    else formatCounts.unknown++

    try {
      const result = normalizeAssetsDeclaration(raw)
      if (!result) { nulled++; continue }
      normalized++

      if (result.assets.length > 0) withAssets++
      if (result.income) withIncome++
      if (result.total_liabilities != null && result.total_liabilities > 0) withLiabilities++
      if (result.declaration_year) withYear++
      if (result.income?.public_income > 0 || result.income?.private_income > 0) withIncomeBreakdown++

      // Check for negative values
      if (result.total_value < 0) negativeValues++
      for (const a of result.assets) {
        if (a.value < 0) negativeValues++
      }
    } catch (e) {
      errors++
      console.log(`  ERROR: ${c.full_name}: ${e}`)
    }
  }

  console.log()
  console.log(`  Total with assets_declaration: ${total}`)
  console.log(`  Format: flat=${formatCounts.flat}, seed=${formatCounts.seed}, structured=${formatCounts.structured}, unknown=${formatCounts.unknown}`)
  console.log()
  console.log(`  Normalized successfully: ${normalized} (${(100*normalized/total).toFixed(1)}%)`)
  console.log(`  Returned null (no data): ${nulled}`)
  console.log(`  Errors: ${errors}`)
  console.log()
  console.log(`  With asset items: ${withAssets}`)
  console.log(`  With income: ${withIncome}`)
  console.log(`  With income breakdown (pub/priv): ${withIncomeBreakdown}`)
  console.log(`  With liabilities: ${withLiabilities}`)
  console.log(`  With declaration year: ${withYear}`)
  console.log(`  Negative values found: ${negativeValues}`)
  console.log()

  if (errors === 0 && negativeValues === 0) {
    console.log('  ✅ ALL CHECKS PASSED')
  } else {
    console.log('  ❌ Issues found')
  }
}

main().catch(console.error)
