import type * as cheerio from 'cheerio'

type CheerioAPI = cheerio.CheerioAPI
type CheerioSelection = ReturnType<CheerioAPI>

// Enhanced sentence types for detailed judicial information
export interface JNEPenalSentence {
  expediente?: string        // Case number
  juzgado?: string           // Court name
  delito: string             // Specific crime
  fecha_sentencia?: string   // Sentence date
  pena_impuesta?: string     // Imposed penalty
  tipo_pena?: 'efectiva' | 'suspendida' | 'reserva_fallo'
  estado: 'firme' | 'apelacion' | 'proceso'
  rehabilitado?: boolean
  modalidad?: string         // Crime modality (tentativa, consumado, etc)
}

export interface JNECivilSentence {
  tipo: 'violencia_familiar' | 'alimentos' | 'laboral' | 'contractual'
  expediente?: string
  juzgado?: string
  descripcion: string
  fecha_sentencia?: string
  monto?: number             // Amount owed
  estado: 'firme' | 'apelacion' | 'proceso'
  demandante?: string        // Plaintiff (may be redacted)
}

export interface JNEPartyResignation {
  partido: string
  fecha_afiliacion?: string
  fecha_renuncia?: string
  tipo_afiliacion?: 'militante' | 'adherente' | 'simpatizante'
  motivo?: string            // Reason for resignation
}

export interface JNECandidateData {
  jne_id: string
  dni: string
  full_name: string
  first_name: string
  paternal_surname: string
  maternal_surname: string
  birth_date?: string
  cargo: 'Presidente' | 'Vicepresidente' | 'Congresista' | 'Parlamento Andino'
  region?: string
  party_name: string
  party_short_name?: string
  photo_url?: string
  education?: Array<{
    level: string
    institution: string
    degree: string
    year?: number
  }>
  experience?: Array<{
    organization: string
    position: string
    start_year?: number
    end_year?: number
  }>
  political_trajectory?: Array<{
    party: string
    position: string
    start_year?: number
    end_year?: number
  }>
  assets?: {
    properties: number
    vehicles: number
    savings: number
    total: number
  }
  // Legacy simple sentences (for backwards compatibility)
  declared_sentences?: Array<{
    type: 'penal' | 'civil'
    description: string
    date: string
  }>
  // Enhanced detailed sentence information
  penal_sentences_detail?: JNEPenalSentence[]
  civil_sentences_detail?: JNECivilSentence[]
  party_resignations_detail?: JNEPartyResignation[]
  // Inscription status
  inscription_status?: 'inscrito' | 'tachado' | 'excluido' | 'pendiente'
  tacha_reason?: string
  // Declaration completeness flags
  has_declared_sentences?: boolean
  has_declared_assets?: boolean
  djhv_url?: string // URL to Declaración Jurada de Hoja de Vida
}

/**
 * Parses a candidate element from JNE HTML or JSON data
 */
