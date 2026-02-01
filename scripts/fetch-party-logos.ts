/**
 * Fetch Party Logos Script
 *
 * Fetches party logo images from Wikipedia and updates the database.
 * Falls back to manually curated URLs where Wikipedia doesn't have data.
 *
 * Usage:
 *   DATABASE_URL='...' npx tsx scripts/fetch-party-logos.ts
 *   DATABASE_URL='...' npx tsx scripts/fetch-party-logos.ts --dry-run
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
const DRY_RUN = process.argv.includes('--dry-run')

// Map of party names to their Wikipedia article titles
const WIKIPEDIA_TITLES: Record<string, string> = {
  'Fuerza Popular': 'Fuerza_Popular',
  'PARTIDO DEMOCRATICO SOMOS PERU': 'Partido_Democrático_Somos_Perú',
  'RENOVACION POPULAR': 'Renovación_Popular',
  'Alianza para el Progreso': 'Alianza_para_el_Progreso_(Perú)',
  'AVANZA PAIS - PARTIDO DE INTEGRACION SOCIAL': 'Avanza_País',
  'JUNTOS POR EL PERU': 'Juntos_por_el_Perú',
  'Partido Aprista Peruano': 'Partido_Aprista_Peruano',
  'PARTIDO POLITICO NACIONAL PERU LIBRE': 'Perú_Libre',
  'Partido Morado': 'Partido_Morado',
  'PODEMOS PERU': 'Podemos_Perú',
  'FRENTE POPULAR AGRICOLA FIA DEL PERU': 'Frente_Popular_Agrícola_del_Perú',
  'Partido del Buen Gobierno': 'Partido_del_Buen_Gobierno_(Perú)',
  'PARTIDO FRENTE DE LA ESPERANZA 2021': 'Frente_de_la_Esperanza_2021',
  'PARTIDO POLITICO PERU PRIMERO': 'Perú_Primero_(partido_político)',
  'FE EN EL PERU': 'Fe_en_el_Perú',
  'PARTIDO DEMOCRATA VERDE': 'Partido_Demócrata_Verde',
  'PARTIDO PATRIOTICO DEL PERU': 'Partido_Patriótico_del_Perú',
  'Progresemos': 'Progresemos',
  'PARTIDO POLITICO COOPERACION POPULAR': 'Acción_Popular',
  'SALVEMOS AL PERU': 'Salvemos_al_Perú',
}

// Manually curated logo URLs from Wikimedia Commons
const MANUAL_LOGOS: Record<string, string> = {
  'AHORA NACION - AN': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Logo_Ahora_Naci%C3%B3n_2026.jpg',
  'ALIANZA ELECTORAL VENCEREMOS': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Venceremos_-_Peru.jpg',
  'AVANZA PAIS - PARTIDO DE INTEGRACION SOCIAL': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Avanza_Pa%C3%ADs_Logo_2017-20.jpg',
  'PARTIDO DEMOCRATICO SOMOS PERU': 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Logo_Partido_Democr%C3%A1tico_Somos_Per%C3%BA.svg',
  'Partido Aprista Peruano': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/APRA_Peru_logo.svg',
  'FE EN EL PERU': 'https://upload.wikimedia.org/wikipedia/commons/1/16/FE_EN_EL_PER%C3%9A_LOGO.png',
  'SALVEMOS AL PERU': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Salvemos_al_Per%C3%BA_-_Logo.jpg',
  'FRENTE POPULAR AGRICOLA FIA DEL PERU': 'https://upload.wikimedia.org/wikipedia/commons/6/63/FREPAP-Logo-removebg-preview.svg',
  'LIBERTAD POPULAR': 'https://upload.wikimedia.org/wikipedia/commons/7/78/Logo_de_Libertad_Popular.jpg',
  'PARTIDO POLITICO PRIN': 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Partido_Pol%C3%ADtico_PRIN_-_S%C3%ADmbolo.png',
  'PARTIDO DE LOS TRABAJADORES Y EMPRENDEDORES PTE - PERU': 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Logo_PTE_PERU.jpg',
  'PARTIDO POLITICO INTEGRIDAD DEMOCRATICA': 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Logo_de_Integridad_democratica.jpg',
  'Un Camino Diferente': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Logo_de_un_camino_diferente.jpg',
  'PARTIDO POLITICO COOPERACION POPULAR': 'https://upload.wikimedia.org/wikipedia/commons/3/39/Logo_Cooperacion_Popular_Peru.png',
  'PARTIDO DEMOCRATICO FEDERAL': 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Logo_de_Democratico_federal.jpg',
  'Partido del Buen Gobierno': 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Partido_del_Buen_Gobierno_%28Per%C3%BA%29_Logo.png',
  'PARTIDO POLITICO PERU PRIMERO': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Logo_de_Per%C3%BA_Primero.png',
  'PARTIDO FRENTE DE LA ESPERANZA 2021': 'https://upload.wikimedia.org/wikipedia/commons/5/55/Frente_de_la_Esperanza_2021_%28logo%29.svg',
  'PARTIDO PATRIOTICO DEL PERU': 'https://upload.wikimedia.org/wikipedia/commons/6/63/Partido_Patri%C3%B3tico_del_Per%C3%BA_%28logo%29.svg',
  'RENOVACION POPULAR': 'https://upload.wikimedia.org/wikipedia/commons/3/33/Logo_Renovaci%C3%B3n_Popular_2023.png',
}

async function fetchWikipediaLogo(title: string): Promise<string | null> {
  try {
    const url = `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&piprop=original`
    const response = await fetch(url)
    const data = await response.json()
    const pages = data.query?.pages
    if (!pages) return null

    for (const page of Object.values(pages) as any[]) {
      if (page.original?.source) {
        return page.original.source
      }
    }
    return null
  } catch (error) {
    console.log(`  Wikipedia fetch failed for ${title}: ${error}`)
    return null
  }
}

// Try English Wikipedia if Spanish doesn't have image
async function fetchEnWikipediaLogo(title: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&piprop=original`
    const response = await fetch(url)
    const data = await response.json()
    const pages = data.query?.pages
    if (!pages) return null

    for (const page of Object.values(pages) as any[]) {
      if (page.original?.source) {
        return page.original.source
      }
    }
    return null
  } catch {
    return null
  }
}

async function main() {
  console.log('=== Party Logo Fetcher ===')
  if (DRY_RUN) console.log('>>> DRY RUN MODE <<<\n')

  // Get all parties from DB
  const parties = await sql`SELECT id, name, logo_url FROM parties ORDER BY name`
  console.log(`${parties.length} parties in database\n`)

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (const party of parties) {
    const name = party.name as string

    // Skip if already has logo
    if (party.logo_url) {
      console.log(`  SKIP ${name} (already has logo)`)
      skipped++
      continue
    }

    let logoUrl: string | null = null

    // Check manual logos first
    if (MANUAL_LOGOS[name]) {
      logoUrl = MANUAL_LOGOS[name]
      console.log(`  MANUAL ${name}`)
    }
    // Try Wikipedia
    else if (WIKIPEDIA_TITLES[name]) {
      console.log(`  Fetching from Wikipedia: ${name}...`)
      logoUrl = await fetchWikipediaLogo(WIKIPEDIA_TITLES[name])

      // Try English Wikipedia as fallback
      if (!logoUrl) {
        logoUrl = await fetchEnWikipediaLogo(WIKIPEDIA_TITLES[name])
      }
    }

    if (logoUrl) {
      console.log(`  ✓ ${name} → ${logoUrl.substring(0, 80)}...`)
      if (!DRY_RUN) {
        await sql`UPDATE parties SET logo_url = ${logoUrl} WHERE id = ${party.id}::uuid`
      }
      updated++
    } else {
      console.log(`  ✗ ${name} - no logo found`)
      notFound++
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Updated: ${updated}`)
  console.log(`Skipped (already has logo): ${skipped}`)
  console.log(`Not found: ${notFound}`)

  if (DRY_RUN) {
    console.log('\n>>> DRY RUN complete. Run without --dry-run to apply changes. <<<')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
