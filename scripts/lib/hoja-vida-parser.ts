/**
 * Parser especializado para datos de Hoja de Vida del JNE
 * Transforma datos crudos de la API/DOM a estructura de base de datos
 */

// Tipos para la base de datos
export interface EducationDetail {
  level: string
  institution: string
  degree?: string
  field_of_study?: string
  start_date?: string
  end_date?: string
  is_completed: boolean
  is_verified?: boolean
  source?: string
}

export interface ExperienceDetail {
  role_type?: string
  position: string
  organization: string
  sector: 'publico' | 'privado' | 'ong' | 'internacional'
  start_date?: string
  end_date?: string
  is_current: boolean
  description?: string
  seniority_level?: string
  is_verified?: boolean
  source?: string
}

export interface PoliticalTrajectory {
  position: string
  party?: string
  start_date?: string
  end_date?: string
  is_elected: boolean
  description?: string
  source?: string
}

export interface PenalSentence {
  expediente?: string
  juzgado?: string
  delito: string
  fecha_sentencia?: string
  pena_impuesta?: string
  tipo_pena?: 'efectiva' | 'suspendida' | 'reserva_fallo'
  estado: 'firme' | 'apelacion' | 'proceso'
  rehabilitado?: boolean
  modalidad?: string
}

export interface CivilSentence {
  tipo: 'violencia_familiar' | 'alimentos' | 'laboral' | 'contractual'
  expediente?: string
  juzgado?: string
  descripcion: string
  fecha_sentencia?: string
  monto?: number
  estado: 'firme' | 'apelacion' | 'proceso'
  demandante?: string
}

export interface PartyResignation {
  partido: string
  fecha_afiliacion?: string
  fecha_renuncia?: string
  tipo_afiliacion?: 'militante' | 'adherente' | 'simpatizante'
  motivo?: string
}

export interface AssetsDeclaration {
  total_income?: number
  real_estate?: number
  vehicles?: number
  investments?: number
  other_assets?: number
  total_assets?: number
  total_liabilities?: number
  is_complete: boolean
  source?: string
}

export interface ParsedHojaVida {
  // Identificación
  jne_id?: string
  dni?: string

  // Datos personales
  full_name: string
  birth_date?: string
  birth_place?: string
  residence?: string
  profession?: string

  // Cargo
  cargo: 'presidente' | 'vicepresidente' | 'senador' | 'diputado' | 'parlamento_andino'
  district?: string
  position_number?: number

  // Partido
  party_name: string
  party_short_name?: string

  // Foto
  photo_url?: string

  // Secciones detalladas
  education_details: EducationDetail[]
  experience_details: ExperienceDetail[]
  political_trajectory: PoliticalTrajectory[]
  penal_sentences: PenalSentence[]
  civil_sentences: CivilSentence[]
  party_resignations_detail: PartyResignation[]
  assets_declaration?: AssetsDeclaration

  // URLs
  plan_gobierno_url?: string
  djhv_url?: string

  // Metadatos
  data_source: 'jne'
  extraction_date: string
}

/**
 * Parsea los datos crudos de la API/DOM a la estructura de BD
 */
export function parseHojaVida(
  rawData: Record<string, unknown>,
  cargoOriginal: string,
  idOrg: number,
  idHV: number
): ParsedHojaVida {
  const cargo = normalizeCargo(cargoOriginal)

  return {
    jne_id: String(rawData.idHojaVida || idHV || ''),
    dni: String(rawData.strDNI || rawData.dni || ''),

    full_name: normalizeFullName(
      String(rawData.strNombreCompleto || rawData.nombre || '')
    ),
    birth_date: parseDate(rawData.dteFechaNacimiento || rawData.fechaNacimiento),
    birth_place: String(rawData.strLugarNacimiento || rawData.lugarNacimiento || ''),
    residence: String(rawData.strDomicilio || rawData.domicilio || ''),
    profession: String(rawData.strProfesion || rawData.profesion || ''),

    cargo,
    district: rawData.strDistrito ? String(rawData.strDistrito) : undefined,
    position_number: rawData.intPosicion ? Number(rawData.intPosicion) : undefined,

    party_name: String(rawData.strOrganizacionPolitica || rawData.partido || ''),
    party_short_name: rawData.strSiglas ? String(rawData.strSiglas) : undefined,

    photo_url: String(rawData.strFoto || rawData.urlFoto || rawData.foto || ''),

    education_details: parseEducation(rawData.educacion || rawData.lstEducacion || []),
    experience_details: parseExperience(rawData.experiencia || rawData.lstExperiencia || []),
    political_trajectory: parsePoliticalTrajectory(rawData.trayectoriaPolitica || rawData.lstTrayectoria || []),
    penal_sentences: parsePenalSentences(rawData.sentenciasPenales || rawData.lstSentenciasPenales || []),
    civil_sentences: parseCivilSentences(rawData.sentenciasCiviles || rawData.lstSentenciasCiviles || []),
    party_resignations_detail: parsePartyResignations(rawData.renuncias || rawData.lstRenuncias || []),
    assets_declaration: parseAssets(rawData.bienes || rawData.declaracionBienes || {}),

    plan_gobierno_url: rawData.strUrlPlanGobierno ? String(rawData.strUrlPlanGobierno) : undefined,
    djhv_url: `https://votoinformado.jne.gob.pe/hoja-vida/${idOrg}/${idHV}`,

    data_source: 'jne',
    extraction_date: new Date().toISOString()
  }
}

