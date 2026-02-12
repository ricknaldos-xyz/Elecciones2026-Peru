/**
 * Franja Electoral 2026 — Data from ONPE RJ 000011-2026-JN/ONPE
 *
 * The franja electoral is Peru's state-funded electoral broadcast system.
 * S/ 80M of public funds are allocated to 38 political organizations
 * for TV, radio, and digital advertising during the campaign period.
 *
 * Sources:
 * - ONPE Resolución Jefatural 000011-2026-JN/ONPE (Plan de Medios)
 * - ONPE Resolución Jefatural 000020-2026-JN/ONPE (Modificaciones)
 * - La República: "Cuánto dinero recibió cada partido" (2026-02-05)
 * - Infobae: "ONPE reparte S/ 80 millones" (2025-12-31)
 * - JNE Resolución 0602-2021-JNE (distribución de escaños 2021)
 *
 * Distribution formula:
 * - Radio/TV (S/ 71.3M): 50% equal among all parties + 50% proportional to 2021 seats
 * - Digital (S/ 8.7M): 100% equal among all parties (S/ 229,189 each)
 */

export const FRANJA_ELECTORAL = {
  totalBudget: 80_000_000,
  radioTvBudget: 71_290_817,
  digitalBudget: 8_709_183,
  totalParties: 38,
  broadcastStart: '2026-02-11',
  broadcastEnd: '2026-04-09',
  broadcastDays: 58,
  mediaOutlets: 372,
  estimatedSpots: 348_000,
  broadcastHours: '6:00 - 23:00',
  minAllocation: 1_699_247,
  maxAllocation: 7_728_819,
  disparityRatio: 4.5,
} as const

export type PartyFranjaStatus =
  | 'active'             // Participating normally
  | 'renounced_full'     // Renounced entire franja (País para Todos)
  | 'renounced_partial'  // Renounced only Nativa TV (Perú Libre, Primero la Gente)
  | 'withdrawn'          // Withdrew from elections entirely (Ciudadanos por el Perú)

export interface PartyFranjaData {
  partyName: string
  shortName: string
  totalAllocation: number
  congressionalSeats2021: number
  status: PartyFranjaStatus
  underInvestigation: boolean
}

// Ordered by allocation descending.
// Top parties have exact ONPE/La República figures.
// Parties without 2021 seats receive the minimum allocation (~S/ 1.7M).
//
// 2021 congressional seats (JNE Res. 0602-2021):
// PL:37, FP:24, AP*:16, APP:15, RP:13, AVP:7, Podemos:5, JPP:5, SP:5, PM:3
// *Acción Popular (16 seats) excluded from 2026 elections by JNE
export const PARTY_ALLOCATIONS: PartyFranjaData[] = [
  // === Parties with 2021 congressional representation ===
  { partyName: 'Perú Libre', shortName: 'PL', totalAllocation: 7_728_819, congressionalSeats2021: 37, status: 'renounced_partial', underInvestigation: false },
  { partyName: 'Fuerza Popular', shortName: 'FP', totalAllocation: 5_423_394, congressionalSeats2021: 24, status: 'active', underInvestigation: true },
  { partyName: 'Alianza para el Progreso', shortName: 'APP', totalAllocation: 3_827_331, congressionalSeats2021: 15, status: 'active', underInvestigation: true },
  { partyName: 'Renovación Popular', shortName: 'RP', totalAllocation: 3_472_651, congressionalSeats2021: 13, status: 'active', underInvestigation: false },
  { partyName: 'Avanza País', shortName: 'AVP', totalAllocation: 2_408_608, congressionalSeats2021: 7, status: 'active', underInvestigation: false },
  { partyName: 'Podemos Perú', shortName: 'PP', totalAllocation: 2_053_928, congressionalSeats2021: 5, status: 'active', underInvestigation: false },
  { partyName: 'Juntos por el Perú', shortName: 'JPP', totalAllocation: 2_053_928, congressionalSeats2021: 5, status: 'active', underInvestigation: false },
  { partyName: 'Somos Perú', shortName: 'SP', totalAllocation: 2_053_928, congressionalSeats2021: 5, status: 'active', underInvestigation: false },
  { partyName: 'Partido Morado', shortName: 'PM', totalAllocation: 1_699_247, congressionalSeats2021: 3, status: 'active', underInvestigation: false },
  // === Parties without 2021 seats (minimum allocation) ===
  { partyName: 'Primero la Gente', shortName: 'PLG', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'renounced_partial', underInvestigation: false },
  { partyName: 'País para Todos', shortName: 'PPT', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'renounced_full', underInvestigation: false },
  { partyName: 'Ciudadanos por el Perú', shortName: 'CPP', totalAllocation: 1_699_130, congressionalSeats2021: 0, status: 'withdrawn', underInvestigation: false },
  { partyName: 'Alianza Fuerza y Libertad', shortName: 'AFL', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Cooperación Popular', shortName: 'COOPOP', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Fe en el Perú', shortName: 'FEP', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'FREPAP', shortName: 'FREPAP', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Partido Aprista Peruano', shortName: 'APRA', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Progresemos', shortName: 'PROG', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Salvemos al Perú', shortName: 'SAP', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'PRIN', shortName: 'PRIN', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Partido Patriótico del Perú', shortName: 'PPP', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Un Camino Diferente', shortName: 'UCD', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Alianza Unidad Nacional', shortName: 'AUN', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Partido Cívico Obras', shortName: 'PCO', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Partido de los Trabajadores y Emprendedores', shortName: 'PTE', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Partido Demócrata Verde', shortName: 'PDV', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Partido Demócrata Unido Perú', shortName: 'PDUP', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Partido Democrático Federal', shortName: 'PDF', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Integridad Democrática', shortName: 'ID', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Partido Perú Moderno', shortName: 'PPM', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Ahora Nación', shortName: 'AN', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Alianza Venceremos', shortName: 'AV', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Partido Libertad Popular', shortName: 'PLP', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Frente de la Esperanza 2021', shortName: 'FE21', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Perú Acción', shortName: 'PAC', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Perú Primero', shortName: 'PEP', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
  { partyName: 'Partido Sí Creo', shortName: 'PSC', totalAllocation: 1_699_247, congressionalSeats2021: 0, status: 'active', underInvestigation: false },
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
