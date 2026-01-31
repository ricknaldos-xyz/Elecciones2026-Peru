import type { ObjectType, RunnerRole } from './types'

// ============================================
// OBJECT DEFINITIONS
// ============================================

export interface ObjectDef {
  w: number
  h: number
  isObstacle: boolean
  // Effects on hit/collect
  humo: number    // + or -
  cred: number    // + or -
  score: number   // base score (multiplied by combo for pickups)
  breaksCombo: boolean
}

export const OBJECT_DEFS: Record<ObjectType, ObjectDef> = {
  // Obstacles
  cono: {
    w: 40, h: 45, isObstacle: true,
    humo: 0, cred: -10, score: 0, breaksCombo: true,
  },
  hueco: {
    w: 80, h: 25, isObstacle: true,
    humo: 0, cred: -15, score: 0, breaksCombo: true,
  },
  prensa: {
    w: 50, h: 45, isObstacle: true,
    humo: 20, cred: 0, score: 0, breaksCombo: true,
  },
  fiscalia: {
    w: 50, h: 50, isObstacle: true,
    humo: -10, cred: -20, score: 0, breaksCombo: true,
  },
  // Pickups
  promesa: {
    w: 32, h: 32, isObstacle: false,
    humo: 15, cred: 0, score: 100, breaksCombo: false,
  },
  fuente: {
    w: 32, h: 32, isObstacle: false,
    humo: 0, cred: 15, score: 50, breaksCombo: false,
  },
}

// ============================================
// POLITICAL ROLES
// ============================================

export const RUNNER_ROLES: RunnerRole[] = [
  {
    id: 'populista',
    name: 'EL POPULISTA',
    description: 'Puro humo, cero vergüenza. Prometes tren bala a Iquitos y la gente aplaude.',
    emoji: '📢',
    condition: (h, _c, s) => h >= 80 && s >= 3000,
  },
  {
    id: 'florista',
    name: 'EL FLORISTA',
    description: 'Vendedor de humo profesional. Ya tienes trabajo asegurado en el Congreso.',
    emoji: '💐',
    condition: (h, c) => h >= 60 && c < 30,
  },
  {
    id: 'tecnocrata',
    name: 'EL TECNÓCRATA',
    description: 'Honesto y aburrido. En Perú eso vale 3% en las encuestas.',
    emoji: '🤓',
    condition: (h, c) => h < 30 && c >= 60,
  },
  {
    id: 'showman',
    name: 'EL SHOWMAN',
    description: 'Entretiene Y cumple. El unicornio político. Lástima que no existes.',
    emoji: '🎪',
    condition: (h, c) => h >= 60 && c >= 60,
  },
  {
    id: 'fantasma',
    name: 'EL FANTASMA',
    description: 'Tu campaña fue tan invisible que ni la ONPE la registró.',
    emoji: '👻',
    condition: (h, c) => h < 30 && c < 30,
  },
  {
    id: 'equilibrista',
    name: 'EL EQUILIBRISTA',
    description: 'Ni izquierda ni derecha. Tu posición política es "depende". De qué, nadie sabe.',
    emoji: '⚖️',
    condition: (h, c) => h >= 30 && h < 60 && c >= 30 && c < 60,
  },
  {
    id: 'sobreviviente',
    name: 'EL SOBREVIVIENTE',
    description: 'Duraste más que un gabinete ministerial. Eso ya es un logro nacional.',
    emoji: '🦎',
    condition: () => true, // fallback
  },
]

export function getRole(humo: number, cred: number, score: number): RunnerRole {
  return RUNNER_ROLES.find(r => r.condition(humo, cred, score)) || RUNNER_ROLES[RUNNER_ROLES.length - 1]
}
