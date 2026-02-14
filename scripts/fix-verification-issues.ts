/**
 * Fix all issues found during deep extraction verification
 * - DELETE all INVENTADO proposals (54)
 * - CORRECT all DISTORSIONADO proposals (6)
 */
import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const dbMatch = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return { db: dbMatch![1] }
}

const env = loadEnv()
const sql = neon(env.db)

// All 54 INVENTADO proposal IDs to DELETE
const INVENTADO_IDS = [
  // Gonzales (1)
  'd4348682-7814-4516-b1eb-f2a6a5d09538', // 35% empresas con innovación tecnológica
  // Guevara (49)
  '72876f06-ca72-484d-acb7-4bbeb0771529', // Clústeres de Producción de Alimentos Biofortificados
  '44722531-bbb6-4286-82de-c357cc84eaf9', // Comedores Escolares con Productores Locales
  'c384a800-d727-4c4c-92bd-dea2ff449a83', // Empleo Verde en Huertos Urbanos
  'ba5943bf-3a12-47ec-bbe1-92aae9b519be', // Programa 'Del Campo al Trabajo'
  '2ac150c4-03ec-4188-92e1-207e20f40723', // Incentivos fiscales para empresas rurales
  '0ec97bdc-457f-41d2-8569-7af14c61fc78', // Huertos familiares tecnificados
  '7e5802ec-1aed-4411-98a2-729e87b67306', // Bolsas de trabajo especializadas para zonas rurales
  '7ff46dd9-aaae-4671-aae3-9f9c3e4b8a16', // Programa de Formalización de Pequeños Agricultores
  '54c7b59c-9ec1-4655-a873-c5f4b99ddf9f', // Educación nutricional a cuidadores
  'd917bfe7-8333-4a5a-b743-f8ff00286df2', // Capacitación en agricultura familiar nutricional
  'd1451305-a6f1-436d-af0f-eb2b0ff89430', // Promoción de prácticas de higiene
  '7f2e1dff-6c92-4a66-8041-a5af2e8dc325', // Acceso a agua potable y alcantarillado
  'a7459b26-a5dc-46f5-a522-ff9daf0b713d', // Sistema de vigilancia nutricional integrado
  '8517d4bf-9e2e-4d59-a0c5-37d956f92d46', // Suplementación universal con hierro
  '3f50f897-8526-4479-927b-9dfb8fbd21e4', // Desparasitación periódica programada
  '7f719ba8-69b0-426a-86cd-e133af15dc11', // Fortalecimiento del Programa Wasi Mikuna
  '3a9c2862-73d4-4c37-8ffa-3822fa0229fe', // Programa Vaso de Leche mejorado
  '1effbb9f-e78f-4f70-9df3-07e7cf850994', // Canasta básica nutricional subsidiada
  'f7626169-d05d-498b-916d-28c43de2aaa1', // Promoción de cadenas productivas de superalimentos
  '41839710-af2d-49ea-8d6e-e8740f2d3d2b', // Industria de alimentos fortificados
  '2bba6dbd-98d7-4159-a395-0a88e2a5fed5', // Cadenas de frío para transporte
  'eca33954-d27c-45a8-9069-04604591a9ec', // Planificación Estratégica (coordinación)
  '9b49ab0f-0ed2-45a9-b4dd-3685287182ad', // Red Nacional de Cadenas de Frío
  '86bdaf08-d312-4fa8-9feb-7a595f49604e', // Centros de acopio con conservación
  '466e25d0-21fa-49d5-839a-dda78c4d754f', // Rutas alimentarias
  '505b6f99-ba96-4381-adf0-0820c926917f', // Mercados de abastos modernos digitalmente
  'fb289865-b8ef-4aa0-a94f-45fab7088462', // Mercados de Abastos Modernos Conectados Digitalmente
  '64fa0523-0cb0-4926-9464-b0103a3e303b', // Plataforma Nacional de Educación Digital "PerúAprende"
  '397ab9b5-ab00-404f-841d-ba39f4da44b6', // Conectividad universal en escuelas
  'd17f06f4-a164-437e-a240-279f247f2909', // Inversión quinquenal en educación digital
  '911c4e05-3d20-4e67-ae82-1d80acf65b40', // Universidades para la tercera edad
  '46c21e83-617d-492f-a607-020604cf9972', // Certificación de competencias digitales
  '6bd41301-61df-44b4-82ce-bd36695856d5', // Plataformas Adaptativas con IA para Matemáticas
  '9cbe6a54-dcbb-4155-8243-5421796d483e', // Tablets educativas con contenido offline
  'ce642565-bfd2-40e0-95d9-c947b87b12d8', // Plataforma nacional de educación digital
  '837ff699-e665-4f09-8407-de14cf36bb81', // Conectividad de alta velocidad en instituciones
  'e65a4e06-1056-4153-b927-d18f8326a4a7', // Plataforma accesible para personas con discapacidad
  'f4f5d223-a37c-4834-bc7d-7be3b690b165', // App "Crianza Temprana Digital" con tutoría de IA
  '9f7b2f2d-49d3-41b8-b1cd-d978109855b1', // Alfabetización digital para tercera edad
  '9c8cc8b6-ea90-4bc3-a0e9-28442775fd58', // App "Crianza Temprana Digital" (inversión)
  'e662a184-14f3-4ae3-8287-1ac749ce9934', // Universidades de la Tercera Edad (inversión)
  '483b3e9c-c44c-43c1-90e4-752f8c232c7e', // Alfabetización digital para adultos mayores (inversión)
  '9832d844-7ab6-441a-9a49-9da5781e24a4', // Equipamiento digital para estudiantes
  '8412483a-5705-4f76-a22e-96f9d02db0af', // Plataformas Públicas Multilingües
  '2c2d746d-e851-462e-818d-6d0f0fa68d53', // Identidad de Género Auto percibida
  'd5f4556f-23da-4942-8075-34ee88ba4b2a', // DNI Digital Accesible Universal
  'e34bb0b1-8a07-414e-a434-02f2ee174740', // Asistentes Digitales para Adultos Mayores
  'f8eeb0ff-af29-45fe-adbd-6dea6d118c58', // Tecnología de Asistencia Subsidiada
  'ae570d0b-0945-4ef9-9bc7-ff4a1e862a8a', // Evaluación intermedia y ajustes en Fase 3
  // Vizcarra (4)
  '1e4d383f-35ba-4cdf-9edd-55e8c60734dd', // Acceso a servicios básicos (meta, no propuesta)
  '859c37bb-e82e-4975-819a-35af72534ae4', // Planes multisectoriales (meta, no propuesta)
  'f1e35569-fc13-483b-88bd-f0195cb3943b', // Sistemas de evaluación (meta, no propuesta)
  '9ca9527f-118e-4a6f-9de8-0a9b22d8993c', // Identificación hogares (meta, no propuesta)
]

