/**
 * Franja Electoral 2026 — Data from ONPE RJ 000011-2026-JN/ONPE
 *
 * The franja electoral is Peru's state-funded electoral broadcast system.
 * S/ 80M of public funds are allocated to 38 political organizations
 * for TV, radio, and digital advertising during the campaign period.
 *
 * Sources:
 * - ONPE Resolución Jefatural 000011-2026-JN/ONPE
 * - La República, Infobae, El Comercio (Feb 2026 reporting)
 */

export const FRANJA_ELECTORAL = {
  totalBudget: 80_000_000,
  radioTvBudget: 71_290_817,
  digitalBudget: 8_709_183,
  totalParties: 38,
  broadcastStart: '2026-02-11',
  broadcastEnd: '2026-04-09',
  mediaOutlets: 372,
  estimatedSpots: 348_000,
  broadcastHours: '6:00 - 23:00',
  minAllocation: 1_699_247,
  maxAllocation: 7_728_819,
  disparityRatio: 4.5,
} as const

export interface PartyFranjaData {
  partyName: string
  shortName: string
  totalAllocation: number
  congressionalSeats2021: number
  renounced: boolean
  underInvestigation: boolean
}

// Ordered by allocation descending. Top 5 have exact ONPE figures.
// Remaining parties receive the minimum allocation (~S/ 1.7M).
export const PARTY_ALLOCATIONS: PartyFranjaData[] = [
  // === TOP 5: Exact figures from ONPE ===
  { partyName: 'Perú Libre', shortName: 'PL', totalAllocation: 7_728_819, congressionalSeats2021: 37, renounced: true, underInvestigation: false },
  { partyName: 'Fuerza Popular', shortName: 'FP', totalAllocation: 5_423_394, congressionalSeats2021: 24, renounced: false, underInvestigation: true },
  { partyName: 'Alianza para el Progreso', shortName: 'APP', totalAllocation: 3_827_331, congressionalSeats2021: 15, renounced: false, underInvestigation: true },
  { partyName: 'Renovación Popular', shortName: 'RP', totalAllocation: 3_472_651, congressionalSeats2021: 13, renounced: false, underInvestigation: false },
  { partyName: 'Avanza País', shortName: 'AP', totalAllocation: 2_408_608, congressionalSeats2021: 7, renounced: false, underInvestigation: false },
  // === MEDIUM: Parties with some 2021 seats (estimated) ===
  { partyName: 'Somos Perú', shortName: 'SP', totalAllocation: 2_054_000, congressionalSeats2021: 5, renounced: false, underInvestigation: false },
  { partyName: 'Juntos por el Perú', shortName: 'JPP', totalAllocation: 2_054_000, congressionalSeats2021: 5, renounced: false, underInvestigation: false },
  // === MINIMUM ALLOCATION: Parties without significant 2021 representation ===
  { partyName: 'Primero la Gente', shortName: 'PLG', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: true, underInvestigation: false },
  { partyName: 'País para Todos', shortName: 'PPT', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: true, underInvestigation: false },
  { partyName: 'Alianza Fuerza y Libertad', shortName: 'AFL', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Cooperación Popular', shortName: 'COOPOP', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Partido Morado', shortName: 'PM', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Fe en el Perú', shortName: 'FEP', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Partido Patriótico del Perú', shortName: 'PPP', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Partido Sí Creo', shortName: 'PSC', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Un Camino Diferente', shortName: 'UCD', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Alianza Unidad Nacional', shortName: 'AUN', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Partido Cívico Obras', shortName: 'PCO', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Partido de los Trabajadores y Emprendedores', shortName: 'PTE', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Partido Demócrata Verde', shortName: 'PDV', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Partido Demócrata Unido Perú', shortName: 'PDUP', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Partido Democrático Federal', shortName: 'PDF', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Integridad Democrática', shortName: 'ID', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Partido Perú Moderno', shortName: 'PPM', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Ahora Nación', shortName: 'AN', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Alianza Venceremos', shortName: 'AV', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Partido Libertad Popular', shortName: 'PLP', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Frente de la Esperanza 2021', shortName: 'FE21', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Perú Acción', shortName: 'PA', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
  { partyName: 'Perú Primero', shortName: 'PP', totalAllocation: 1_699_247, congressionalSeats2021: 0, renounced: false, underInvestigation: false },
]

export function getPartyFranjaData(shortName: string): PartyFranjaData | undefined {
  return PARTY_ALLOCATIONS.find(p => p.shortName === shortName)
}

export function formatSoles(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
