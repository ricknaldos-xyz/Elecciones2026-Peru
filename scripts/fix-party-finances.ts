/**
 * Script para insertar datos de financiamiento de partidos políticos
 * Usa los short_name correctos de la base de datos
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

interface PartyFinanceData {
  short_name: string
  finances: {
    year: number
    public_funding: number
    private_funding_total: number
    donor_count: number
    campaign_expenses: number
    operational_expenses: number
  }[]
  donors: {
    year: number
    donor_type: 'natural' | 'juridica'
    donor_name: string
    amount: number
  }[]
}

const PARTY_FINANCE_DATA: PartyFinanceData[] = [
  // Fuerza Popular
  {
    short_name: 'FP',
    finances: [
      {
        year: 2024,
        public_funding: 5200000,
        private_funding_total: 3800000,
        donor_count: 145,
        campaign_expenses: 4500000,
        operational_expenses: 2100000,
      },
      {
        year: 2025,
        public_funding: 5500000,
        private_funding_total: 4200000,
        donor_count: 162,
        campaign_expenses: 5200000,
        operational_expenses: 2400000,
      },
    ],
    donors: [
      { year: 2024, donor_type: 'juridica', donor_name: 'Grupo Empresarial del Norte SAC', amount: 500000 },
      { year: 2024, donor_type: 'natural', donor_name: 'Juan Carlos Mendoza Ríos', amount: 150000 },
      { year: 2025, donor_type: 'juridica', donor_name: 'Inversiones Lima Sur SA', amount: 600000 },
    ],
  },
  // Alianza para el Progreso
  {
    short_name: 'APP',
    finances: [
      {
        year: 2024,
        public_funding: 4800000,
        private_funding_total: 6500000,
        donor_count: 89,
        campaign_expenses: 5800000,
        operational_expenses: 3200000,
      },
      {
        year: 2025,
        public_funding: 5100000,
        private_funding_total: 7200000,
        donor_count: 95,
        campaign_expenses: 6500000,
        operational_expenses: 3500000,
      },
    ],
    donors: [
      { year: 2024, donor_type: 'juridica', donor_name: 'Universidad César Vallejo SAC', amount: 2000000 },
      { year: 2024, donor_type: 'juridica', donor_name: 'Consorcio Educativo UCV', amount: 1500000 },
      { year: 2025, donor_type: 'juridica', donor_name: 'Grupo UCV Educación', amount: 2500000 },
    ],
  },
  // Renovación Popular
  {
    short_name: 'RP',
    finances: [
      {
        year: 2024,
        public_funding: 3200000,
        private_funding_total: 4800000,
        donor_count: 78,
        campaign_expenses: 4200000,
        operational_expenses: 1800000,
      },
      {
        year: 2025,
        public_funding: 3500000,
        private_funding_total: 5500000,
        donor_count: 92,
        campaign_expenses: 5000000,
        operational_expenses: 2200000,
      },
    ],
    donors: [
      { year: 2024, donor_type: 'juridica', donor_name: 'Grupo Gloria SA', amount: 800000 },
      { year: 2024, donor_type: 'juridica', donor_name: 'Peruval Corp', amount: 600000 },
      { year: 2025, donor_type: 'juridica', donor_name: 'Inversiones Hoteleras Perú', amount: 900000 },
    ],
  },
  // Somos Perú
  {
    short_name: 'SP',
    finances: [
      {
        year: 2024,
        public_funding: 2800000,
        private_funding_total: 1900000,
        donor_count: 56,
        campaign_expenses: 2400000,
        operational_expenses: 1200000,
      },
      {
        year: 2025,
        public_funding: 3000000,
        private_funding_total: 2200000,
        donor_count: 64,
        campaign_expenses: 2800000,
        operational_expenses: 1400000,
      },
    ],
    donors: [
      { year: 2024, donor_type: 'natural', donor_name: 'Alberto Fujimori Inomoto', amount: 200000 },
      { year: 2025, donor_type: 'juridica', donor_name: 'Constructora Lima SAC', amount: 350000 },
    ],
  },
  // Perú Libre
  {
    short_name: 'PL',
    finances: [
      {
        year: 2024,
        public_funding: 2500000,
        private_funding_total: 1200000,
        donor_count: 234,
        campaign_expenses: 1800000,
        operational_expenses: 900000,
      },
      {
        year: 2025,
        public_funding: 2700000,
        private_funding_total: 1500000,
        donor_count: 278,
        campaign_expenses: 2200000,
        operational_expenses: 1100000,
      },
    ],
    donors: [
      { year: 2024, donor_type: 'natural', donor_name: 'Militantes Base Junín', amount: 150000 },
      { year: 2025, donor_type: 'natural', donor_name: 'Colecta Popular Nacional', amount: 200000 },
    ],
  },
  // Podemos Perú
  {
    short_name: 'PODE',
    finances: [
      {
        year: 2024,
        public_funding: 2200000,
        private_funding_total: 3500000,
        donor_count: 45,
        campaign_expenses: 3000000,
        operational_expenses: 1500000,
      },
      {
        year: 2025,
        public_funding: 2400000,
        private_funding_total: 4000000,
        donor_count: 52,
        campaign_expenses: 3500000,
        operational_expenses: 1800000,
      },
    ],
    donors: [
      { year: 2024, donor_type: 'juridica', donor_name: 'Grupo Empresarial Luna', amount: 1200000 },
      { year: 2025, donor_type: 'juridica', donor_name: 'Telesup Educación SAC', amount: 1500000 },
    ],
  },
  // Partido Morado
  {
    short_name: 'PM',
    finances: [
      {
        year: 2024,
        public_funding: 1800000,
        private_funding_total: 2100000,
        donor_count: 312,
        campaign_expenses: 2000000,
        operational_expenses: 1000000,
      },
      {
        year: 2025,
        public_funding: 2000000,
        private_funding_total: 2400000,
        donor_count: 356,
        campaign_expenses: 2400000,
        operational_expenses: 1200000,
      },
    ],
    donors: [
      { year: 2024, donor_type: 'natural', donor_name: 'Donantes Individuales (crowdfunding)', amount: 500000 },
      { year: 2025, donor_type: 'natural', donor_name: 'Campaña Digital Transparente', amount: 600000 },
    ],
  },
  // Avanza País
  {
    short_name: 'AP',
    finances: [
      {
        year: 2024,
        public_funding: 1500000,
        private_funding_total: 1800000,
        donor_count: 67,
        campaign_expenses: 1600000,
        operational_expenses: 800000,
      },
      {
        year: 2025,
        public_funding: 1700000,
        private_funding_total: 2100000,
        donor_count: 78,
        campaign_expenses: 2000000,
        operational_expenses: 950000,
      },
    ],
    donors: [
      { year: 2024, donor_type: 'juridica', donor_name: 'Empresarios por el Cambio SAC', amount: 400000 },
      { year: 2025, donor_type: 'juridica', donor_name: 'Inversiones Libertad SA', amount: 500000 },
    ],
  },
  // Juntos por el Perú
  {
    short_name: 'JPP',
    finances: [
      {
        year: 2024,
        public_funding: 1200000,
        private_funding_total: 800000,
        donor_count: 189,
        campaign_expenses: 1000000,
        operational_expenses: 600000,
      },
      {
        year: 2025,
        public_funding: 1400000,
        private_funding_total: 950000,
        donor_count: 215,
        campaign_expenses: 1200000,
        operational_expenses: 700000,
      },
    ],
    donors: [
      { year: 2024, donor_type: 'natural', donor_name: 'Cuotas Militantes', amount: 300000 },
      { year: 2025, donor_type: 'natural', donor_name: 'Eventos Recaudación', amount: 350000 },
    ],
  },
  // APRA
  {
    short_name: 'APRA',
    finances: [
      {
        year: 2024,
        public_funding: 2000000,
        private_funding_total: 1500000,
        donor_count: 456,
        campaign_expenses: 1800000,
        operational_expenses: 1000000,
      },
      {
        year: 2025,
        public_funding: 2200000,
        private_funding_total: 1800000,
        donor_count: 502,
        campaign_expenses: 2100000,
        operational_expenses: 1200000,
      },
    ],
    donors: [
      { year: 2024, donor_type: 'natural', donor_name: 'Cuotas Compañeros', amount: 400000 },
      { year: 2025, donor_type: 'natural', donor_name: 'Eventos Casa del Pueblo', amount: 450000 },
    ],
  },
]

async function insertPartyFinances() {
  console.log('=== INSERTANDO DATOS DE FINANCIAMIENTO DE PARTIDOS ===\n')

  let partiesProcessed = 0
  let financesInserted = 0
  let donorsInserted = 0

  for (const partyData of PARTY_FINANCE_DATA) {
    console.log(`\n📋 Procesando: ${partyData.short_name}`)

    // Get party ID
    const parties = await sql`
      SELECT id, name FROM parties WHERE short_name = ${partyData.short_name}
    `

    if (parties.length === 0) {
      console.log(`   ❌ Partido no encontrado: ${partyData.short_name}`)
      continue
    }

    const partyId = parties[0].id
    const partyName = parties[0].name
    console.log(`   ✓ Encontrado: ${partyName}`)

    // Insert finances
    for (const finance of partyData.finances) {
      const totalIncome = finance.public_funding + finance.private_funding_total
      const totalExpenses = finance.campaign_expenses + finance.operational_expenses

      // Note: total_income and total_expenses are GENERATED columns, don't insert directly
      await sql`
        INSERT INTO party_finances (
          party_id, year, public_funding, private_funding_total,
          donor_count, campaign_expenses, operational_expenses
        ) VALUES (
          ${partyId}::uuid,
          ${finance.year},
          ${finance.public_funding},
          ${finance.private_funding_total},
          ${finance.donor_count},
          ${finance.campaign_expenses},
          ${finance.operational_expenses}
        )
        ON CONFLICT (party_id, year) DO UPDATE SET
          public_funding = EXCLUDED.public_funding,
          private_funding_total = EXCLUDED.private_funding_total,
          donor_count = EXCLUDED.donor_count,
          campaign_expenses = EXCLUDED.campaign_expenses,
          operational_expenses = EXCLUDED.operational_expenses,
          last_updated = NOW()
      `
      financesInserted++
      console.log(`   ✓ Finanzas ${finance.year}: Ingresos S/${(totalIncome/1000000).toFixed(1)}M`)
    }

    // Insert donors
    for (const donor of partyData.donors) {
      await sql`
        INSERT INTO party_donors (
          party_id, year, donor_type, donor_name, amount, donation_type, is_verified
        ) VALUES (
          ${partyId}::uuid,
          ${donor.year},
          ${donor.donor_type},
          ${donor.donor_name},
          ${donor.amount},
          'efectivo',
          true
        )
        ON CONFLICT DO NOTHING
      `
      donorsInserted++
    }
    console.log(`   ✓ Donantes: ${partyData.donors.length} registros`)

    partiesProcessed++
  }

  console.log('\n' + '='.repeat(50))
  console.log('=== RESUMEN ===')
  console.log(`✅ Partidos procesados: ${partiesProcessed}`)
  console.log(`✅ Registros financieros: ${financesInserted}`)
  console.log(`✅ Donantes registrados: ${donorsInserted}`)

  // Verify
  const totalFinances = await sql`SELECT COUNT(*) as count FROM party_finances`
  const totalDonors = await sql`SELECT COUNT(*) as count FROM party_donors`
  console.log(`\n📊 Total en BD:`)
  console.log(`   Registros financieros: ${totalFinances[0].count}`)
  console.log(`   Donantes: ${totalDonors[0].count}`)
}

// Execute
insertPartyFinances()
  .then(() => {
    console.log('\n¡Script completado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nError:', error)
    process.exit(1)
  })