function normalizeCargo(cargo: string): ParsedHojaVida['cargo'] {
  const c = cargo.toLowerCase()
  if (c.includes('presidente') && !c.includes('vice')) return 'presidente'
  if (c.includes('vicepresidente') || c.includes('vice')) return 'vicepresidente'
  if (c.includes('senador')) return 'senador'
  if (c.includes('diputado') || c.includes('congres')) return 'diputado'
  if (c.includes('andino') || c.includes('parlamento')) return 'parlamento_andino'
  return 'diputado' // default
}

function normalizeFullName(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
    .trim()
}

function parseDate(value: unknown): string | undefined {
  if (!value) return undefined
  const str = String(value)

  // Intentar diferentes formatos
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})/, // ISO
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
  ]

  for (const format of formats) {
    const match = str.match(format)
    if (match) {
      if (format === formats[0]) {
        return `${match[1]}-${match[2]}-${match[3]}`
      } else {
        return `${match[3]}-${match[2]}-${match[1]}`
      }
    }
  }

  return undefined
}

function parseEducation(items: unknown): EducationDetail[] {
  if (!Array.isArray(items)) return []

  return items
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const obj = item as Record<string, unknown>
      return {
        level: normalizeEducationLevel(String(obj.strNivelEstudio || obj.nivel || '')),
        institution: String(obj.strCentroEstudio || obj.institucion || obj.centro || ''),
        degree: obj.strCarrera ? String(obj.strCarrera) : undefined,
        field_of_study: obj.strEspecialidad ? String(obj.strEspecialidad) : undefined,
        start_date: parseDate(obj.intAnioInicio),
        end_date: parseDate(obj.intAnioEstudio || obj.intAnioFin),
        is_completed: obj.blnConcluido !== false && obj.blnConcluido !== 0,
        source: 'jne'
      }
    })
    .filter(e => e.institution || e.degree)
}

function normalizeEducationLevel(level: string): string {
  const l = level.toLowerCase()
  if (l.includes('primaria')) return 'primaria'
  if (l.includes('secundaria')) return 'secundaria'
  if (l.includes('técnic')) return 'tecnico'
  if (l.includes('universitario') || l.includes('bachiller')) return 'universitario'
  if (l.includes('título') || l.includes('licenciado')) return 'titulo_profesional'
  if (l.includes('maestría') || l.includes('master')) return 'maestria'
  if (l.includes('doctorado') || l.includes('phd')) return 'doctorado'
  return level || 'otro'
}

function parseExperience(items: unknown): ExperienceDetail[] {
  if (!Array.isArray(items)) return []

  return items
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const obj = item as Record<string, unknown>
      const sectorStr = String(obj.strSector || obj.sector || '').toLowerCase()

      return {
        position: String(obj.strOcupacion || obj.cargo || obj.puesto || ''),
        organization: String(obj.strCentroTrabajo || obj.entidad || obj.empresa || ''),
        sector: sectorStr.includes('público') || sectorStr.includes('estado')
          ? 'publico'
          : sectorStr.includes('ong') || sectorStr.includes('civil')
            ? 'ong'
            : 'privado',
        start_date: obj.intAnioInicio ? `${obj.intAnioInicio}-01-01` : undefined,
        end_date: obj.intAnioFin ? `${obj.intAnioFin}-12-31` : undefined,
        is_current: !obj.intAnioFin || obj.blnActual === true,
        source: 'jne'
      }
    })
    .filter(e => e.organization || e.position)
}

function parsePoliticalTrajectory(items: unknown): PoliticalTrajectory[] {
  if (!Array.isArray(items)) return []

  return items
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const obj = item as Record<string, unknown>
      return {
        position: String(obj.strCargo || obj.cargo || ''),
        party: obj.strPartido ? String(obj.strPartido) : undefined,
        start_date: obj.intAnioInicio ? `${obj.intAnioInicio}-01-01` : undefined,
        end_date: obj.intAnioFin ? `${obj.intAnioFin}-12-31` : undefined,
        is_elected: obj.blnElecto === true || String(obj.strTipo || '').toLowerCase().includes('electo'),
        source: 'jne'
      }
    })
    .filter(p => p.position || p.party)
}

