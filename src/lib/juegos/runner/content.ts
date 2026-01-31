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
    description: 'Maximo humo, cero verguenza. El pueblo aplaude... por ahora.',
    emoji: '📢',
    condition: (h, _c, s) => h >= 80 && s >= 3000,
  },
  {
    id: 'florista',
    name: 'EL FLORISTA',
    description: 'Promesas al por mayor, datos al por menor. Puro humo, cero sustancia.',
    emoji: '💐',
    condition: (h, c) => h >= 60 && c < 30,
  },
  {
    id: 'tecnocrata',
    name: 'EL TECNOCRATA',
    description: 'Todo verificado, nada emocionante. Aburrido pero confiable.',
    emoji: '🤓',
    condition: (h, c) => h < 30 && c >= 60,
  },
  {
    id: 'showman',
    name: 'EL SHOWMAN',
    description: 'Entretiene Y cumple. El unicornio de la politica peruana.',
    emoji: '🎪',
    condition: (h, c) => h >= 60 && c >= 60,
  },
  {
    id: 'fantasma',
    name: 'EL FANTASMA',
    description: 'Nadie noto tu campaña. Ni promesas, ni datos. Nada.',
    emoji: '👻',
    condition: (h, c) => h < 30 && c < 30,
  },
  {
    id: 'equilibrista',
    name: 'EL EQUILIBRISTA',
    description: 'Un poco de humo, un poco de data. El clasico tibio.',
    emoji: '⚖️',
    condition: (h, c) => h >= 30 && h < 60 && c >= 30 && c < 60,
  },
  {
    id: 'sobreviviente',
    name: 'EL SOBREVIVIENTE',
    description: 'No brillo, pero llego al final. Como la mayoria de congresistas.',
    emoji: '🦎',
    condition: () => true, // fallback
  },
]

export function getRole(humo: number, cred: number, score: number): RunnerRole {
  return RUNNER_ROLES.find(r => r.condition(humo, cred, score)) || RUNNER_ROLES[RUNNER_ROLES.length - 1]
}
