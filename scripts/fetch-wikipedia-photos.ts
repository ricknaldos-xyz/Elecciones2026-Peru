/**
 * Script para obtener fotos de candidatos desde Wikipedia
 * Usa la API de Wikipedia (MediaWiki) para buscar imágenes
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || '')

const WIKIPEDIA_API = 'https://es.wikipedia.org/w/api.php'
const DELAY_MS = 2000 // Rate limiting

// Mapeo de nombres en BD a títulos de Wikipedia
// Algunos candidatos tienen nombres diferentes en Wikipedia
const WIKIPEDIA_TITLES: Record<string, string> = {
  // Candidatos presidenciales conocidos
  'Keiko Sofía Fujimori Higuchi': 'Keiko_Fujimori',
  'César Acuña Peralta': 'César_Acuña',
  'Rafael López Aliaga Cazorla': 'Rafael_López_Aliaga',
  'George Patrick Forsyth Sommer': 'George_Forsyth',
  'Vladimir Roy Cerrón Rojas': 'Vladimir_Cerrón',
  'Yonhy Lescano Ancieta': 'Yonhy_Lescano',
  'Fernando Olivera Vega': 'Fernando_Olivera',
  'José Luna Gálvez': 'José_Luna_Gálvez',
  'Marisol Pérez Tello': 'Marisol_Pérez_Tello',
  'Roberto Chiabra León': 'Roberto_Chiabra',
  'Francisco Diez Canseco Terry': 'Francisco_Diez_Canseco_Távara', // Verificar si es el mismo
  'Jorge Nieto Montesinos': 'Jorge_Nieto_Montesinos',
  'Antauro Igor Humala Tasso': 'Antauro_Humala',
  'Daniel Urresti Elera': 'Daniel_Urresti',
  'Luis Galarreta Velarde': 'Luis_Galarreta',
  'Ricardo Belmont Cassinelli': 'Ricardo_Belmont',
  'Álvaro Paz de la Barra': 'Álvaro_Paz_de_la_Barra',
  'Mesías Guevara Amasifuén': 'Mesías_Guevara',
  'José Williams Zapata': 'José_Williams',
  'Norma Yarrow Lumbreras': 'Norma_Yarrow',
  'Alfonso López Chau Nava': 'Alfonso_López_Chau',
  'Fiorella Molinelli Aristondo': 'Fiorella_Molinelli',
}

interface WikipediaResponse {
  query?: {
    pages: {
      [pageId: string]: {
        title: string
        thumbnail?: {
          source: string
          width: number
          height: number
        }
        pageimage?: string
      }
    }
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getWikipediaPhoto(title: string): Promise<string | null> {
  try {
    const url = new URL(WIKIPEDIA_API)
    url.searchParams.set('action', 'query')
    url.searchParams.set('titles', title)
    url.searchParams.set('prop', 'pageimages')
    url.searchParams.set('pithumbsize', '400')
    url.searchParams.set('format', 'json')
    url.searchParams.set('origin', '*')

    const response = await fetch(url.toString())
    if (!response.ok) {
      console.log(`  HTTP ${response.status} for ${title}`)
      return null
    }

    const data: WikipediaResponse = await response.json()

    if (!data.query?.pages) {
      return null
    }

    const pageId = Object.keys(data.query.pages)[0]
    if (pageId === '-1') {
      return null // Page not found
    }

    const page = data.query.pages[pageId]
    return page.thumbnail?.source || null
  } catch (error) {
    console.error(`Error fetching Wikipedia for ${title}:`, error)
    return null
  }
}

function generateUIAvatar(name: string, index: number): string {
  const initials = name.split(' ')
    .filter(p => p.length > 0)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const colors = [
    { bg: '1a365d', fg: 'ffffff' },
    { bg: '2e1a4a', fg: 'ffffff' },
    { bg: '1e3a5f', fg: 'ffffff' },
    { bg: '4a1a2e', fg: 'ffffff' },
    { bg: '1a4a3d', fg: 'ffffff' },
  ]
  const color = colors[index % colors.length]

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color.bg}&color=${color.fg}&size=200&bold=true&format=png`
}

async function fetchWikipediaPhotos() {
  console.log('=== OBTENIENDO FOTOS DE WIKIPEDIA ===\n')

  // Get all candidates
  const candidates = await sql`
    SELECT id, full_name
    FROM candidates
    ORDER BY full_name
  `

  console.log(`Total candidatos: ${candidates.length}\n`)

  let found = 0
  let notFound = 0

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const name = candidate.full_name

    // Get Wikipedia title (mapped or construct from name)
    const wikiTitle = WIKIPEDIA_TITLES[name] || name.replace(/ /g, '_')

    console.log(`[${i + 1}/${candidates.length}] ${name}`)
    console.log(`  Wikipedia: ${wikiTitle}`)

    const photoUrl = await getWikipediaPhoto(wikiTitle)

    if (photoUrl) {
      // Update database with Wikipedia photo
      await sql`
        UPDATE candidates
        SET photo_url = ${photoUrl}
        WHERE id = ${candidate.id}::uuid
      `
      console.log(`  ✓ Foto encontrada`)
      found++
    } else {
      // Try English Wikipedia as fallback
      const enUrl = new URL('https://en.wikipedia.org/w/api.php')
      enUrl.searchParams.set('action', 'query')
      enUrl.searchParams.set('titles', wikiTitle)
      enUrl.searchParams.set('prop', 'pageimages')
      enUrl.searchParams.set('pithumbsize', '400')
      enUrl.searchParams.set('format', 'json')
      enUrl.searchParams.set('origin', '*')

      try {
        const enResponse = await fetch(enUrl.toString())
        const enData: WikipediaResponse = await enResponse.json()
        const enPageId = Object.keys(enData.query?.pages || {})[0]

        if (enPageId && enPageId !== '-1' && enData.query?.pages[enPageId]?.thumbnail?.source) {
          const enPhotoUrl = enData.query.pages[enPageId].thumbnail.source
          await sql`
            UPDATE candidates
            SET photo_url = ${enPhotoUrl}
            WHERE id = ${candidate.id}::uuid
          `
          console.log(`  ✓ Foto encontrada (EN Wikipedia)`)
          found++
        } else {
          // Use UI Avatar as fallback
          const avatarUrl = generateUIAvatar(name, i)
          await sql`
            UPDATE candidates
            SET photo_url = ${avatarUrl}
            WHERE id = ${candidate.id}::uuid
          `
          console.log(`  ⚠ No encontrada, usando avatar`)
          notFound++
        }
      } catch {
        const avatarUrl = generateUIAvatar(name, i)
        await sql`
          UPDATE candidates
          SET photo_url = ${avatarUrl}
          WHERE id = ${candidate.id}::uuid
        `
        console.log(`  ⚠ Error, usando avatar`)
        notFound++
      }
    }

    // Rate limiting
    await delay(DELAY_MS)
  }

  console.log('\n=== RESUMEN ===')
  console.log(`Fotos Wikipedia: ${found}`)
  console.log(`Avatares UI: ${notFound}`)
  console.log(`Total: ${candidates.length}`)
}

fetchWikipediaPhotos().catch(console.error)
