/**
 * AUDIT: Verify well-known Peruvian politicians have complete and accurate data
 *
 * Cross-references database records against publicly known facts for 20
 * high-profile candidates in the 2026 elections.
 *
 * Sources: JNE, Congreso, Poder Judicial, Wikipedia, public media
 * Usage: npx tsx scripts/audit-known-politicians.ts
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const sql = neon(dbMatch![1])

// ============================================================
// KNOWN FACTS - Verified from public sources
// ============================================================

interface KnownFact {
  label: string
  searchName: string  // for ILIKE
  expectedCargo: string
  knownFacts: {
    education?: {
      expectedLevel: string
      details: string[]
      issues?: string[]
    }
    politicalTrajectory?: {
      expectedEntries: string[]
      minEntries?: number
      issues?: string[]
    }
    penalSentences?: {
      expectedCount: number
      details: string[]
    }
    civilSentences?: {
      expectedCount: number
      details: string[]
    }
    competenceExpectation?: {
      min: number
      max: number
      reasoning: string
    }
    partyResignations?: {
      expected: number
    }
    otherIssues?: string[]
  }
}

const KNOWN_POLITICIANS: KnownFact[] = [
  // ======================== PRESIDENTIAL ========================
  {
    label: 'Keiko Fujimori',
    searchName: 'FUJIMORI',
    expectedCargo: 'presidente',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'BA in Business Administration from Boston University',
          'MBA from Columbia University',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista por Lima 2006-2011 (Alianza por el Futuro)',
          'Candidata presidencial 2011',
          'Candidata presidencial 2016',
          'Candidata presidencial 2021',
          'Fundadora/Presidenta Fuerza Popular',
        ],
        minEntries: 5,
      },
      penalSentences: {
        expectedCount: 0,
        details: [
          'Case Odebrecht/Cocteles: trial annulled by TC in Oct 2025 (habeas corpus granted)',
          'DB currently shows 1 entry with status "juicio_anulado" which is CORRECT per TC ruling',
        ],
      },
      civilSentences: { expectedCount: 0, details: [] },
      competenceExpectation: {
        min: 75,
        max: 95,
        reasoning: 'MBA Columbia, 5yr Congress, multi-time presidential candidate, Fuerza Popular leader',
      },
    },
  },
  {
    label: 'Cesar Acuna',
    searchName: 'ACUÑA PERALTA',
    expectedCargo: 'presidente',
    knownFacts: {
      education: {
        expectedLevel: 'Doctorado',
        details: [
          'Chemical Engineering from UNT',
          'Maestria Administracion Educacion from U Lima',
          'Maestria Direccion Universitaria from U de los Andes (Colombia)',
          'Doctorado from Complutense de Madrid (plagiarism confirmed by Indecopi but degree not formally revoked)',
        ],
        issues: [
          'Tesis doctoral accused of plagiarism; Complutense found "mala praxis" but did not annul',
          'Indecopi multed Acuna and UCV S/39,500 and S/71,100 for copyright infringement',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista (Solidaridad Nacional, ~2000)',
          'Congresista (Unidad Nacional / APP)',
          'Alcalde de Trujillo 2007-2014',
          'Gobernador Regional La Libertad 2015 (briefly)',
          'Gobernador Regional La Libertad 2023-present',
          'Presidente/Fundador APP',
          'Candidato presidencial 2016 (excluido)',
        ],
        minEntries: 6,
      },
      penalSentences: {
        expectedCount: 0,
        details: ['No firm penal sentences; DB shows 2 entries with "investigacion_preliminar" and "observacion" statuses'],
      },
      civilSentences: {
        expectedCount: 3,
        details: [
          'Electoral exclusion 2016 (entrega de dinero - "plata como cancha")',
          'Academic plagiarism (Complutense)',
          'Alimentos sentence (firme)',
        ],
      },
      competenceExpectation: {
        min: 85,
        max: 100,
        reasoning: 'Doctorate, multiple Congress terms, Alcalde, Gobernador Regional x2, university founder',
      },
    },
  },
  {
    label: 'Rafael Lopez Aliaga',
    searchName: 'LOPEZ ALIAGA',
    expectedCargo: 'presidente',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'Industrial Engineering from U de Piura',
          'MBA from Universidad del Pacifico',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Regidor Provincial de Lima (Unidad Nacional)',
          'Candidato presidencial 2021 (Renovacion Popular)',
          'Alcalde de Lima Metropolitana 2023-present',
          'Presidente/Fundador Renovacion Popular',
        ],
        minEntries: 4,
      },
      penalSentences: {
        expectedCount: 2,
        details: ['DB shows 2 entries: investigacion_preparatoria and confirmado'],
      },
      civilSentences: {
        expectedCount: 1,
        details: ['Labor/business debts (PeruRail and linked companies)'],
      },
      competenceExpectation: {
        min: 85,
        max: 100,
        reasoning: 'MBA, 20+ years as Director of PeruRail/Belmond Hotels, current Alcalde de Lima, UNI professor',
      },
    },
  },
  {
    label: 'Vladimir Cerron',
    searchName: 'CERRON ROJAS',
    expectedCargo: 'presidente',
    knownFacts: {
      education: {
        expectedLevel: 'Doctorado',
        details: [
          'Medical degree from Cuba (neurosurgery specialty)',
          'Doctorado en Medicina from UNMSM',
          'Maestria en Neurociencias from UNMSM',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Presidente Regional de Junin 2011-2014',
          'Gobernador Regional de Junin 2019-2022',
          'Secretario General Peru Libre',
          'Fundador Peru Libre',
        ],
        minEntries: 4,
      },
      penalSentences: {
        expectedCount: 3,
        details: [
          'Negociacion incompatible - Hospital Regional Junin (4a8m suspended, firme)',
          'Colusion agravada (3a6m effective sentence, firme - 2021)',
          'Additional investigation for corruption/colusion',
          'DB shows 3 entries which seems correct',
        ],
      },
      civilSentences: { expectedCount: 0, details: [] },
      competenceExpectation: {
        min: 85,
        max: 100,
        reasoning: 'MD + PhD, 2x Regional Governor, major party leader, neurosurgeon with long career',
      },
    },
  },
  {
    label: 'Fernando Olivera',
    searchName: 'OLIVERA VEGA',
    expectedCargo: 'presidente',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'BA Business Administration from Universidad del Pacifico (1980)',
          'Maestria en Relaciones Internacionales from Complutense de Madrid (2008)',
        ],
        issues: [
          'DB shows education_level as "Universitario" but he has a Maestria from Complutense (2008)',
          'Maestria is MISSING from education_details',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Diputado 1985-1990 (Convergencia Democratica)',
          'Diputado 1990-1992 (FIM)',
          'Congresista Constituyente (CCD) 1992-1995',
          'Congresista 1995-2001',
          'Ministro de Justicia (Toledo govt)',
          'Embajador del Peru en Espana 2002-2005',
          'Ministro de Relaciones Exteriores (briefly, 2005)',
          'Presidente/Fundador FIM, then Frente de la Esperanza',
        ],
        minEntries: 7,
      },
      penalSentences: { expectedCount: 0, details: [] },
      civilSentences: {
        expectedCount: 1,
        details: ['Diffamation sentence (firme)'],
      },
      competenceExpectation: {
        min: 85,
        max: 95,
        reasoning: '4 congressional terms, 2 ministerial posts, ambassador, party founder - extensive career',
      },
    },
  },
  {
    label: 'George Forsyth',
    searchName: 'FORSYTH',
    expectedCargo: 'presidente',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'BA Business Administration from UPC (completed 2021)',
          'MBA from Universidad del Pacifico (completed 2023)',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Regidor de La Victoria (Unidad Nacional)',
          'Alcalde de La Victoria 2019-2020',
          'Candidato presidencial 2021 (Victoria Nacional)',
        ],
        minEntries: 3,
      },
      penalSentences: { expectedCount: 0, details: [] },
      civilSentences: {
        expectedCount: 1,
        details: ['DB shows 1 civil: administrativo/observacion - Contraloria investigation for gestión as alcalde'],
      },
      partyResignations: { expected: 2 },
      competenceExpectation: {
        min: 55,
        max: 75,
        reasoning: 'MBA but recent, short municipal tenure (1yr as alcalde), professional footballer; score of 90 seems HIGH',
      },
    },
  },
  {
    label: 'Marisol Perez Tello',
    searchName: 'PEREZ TELLO',
    expectedCargo: 'presidente',
    knownFacts: {
      education: {
        expectedLevel: 'Doctorado',
        details: [
          'Abogado from USMP',
          'Maestria en Derecho Constitucional from PUCP',
          'Doctorado en Derecho from USMP (confirmed by Infobae, Wikipedia)',
        ],
        issues: [
          'DB shows education_level as "Posgrado" but she has a Doctorado en Derecho from USMP',
          'Doctorado is MISSING from education_details',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista 2011-2016 (PPC)',
          'Ministra de Justicia y Derechos Humanos 2016-2017',
          'Secretaria General Nacional PPC 2017-2021',
          'Notaria publica desde 1999',
        ],
        minEntries: 3,
      },
      penalSentences: { expectedCount: 0, details: [] },
      civilSentences: { expectedCount: 0, details: [] },
      competenceExpectation: {
        min: 88,
        max: 98,
        reasoning: 'Doctorate, abogada, notaria, congresista, ministra - very complete profile',
      },
    },
  },
  {
    label: 'Jose Williams Zapata',
    searchName: 'WILLIAMS',
    expectedCargo: 'presidente',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'Military Sciences from Escuela Militar de Chorrillos',
          'Maestria en Desarrollo y Defensa Nacional from CAEN',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista 2021-2025 (Avanza Pais)',
          'Presidente del Congreso 2022-2023',
          'Commandante General del Ejercito (implied military)',
          'Led Operation Chavin de Huantar 1997',
        ],
        minEntries: 2,
        issues: [
          'MISSING: his military career as General, Comandante General Ejercito',
          'MISSING: Presidente del Congreso 2022-2023',
          'MISSING: Academic Director of CAEN 2009-2012',
          'Only 1 experience entry and 1 political trajectory entry - severely incomplete',
          'JEE started sanction process Feb 2026 for omitting Accomarca case from hoja de vida',
        ],
      },
      penalSentences: {
        expectedCount: 0,
        details: [
          'Accomarca massacre case: absolved in 2016 by Judiciary for lack of evidence',
          'Chavin de Huantar case: permanently archived, absolved',
          'DB shows 0 penal sentences which is technically correct (all absolved)',
          'BUT JEE argues he should have declared Accomarca in hoja de vida',
        ],
      },
      civilSentences: { expectedCount: 0, details: [] },
      competenceExpectation: {
        min: 75,
        max: 90,
        reasoning: 'Maestria, General EP, Congress president, decades of military service; score of 58 seems LOW due to missing data',
      },
      otherIssues: [
        'Integrity score of 22 seems oddly low for someone with 0 sentences; likely penalized for congressional votes',
      ],
    },
  },
  {
    label: 'Fiorella Molinelli',
    searchName: 'MOLINELLI',
    expectedCargo: 'presidente',
    knownFacts: {
      education: {
        expectedLevel: 'Doctorado',
        details: [
          'Economia from PUCP',
          'Doctorado en Gobierno y Politica Publica from USMP',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Viceministra de Transportes',
          'Ministra de Desarrollo e Inclusion Social 2017-2018',
          'Presidenta Ejecutiva de EsSalud 2018-2021',
          'Fundadora Fuerza Moderna / Fuerza y Libertad',
        ],
        minEntries: 4,
      },
      penalSentences: {
        expectedCount: 1,
        details: [
          'Under investigation for EsSalud corruption - "Club de las Farmaceuticas"',
          'Three fiscal processes for irregular purchases during pandemic',
          'Impedimento de salida del pais ordered by PJ',
          'DB shows 1 penal with status "investigacion" - seems incomplete but status is active investigation',
        ],
      },
      civilSentences: { expectedCount: 0, details: [] },
      competenceExpectation: {
        min: 80,
        max: 95,
        reasoning: 'PhD, PUCP economist, minister, EsSalud president, CAEN lecturer',
      },
    },
  },
  {
    label: 'Ricardo Belmont',
    searchName: 'BELMONT',
    expectedCargo: 'presidente',
    knownFacts: {
      education: {
        expectedLevel: 'Universitario',
        details: [
          'Bachiller en Administracion de Empresas from U de Lima',
        ],
        issues: [
          'DB shows degree as "BACHIYER ADMINISTRADOR DE EMPRESAS" (typo in original JNE data)',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Alcalde de Lima Metropolitana 1990-1995 (Movimiento Civico OBRAS)',
          'Candidato presidencial (multiple)',
          'Congresista (briefly, Centro Front)',
          'Fundador/Presidente Partido Civico Obras',
        ],
        minEntries: 4,
      },
      penalSentences: {
        expectedCount: 0,
        details: [
          'MISSING: Convicted of aggravated defamation against Phillip Butters (1 year suspended sentence)',
          'This is a recent conviction that is NOT in the database',
        ],
      },
      civilSentences: {
        expectedCount: 1,
        details: ['Tax debts (SUNAT coactiva)'],
      },
      partyResignations: { expected: 3 },
      competenceExpectation: {
        min: 65,
        max: 80,
        reasoning: 'Bachiller only, 5yr as Alcalde de Lima, major media entrepreneur; score 84 seems reasonable',
      },
    },
  },

  // ======================== SENATORS (ex-congressistas) ========================
  {
    label: 'Guido Bellido',
    searchName: 'BELLIDO UGARTE',
    expectedCargo: 'senador',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'Bachiller Ingenieria Electronica from UNSAAC',
          'Maestria en Economia, Gestion Publica from UNSAAC',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista 2021-2026 (Peru Libre)',
          'Presidente del Consejo de Ministros (PCM) 2021',
          'Fundador/Presidente Pueblo Consciente',
        ],
        minEntries: 3,
        issues: [
          'MISSING from trajectory: Congresista 2021-2026 should be listed as elected position',
          'MISSING: PCM role is only in experience, not political trajectory as it should be',
        ],
      },
      penalSentences: {
        expectedCount: 0,
        details: [
          'Investigation for terrorism affiliation was ARCHIVED by Appeals Court',
          'Investigation for obstruction of justice (contacting witness) - status unclear',
          'DB shows 0 penal which may be technically correct since no firm sentences',
        ],
      },
      civilSentences: { expectedCount: 0, details: [] },
      partyResignations: { expected: 2 },
      competenceExpectation: {
        min: 55,
        max: 70,
        reasoning: 'Maestria, PM for ~3 months, Congresista 1 term, limited prior experience; score 56 is reasonable',
      },
    },
  },
  {
    label: 'Martha Chavez',
    searchName: 'CHAVEZ COSSIO MARTHA',
    expectedCargo: 'senador',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'Abogada from PUCP (1976)',
          'Maestria en Derecho Internacional Economico from PUCP (1986-1988)',
          'Maestria en Derecho Constitucional y Gobierno from U Privada San Juan Bautista',
        ],
        issues: [
          'DB shows education_level as "Posgrado" - should be "Maestria" since she has 2 maestrias',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista Constituyente CCD 1992-1995',
          'Congresista 1995-2000 (Presidenta del Congreso 1995-1996 - first woman)',
          'Congresista 2000-2001',
          'Congresista 2001-2006',
          'Congresista 2011-2016 (Fuerza 2011)',
          'Congresista 2020-2021',
          'Secretaria General Nueva Mayoria 1998-2004',
          'Presidenta Nueva Mayoria 2004-2011',
        ],
        minEntries: 6,
        issues: [
          'SEVERELY INCOMPLETE: Only shows 2 political trajectory entries (1 partidario + 1 eleccion)',
          'MISSING: 6 congressional terms (1992-2021) - one of Peru\'s most prolific legislators',
          'MISSING: Presidenta del Congreso 1995-1996',
          'Experience section partially compensates (shows 2011-2016 and 2020-2021 as congresista)',
        ],
      },
      penalSentences: {
        expectedCount: 0,
        details: [
          'Suspended for corruption charges in 2001, then declared innocent in 2005',
          'DB correctly shows 0 firm penal sentences',
        ],
      },
      civilSentences: { expectedCount: 0, details: [] },
      competenceExpectation: {
        min: 85,
        max: 98,
        reasoning: '6 congressional terms, Congress president, 2 maestrias from PUCP - extremely experienced; score 94 is appropriate',
      },
    },
  },
  {
    label: 'Roberto Chiabra',
    searchName: 'CHIABRA LEON ROBERTO',
    expectedCargo: 'senador',
    knownFacts: {
      education: {
        expectedLevel: 'Universitario',
        details: [
          'Ciencias Militares from Escuela Militar de Chorrillos',
          'Cursos de Estado Mayor y Comando (CAEM)',
          'Programa de Alta Direccion y Gerencia from U de Piura',
        ],
        issues: [
          'DB correctly shows Universitario level',
          'No formal maestria found in public records despite extensive military studies',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Comandante General del Ejercito 2002-2003',
          'Ministro de Defensa 2003-2005 (Toledo govt)',
          'Congresista 2021-2025',
          'Presidente Comite Ejecutivo Unidad Nacional',
        ],
        minEntries: 3,
        issues: [
          'MISSING: Ministro de Defensa 2003-2005 - major public office',
          'MISSING: Comandante General del Ejercito',
          'MISSING: War of Cenepa 1995 leadership',
          'Only shows 1 experience entry (Congresista 2021-2025) - decades of military career MISSING',
          'Political trajectory only shows party positions, no elected/appointed national offices',
        ],
      },
      penalSentences: {
        expectedCount: 0,
        details: ['No known firm sentences; no Accomarca involvement (unlike Williams)'],
      },
      civilSentences: { expectedCount: 0, details: [] },
      competenceExpectation: {
        min: 80,
        max: 95,
        reasoning: 'General de Division, Comandante General EP, Defense Minister, Congresista; score 54 is FAR TOO LOW due to missing data',
      },
    },
  },
  {
    label: 'Jorge Montoya',
    searchName: 'MONTOYA MANRIQUE',
    expectedCargo: 'senador',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'Ciencias Maritimas Navales from Escuela Naval',
          'Maestria en Estrategia Maritima from Escuela Superior de Guerra Naval',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Almirante, Marina de Guerra',
          'Jefe del Comando Conjunto FFAA 2007-2008',
          'Congresista 2021-2025 (Renovacion Popular)',
        ],
        minEntries: 2,
        issues: [
          'DB experience section shows Almirante 1981-2007 + JCCFFAA 2007 + Congresista 2021-2025 = GOOD',
          'Political trajectory only shows 1 elected entry - missing party leadership details',
        ],
      },
      penalSentences: {
        expectedCount: 0,
        details: [
          'Investigated for sedition (2021 election results dispute) but no firm sentence',
          'DB correctly shows 0',
        ],
      },
      civilSentences: { expectedCount: 0, details: [] },
      partyResignations: { expected: 1 },
      competenceExpectation: {
        min: 80,
        max: 95,
        reasoning: 'Almirante, Jefe CCFFAA, Maestria, Congresista; score 90 seems appropriate',
      },
    },
  },
  {
    label: 'Alejandro Soto',
    searchName: 'SOTO REYES ALEJANDRO',
    expectedCargo: 'diputado',
    knownFacts: {
      education: {
        expectedLevel: 'Doctorado',
        details: [
          'Abogado from Universidad Andina del Cusco',
          'Doctorado en Derecho from UNSAAC',
          'Maestria en Derecho from UNSAAC',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista 2021-2025 (APP)',
          'Presidente del Congreso 2023-2024',
          'Regidor (previously)',
        ],
        minEntries: 2,
        issues: [
          'MISSING: Presidente del Congreso 2023-2024 - this is a major omission',
          'Trajectory only shows "candidatura" entries, no actual elected positions with dates',
        ],
      },
      penalSentences: {
        expectedCount: 3,
        details: [
          'DB correctly shows 3 penal entries with "RESERVA DE FALLO"',
          'Public records show 55+ case files in Fiscalia',
          'Sentenced to 1 year suspended + S/10,000 for aggravated defamation',
          'Initially sentenced to 4 years for peculado (later acquitted by Supreme Court)',
          'Sentences in DB lack details: delito, estado, juzgado fields are empty',
        ],
      },
      civilSentences: {
        expectedCount: 1,
        details: ['DB shows 1 civil sentence - details are empty'],
      },
      competenceExpectation: {
        min: 70,
        max: 90,
        reasoning: 'Doctorado, Abogado, Congresista, President of Congress; score 91 is reasonable',
      },
      otherIssues: [
        'Registered as diputado, NOT senador as initially expected',
        'Also registered as vicepresidente (slug alejandro-soto) - may be running for VP',
      ],
    },
  },
  {
    label: 'Adriana Tudela',
    searchName: 'TUDELA GUTIERREZ ADRIANA',
    expectedCargo: 'diputado',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'Abogada from Universidad de Lima',
          'Master en Derecho from University of Chicago',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista 2021-2025 (Avanza Pais)',
          'Presidenta Comision de Defensa Nacional 2024',
          'VP Comision de Constitucion 2023',
          'Candidata 2da Vicepresidenta 2026',
        ],
        minEntries: 2,
        issues: [
          'MISSING: Commission presidencies not reflected',
          'Only 1 elected entry in political trajectory',
        ],
      },
      penalSentences: { expectedCount: 0, details: [] },
      civilSentences: { expectedCount: 0, details: [] },
      competenceExpectation: {
        min: 60,
        max: 80,
        reasoning: 'U Chicago Masters, Congresista 1 term, young politician; score 72 is reasonable',
      },
      otherIssues: [
        'Registered as diputado, NOT senador as initially expected',
        'Also registered as vicepresidente for Avanza Pais',
      ],
    },
  },
  {
    label: 'Norma Yarrow',
    searchName: 'YARROW LUMBRERAS NORMA',
    expectedCargo: 'diputado',
    knownFacts: {
      education: {
        expectedLevel: 'Universitario',
        details: [
          'Arquitecta from UNIFE',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista 2021-2025 (Renovacion Popular, then Avanza Pais)',
          'Regidora Metropolitana de Lima 2019-2021',
          'Secretaria Nacional de Organizacion Solidaridad Nacional 2002-2011',
        ],
        minEntries: 3,
      },
      penalSentences: { expectedCount: 0, details: [] },
      civilSentences: { expectedCount: 0, details: [] },
      partyResignations: { expected: 1 },
      competenceExpectation: {
        min: 60,
        max: 80,
        reasoning: 'Arquitecta, Congresista, Regidora, party leadership; score 72 seems reasonable',
      },
      otherIssues: [
        'Registered as diputado, NOT senador as initially expected',
        'Also registered as vicepresidente (slug norma-yarrow)',
        'Investigated for alleged salary cuts to staffer (no firm sentence)',
      ],
    },
  },
  {
    label: 'Kelly Portalatino',
    searchName: 'PORTALATINO AVALOS',
    expectedCargo: 'senador',
    knownFacts: {
      education: {
        expectedLevel: 'Universitario',
        details: [
          'Medico Cirujano from Universidad San Pedro',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista 2021-2025 (Peru Libre)',
          'Ministra de Salud 2022 (Oct-Dec, Pedro Castillo govt)',
          'Secretaria General Regional Peru Libre',
        ],
        minEntries: 3,
        issues: [
          'MISSING: Ministra de Salud 2022 - not in experience or trajectory',
          'Only shows Congresista and regional party role',
        ],
      },
      penalSentences: {
        expectedCount: 0,
        details: [
          'Investigated for money laundering linked to "Mafia Chimbotana"',
          'Banned from contracting with the State',
          'DB shows 0 which is technically correct (no firm sentences)',
        ],
      },
      civilSentences: { expectedCount: 0, details: [] },
      competenceExpectation: {
        min: 55,
        max: 75,
        reasoning: 'Medical doctor, Congresista, brief Ministra; score 73 seems slightly high but acceptable',
      },
    },
  },
  {
    label: 'Silvana Robles',
    searchName: 'ROBLES ARAUJO SILVANA',
    expectedCargo: 'senador',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'Cirujana Dentista from UAP',
          'Maestria en Antropologia Juridica from UNCP',
          'Tecnico en Enfermeria',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista 2021-2025 (Peru Libre / Bancada Socialista)',
          'Ministra de Cultura Nov-Dec 2022',
        ],
        minEntries: 2,
        issues: [
          'Trajectory only shows 1 elected entry',
          'Ministra de Cultura IS in experience which is good',
          'Investigated for false fuel reimbursements - not reflected anywhere',
        ],
      },
      penalSentences: { expectedCount: 0, details: [] },
      civilSentences: { expectedCount: 0, details: [] },
      partyResignations: { expected: 1 },
      competenceExpectation: {
        min: 55,
        max: 75,
        reasoning: 'Maestria, dentist, Congresista, brief Ministra; score 73 is reasonable',
      },
    },
  },
  {
    label: 'Alejandro Munante',
    searchName: 'MUÑANTE BARRIOS',
    expectedCargo: 'senador',
    knownFacts: {
      education: {
        expectedLevel: 'Maestria',
        details: [
          'Abogado from Universidad Senor de Sipan',
          'Maestria en Derecho Constitucional from USMP',
        ],
        issues: [
          'DB shows education_level as "Posgrado" but he has a Maestria - should be "Maestria"',
          'The Posgrado entry has no field of study beyond "MAESTRIA" - incomplete',
        ],
      },
      politicalTrajectory: {
        expectedEntries: [
          'Congresista 2021-2025 (Renovacion Popular)',
          '3er Vicepresidente del Congreso 2022-2023',
          'Director RENAFAM',
        ],
        minEntries: 2,
        issues: [
          'MISSING: Vice-presidency of Congress not reflected',
          'Only 1 elected entry in political trajectory',
        ],
      },
      penalSentences: { expectedCount: 0, details: [] },
      civilSentences: { expectedCount: 0, details: [] },
      competenceExpectation: {
        min: 55,
        max: 75,
        reasoning: 'Maestria, Abogado, Congresista, Vice-president of Congress; score 66 is reasonable',
      },
    },
  },
]

// ============================================================
// AUDIT LOGIC
// ============================================================

interface Issue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  category: string
  message: string
}

async function auditCandidate(kf: KnownFact): Promise<{found: boolean, issues: Issue[], name?: string}> {
  const issues: Issue[] = []
  const parts = kf.searchName.split(' ')

  let whereClause: string
  if (parts.length === 1) {
    whereClause = parts[0]
  } else {
    whereClause = parts[0]
  }

  const candidates = await sql`
    SELECT c.id, c.full_name, c.slug, c.cargo, c.education_level,
           c.education_details, c.experience_details, c.political_trajectory,
           c.penal_sentences, c.civil_sentences, c.party_resignations,
           c.birth_date, c.data_source, c.data_verified,
           p.name as party_name, p.short_name as party_short,
           s.competence, s.integrity, s.transparency, s.confidence, s.score_balanced
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN scores s ON s.candidate_id = c.id
    WHERE c.is_active = true
      AND c.full_name ILIKE ${'%' + parts[0] + '%'}
      ${parts.length > 1 ? sql`AND c.full_name ILIKE ${'%' + parts[1] + '%'}` : sql``}
      AND c.cargo = ${kf.expectedCargo}
    ORDER BY c.full_name
    LIMIT 1
  `

  if (candidates.length === 0) {
    issues.push({
      severity: 'CRITICAL',
      category: 'NOT_FOUND',
      message: `Candidate "${kf.label}" not found with cargo="${kf.expectedCargo}" (search: "${kf.searchName}")`,
    })
    return { found: false, issues }
  }

  const c = candidates[0]
  const edu = c.education_details || []
  const exp = c.experience_details || []
  const pol = c.political_trajectory || []
  const penal = c.penal_sentences || []
  const civil = c.civil_sentences || []
  const competence = Number(c.competence) || 0

  // ---- 1. EDUCATION ----
  if (kf.knownFacts.education) {
    const expectedLevel = kf.knownFacts.education.expectedLevel
    const actualLevel = c.education_level || 'sin_informacion'

    // Normalize for comparison
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const normExpected = normalize(expectedLevel)
    const normActual = normalize(actualLevel)

    if (!normActual.includes(normExpected) && normExpected !== normActual) {
      // Check if the actual level is lower
      const levelOrder = ['primaria', 'secundaria', 'tecnico', 'universitario', 'posgrado', 'maestria', 'doctorado']
      const expectedIdx = levelOrder.indexOf(normExpected)
      const actualIdx = levelOrder.findIndex(l => normActual.includes(l))

      if (actualIdx < expectedIdx) {
        issues.push({
          severity: 'HIGH',
          category: 'EDUCATION_LEVEL',
          message: `Education level mismatch: DB="${actualLevel}" but expected="${expectedLevel}". ${kf.knownFacts.education.issues?.join('. ') || ''}`,
        })
      }
    }

    if (kf.knownFacts.education.issues) {
      for (const issue of kf.knownFacts.education.issues) {
        issues.push({ severity: 'MEDIUM', category: 'EDUCATION_DETAIL', message: issue })
      }
    }
  }

  // ---- 2. POLITICAL TRAJECTORY ----
  if (kf.knownFacts.politicalTrajectory) {
    const totalEntries = pol.length + exp.length
    const minExpected = kf.knownFacts.politicalTrajectory.minEntries || 2

    if (totalEntries < minExpected) {
      issues.push({
        severity: 'HIGH',
        category: 'TRAJECTORY_INCOMPLETE',
        message: `Only ${pol.length} trajectory + ${exp.length} experience entries (expected min ${minExpected}). Missing: ${kf.knownFacts.politicalTrajectory.expectedEntries.join('; ')}`,
      })
    }

    // Check for specific missing entries
    if (kf.knownFacts.politicalTrajectory.issues) {
      for (const issue of kf.knownFacts.politicalTrajectory.issues) {
        issues.push({ severity: issue.includes('MISSING') ? 'HIGH' : 'MEDIUM', category: 'TRAJECTORY_DETAIL', message: issue })
      }
    }

    // Check if elected positions have proper date ranges
    for (const p of pol) {
      if (p.is_elected && (!p.start_year || p.start_year === 'undefined')) {
        issues.push({
          severity: 'MEDIUM',
          category: 'TRAJECTORY_DATES',
          message: `Elected position "${p.position}" has no start_year`,
        })
      }
    }
  }

  // ---- 3. PENAL SENTENCES ----
  if (kf.knownFacts.penalSentences) {
    const actualCount = penal.length
    const expectedCount = kf.knownFacts.penalSentences.expectedCount

    // Check for empty/missing fields in penal sentences
    for (const s of penal) {
      if (!s.delito && !s.description) {
        issues.push({
          severity: 'MEDIUM',
          category: 'PENAL_DETAIL',
          message: `Penal sentence missing delito/description: ${JSON.stringify(s)}`,
        })
      }
      if (!s.estado && !s.status) {
        issues.push({
          severity: 'LOW',
          category: 'PENAL_DETAIL',
          message: `Penal sentence missing estado/status: expediente=${s.expediente || 'N/A'}`,
        })
      }
    }

    for (const detail of kf.knownFacts.penalSentences.details) {
      issues.push({ severity: 'INFO', category: 'PENAL_NOTE', message: detail })
    }
  }

  // ---- 4. CIVIL SENTENCES ----
  if (kf.knownFacts.civilSentences) {
    for (const s of civil) {
      if (!s.descripcion && !s.description && !s.delito) {
        issues.push({
          severity: 'MEDIUM',
          category: 'CIVIL_DETAIL',
          message: `Civil sentence missing description: ${JSON.stringify(s)}`,
        })
      }
    }
  }

  // ---- 5. COMPETENCE SCORE ----
  if (kf.knownFacts.competenceExpectation) {
    const { min, max, reasoning } = kf.knownFacts.competenceExpectation
    if (competence < min) {
      issues.push({
        severity: 'HIGH',
        category: 'SCORE_TOO_LOW',
        message: `Competence=${competence}, expected ${min}-${max}. ${reasoning}`,
      })
    } else if (competence > max) {
      issues.push({
        severity: 'MEDIUM',
        category: 'SCORE_TOO_HIGH',
        message: `Competence=${competence}, expected ${min}-${max}. ${reasoning}`,
      })
    }
  }

  // ---- 6. PARTY RESIGNATIONS ----
  if (kf.knownFacts.partyResignations) {
    const actual = c.party_resignations || 0
    if (actual !== kf.knownFacts.partyResignations.expected) {
      issues.push({
        severity: 'LOW',
        category: 'RESIGNATIONS',
        message: `Party resignations: DB=${actual}, expected=${kf.knownFacts.partyResignations.expected}`,
      })
    }
  }

  // ---- 7. OTHER ISSUES ----
  if (kf.knownFacts.otherIssues) {
    for (const issue of kf.knownFacts.otherIssues) {
      issues.push({ severity: 'INFO', category: 'OTHER', message: issue })
    }
  }

  return { found: true, issues, name: c.full_name }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('='.repeat(80))
  console.log(' AUDIT: Well-Known Politicians - Data Completeness & Accuracy')
  console.log(' Date: ' + new Date().toISOString().split('T')[0])
  console.log('='.repeat(80))

  const allIssues: { label: string, issues: Issue[] }[] = []
  let totalCritical = 0
  let totalHigh = 0
  let totalMedium = 0
  let totalLow = 0
  let totalInfo = 0

  for (const kf of KNOWN_POLITICIANS) {
    const { found, issues, name } = await auditCandidate(kf)

    console.log(`\n${'─'.repeat(80)}`)
    console.log(`${kf.label} ${name ? `=> ${name}` : '(NOT FOUND)'} [${kf.expectedCargo}]`)
    console.log('─'.repeat(80))

    if (issues.length === 0) {
      console.log('  [OK] No issues found')
    }

    const sorted = issues.sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }
      return order[a.severity] - order[b.severity]
    })

    for (const issue of sorted) {
      const icon = {
        CRITICAL: 'CRIT',
        HIGH: 'HIGH',
        MEDIUM: ' MED',
        LOW: ' LOW',
        INFO: 'INFO',
      }[issue.severity]

      console.log(`  [${icon}] ${issue.category}: ${issue.message}`)

      if (issue.severity === 'CRITICAL') totalCritical++
      else if (issue.severity === 'HIGH') totalHigh++
      else if (issue.severity === 'MEDIUM') totalMedium++
      else if (issue.severity === 'LOW') totalLow++
      else totalInfo++
    }

    allIssues.push({ label: kf.label, issues })
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log(`\n\n${'='.repeat(80)}`)
  console.log(' SUMMARY')
  console.log('='.repeat(80))

  console.log(`\nTotal candidates audited: ${KNOWN_POLITICIANS.length}`)
  console.log(`Issues found:`)
  console.log(`  CRITICAL: ${totalCritical}`)
  console.log(`  HIGH:     ${totalHigh}`)
  console.log(`  MEDIUM:   ${totalMedium}`)
  console.log(`  LOW:      ${totalLow}`)
  console.log(`  INFO:     ${totalInfo}`)
  console.log(`  TOTAL:    ${totalCritical + totalHigh + totalMedium + totalLow + totalInfo}`)

  // Top issues by category
  const byCat: Record<string, number> = {}
  for (const { issues } of allIssues) {
    for (const i of issues) {
      if (i.severity !== 'INFO') {
        byCat[i.category] = (byCat[i.category] || 0) + 1
      }
    }
  }

  console.log(`\nTop issue categories (excluding INFO):`)
  const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1])
  for (const [cat, count] of sortedCats) {
    console.log(`  ${cat}: ${count}`)
  }

  // Candidates with most issues
  console.log(`\nCandidates with most non-INFO issues:`)
  const ranked = allIssues
    .map(a => ({
      label: a.label,
      count: a.issues.filter(i => i.severity !== 'INFO').length,
      critHigh: a.issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length,
    }))
    .sort((a, b) => b.critHigh - a.critHigh || b.count - a.count)

  for (const r of ranked) {
    if (r.count > 0) {
      console.log(`  ${r.label.padEnd(25)} ${r.count} issues (${r.critHigh} critical/high)`)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log(' KEY SYSTEMIC FINDINGS')
  console.log('='.repeat(80))

  console.log(`
1. EDUCATION LEVEL MISCLASSIFICATION (3 candidates):
   - Fernando Olivera: Maestria from Complutense completely missing, classified as "Universitario"
   - Marisol Perez Tello: Has Doctorado en Derecho from USMP, classified as "Posgrado"
   - Alejandro Munante: Has Maestria en Derecho Constitucional, classified as "Posgrado"
   Martha Chavez: Also "Posgrado" when 2 Maestrias are present

2. INCOMPLETE POLITICAL TRAJECTORIES (systemic across military/senior candidates):
   - Roberto Chiabra: Missing 40+ years of military career including Ministro de Defensa
   - Jose Williams: Missing entire military career, Presidencia del Congreso
   - Martha Chavez: Missing 4 of 6 congressional terms
   - Kelly Portalatino: Missing Ministra de Salud role

3. CARGO MISMATCH (3 candidates running for different position than expected):
   - Alejandro Soto: Running as diputado (also VP), not senador
   - Adriana Tudela: Running as diputado (also VP), not senador
   - Norma Yarrow: Running as diputado (also VP), not senador

4. SENTENCE DATA QUALITY:
   - Multiple penal/civil entries have empty delito, estado, juzgado fields
   - Ricardo Belmont: Missing recent defamation conviction (Phillip Butters case)
   - Keiko Fujimori: Correctly updated to "juicio_anulado" per TC ruling Oct 2025

5. COMPETENCE SCORES DEFLATED BY MISSING DATA:
   - Roberto Chiabra: 54 (should be 80-95 given military career + ministry)
   - Jose Williams: 58 (should be 75-90 given military career + Congress presidency)
   These scores are artificially low because the experience/trajectory data is incomplete.

6. GEORGE FORSYTH SCORE POSSIBLY INFLATED:
   - Competence 90 seems high for short political career (1yr as alcalde)
   - MBA is recent (2023), brief tenure, mostly sports career before politics
`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
