/**
 * Update plan de gobierno URLs and local PDFs in database
 * Uses exact candidate-to-party mapping from JNE API
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Exact mapping: JNE candidate name -> party name from API
const CANDIDATE_PARTY_MAP: Record<string, { party: string; orgId: number }> = {
  'FERNANDEZ BAZAN ROSARIO DEL PILAR': { party: 'UN CAMINO DIFERENTE', orgId: 2998 },
  'FORSYTH SOMMER GEORGE PATRICK': { party: 'PARTIDO DEMOCRATICO SOMOS PERU', orgId: 14 },
  'SANCHEZ PALOMINO ROBERTO HELBERT': { party: 'JUNTOS POR EL PERU', orgId: 1264 },
  'VALDERRAMA PEÑA PITTER ENRIQUE': { party: 'PARTIDO APRISTA PERUANO', orgId: 2930 },
  'PAZ DE LA BARRA FREIGEIRO ALVARO GONZALO': { party: 'FE EN EL PERU', orgId: 2898 },
  'BELMONT CASSINELLI RICARDO PABLO': { party: 'PARTIDO CIVICO OBRAS', orgId: 2941 },
  'ATENCIO SOTOMAYOR RONALD DARWIN': { party: 'ALIANZA ELECTORAL VENCEREMOS', orgId: 3025 },
  'LOPEZ ALIAGA CAZORLA RAFAEL BERNARDO': { party: 'RENOVACION POPULAR', orgId: 22 },
  'ACUÑA PERALTA CESAR': { party: 'ALIANZA PARA EL PROGRESO', orgId: 1257 },
  'FUJIMORI HIGUCHI KEIKO SOFIA': { party: 'FUERZA POPULAR', orgId: 1366 },
  'BECERRA GARCIA NAPOLEON': { party: 'PARTIDO DE LOS TRABAJADORES Y EMPRENDEDORES PTE - PERU', orgId: 2939 },
  'ESPA Y GARCES-ALVEAR ALFONSO CARLOS': { party: 'PARTIDO SICREO', orgId: 2935 },
  'DIEZ-CANSECO TÁVARA FRANCISCO ERNESTO': { party: 'PARTIDO POLITICO PERU ACCION', orgId: 2932 },
  'VIZCARRA CORNEJO MARIO ENRIQUE': { party: 'PARTIDO POLITICO PERU PRIMERO', orgId: 2925 },
  'JAICO CARRANZA CARLOS ERNESTO': { party: 'PERU MODERNO', orgId: 2924 },
  'LUNA GALVEZ JOSE LEON': { party: 'PODEMOS PERU', orgId: 2731 },
  'CARRASCO SALAZAR CHARLIE': { party: 'PARTIDO DEMOCRATA UNIDO PERU', orgId: 2867 },
  'GONZALES CASTILLO ALEX': { party: 'PARTIDO DEMOCRATA VERDE', orgId: 2895 },
  'CALLER GUTIERREZ HERBERT': { party: 'PARTIDO PATRIOTICO DEL PERU', orgId: 2869 },
  'GROZO COSTA WOLFGANG MARIO': { party: 'PARTIDO POLITICO INTEGRIDAD DEMOCRATICA', orgId: 2985 },
  'LOPEZ CHAU NAVA PABLO ALFONSO': { party: 'AHORA NACION - AN', orgId: 2980 },
  'MASSE FERNANDEZ ARMANDO JOAQUIN': { party: 'PARTIDO DEMOCRATICO FEDERAL', orgId: 2986 },
  'LESCANO ANCIETA YONHY': { party: 'PARTIDO POLITICO COOPERACION POPULAR', orgId: 2995 },
  'MOLINELLI ARISTONDO FIORELLA GIANNINA': { party: 'FUERZA Y LIBERTAD', orgId: 3024 },
  'CHIABRA LEON ROBERTO ENRIQUE': { party: 'UNIDAD NACIONAL', orgId: 3023 },
  'GUEVARA AMASIFUEN MESIAS ANTONIO': { party: 'PARTIDO MORADO', orgId: 2840 },
  'OLIVERA VEGA LUIS FERNANDO': { party: 'PARTIDO FRENTE DE LA ESPERANZA 2021', orgId: 2857 },
  'WILLIAMS ZAPATA JOSE DANIEL': { party: 'AVANZA PAIS - PARTIDO DE INTEGRACION SOCIAL', orgId: 2173 },
  'CERRON ROJAS VLADIMIR ROY': { party: 'PARTIDO POLITICO NACIONAL PERU LIBRE', orgId: 2218 },
  'BELAUNDE LLOSA RAFAEL JORGE': { party: 'LIBERTAD POPULAR', orgId: 2933 },
  'PEREZ TELLO DE RODRIGUEZ MARIA SOLEDAD': { party: 'PRIMERO LA GENTE - COMUNIDAD, ECOLOGIA, LIBERTAD Y PROGRESO', orgId: 2931 },
  'ORTIZ VILLANO ANTONIO': { party: 'SALVEMOS AL PERU', orgId: 2927 },
  'NIETO MONTESINOS JORGE': { party: 'PARTIDO DEL BUEN GOBIERNO', orgId: 2961 },
  'ALVAREZ LOAYZA CARLOS GONSALO': { party: 'PARTIDO PAIS PARA TODOS', orgId: 2956 },
  'JAIMES BLANCO PAUL DAVIS': { party: 'PROGRESEMOS', orgId: 2967 },
  'CHIRINOS PURIZAGA WALTER GILMER': { party: 'PARTIDO POLITICO PRIN', orgId: 2921 },
}

interface PlanData {
  party: string
  orgId: number
  urlPlanCompleto: string | null
  urlResumen: string | null
  pesoArchivo: number
}

async function main() {
  console.log('='.repeat(70))
  console.log(' ACTUALIZANDO PLANES DE GOBIERNO EN BASE DE DATOS')
  console.log('='.repeat(70))

  // Load plans data
  const plansData: PlanData[] = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'planes-gobierno-2026.json'), 'utf-8')
  )

  // Create orgId -> plan mapping
  const planByOrgId = new Map<number, PlanData>()
  for (const plan of plansData) {
    planByOrgId.set(plan.orgId, plan)
  }

  let updated = 0
  let noplan = 0
  let notfound = 0

  for (const [jneName, info] of Object.entries(CANDIDATE_PARTY_MAP)) {
    const plan = planByOrgId.get(info.orgId)
    const partySlug = slugify(info.party)
    const localPdfPath = `/planes/${partySlug}.pdf`
    const fullPdfPath = path.join(process.cwd(), 'public', localPdfPath)

    // Find candidate in DB by name parts
    const nameParts = jneName.split(' ')
    const apellido1 = nameParts[0]
    const apellido2 = nameParts.length > 2 ? nameParts[1] : ''

    const candidates = await sql`
      SELECT id, full_name FROM candidates
      WHERE cargo = 'presidente'
      AND full_name ILIKE ${`%${apellido1}%`}
      AND full_name ILIKE ${`%${apellido2}%`}
      AND is_active = true
      LIMIT 1
    `

    if (candidates.length === 0) {
      console.log(`  [??] No encontrado: ${jneName}`)
      notfound++
      continue
    }

    const candidate = candidates[0]

    if (!plan || !plan.urlPlanCompleto) {
      console.log(`  [--] ${candidate.full_name}: Sin plan en JNE`)
      await sql`
        UPDATE candidates SET
          plan_gobierno_url = NULL,
          plan_pdf_local = NULL,
          last_updated = NOW()
        WHERE id = ${candidate.id}
      `
      noplan++
      continue
    }

    // Check if PDF exists locally
    const pdfExists = fs.existsSync(fullPdfPath)
    const pdfSize = pdfExists ? Math.round(fs.statSync(fullPdfPath).size / 1024) : 0

    await sql`
      UPDATE candidates SET
        plan_gobierno_url = ${plan.urlPlanCompleto},
        plan_pdf_local = ${pdfExists ? localPdfPath : null},
        last_updated = NOW()
      WHERE id = ${candidate.id}
    `

    const status = pdfExists ? `${pdfSize}KB` : 'sin PDF local'
    console.log(`  [OK] ${candidate.full_name} -> ${partySlug}.pdf (${status})`)
    updated++
  }

  // Verify
  console.log('\n' + '='.repeat(70))
  console.log(' VERIFICACION')
  console.log('='.repeat(70))

  const allCandidates = await sql`
    SELECT full_name, plan_gobierno_url, plan_pdf_local
    FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
    ORDER BY full_name
  `

  let withPlan = 0
  let withLocal = 0
  for (const c of allCandidates) {
    const hasUrl = !!c.plan_gobierno_url
    const hasLocal = !!c.plan_pdf_local
    if (hasUrl) withPlan++
    if (hasLocal) withLocal++
    if (!hasUrl) {
      console.log(`  Sin plan: ${c.full_name}`)
    }
  }

  console.log(`\n  Total: ${allCandidates.length}`)
  console.log(`  Con URL: ${withPlan}`)
  console.log(`  Con PDF local: ${withLocal}`)
  console.log(`  Actualizados: ${updated}`)
  console.log(`  Sin plan: ${noplan}`)
  console.log(`  No encontrados: ${notfound}`)
}

main().catch(console.error)