function parsePenalSentences(items: unknown): PenalSentence[] {
  if (!Array.isArray(items)) return []

  return items
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const obj = item as Record<string, unknown>
      const estadoStr = String(obj.strEstado || obj.estado || '').toLowerCase()
      const penaStr = String(obj.strPena || obj.pena || '').toLowerCase()

      return {
        expediente: obj.strExpediente ? String(obj.strExpediente) : undefined,
        juzgado: obj.strJuzgado ? String(obj.strJuzgado) : undefined,
        delito: String(obj.strDelito || obj.delito || obj.strTipoDelito || ''),
        fecha_sentencia: parseDate(obj.dteFechaSentencia || obj.fechaSentencia),
        pena_impuesta: obj.strPena ? String(obj.strPena) : undefined,
        tipo_pena: penaStr.includes('efectiva')
          ? 'efectiva'
          : penaStr.includes('suspendida')
            ? 'suspendida'
            : penaStr.includes('reserva')
              ? 'reserva_fallo'
              : undefined,
        estado: estadoStr.includes('firme')
          ? 'firme'
          : estadoStr.includes('apela')
            ? 'apelacion'
            : 'proceso',
        rehabilitado: obj.blnRehabilitado === true,
        modalidad: obj.strModalidad ? String(obj.strModalidad) : undefined
      }
    })
    .filter(s => s.delito)
}

function parseCivilSentences(items: unknown): CivilSentence[] {
  if (!Array.isArray(items)) return []

  return items
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const obj = item as Record<string, unknown>
      const tipoStr = String(obj.strTipo || obj.tipo || '').toLowerCase()
      const estadoStr = String(obj.strEstado || obj.estado || '').toLowerCase()

      return {
        tipo: tipoStr.includes('violencia') || tipoStr.includes('familiar')
          ? 'violencia_familiar'
          : tipoStr.includes('alimento')
            ? 'alimentos'
            : tipoStr.includes('laboral')
              ? 'laboral'
              : 'contractual',
        expediente: obj.strExpediente ? String(obj.strExpediente) : undefined,
        juzgado: obj.strJuzgado ? String(obj.strJuzgado) : undefined,
        descripcion: String(obj.strMateria || obj.descripcion || obj.strDescripcion || ''),
        fecha_sentencia: parseDate(obj.dteFechaSentencia || obj.fechaSentencia),
        monto: obj.decMonto ? Number(obj.decMonto) : undefined,
        estado: estadoStr.includes('firme')
          ? 'firme'
          : estadoStr.includes('apela')
            ? 'apelacion'
            : 'proceso',
        demandante: obj.strDemandante ? String(obj.strDemandante) : undefined
      }
    })
    .filter(s => s.descripcion)
}

function parsePartyResignations(items: unknown): PartyResignation[] {
  if (!Array.isArray(items)) return []

  return items
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const obj = item as Record<string, unknown>
      const tipoStr = String(obj.strTipoAfiliacion || '').toLowerCase()

      return {
        partido: String(obj.strPartido || obj.partido || ''),
        fecha_afiliacion: parseDate(obj.dteFechaAfiliacion || obj.strFechaAfiliacion),
        fecha_renuncia: parseDate(obj.dteFechaRenuncia || obj.strFechaRenuncia),
        tipo_afiliacion: tipoStr.includes('militante')
          ? 'militante'
          : tipoStr.includes('adherente')
            ? 'adherente'
            : tipoStr.includes('simpatizante')
              ? 'simpatizante'
              : undefined,
        motivo: obj.strMotivo ? String(obj.strMotivo) : undefined
      }
    })
    .filter(r => r.partido)
}

function parseAssets(data: unknown): AssetsDeclaration | undefined {
  if (!data || typeof data !== 'object') return undefined

  const obj = data as Record<string, unknown>

  const totalAssets = obj.decTotalBienes ? Number(obj.decTotalBienes) : undefined
  const totalIncome = obj.decIngresoTotal ? Number(obj.decIngresoTotal) : undefined

  if (!totalAssets && !totalIncome && !obj.intCantidadInmuebles && !obj.intCantidadVehiculos) {
    return undefined
  }

  return {
    total_income: totalIncome,
    real_estate: obj.intCantidadInmuebles ? Number(obj.intCantidadInmuebles) : undefined,
    vehicles: obj.intCantidadVehiculos ? Number(obj.intCantidadVehiculos) : undefined,
    total_assets: totalAssets,
    total_liabilities: obj.decTotalDeudas ? Number(obj.decTotalDeudas) : undefined,
    is_complete: true,
    source: 'jne'
  }
}

/**
 * Genera un slug único para el candidato
 */
export function generateSlug(fullName: string): string {
  return fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Valida que una hoja de vida tenga los datos mínimos
 */
export function isValidHojaVida(hv: ParsedHojaVida): boolean {
  return !!(
    hv.full_name &&
    hv.full_name.length > 3 &&
    hv.party_name &&
    hv.cargo
  )
}