// 6 DISTORSIONADO proposals to correct
const DISTORSIONADO_FIXES: { id: string; title: string; description: string }[] = [
  {
    id: '2e9c482d-42e0-413a-924a-d19d5f1dd8e6',
    // Gonzales: "Plataformas móviles para zonas rurales e indígenas" → real: brigadas itinerantes
    title: 'Brigadas itinerantes de servicios esenciales para zonas rurales',
    description: 'Brigadas itinerantes que lleven servicios esenciales a zonas rurales y comunidades indígenas, garantizando acceso a servicios del Estado en áreas remotas.',
  },
  {
    id: 'd658438a-60fa-454c-a08b-ce25060feebd',
    // Guevara: "Planificación Estratégica" → distorsionado sobre articulación MINSA-MIDIS
    title: 'Articulación MINSA-MIDIS para romper silos burocráticos',
    description: 'Implementación de articulación entre MINSA y MIDIS para romper silos burocráticos mediante el modelo VSM (Viable System Model) en la gestión pública de salud y desarrollo social.',
  },
  {
    id: 'cc295bcb-fd8f-4568-8db5-affa1229cd71',
    // Guevara: "Planificación Estratégica" → distorsionado sobre articulación MIDIS-MINAGRI
    title: 'Articulación MIDIS-MINAGRI-gobiernos locales para compras estatales',
    description: 'Articulación entre MIDIS, MINAGRI y gobiernos locales para coordinar compras estatales de alimentos en el marco de la planificación estratégica del Estado.',
  },
  {
    id: 'edb8b5b3-b6a7-4048-a47a-58d0b95a1b74',
    // Lopez Chau: "Docentes con manejo efectivo de nuevas metodologías" → corrected
    title: 'Egresados de formación docente con competencias en salud y protección integral',
    description: 'Meta de que el 100% de egresados de formación inicial docente cuenten con competencias en salud y protección integral, con manejo efectivo de nuevas metodologías educativas.',
  },
  {
    id: 'f562d9ff-19be-49a1-9007-367dd94472c4',
    // Luna Galvez: "Mejorar la productividad laboral promedio de las PYMEs al 50% del PBI" → 20%
    title: 'Mejorar la productividad laboral promedio de las PYMEs al 20% del PBI',
    description: 'Incrementar la productividad laboral promedio de las pequeñas y medianas empresas para que alcance el 20% del PBI nacional, con meta de participación del 50% en el mercado formal.',
  },
  {
    id: '106f27c1-e8c9-4f7b-b558-65ace849530c',
    // Vizcarra: "Articular proyectos regionales con cofinanciamiento nacional" → corrected percentage
    title: 'Articular el 60% de proyectos regionales con cofinanciamiento nacional',
    description: 'Meta de articular el 60% de proyectos regionales con esquemas de cofinanciamiento nacional para mejorar la inversión pública descentralizada.',
  },
]

