// ============================================
// CRAZY CAMPAÑA — TYPES
// ============================================

export type Lane = 0 | 1 | 2

export interface GameConfig {
  canvasW: number       // 390
  canvasH: number       // 600
  laneCount: 3
  laneWidth: number     // ~110
  playerY: number       // 480
  playerW: number       // 60
  playerH: number       // 40
  baseSpeed: number     // 4 px/frame at 60fps
  maxSpeed: number      // 12
  runDurationMs: number // 20000
}

export const DEFAULT_CONFIG: GameConfig = {
  canvasW: 390,
  canvasH: 600,
  laneCount: 3,
  laneWidth: 110,
  playerY: 480,
  playerW: 60,
  playerH: 40,
  baseSpeed: 4,
  maxSpeed: 12,
  runDurationMs: 20000,
}

export type ObstacleType = 'cono' | 'hueco' | 'prensa' | 'fiscalia'
export type PickupType = 'promesa' | 'fuente'
export type ObjectType = ObstacleType | PickupType

export interface GameObject {
  type: ObjectType
  lane: Lane
  y: number
  w: number
  h: number
  collected: boolean
  hit: boolean
}

export interface SpawnEvent {
  scrollThreshold: number
  type: ObjectType
  lane: Lane
}

export interface GameState {
  phase: 'ready' | 'running' | 'dying' | 'over'
  playerLane: Lane
  playerX: number
  targetX: number
  speed: number
  score: number
  humo: number
  cred: number
  combo: number
  maxCombo: number
  elapsed: number
  scrollDistance: number
  objects: GameObject[]
  shakeFrames: number
  nextSpawnIdx: number
  flashScore: number
  flashTimer: number
}

export interface GameResult {
  score: number
  humo: number
  cred: number
  maxCombo: number
  elapsed: number
  role: RunnerRole
}

export interface RunnerRole {
  id: string
  name: string
  description: string
  emoji: string
  condition: (humo: number, cred: number, score: number) => boolean
}

export interface RunnerStats {
  bestScore: number
  totalRuns: number
  dailyBest: Record<string, number>
  lastPlayDate: string
}

export interface GameColors {
  bg: string
  fg: string
  border: string
  borderSubtle: string
  primary: string
  card: string
  muted: string
  mutedFg: string
  scoreGood: string
  scoreLow: string
  scoreMedium: string
  scoreExcellent: string
  rankGold: string
}