export function parseJNECandidate(
  $: CheerioAPI | null,
  element: CheerioSelection | Record<string, unknown>
): JNECandidateData | null {
  try {
    // If it's a JSON object (from API)
    if (!$ || typeof element === 'object' && !('cheerio' in element)) {
      return parseJSONCandidate(element as Record<string, unknown>)
    }

    // Parse from HTML element using Cheerio
    const $el = element as CheerioSelection

    const jneId =
      $el.attr('data-id') ||
      $el.find('[data-candidato-id]').attr('data-candidato-id') ||
      ''

    const dni =
      $el.attr('data-dni') ||
      $el.find('.dni, [data-dni]').text().trim() ||
      ''

    // Parse name - try different selectors
    let fullName =
      $el.find('.nombre-completo, .candidate-name, h3, h4').first().text().trim() ||
      $el.attr('data-nombre') ||
      ''

    // Parse individual name parts
    let firstName = $el.find('.nombres, .first-name').text().trim()
    let paternalSurname = $el.find('.apellido-paterno, .paternal').text().trim()
    let maternalSurname = $el.find('.apellido-materno, .maternal').text().trim()

    // If we have full name but not parts, try to split
    if (fullName && (!firstName || !paternalSurname)) {
      const nameParts = fullName.split(' ')
      if (nameParts.length >= 3) {
        paternalSurname = nameParts[0]
        maternalSurname = nameParts[1]
        firstName = nameParts.slice(2).join(' ')
      } else if (nameParts.length === 2) {
        paternalSurname = nameParts[0]
        firstName = nameParts[1]
      }
    }

    // If we have parts but not full name, build it
    if (!fullName && firstName) {
      fullName = `${paternalSurname} ${maternalSurname} ${firstName}`.trim()
    }

    // Parse cargo
    const cargoText =
      $el.find('.cargo, .position').text().trim() ||
      $el.attr('data-cargo') ||
      ''

    let cargo: JNECandidateData['cargo'] = 'Congresista' // default

    if (cargoText.toLowerCase().includes('presidente')) {
      cargo = cargoText.toLowerCase().includes('vice')
        ? 'Vicepresidente'
        : 'Presidente'
    } else if (
      cargoText.toLowerCase().includes('andino') ||
      cargoText.toLowerCase().includes('parlamento')
    ) {
      cargo = 'Parlamento Andino'
    }

    // Parse party
    const partyName =
      $el.find('.partido, .party-name').text().trim() ||
      $el.attr('data-partido') ||
      ''

    const partyShortName = $el.find('.partido-siglas, .party-short').text().trim()

    // Parse region
    const region =
      $el.find('.region, .department').text().trim() ||
      $el.attr('data-region') ||
      undefined

    // Parse photo URL
    let photoUrl =
      $el.find('img.foto, img.candidate-photo').attr('src') ||
      $el.find('img').first().attr('src') ||
      undefined

    if (photoUrl && !photoUrl.startsWith('http')) {
      photoUrl = `https://plataformaelectoral.jne.gob.pe${photoUrl}`
    }

    // Parse DJHV URL
    let djhvUrl =
      $el.find('a.djhv, a[href*="HojaVida"]').attr('href') || undefined

    if (djhvUrl && !djhvUrl.startsWith('http')) {
      djhvUrl = `https://plataformaelectoral.jne.gob.pe${djhvUrl}`
    }

    // Validate required fields
    if (!fullName && !dni) {
      return null
    }

    return {
      jne_id: jneId,
      dni,
      full_name: fullName,
      first_name: firstName,
      paternal_surname: paternalSurname,
      maternal_surname: maternalSurname,
      cargo,
      region,
      party_name: partyName,
      party_short_name: partyShortName || undefined,
      photo_url: photoUrl,
      djhv_url: djhvUrl,
    }
  } catch (error) {
    console.error('[JNE Parser] Error parsing candidate:', error)
    return null
  }
}

/**
 * Parses a candidate from JSON API response
 */
