import type * as cheerio from 'cheerio'

type CheerioAPI = cheerio.CheerioAPI
type CheerioSelection = ReturnType<CheerioAPI>

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
  declared_sentences?: Array<{
    type: 'penal' | 'civil'
    description: string
    date: string
  }>
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
