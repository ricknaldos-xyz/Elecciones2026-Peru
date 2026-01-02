// ============================================
// DATABASE TYPES
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      parties: {
        Row: {
          id: string
          name: string
          short_name: string | null
          logo_url: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name?: string | null
          logo_url?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string | null
          logo_url?: string | null
          color?: string | null
          created_at?: string
        }
      }
      districts: {
        Row: {
          id: string
          name: string
          slug: string
          type: 'departamento' | 'lima_provincia' | 'callao' | 'extranjero'
          senators_count: number
          deputies_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: 'departamento' | 'lima_provincia' | 'callao' | 'extranjero'
          senators_count?: number
          deputies_count: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: 'departamento' | 'lima_provincia' | 'callao' | 'extranjero'
          senators_count?: number
          deputies_count?: number
          created_at?: string
        }
      }
      candidates: {
        Row: {
          id: string
          slug: string
          full_name: string
          photo_url: string | null
          cargo: CargoType
          party_id: string | null
          district_id: string | null
          birth_date: string | null
          education_level: string | null
          education_details: EducationDetail[]
          experience_details: ExperienceDetail[]
          political_trajectory: PoliticalTrajectory[]
          assets_declaration: AssetsDeclaration | null
          penal_sentences: Sentence[]
          civil_sentences: Sentence[]
          party_resignations: number
          djhv_url: string | null
          jne_id: string | null
          data_source: string | null
          data_verified: boolean
          inscription_status: string | null
          inscription_date: string | null
          verification_date: string | null
          last_updated: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          full_name: string
          photo_url?: string | null
          cargo: CargoType
          party_id?: string | null
          district_id?: string | null
          birth_date?: string | null
          education_level?: string | null
          education_details?: EducationDetail[]
          experience_details?: ExperienceDetail[]
          political_trajectory?: PoliticalTrajectory[]
          assets_declaration?: AssetsDeclaration | null
          penal_sentences?: Sentence[]
          civil_sentences?: Sentence[]
          party_resignations?: number
          djhv_url?: string | null
          jne_id?: string | null
          data_source?: string | null
          data_verified?: boolean
          inscription_status?: string | null
          inscription_date?: string | null
          verification_date?: string | null
          last_updated?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          full_name?: string
          photo_url?: string | null
          cargo?: CargoType
          party_id?: string | null
          district_id?: string | null
          birth_date?: string | null
          education_level?: string | null
          education_details?: EducationDetail[]
          experience_details?: ExperienceDetail[]
          political_trajectory?: PoliticalTrajectory[]
          assets_declaration?: AssetsDeclaration | null
          penal_sentences?: Sentence[]
          civil_sentences?: Sentence[]
          party_resignations?: number
          djhv_url?: string | null
          jne_id?: string | null
          data_source?: string | null
          data_verified?: boolean
          inscription_status?: string | null
          inscription_date?: string | null
          verification_date?: string | null
          last_updated?: string
          is_active?: boolean
          created_at?: string
        }
      }
      scores: {
        Row: {
          id: string
          candidate_id: string
          competence: number
          integrity: number
          transparency: number
          confidence: number
          score_balanced: number
          score_merit: number
          score_integrity: number
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          competence: number
          integrity: number
          transparency: number
          confidence: number
          score_balanced: number
          score_merit: number
          score_integrity: number
          updated_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          competence?: number
          integrity?: number
          transparency?: number
          confidence?: number
          score_balanced?: number
          score_merit?: number
          score_integrity?: number
          updated_at?: string
        }
      }
      score_breakdowns: {
        Row: {
          id: string
          candidate_id: string
          education_points: number
          education_level_points: number
          education_depth_points: number
          experience_total_points: number
          experience_relevant_points: number
          leadership_points: number
          leadership_seniority: number
          leadership_stability: number
          integrity_base: number
          penal_penalty: number
          civil_penalties: CivilPenalty[]
          resignation_penalty: number
          completeness_points: number
          consistency_points: number
          assets_quality_points: number
          verification_points: number
          coverage_points: number
        }
        Insert: {
          id?: string
          candidate_id: string
          education_points?: number
          education_level_points?: number
          education_depth_points?: number
          experience_total_points?: number
          experience_relevant_points?: number
          leadership_points?: number
          leadership_seniority?: number
          leadership_stability?: number
          integrity_base?: number
          penal_penalty?: number
          civil_penalties?: CivilPenalty[]
          resignation_penalty?: number
          completeness_points?: number
          consistency_points?: number
          assets_quality_points?: number
          verification_points?: number
          coverage_points?: number
        }
        Update: {
          id?: string
          candidate_id?: string
          education_points?: number
          education_level_points?: number
          education_depth_points?: number
          experience_total_points?: number
          experience_relevant_points?: number
          leadership_points?: number
          leadership_seniority?: number
          leadership_stability?: number
          integrity_base?: number
          penal_penalty?: number
          civil_penalties?: CivilPenalty[]
          resignation_penalty?: number
          completeness_points?: number
          consistency_points?: number
          assets_quality_points?: number
          verification_points?: number
          coverage_points?: number
        }
      }
      flags: {
        Row: {
          id: string
          candidate_id: string
          type: FlagType
          severity: FlagSeverity
          title: string
          description: string | null
          source: string
          evidence_url: string | null
          date_captured: string
        }
        Insert: {
          id?: string
          candidate_id: string
          type: FlagType
          severity: FlagSeverity
          title: string
          description?: string | null
          source: string
          evidence_url?: string | null
          date_captured?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          type?: FlagType
          severity?: FlagSeverity
          title?: string
          description?: string | null
          source?: string
          evidence_url?: string | null
          date_captured?: string
        }
      }
    }
  }
}