function parseJSONCandidate(
  data: Record<string, unknown>
): JNECandidateData | null {
  try {
    const jneId = String(
      data.idCandidato || data.id || data.candidatoId || ''
    )
    const dni = String(data.dni || data.documento || '')

    // Parse name
    const fullName = String(
      data.nombreCompleto ||
        data.nombre ||
        data.fullName ||
        `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''} ${data.nombres || ''}`.trim()
    )

    const firstName = String(data.nombres || data.firstName || '')
    const paternalSurname = String(
      data.apellidoPaterno || data.paternalSurname || ''
    )
    const maternalSurname = String(
      data.apellidoMaterno || data.maternalSurname || ''
    )

    // Parse cargo
    const cargoStr = String(data.cargo || data.position || '').toLowerCase()
    let cargo: JNECandidateData['cargo'] = 'Congresista'

    if (cargoStr.includes('presidente')) {
      cargo = cargoStr.includes('vice') ? 'Vicepresidente' : 'Presidente'
    } else if (cargoStr.includes('andino') || cargoStr.includes('parlamento')) {
      cargo = 'Parlamento Andino'
    }

    // Parse party
    const partyName = String(
      data.organizacionPolitica ||
        data.partido ||
        data.partyName ||
        ''
    )
    const partyShortName =
      String(data.siglas || data.partyShortName || '') || undefined

    // Parse other fields
    const region =
      String(data.region || data.departamento || '') || undefined
    const birthDate =
      String(data.fechaNacimiento || data.birthDate || '') || undefined
    const photoUrl =
      String(data.urlFoto || data.photoUrl || data.foto || '') || undefined

    if (!fullName && !dni) {
      return null
    }

    return {
      jne_id: jneId,
      dni,
      full_name: fullName,
      first_name: firstName,
      paternal_surname: paternalSurname,
      maternal_surname: maternalSurname,
      birth_date: birthDate,
      cargo,
      region,
      party_name: partyName,
      party_short_name: partyShortName,
      photo_url: photoUrl,
    }
  } catch (error) {
    console.error('[JNE Parser] Error parsing JSON candidate:', error)
    return null
  }
}

/**
 * Normalizes a candidate name for comparison
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Checks if two candidates are likely the same person
 */
export function isSameCandidate(
  a: JNECandidateData,
  b: { dni?: string; full_name?: string }
): boolean {
  // Match by DNI if both have it
  if (a.dni && b.dni && a.dni === b.dni) {
    return true
  }

  // Match by normalized name
  if (a.full_name && b.full_name) {
    return normalizeName(a.full_name) === normalizeName(b.full_name)
  }

  return false
}

// ============================================
// ENHANCED SENTENCE PARSING FUNCTIONS
// ============================================

/**
 * Maps civil sentence type text to enum value
 */
export function mapCivilSentenceType(text: string): JNECivilSentence['tipo'] {
  const normalized = text.toLowerCase().trim()
  if (normalized.includes('violencia') || normalized.includes('familiar')) return 'violencia_familiar'
  if (normalized.includes('alimento')) return 'alimentos'
  if (normalized.includes('laboral') || normalized.includes('trabajo')) return 'laboral'
  return 'contractual'
}

/**
 * Parses sentence status from text
 */
export function parseEstadoSentencia(text: string): 'firme' | 'apelacion' | 'proceso' {
  const normalized = text.toLowerCase().trim()
  if (normalized.includes('firme') || normalized.includes('consentida') || normalized.includes('ejecutoriada')) return 'firme'
  if (normalized.includes('apela') || normalized.includes('recurso')) return 'apelacion'
  return 'proceso'
}

/**
 * Parses penalty type from text
 */
export function parseTipoPena(text: string): 'efectiva' | 'suspendida' | 'reserva_fallo' | undefined {
  const normalized = text.toLowerCase().trim()
  if (normalized.includes('efectiva') || normalized.includes('privativa')) return 'efectiva'
  if (normalized.includes('suspendida') || normalized.includes('condicional')) return 'suspendida'
  if (normalized.includes('reserva')) return 'reserva_fallo'
  return undefined
}

/**
 * Parses monetary amount from text (S/. 1,234.56 or 1234.56)
 */
export function parseMontoFromText(text: string): number | undefined {
  if (!text) return undefined
  // Remove currency symbols and normalize
  const cleaned = text.replace(/[sS]\/\.?/g, '').replace(/,/g, '').trim()
  const amount = parseFloat(cleaned)
  return isNaN(amount) ? undefined : amount
}

/**
 * Parses party affiliation type
 */
export function parseAffiliationType(text: string): 'militante' | 'adherente' | 'simpatizante' | undefined {
  const normalized = text.toLowerCase().trim()
  if (normalized.includes('militante')) return 'militante'
  if (normalized.includes('adherente')) return 'adherente'
  if (normalized.includes('simpatizante')) return 'simpatizante'
  return undefined
}

