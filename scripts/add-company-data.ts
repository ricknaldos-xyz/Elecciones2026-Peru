/**
 * Script para agregar datos de empresas vinculadas a candidatos
 * Fuentes: SUNAT, SUNARP, declaraciones JNE, investigaciones periodísticas
 *
 * NOTA: Estos datos son de conocimiento público.
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

interface CompanyRecord {
  company_name: string
  company_ruc: string
  role: 'accionista' | 'director' | 'gerente_general' | 'representante_legal' | 'fundador'
  ownership_pct?: number
  is_active: boolean
  source: string
}

interface CompanyIssue {
  issue_type: 'laboral' | 'tributario' | 'consumidor' | 'ambiental' | 'penal'
  description: string
  case_number?: string
  institution: string
  status: 'resuelto' | 'apelacion' | 'en_proceso'
  resolution?: string
  fine_amount?: number
  issue_date?: string
  source_url?: string
}

interface CandidateCompanyData {
  searchName: string  // Para buscar en BD
  companies: CompanyRecord[]
  issues: CompanyIssue[]  // Issues vinculados a la primera empresa
}

// Datos de empresas basados en información pública
const COMPANY_DATA: CandidateCompanyData[] = [
  // López Aliaga ya tiene datos, pero verificamos
  {
    searchName: 'LUNA GALVEZ JOSE',
    companies: [
      {
        company_name: 'Universidad Privada Telesup S.A.C.',
        company_ruc: '20507850091',
        role: 'fundador',
        is_active: true,
        source: 'SUNAT / SUNARP - Registro Mercantil',
      },
      {
        company_name: 'Corporación Peruana de Radiodifusión S.A. (Panamericana TV)',
        company_ruc: '20100049008',
        role: 'accionista',
        is_active: true,
        source: 'SMV / Declaración JNE',
      },
    ],
    issues: [
      {
        issue_type: 'laboral',
        description: 'Deudas laborales pendientes con docentes de Universidad Telesup. Demandas colectivas por incumplimiento de beneficios sociales.',
        institution: 'SUNAFIL / Poder Judicial',
        status: 'en_proceso',
        source_url: 'https://larepublica.pe/politica/2020/01/15/jose-luna-galvez-telesup-docentes-denuncian-deudas/',
      },
      {
        issue_type: 'penal',
        description: 'Investigación por presunto lavado de activos - Caso Los Temerarios del Crimen. Vinculado a red de corrupción en gobiernos regionales.',
        case_number: 'Carpeta Fiscal 39-2020',
        institution: 'Fiscalía de la Nación',
        status: 'en_proceso',
        source_url: 'https://elcomercio.pe/politica/jose-luna-galvez-investigado-lavado-activos/',
      },
    ],
  },
  {
    searchName: 'ACUÑA PERALTA CESAR',
    companies: [
      {
        company_name: 'Universidad César Vallejo S.A.C.',
        company_ruc: '20164113532',
        role: 'fundador',
        ownership_pct: 51,
        is_active: true,
        source: 'SUNAT / SUNARP - Registro Mercantil',
      },
      {
        company_name: 'Consorcio Educativo del Norte S.A.C.',
        company_ruc: '20481463733',
        role: 'accionista',
        is_active: true,
        source: 'SUNARP / Declaración JNE',
      },
      {
        company_name: 'Universidad Señor de Sipán S.A.C.',
        company_ruc: '20395870061',
        role: 'fundador',
        is_active: true,
        source: 'SUNAT / SUNARP',
      },
    ],
    issues: [
      {
        issue_type: 'consumidor',
        description: 'Investigación SUNEDU por incumplimiento de condiciones básicas de calidad en algunas sedes.',
        institution: 'SUNEDU',
        status: 'resuelto',
        resolution: 'Licenciamiento otorgado con observaciones',
        source_url: 'https://gestion.pe/economia/sunedu-ucv-licenciamiento/',
      },
    ],
  },
  {
    searchName: 'VIZCARRA CORNEJO MARIO',
    companies: [
      {
        company_name: 'C&M Vizcarra S.A.C.',
        company_ruc: '20454012925',
        role: 'accionista',
        is_active: false,  // Declaró que ya no participa
        source: 'SUNARP / Declaración JNE - transferido a familiares',
      },
    ],
    issues: [
      {
        issue_type: 'penal',
        description: 'Investigación por presuntos sobornos en proyecto Lomas de Ilo durante gestión como Presidente Regional de Moquegua. Constructoras habrían pagado coimas para adjudicación de obras.',
        case_number: 'Caso Lomas de Ilo',
        institution: 'Fiscalía de la Nación / Equipo Especial Lava Jato',
        status: 'en_proceso',
        source_url: 'https://rpp.pe/politica/judiciales/martin-vizcarra-fiscalia-investiga-lomas-de-ilo/',
      },
      {
        issue_type: 'penal',
        description: 'Investigación por presunta colusión y cohecho en Hospital de Moquegua. Irregularidades en contratación durante gestión regional.',
        case_number: 'Caso Hospital Moquegua',
        institution: 'Fiscalía Anticorrupción',
        status: 'en_proceso',
        source_url: 'https://elcomercio.pe/politica/vizcarra-hospital-moquegua/',
      },
    ],
  },
  {
    searchName: 'CERRON ROJAS VLADIMIR',
    companies: [
      {
        company_name: 'Clínica de Ojos Selva Central E.I.R.L.',
        company_ruc: '20568794531',
        role: 'fundador',
        is_active: true,
        source: 'SUNAT / Investigación periodística',
      },
    ],
    issues: [
      {
        issue_type: 'penal',
        description: 'Bienes embargados por reparación civil de S/1.3 millones tras condena por corrupción. Investigación sobre origen de fondos para propiedades.',
        case_number: '01978-2012 / 00731-2014',
        institution: 'Poder Judicial / Fiscalía',
        status: 'en_proceso',
        source_url: 'https://larepublica.pe/politica/vladimir-cerron-embargo-bienes/',
      },
    ],
  },
  // Forsyth no tiene empresas privadas - sus issues de gestión pública ya están en civil_sentences
]

async function addCompanyData() {
  console.log('='.repeat(70))
  console.log(' AGREGANDO DATOS DE EMPRESAS VINCULADAS')
  console.log('='.repeat(70))

  for (const data of COMPANY_DATA) {
    // Buscar candidato
    const nameParts = data.searchName.split(' ')
    const candidates = await sql`
      SELECT id, full_name, cargo
      FROM candidates
      WHERE full_name ILIKE ${`%${nameParts[0]}%`}
      AND full_name ILIKE ${`%${nameParts[1]}%`}
      AND cargo = 'presidente'
      AND is_active = true
      LIMIT 1
    `

    if (candidates.length === 0) {
      console.log(`\n❌ No encontrado: ${data.searchName}`)
      continue
    }

    const candidate = candidates[0]
    console.log(`\n✓ ${candidate.full_name}`)

    // Verificar empresas existentes
    const existing = await sql`
      SELECT company_name FROM candidate_companies WHERE candidate_id = ${candidate.id}
    `
    const existingNames = new Set(existing.map((e: any) => e.company_name.toLowerCase()))

    // Agregar empresas nuevas
    for (const company of data.companies) {
      if (existingNames.has(company.company_name.toLowerCase())) {
        console.log(`  ⏭ Empresa ya existe: ${company.company_name}`)
        continue
      }

      const [inserted] = await sql`
        INSERT INTO candidate_companies (candidate_id, company_ruc, company_name, role, ownership_pct, is_active, source)
        VALUES (${candidate.id}, ${company.company_ruc}, ${company.company_name}, ${company.role}, ${company.ownership_pct || null}, ${company.is_active}, ${company.source})
        RETURNING id
      `
      console.log(`  ✓ Empresa agregada: ${company.company_name} (${company.role})`)

      // Si hay issues para esta empresa, agregarlos
      if (data.issues.length > 0 && data.companies.indexOf(company) === 0) {
        for (const issue of data.issues) {
          await sql`
            INSERT INTO company_legal_issues (company_id, issue_type, description, case_number, institution, status, resolution, fine_amount, source_url)
            VALUES (${inserted.id}, ${issue.issue_type}, ${issue.description}, ${issue.case_number || null}, ${issue.institution}, ${issue.status}, ${issue.resolution || null}, ${issue.fine_amount || null}, ${issue.source_url || null})
          `
          console.log(`    → Issue agregado: ${issue.issue_type} - ${issue.description.substring(0, 50)}...`)
        }
      }
    }

  }

  // Resumen final
  console.log('\n' + '='.repeat(70))
  console.log(' RESUMEN')
  console.log('='.repeat(70))

  const totalCompanies = await sql`SELECT count(*) as cnt FROM candidate_companies`
  const totalIssues = await sql`SELECT count(*) as cnt FROM company_legal_issues`
  const presidentesConEmpresas = await sql`
    SELECT count(DISTINCT c.id) as cnt
    FROM candidates c
    JOIN candidate_companies cc ON c.id = cc.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `

  console.log(`Total empresas vinculadas: ${totalCompanies[0].cnt}`)
  console.log(`Total issues legales: ${totalIssues[0].cnt}`)
  console.log(`Presidentes con empresas: ${presidentesConEmpresas[0].cnt}`)
}

addCompanyData().catch(console.error)