async function main() {
  console.log('='.repeat(70))
  console.log(' CORRECCIÓN DE PROPUESTAS PROBLEMÁTICAS')
  console.log('='.repeat(70))

  // 1. Delete INVENTADO
  console.log(`\n🗑️  Eliminando ${INVENTADO_IDS.length} propuestas INVENTADAS...`)
  let deleted = 0
  for (const id of INVENTADO_IDS) {
    try {
      const result = await sql`DELETE FROM candidate_proposals WHERE id = ${id}`
      deleted++
    } catch (err: any) {
      console.log(`  ❌ Error deleting ${id}: ${err.message?.slice(0, 80)}`)
    }
  }
  console.log(`  ✅ ${deleted}/${INVENTADO_IDS.length} eliminadas`)

  // 2. Correct DISTORSIONADO
  console.log(`\n✏️  Corrigiendo ${DISTORSIONADO_FIXES.length} propuestas DISTORSIONADAS...`)
  let corrected = 0
  for (const fix of DISTORSIONADO_FIXES) {
    try {
      await sql`UPDATE candidate_proposals SET title = ${fix.title}, description = ${fix.description} WHERE id = ${fix.id}`
      corrected++
      console.log(`  ✅ ${fix.title.slice(0, 60)}`)
    } catch (err: any) {
      console.log(`  ❌ Error updating ${fix.id}: ${err.message?.slice(0, 80)}`)
    }
  }
  console.log(`  ✅ ${corrected}/${DISTORSIONADO_FIXES.length} corregidas`)

  // 3. Final count
  const total = await sql`
    SELECT COUNT(*) as count FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log(`\n📊 Total propuestas ahora: ${total[0].count}`)

  // Per candidate summary
  const perCandidate = await sql`
    SELECT c.full_name, COUNT(cp.id) as count
    FROM candidates c
    LEFT JOIN candidate_proposals cp ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY c.id, c.full_name
    ORDER BY count DESC
  `
  console.log('\nPropuestas por candidato:')
  for (const c of perCandidate) {
    console.log(`  ${String(c.count).padStart(5)} | ${c.full_name}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