/**
 * Parses penal sentences from HTML using Cheerio
 */
export function parsePenalSentencesFromHTML($: CheerioAPI): JNEPenalSentence[] {
  const sentences: JNEPenalSentence[] = []

  // Try multiple selectors for penal sentences section
  const selectors = [
    '#sentencias-penales tr',
    '.sentencias-penales tr',
    '[data-section="penal"] tr',
    '.seccion-v tr',
    'table:contains("Sentencias Penales") tr',
    '#tblSentenciasPenales tr'
  ]

  for (const selector of selectors) {
    $(selector).each((idx, el) => {
      if (idx === 0) return // Skip header row
      const $el = $(el)
      const cells = $el.find('td')

      if (cells.length >= 3) {
        const delito = $(cells[0]).text().trim() || $(cells[2]).text().trim()
        if (delito) {
          sentences.push({
            expediente: $(cells[0]).text().trim() || undefined,
            juzgado: $(cells[1]).text().trim() || undefined,
            delito: delito,
            fecha_sentencia: $(cells[3]).text().trim() || undefined,
            pena_impuesta: $(cells[4]).text().trim() || undefined,
            tipo_pena: parseTipoPena($(cells[5]).text()),
            estado: parseEstadoSentencia($(cells[6]).text() || 'firme'),
            rehabilitado: $(cells[7]).text().toLowerCase().includes('si')
          })
        }
      }
    })
    if (sentences.length > 0) break
  }

  return sentences
}

/**
 * Parses civil sentences from HTML using Cheerio
 */
export function parseCivilSentencesFromHTML($: CheerioAPI): JNECivilSentence[] {
  const sentences: JNECivilSentence[] = []

  const selectors = [
    '#sentencias-civiles tr',
    '.sentencias-civiles tr',
    '[data-section="civil"] tr',
    '.seccion-vi tr',
    'table:contains("Obligaciones") tr',
    '#tblSentenciasCiviles tr'
  ]

  for (const selector of selectors) {
    $(selector).each((idx, el) => {
      if (idx === 0) return // Skip header row
      const $el = $(el)
      const cells = $el.find('td')

      if (cells.length >= 2) {
        const tipoText = $(cells[0]).text().trim()
        const descripcion = $(cells[1]).text().trim() || $(cells[2]).text().trim()
        if (descripcion) {
          sentences.push({
            tipo: mapCivilSentenceType(tipoText),
            expediente: $(cells[1]).text().trim() || undefined,
            juzgado: $(cells[2]).text().trim() || undefined,
            descripcion: descripcion,
            fecha_sentencia: $(cells[3]).text().trim() || undefined,
            monto: parseMontoFromText($(cells[4]).text()),
            estado: parseEstadoSentencia($(cells[5]).text() || 'firme')
          })
        }
      }
    })
    if (sentences.length > 0) break
  }

  return sentences
}

/**
 * Parses party resignations from HTML using Cheerio
 */
export function parsePartyResignationsFromHTML($: CheerioAPI): JNEPartyResignation[] {
  const resignations: JNEPartyResignation[] = []

  const selectors = [
    '#renuncias tr',
    '.renuncias-partidos tr',
    '[data-section="renuncias"] tr',
    '.seccion-vii tr',
    'table:contains("Renuncia") tr',
    '#tblRenuncias tr'
  ]

  for (const selector of selectors) {
    $(selector).each((idx, el) => {
      if (idx === 0) return // Skip header row
      const $el = $(el)
      const cells = $el.find('td')

      if (cells.length >= 2) {
        const partido = $(cells[0]).text().trim()
        if (partido) {
          resignations.push({
            partido: partido,
            fecha_afiliacion: $(cells[1]).text().trim() || undefined,
            fecha_renuncia: $(cells[2]).text().trim() || undefined,
            tipo_afiliacion: parseAffiliationType($(cells[3]).text())
          })
        }
      }
    })
    if (resignations.length > 0) break
  }

  return resignations
}
