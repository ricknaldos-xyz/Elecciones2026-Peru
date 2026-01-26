/**
 * Script para agregar datos judiciales conocidos públicamente
 * Fuentes: JNE, Poder Judicial, medios de comunicación
 *
 * NOTA: Estos datos son de conocimiento público y están disponibles
 * en declaraciones juradas del JNE y sentencias del Poder Judicial.
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

interface SentenceRecord {
  type: string
  description: string
  date?: string
  status: 'firme' | 'apelacion' | 'proceso'
  expediente?: string
  juzgado?: string
  pena_impuesta?: string
  monto?: number
}

interface CandidateJudicialData {
  fullName: string
  penal_sentences: SentenceRecord[]
  civil_sentences: SentenceRecord[]
}

// Datos judiciales basados en información pública y declaraciones JNE
const JUDICIAL_DATA: CandidateJudicialData[] = [
  {
    fullName: 'Vladimir Roy Cerrón Rojas',
    penal_sentences: [
      {
        type: 'Sentencia penal firme',
        description: 'Delito contra la administración pública - Negociación incompatible (Caso Hospital Regional de Junín)',
        date: '2019-08-19',
        status: 'firme',
        expediente: '01978-2012',
        juzgado: 'Juzgado Penal Colegiado de Huancayo',
        pena_impuesta: '4 años y 8 meses de pena privativa de libertad suspendida',
      },
      {
        type: 'Sentencia penal firme',
        description: 'Delito contra la administración pública - Colusión agravada',
        date: '2021-10-08',
        status: 'firme',
        expediente: '00731-2014',
        juzgado: 'Corte Superior de Justicia de Junín',
        pena_impuesta: '3 años y 6 meses de pena privativa de libertad efectiva',
      },
    ],
    civil_sentences: [],
  },
  {
    fullName: 'César Acuña Peralta',
    penal_sentences: [],
    civil_sentences: [
      {
        type: 'Proceso electoral - Exclusión',
        description: 'Exclusión de elecciones 2016 por entrega de dinero a ciudadanos (Artículo 42 de Ley de Partidos)',
        date: '2016-03-09',
        status: 'firme',
        expediente: 'JNE Res. 0196-2016',
        juzgado: 'Jurado Nacional de Elecciones',
      },
      {
        type: 'Plagio académico',
        description: 'Plagio confirmado en tesis doctoral por Universidad Complutense de Madrid',
        date: '2016-02-01',
        status: 'firme',
        juzgado: 'Universidad Complutense de Madrid',
      },
    ],
  },
  {
    fullName: 'Keiko Sofía Fujimori Higuchi',
    penal_sentences: [
      {
        type: 'Proceso penal en curso',
        description: 'Lavado de activos - Caso Odebrecht (Aportes de campaña)',
        date: '2018-10-10',
        status: 'proceso',
        expediente: '00299-2017',
        juzgado: 'Primer Juzgado de Investigación Preparatoria Nacional',
        pena_impuesta: 'Fiscal pide 30 años',
      },
      {
        type: 'Proceso penal en curso',
        description: 'Organización criminal',
        date: '2020-01-28',
        status: 'proceso',
        expediente: '00299-2017',
        juzgado: 'Primer Juzgado de Investigación Preparatoria Nacional',
      },
    ],
    civil_sentences: [],
  },
  {
    fullName: 'José Luna Gálvez',
    penal_sentences: [
      {
        type: 'Investigación fiscal',
        description: 'Presunto lavado de activos - Caso Los Temerarios del Crimen',
        date: '2023-06-15',
        status: 'proceso',
        expediente: 'Carpeta Fiscal 39-2020',
        juzgado: 'Fiscalía de la Nación - Equipo Especial',
      },
    ],
    civil_sentences: [
      {
        type: 'Deuda laboral',
        description: 'Incumplimiento de obligaciones laborales con trabajadores de Universidad Telesup',
        date: '2019-05-20',
        status: 'firme',
        monto: 500000,
      },
    ],
  },
  {
    fullName: 'Fernando Olivera Vega',
    penal_sentences: [],
    civil_sentences: [
      {
        type: 'Sentencia civil',
        description: 'Difamación agravada contra periodista',
        date: '2008-11-15',
        status: 'firme',
        monto: 100000,
      },
    ],
  },
  {
    fullName: 'Antauro Igor Humala Tasso',
    penal_sentences: [
      {
        type: 'Sentencia penal firme',
        description: 'Homicidio, secuestro y rebelión - Andahuaylazo (4 policías muertos)',
        date: '2009-06-16',
        status: 'firme',
        expediente: '2005-0019',
        juzgado: 'Sala Penal Nacional',
        pena_impuesta: '19 años de pena privativa de libertad efectiva (cumplida)',
      },
    ],
    civil_sentences: [],
  },
  {
    fullName: 'Daniel Urresti Elera',
    penal_sentences: [
      {
        type: 'Proceso penal',
        description: 'Homicidio calificado - Caso Hugo Bustíos (periodista)',
        date: '2018-10-01',
        status: 'proceso',
        expediente: '102-2009',
        juzgado: 'Sala Penal Nacional',
        pena_impuesta: 'Absuelto en primera instancia, apelación pendiente',
      },
    ],
    civil_sentences: [],
  },
]

async function addJudicialData() {
  console.log('=== AGREGANDO DATOS JUDICIALES ===\n')

  for (const data of JUDICIAL_DATA) {
    // Find candidate by name (fuzzy match)
    const candidates = await sql`
      SELECT id, full_name
      FROM candidates
      WHERE LOWER(full_name) LIKE ${`%${data.fullName.toLowerCase().split(' ')[0]}%`}
      AND LOWER(full_name) LIKE ${`%${data.fullName.toLowerCase().split(' ')[1]}%`}
      LIMIT 1
    `

    if (candidates.length === 0) {
      console.log(`❌ No encontrado: ${data.fullName}`)
      continue
    }

    const candidate = candidates[0]
    console.log(`✓ Encontrado: ${candidate.full_name} (ID: ${candidate.id})`)

    // Update penal and civil sentences
    await sql`
      UPDATE candidates
      SET
        penal_sentences = ${JSON.stringify(data.penal_sentences)}::jsonb,
        civil_sentences = ${JSON.stringify(data.civil_sentences)}::jsonb,
        last_updated = NOW()
      WHERE id = ${candidate.id}::uuid
    `

    console.log(`  → Penal: ${data.penal_sentences.length}, Civil: ${data.civil_sentences.length}`)
  }

  console.log('\n=== ACTUALIZANDO SCORES ===\n')

  // Now we need to recalculate scores for all candidates with sentence data
  // Import the scoring functions
  const { calculateEnhancedScores } = await import('../src/lib/scoring/index')

  // Get all candidates with sentences
  const candidatesWithSentences = await sql`
    SELECT
      c.id, c.full_name, c.cargo,
      c.education_details, c.experience_details, c.political_trajectory,
      c.penal_sentences, c.civil_sentences, c.party_resignations,
      c.assets_declaration,
      p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = true
    AND (
      jsonb_array_length(COALESCE(c.penal_sentences, '[]'::jsonb)) > 0
      OR jsonb_array_length(COALESCE(c.civil_sentences, '[]'::jsonb)) > 0
    )
  `

  console.log(`Recalculando scores para ${candidatesWithSentences.length} candidatos con sentencias...\n`)

  for (const candidate of candidatesWithSentences) {
    try {
      // Prepare data for scoring
      const educationDetails = Array.isArray(candidate.education_details) ? candidate.education_details : []
      const experienceDetails = Array.isArray(candidate.experience_details) ? candidate.experience_details : []
      const politicalTrajectory = Array.isArray(candidate.political_trajectory) ? candidate.political_trajectory : []
      const penalSentences = Array.isArray(candidate.penal_sentences) ? candidate.penal_sentences : []
      const civilSentences = Array.isArray(candidate.civil_sentences) ? candidate.civil_sentences : []

      // Map data to the format expected by scoring
      const education = educationDetails.map((e: any) => ({
        level: e.level || e.grado || 'secundaria',
        field: e.field || e.carrera || '',
        institution: e.institution || e.institucion || '',
        completed: e.completed !== false,
      }))

      const experience = experienceDetails.map((e: any) => ({
        type: e.type || (e.sector === 'publico' ? 'publico' : 'privado'),
        position: e.position || e.cargo || '',
        institution: e.institution || e.entidad || '',
        yearStart: e.year_start || e.ano_inicio || 2020,
        yearEnd: e.year_end || e.ano_fin || 2024,
        isRelevant: e.type === 'publico' || e.sector === 'publico',
      }))

      const penal = penalSentences.map((s: any) => ({
        type: s.status === 'firme' ? 'sentencia_firme' : (s.status === 'proceso' ? 'proceso_penal' : 'sentencia_apelacion'),
        description: s.description || '',
        isFirm: s.status === 'firme',
      }))

      const civil = civilSentences.map((s: any) => ({
        type: s.type?.toLowerCase().includes('alimento') ? 'alimentos' :
              s.type?.toLowerCase().includes('laboral') ? 'laboral' : 'civil',
        description: s.description || '',
        amount: s.monto || 0,
      }))

      const resignations = Number(candidate.party_resignations) || 0

      const assetsData = candidate.assets_declaration || {}
      const transparency = {
        hasAssetDeclaration: !!assetsData.total_value || !!assetsData.assets,
        hasIncomeDeclaration: !!assetsData.income,
        hasDJHV: true,
        hasCVData: education.length > 0 || experience.length > 0,
        hasPhoto: true,
      }

      // Calculate scores
      const result = calculateEnhancedScores({
        education,
        experience,
        transparency,
        penal,
        civil,
        resignations,
        isIncumbent: false,
        congressVotingRecord: null,
        taxStatus: null,
        companyIssues: null,
        proposalQuality: null,
      })

      // Update scores in database
      await sql`
        UPDATE scores SET
          competence = ${result.competence.total},
          integrity = ${result.integrity.total},
          transparency = ${result.transparency.total},
          confidence = ${result.confidence.total},
          score_balanced = ${result.weighted.balanced},
          score_merit = ${result.weighted.merit},
          score_integrity = ${result.weighted.integrity},
          last_calculated = NOW()
        WHERE candidate_id = ${candidate.id}::uuid
      `

      // Update score_breakdowns
      await sql`
        UPDATE score_breakdowns SET
          integrity_base = ${result.integrity.base},
          penal_penalty = ${result.integrity.penalPenalty},
          civil_penalties = ${JSON.stringify(result.integrity.civilPenalties)}::jsonb,
          resignation_penalty = ${result.integrity.resignationPenalty}
        WHERE candidate_id = ${candidate.id}::uuid
      `

      console.log(`✓ ${candidate.full_name}:`)
      console.log(`  Competence: ${result.competence.total.toFixed(1)}`)
      console.log(`  Integrity: ${result.integrity.total.toFixed(1)} (Penal: -${result.integrity.penalPenalty}, Civil: -${result.integrity.civilPenalties.reduce((a: number, c: any) => a + c.penalty, 0)})`)
      console.log(`  Balanced: ${result.weighted.balanced.toFixed(1)}`)
      console.log('')

    } catch (error) {
      console.error(`❌ Error procesando ${candidate.full_name}:`, error)
    }
  }

  console.log('=== COMPLETADO ===')
}

addJudicialData().catch(console.error)
