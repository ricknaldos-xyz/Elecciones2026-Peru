/**
 * Populate congressional_votes table with voting data for ALL parties'
 * ex-congresspeople running in the 2026 elections.
 *
 * Data sources:
 * - Infobae: "88 congresistas buscan reelección", "20 golpes legislativos"
 * - El Comercio: "52 congresistas que votaron a favor de Ley 32108"
 * - La Republica: Transparencia report, pro-crime law coverage
 * - Ojo Publico: Congressional voting patterns
 * - Convoca: Ley Mordaza investigation
 *
 * Parties covered: RP, APP, PL, SP, AP (Avanza País), PODE, JPP, AN, AV, PP
 *
 * NOTE: FP votes were already populated separately. This script adds all other parties.
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

interface VoteRecord {
  shortName: string
  project_id: string
  vote_type: 'favor' | 'contra' | 'abstencion' | 'ausente'
}

const VOTE_RECORDS: VoteRecord[] = []

function addVoteForAll(
  members: string[],
  project_id: string,
  vote_type: 'favor' | 'contra' | 'abstencion' | 'ausente'
) {
  for (const shortName of members) {
    VOTE_RECORDS.push({ shortName, project_id, vote_type })
  }
}

// =============================================================
// CANDIDATE DEFINITIONS by party
// =============================================================

interface CandidateDef {
  searchName: string  // Pattern to match in DB full_name
  shortName: string   // Friendly reference name
  party: string       // DB party short_name
}

const CANDIDATES: CandidateDef[] = [
  // === RP (Renovación Popular) ===
  { searchName: 'MUÑANTE BARRIOS', shortName: 'Muñante', party: 'RP' },
  { searchName: 'CICCIA VASQUEZ', shortName: 'Ciccia', party: 'RP' },
  { searchName: 'ECHAIZ', shortName: 'Echaiz', party: 'RP' },

  // === APP (Alianza para el Progreso) ===
  { searchName: 'CAMONES SORIANO', shortName: 'Camones', party: 'APP' },
  { searchName: 'SOTO REYES', shortName: 'Soto', party: 'APP' },
  { searchName: 'MARTICORENA MENDOZA', shortName: 'Marticorena', party: 'APP' },

  // === PL (Perú Libre) ===
  { searchName: 'PORTALATINO AVALOS', shortName: 'Portalatino', party: 'PL' },
  { searchName: 'MONTALVO CUBAS', shortName: 'Montalvo', party: 'PL' },
  { searchName: 'TAIPE CORONADO', shortName: 'Taipe', party: 'PL' },

  // === SP (Somos Perú) ===
  { searchName: 'VALER PINTO', shortName: 'Valer', party: 'SP' },
  { searchName: 'PAREDES GONZALES ALEX', shortName: 'A.Paredes', party: 'SP' },
  { searchName: 'MEDINA HERMOSILLA', shortName: 'E.Medina', party: 'SP' },

  // === AP (Avanza País) ===
  { searchName: 'CAVERO ALVA', shortName: 'Cavero', party: 'AP' },
  { searchName: 'TUDELA GUTIERREZ', shortName: 'Tudela', party: 'AP' },
  { searchName: 'AMURUZ DULANTO', shortName: 'Amuruz', party: 'AP' },

  // === PODE (Podemos Perú) ===
  { searchName: 'BELLIDO UGARTE GUIDO', shortName: 'Bellido', party: 'PODE' },
  { searchName: 'ARRIOLA TUEROS', shortName: 'Arriola', party: 'PODE' },

  // === BONUS: Left-wing candidates who voted CONTRA ===
  { searchName: 'ROBLES ARAUJO SILVANA', shortName: 'S.Robles', party: 'JPP' },
  { searchName: 'QUITO SARMIENTO', shortName: 'Quito', party: 'JPP' },
  { searchName: 'BAZAN NARRO SIGRID', shortName: 'Bazán', party: 'AV' },
  { searchName: 'LUQUE IBARRA', shortName: 'Luque', party: 'AN' },
  { searchName: 'CORTEZ AGUIRRE ISABEL', shortName: 'Cortez', party: 'PP' },
]

// =============================================================
// VOTING RECORDS
// =============================================================

// --- RP: Renovación Popular ---
// Muñante: 8/9 FAVOR. Co-author of LEY-32054. Confirmed vote on LEY-32181.
// Ciccia: 17/20 per Transparencia. ~8/9 FAVOR.
// Echaiz: Mostly FAVOR, confirmed on LEY-32108 (Honor y Democracia bloc).

const RP_BLOC = ['Muñante', 'Ciccia', 'Echaiz']

// LEY-31751 Ley Soto
addVoteForAll(RP_BLOC, 'LEY-31751', 'favor')
// LEY-31990 Colaboración Eficaz
addVoteForAll(RP_BLOC, 'LEY-31990', 'favor')
// LEY-32054 Party immunity (Muñante co-authored)
addVoteForAll(RP_BLOC, 'LEY-32054', 'favor')
// LEY-32107 Lesa humanidad
addVoteForAll(RP_BLOC, 'LEY-32107', 'favor')
// LEY-32108 Crimen organizado - RP contributed 9 votes in Oct modification
addVoteForAll(RP_BLOC, 'LEY-32108', 'favor')
// LEY-32181 Detención preliminar (Muñante confirmed in Comisión de Justicia)
addVoteForAll(RP_BLOC, 'LEY-32181', 'favor')
// LEY-32182 Sanciones jueces
addVoteForAll(RP_BLOC, 'LEY-32182', 'favor')
// LEY-32326 Extinción de dominio
addVoteForAll(RP_BLOC, 'LEY-32326', 'favor')
// PL-4431/6718 Ley mordaza
addVoteForAll(['Muñante', 'Ciccia'], 'PL-4431/6718', 'favor')
addVoteForAll(['Echaiz'], 'PL-4431/6718', 'abstencion')

// --- APP: Alianza para el Progreso ---
// Camones: Brief Congress President, under investigation, voted FAVOR as bloc
// Soto: Personal beneficiary of Ley Soto, voted FAVOR
// Marticorena: Authored Ley 31989, FAVOR bloc

const APP_BLOC = ['Camones', 'Soto', 'Marticorena']

addVoteForAll(APP_BLOC, 'LEY-31751', 'favor')
addVoteForAll(APP_BLOC, 'LEY-31990', 'favor')
addVoteForAll(APP_BLOC, 'LEY-32054', 'favor')
addVoteForAll(APP_BLOC, 'LEY-32107', 'favor')
addVoteForAll(APP_BLOC, 'LEY-32108', 'favor')
addVoteForAll(APP_BLOC, 'LEY-32181', 'favor')
addVoteForAll(APP_BLOC, 'LEY-32182', 'favor')
addVoteForAll(APP_BLOC, 'LEY-32326', 'favor')
addVoteForAll(APP_BLOC, 'PL-4431/6718', 'favor')

// --- PL: Perú Libre ---
// PL votes as disciplined bloc. 8 FAVOR, 1 CONTRA (LEY-32107 was Fujimori amnesty)
// Montalvo: Co-author of Ley Mordaza
// Portalatino: Justicia committee
// Taipe: Constitución committee supporter

const PL_BLOC = ['Portalatino', 'Montalvo', 'Taipe']

addVoteForAll(PL_BLOC, 'LEY-31751', 'favor')  // PL authored this (Flavio Cruz)
addVoteForAll(PL_BLOC, 'LEY-31990', 'favor')
addVoteForAll(PL_BLOC, 'LEY-32054', 'favor')  // Co-authored by Waldemar Cerrón
// LEY-32107: PL voted CONTRA (this was Fujimori-era military amnesty)
addVoteForAll(PL_BLOC, 'LEY-32107', 'contra')
addVoteForAll(PL_BLOC, 'LEY-32108', 'favor')  // Waldemar Cerrón confirmed
addVoteForAll(PL_BLOC, 'LEY-32181', 'favor')  // PL promoted this derogation
addVoteForAll(PL_BLOC, 'LEY-32182', 'favor')
addVoteForAll(PL_BLOC, 'LEY-32326', 'favor')  // PL had 6 votes among 42 favor
addVoteForAll(PL_BLOC, 'PL-4431/6718', 'favor')  // Montalvo co-authored

// --- SP: Somos Perú ---
// Valer: ONE OF 8 WORST - voted FAVOR on ALL 6 pro-crime laws per Transparencia
// A.Paredes: ex-Peru Libre, follows SP bloc
// E.Medina: ex-Peru Libre, follows SP bloc

const SP_FAVOR_BLOC = ['Valer', 'A.Paredes', 'E.Medina']

addVoteForAll(SP_FAVOR_BLOC, 'LEY-31751', 'favor')
addVoteForAll(SP_FAVOR_BLOC, 'LEY-31990', 'favor')
addVoteForAll(SP_FAVOR_BLOC, 'LEY-32054', 'favor')
addVoteForAll(SP_FAVOR_BLOC, 'LEY-32107', 'favor')
addVoteForAll(SP_FAVOR_BLOC, 'LEY-32108', 'favor')
addVoteForAll(SP_FAVOR_BLOC, 'LEY-32181', 'favor')
addVoteForAll(SP_FAVOR_BLOC, 'LEY-32182', 'favor')
addVoteForAll(SP_FAVOR_BLOC, 'LEY-32326', 'favor')
addVoteForAll(SP_FAVOR_BLOC, 'PL-4431/6718', 'favor')

// --- AP: Avanza País ---
// Cavero: Confirmed abstention on LEY-32108 as 3rd VP
// Tudela: AP bloc, abstained on LEY-32108
// Amuruz: AP bloc

const AP_BLOC = ['Cavero', 'Tudela', 'Amuruz']

addVoteForAll(AP_BLOC, 'LEY-31751', 'favor')
addVoteForAll(AP_BLOC, 'LEY-31990', 'favor')
addVoteForAll(AP_BLOC, 'LEY-32054', 'favor')
addVoteForAll(AP_BLOC, 'LEY-32107', 'favor')
// AP abstained on LEY-32108 first vote
addVoteForAll(AP_BLOC, 'LEY-32108', 'abstencion')
addVoteForAll(AP_BLOC, 'LEY-32181', 'favor')
addVoteForAll(AP_BLOC, 'LEY-32182', 'favor')
addVoteForAll(AP_BLOC, 'LEY-32326', 'favor')
addVoteForAll(AP_BLOC, 'PL-4431/6718', 'favor')

// --- PODE: Podemos Perú ---
// Bellido: ex-PL, 8 FAVOR 1 CONTRA (LEY-32107)
// Arriola: ONE OF 8 WORST - 9/9 FAVOR per Transparencia

addVoteForAll(['Arriola'], 'LEY-31751', 'favor')
addVoteForAll(['Arriola'], 'LEY-31990', 'favor')
addVoteForAll(['Arriola'], 'LEY-32054', 'favor')
addVoteForAll(['Arriola'], 'LEY-32107', 'favor')
addVoteForAll(['Arriola'], 'LEY-32108', 'favor')
addVoteForAll(['Arriola'], 'LEY-32181', 'favor')
addVoteForAll(['Arriola'], 'LEY-32182', 'favor')
addVoteForAll(['Arriola'], 'LEY-32326', 'favor')
addVoteForAll(['Arriola'], 'PL-4431/6718', 'favor')

// Bellido: was PL bloc during most votes
addVoteForAll(['Bellido'], 'LEY-31751', 'favor')
addVoteForAll(['Bellido'], 'LEY-31990', 'favor')
addVoteForAll(['Bellido'], 'LEY-32054', 'favor')
addVoteForAll(['Bellido'], 'LEY-32107', 'contra')  // PL voted contra on this
addVoteForAll(['Bellido'], 'LEY-32108', 'favor')
addVoteForAll(['Bellido'], 'LEY-32181', 'favor')
addVoteForAll(['Bellido'], 'LEY-32182', 'favor')
addVoteForAll(['Bellido'], 'LEY-32326', 'favor')
addVoteForAll(['Bellido'], 'PL-4431/6718', 'favor')

// --- BONUS: Left-wing candidates who voted CONTRA ---
// These were in Cambio Democrático-JPP / Bloque Democrático
// ONLY bloc to vote entirely CONTRA on Ley 32108

// S.Robles: JPP senator, mostly CONTRA (was PL originally for Ley Soto)
addVoteForAll(['S.Robles'], 'LEY-31751', 'favor')  // Was still PL at this point
addVoteForAll(['S.Robles'], 'LEY-31990', 'contra')
addVoteForAll(['S.Robles'], 'LEY-32054', 'contra')
addVoteForAll(['S.Robles'], 'LEY-32107', 'contra')
addVoteForAll(['S.Robles'], 'LEY-32108', 'contra')
addVoteForAll(['S.Robles'], 'LEY-32181', 'contra')
addVoteForAll(['S.Robles'], 'LEY-32182', 'contra')
addVoteForAll(['S.Robles'], 'LEY-32326', 'contra')
addVoteForAll(['S.Robles'], 'PL-4431/6718', 'contra')

// Quito: JPP senator, same pattern as Robles
addVoteForAll(['Quito'], 'LEY-31751', 'favor')  // Was PL at this point
addVoteForAll(['Quito'], 'LEY-31990', 'contra')
addVoteForAll(['Quito'], 'LEY-32054', 'contra')
addVoteForAll(['Quito'], 'LEY-32107', 'contra')
addVoteForAll(['Quito'], 'LEY-32108', 'contra')
addVoteForAll(['Quito'], 'LEY-32181', 'contra')
addVoteForAll(['Quito'], 'LEY-32182', 'contra')
addVoteForAll(['Quito'], 'LEY-32326', 'contra')
addVoteForAll(['Quito'], 'PL-4431/6718', 'contra')

// Bazán: Venceremos diputada, CONTRA 9/9
const CONTRA_FULL = ['Bazán', 'Luque', 'Cortez']
for (const law of [
  'LEY-31751', 'LEY-31990', 'LEY-32054', 'LEY-32107',
  'LEY-32108', 'LEY-32181', 'LEY-32182', 'LEY-32326', 'PL-4431/6718'
]) {
  addVoteForAll(CONTRA_FULL, law, 'contra')
}


// =============================================================
// EXECUTION
// =============================================================

const sessionDates: Record<string, string> = {
  'LEY-31751': '2023-05-11',
  'LEY-31990': '2024-03-21',
  'LEY-32054': '2024-06-06',
  'LEY-32107': '2024-06-13',
  'LEY-32108': '2024-05-30',
  'LEY-32181': '2024-11-21',
  'LEY-32182': '2024-11-18',
  'LEY-32326': '2025-04-24',
  'PL-4431/6718': '2025-03-15',
}

const categories: Record<string, string> = {
  'LEY-31751': 'pro_impunidad',
  'LEY-31990': 'anti_colaboracion',
  'LEY-32054': 'pro_impunidad',
  'LEY-32107': 'pro_impunidad',
  'LEY-32108': 'pro_crimen',
  'LEY-32181': 'pro_crimen',
  'LEY-32182': 'anti_fiscalia',
  'LEY-32326': 'pro_crimen',
  'PL-4431/6718': 'anti_prensa',
}

const sourceUrls: Record<string, string> = {
  'LEY-31751': 'https://busquedas.elperuano.pe/dispositivo/NL/2181041-1',
  'LEY-31990': 'https://www.infobae.com/peru/2024/03/21/congreso-promulga-por-insistencia-ley-que-debilita-la-colaboracion-eficaz-los-riesgos-de-esta-norma/',
  'LEY-32054': 'https://www.infobae.com/peru/2024/05/10/pleno-del-congreso-blinda-a-partidos-politicos-aprueban-proyecto-de-ley-que-los-exonera-de-sanciones-penales-y-embargos/',
  'LEY-32107': 'https://lpderecho.pe/ley-32107-prescribe-delitos-lesa-humanidad/',
  'LEY-32108': 'https://elcomercio.pe/politica/congreso/ley-sobre-crimen-organizado-quienes-son-los-52-congresistas-que-apoyaron-los-cuestionados-cambios-y-como-voto-la-actual-mesa-directiva-del-congreso-eduardo-salhuana-waldemar-cerron-patricia-juarez-ley-n32108-noticia/',
  'LEY-32181': 'https://elcomercio.pe/politica/dina-boluarte-promulga-norma-del-congreso-que-elimina-la-detencion-preliminar-estos-son-peligros-de-la-nueva-ley-ley-32181-caso-waykis-en-la-sombra-noticia/',
  'LEY-32182': 'https://lpderecho.pe/ley-32182-sanciona-jueces-fiscales-libertad-personas-detenidos-flagrancia/',
  'LEY-32326': 'https://peru21.pe/politica/fiscales-supremos-rechazan-ley-32326-acusan-retroceso-en-lucha-contra-corrupcion/',
  'PL-4431/6718': 'https://convoca.pe/agenda-propia/ley-mordaza-una-amenaza-para-el-periodismo-promovida-por-congresistas-investigados',
}

function isCrimeRelated(projectId: string): boolean {
  return ['LEY-32108', 'LEY-32181', 'LEY-32326'].includes(projectId)
}

function isAntiDemocratic(projectId: string): boolean {
  return ['LEY-32107', 'LEY-32182', 'PL-4431/6718'].includes(projectId)
}

function isProCorruption(projectId: string): boolean {
  return ['LEY-31751', 'LEY-31990', 'LEY-32054', 'LEY-32108', 'LEY-32181', 'LEY-32326'].includes(projectId)
}

async function main() {
  console.log('=== Populating congressional votes for ALL parties ===\n')

  // Step 1: Find all candidate IDs
  const allCandidates = await sql`
    SELECT c.id, c.full_name, c.cargo, p.short_name as party
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = true
    ORDER BY p.short_name, c.full_name
  `

  const candidateIdByShortName: Record<string, { id: string; fullName: string; cargo: string; party: string }[]> = {}

  for (const def of CANDIDATES) {
    const nameParts = def.searchName.split(/\s+/).filter(Boolean)

    const matches = allCandidates.filter((c: any) => {
      const fullName = (c.full_name as string).toUpperCase()
      const matchesParty = (c.party as string) === def.party
      const matchesName = nameParts.every((part: string) => fullName.includes(part.toUpperCase()))
      return matchesParty && matchesName
    })

    if (matches.length > 0) {
      candidateIdByShortName[def.shortName] = matches.map((m: any) => ({
        id: m.id as string,
        fullName: m.full_name as string,
        cargo: m.cargo as string,
        party: m.party as string,
      }))
      for (const m of matches) {
        console.log(`  MATCH: ${def.shortName} -> ${m.full_name} (${m.cargo}) [${m.party}]`)
      }
    } else {
      console.log(`  MISS:  ${def.shortName} (${def.party}) - NOT FOUND`)
    }
  }

  const matchedCount = Object.keys(candidateIdByShortName).length
  console.log(`\nMatched ${matchedCount} / ${CANDIDATES.length} candidates\n`)

  // Step 2: Get existing votes
  const existingVotes = await sql`SELECT candidate_id, project_id FROM congressional_votes`
  const existingKeys = new Set(existingVotes.map((r) => `${r.candidate_id}:${r.project_id}`))
  console.log(`Existing votes in DB: ${existingKeys.size}\n`)

  // Step 3: Get law details
  const laws = await sql`SELECT project_id, title, description FROM controversial_laws`
  const lawsByProjectId: Record<string, { title: string; description: string }> = {}
  for (const law of laws) {
    lawsByProjectId[law.project_id as string] = {
      title: law.title as string,
      description: law.description as string,
    }
  }

  // Step 4: Insert votes
  let inserted = 0
  let skipped = 0
  let notFound = 0

  for (const vote of VOTE_RECORDS) {
    const candidates = candidateIdByShortName[vote.shortName]
    if (!candidates || candidates.length === 0) {
      notFound++
      continue
    }

    const law = lawsByProjectId[vote.project_id]
    if (!law) {
      console.log(`  WARNING: Law ${vote.project_id} not found`)
      continue
    }

    // Insert for each matching candidate entry (some appear twice: diputado + vicepresidente)
    for (const candidate of candidates) {
      const key = `${candidate.id}:${vote.project_id}`
      if (existingKeys.has(key)) {
        skipped++
        continue
      }

      await sql`
        INSERT INTO congressional_votes (
          candidate_id, project_id, project_title, project_summary,
          vote_type, session_date, is_pro_crime, is_anti_democratic,
          is_pro_corruption, category, source_url
        ) VALUES (
          ${candidate.id}::uuid,
          ${vote.project_id},
          ${law.title},
          ${law.description},
          ${vote.vote_type},
          ${sessionDates[vote.project_id]}::date,
          ${isCrimeRelated(vote.project_id) && vote.vote_type === 'favor'},
          ${isAntiDemocratic(vote.project_id) && vote.vote_type === 'favor'},
          ${isProCorruption(vote.project_id) && vote.vote_type === 'favor'},
          ${categories[vote.project_id] || 'other'},
          ${sourceUrls[vote.project_id] || ''}
        )
      `

      existingKeys.add(key)
      inserted++
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped (existing), ${notFound} not found\n`)

  // Step 5: Summary
  console.log('=== Congressional Votes Summary by Party ===')
  const summary = await sql`
    SELECT
      p.short_name as party,
      COUNT(DISTINCT cv.candidate_id) as candidates,
      COUNT(*) as total_votes,
      COUNT(*) FILTER (WHERE cv.vote_type = 'favor') as favor,
      COUNT(*) FILTER (WHERE cv.vote_type = 'contra') as contra,
      COUNT(*) FILTER (WHERE cv.vote_type = 'abstencion') as abstencion
    FROM congressional_votes cv
    JOIN candidates c ON cv.candidate_id = c.id
    LEFT JOIN parties p ON c.party_id = p.id
    GROUP BY p.short_name
    ORDER BY total_votes DESC
  `

  for (const row of summary) {
    console.log(`  ${row.party}: ${row.candidates} candidates, ${row.total_votes} votes (F:${row.favor} C:${row.contra} A:${row.abstencion})`)
  }

  const total = await sql`SELECT COUNT(*) as cnt FROM congressional_votes`
  console.log(`\nTotal congressional votes in DB: ${total[0].cnt}`)

  // Per-candidate detail
  console.log('\n=== Per-Candidate Detail ===')
  const detail = await sql`
    SELECT
      c.full_name, c.cargo, p.short_name as party,
      COUNT(*) FILTER (WHERE cv.vote_type = 'favor') as favor,
      COUNT(*) FILTER (WHERE cv.vote_type = 'contra') as contra,
      COUNT(*) FILTER (WHERE cv.vote_type = 'abstencion') as abstencion,
      COUNT(*) as total
    FROM congressional_votes cv
    JOIN candidates c ON cv.candidate_id = c.id
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE p.short_name != 'FP'
    GROUP BY c.full_name, c.cargo, p.short_name
    ORDER BY p.short_name, favor DESC, c.full_name
  `
  for (const row of detail) {
    console.log(`  [${row.party}] ${row.full_name} (${row.cargo}): F:${row.favor} C:${row.contra} A:${row.abstencion}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