// ============================================
// DOMAIN TYPES
// ============================================

export type CargoType =
  | 'presidente'
  | 'vicepresidente'
  | 'senador'
  | 'diputado'
  | 'parlamento_andino'

export type FlagType =
  | 'PENAL_SENTENCE'
  | 'CIVIL_SENTENCE'
  | 'VIOLENCE'
  | 'ALIMENTOS'
  | 'LABORAL'
  | 'CONTRACTUAL'
  | 'MULTIPLE_RESIGNATIONS'
  | 'LOW_DATA'
  | 'UNDER_REVIEW'

export type FlagSeverity = 'RED' | 'AMBER' | 'GRAY'

export type RoleType =
  | 'electivo_alto'
  | 'electivo_medio'
  | 'ejecutivo_publico_alto'
  | 'ejecutivo_publico_medio'
  | 'ejecutivo_privado_alto'
  | 'ejecutivo_privado_medio'
  | 'tecnico_profesional'
  | 'academia'
  | 'internacional'
  | 'partidario'

export type SeniorityLevel =
  | 'individual'
  | 'coordinador'
  | 'jefatura'
  | 'gerencia'
  | 'direccion'

export type EducationLevel =
  | 'sin_informacion'
  | 'primaria_completa'
  | 'secundaria_incompleta'
  | 'secundaria_completa'
  | 'tecnico_incompleto'
  | 'tecnico_completo'
  | 'universitario_incompleto'
  | 'universitario_completo'
  | 'titulo_profesional'
  | 'maestria'
  | 'doctorado'

// ============================================
// JSONB FIELD TYPES
// ============================================

export interface EducationDetail {
  level: EducationLevel
  institution: string
  degree: string
  field_of_study?: string
  start_date?: string
  end_date?: string
  is_completed: boolean
  is_verified?: boolean
  source?: string
}

export interface ExperienceDetail {
  role_type: RoleType
  position: string
  organization: string
  sector: 'publico' | 'privado' | 'ong' | 'internacional'
  start_date: string
  end_date?: string
  is_current: boolean
  description?: string
  seniority_level: SeniorityLevel
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

export interface Sentence {
  type: 'penal_dolosa' | 'violencia_familiar' | 'alimentos' | 'laboral' | 'contractual'
  description: string
  date?: string
  status: 'firme' | 'apelacion' | 'otro'
  source: string
  evidence_url?: string
}

export interface CivilPenalty {
  type: string
  penalty: number
}

export interface AssetsDeclaration {
  total_income?: number
  real_estate?: AssetItem[]
  vehicles?: AssetItem[]
  investments?: AssetItem[]
  other_assets?: AssetItem[]
  is_complete: boolean
  source?: string
}

export interface AssetItem {
  description: string
  value?: number
  currency?: string
}

// ============================================
// VIEW/COMPUTED TYPES
// ============================================

export interface CandidateWithScores {
  id: string
  slug: string
  full_name: string
  photo_url: string | null
  cargo: CargoType
  party: {
    id: string
    name: string
    short_name: string | null
    color: string | null
  } | null
  district: {
    id: string
    name: string
    slug: string
  } | null
  scores: {
    competence: number
    integrity: number
    transparency: number
    confidence: number
    score_balanced: number
    score_merit: number
    score_integrity: number
  }
  flags: Flag[]
  data_verified: boolean
  data_source: string | null
}

export interface Flag {
  id: string
  type: FlagType
  severity: FlagSeverity
  title: string
  description: string | null
  source: string
  evidence_url: string | null
  date_captured: string
}

export interface ScoreBreakdown {
  // Competencia
  education: {
    total: number
    level: number
    depth: number
  }
  experience: {
    total: number
    relevant: number
  }
  leadership: {
    total: number
    seniority: number
    stability: number
  }
  // Integridad
  integrity: {
    base: number
    penal_penalty: number
    civil_penalties: CivilPenalty[]
    resignation_penalty: number
    final: number
  }
  // Transparencia
  transparency: {
    completeness: number
    consistency: number
    assets_quality: number
    total: number
  }
  // Confidence
  confidence: {
    verification: number
    coverage: number
    total: number
  }
}

// ============================================
// PRESET TYPES
// ============================================

export type PresetType = 'balanced' | 'merit' | 'integrity' | 'custom'

export interface Weights {
  wC: number // Competencia
  wI: number // Integridad
  wT: number // Transparencia
}

export interface RankingFilters {
  cargo?: CargoType
  district_slug?: string
  party_id?: string
  mode: PresetType
  weights?: Weights
  min_confidence?: number
  min_integrity?: number
  min_competence?: number
  min_transparency?: number
  hide_low_data?: boolean
  only_red_flags?: boolean
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface RankingResponse {
  candidates: CandidateWithScores[]
  total: number
  page: number
  per_page: number
  mode: PresetType
  weights: Weights
}

export interface CandidateDetailResponse {
  candidate: CandidateWithScores
  breakdown: ScoreBreakdown
  similar_candidates: CandidateWithScores[]
}
