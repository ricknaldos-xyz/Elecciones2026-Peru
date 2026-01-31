import type { GameConfig, GameState, GameResult, GameColors, Lane, GameObject } from './types'
import { DEFAULT_CONFIG } from './types'
import { generateSpawnEvents } from './spawner'
import { OBJECT_DEFS, getRole } from './content'

// ============================================
// CANVAS GAME ENGINE
// ============================================

export interface GameCallbacks {
  onGameOver: (result: GameResult) => void
  onScoreChange?: (score: number) => void
}

export interface GameInstance {
  start: () => void
  stop: () => void
  cleanup: () => void
  getState: () => GameState
}

/**
 * Get lane center X position
 */
function laneX(lane: Lane, config: GameConfig): number {
  const gutterTotal = config.canvasW - config.laneWidth * 3
  const gutter = gutterTotal / 4
  return gutter + config.laneWidth * lane + config.laneWidth / 2
}

/**
 * Read CSS variables for canvas rendering
 */
export function readColors(): GameColors {
  if (typeof window === 'undefined') {
    return {
      bg: '#FFFFFF', fg: '#000000', border: '#000000', borderSubtle: '#E5E5E5',
      primary: '#D91023', card: '#FFFFFF', muted: '#F5F5F5', mutedFg: '#525252',
      scoreGood: '#3B82F6', scoreLow: '#EF4444', scoreMedium: '#FBBF24',
      scoreExcellent: '#22C55E', rankGold: '#FFD700',
    }
  }
  const s = getComputedStyle(document.documentElement)
  const get = (v: string) => s.getPropertyValue(v).trim() || '#000'
  return {
    bg: get('--background'),
    fg: get('--foreground'),
    border: get('--border'),
    borderSubtle: get('--border-subtle'),
    primary: get('--primary'),
    card: get('--card'),
    muted: get('--muted'),
    mutedFg: get('--muted-foreground'),
    scoreGood: get('--score-good'),
    scoreLow: get('--score-low'),
    scoreMedium: get('--score-medium'),
    scoreExcellent: get('--score-excellent'),
    rankGold: get('--rank-gold'),
  }
}

/**
 * Initialize game state
 */
function initState(config: GameConfig): GameState {
  return {
    phase: 'ready',
    playerLane: 1 as Lane,
    playerX: laneX(1, config),
    targetX: laneX(1, config),
    speed: config.baseSpeed,
    score: 0,
    humo: 0,
    cred: 0,
    combo: 0,
    maxCombo: 0,
    elapsed: 0,
    scrollDistance: 0,
    objects: [],
    shakeFrames: 0,
    nextSpawnIdx: 0,
    flashScore: 0,
    flashTimer: 0,
  }
}

// ============================================
// CREATE GAME
// ============================================

export function createGame(
  canvas: HTMLCanvasElement,
  seed: number,
  callbacks: GameCallbacks,
  config: GameConfig = DEFAULT_CONFIG,
): GameInstance {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = config.canvasW * dpr
  canvas.height = config.canvasH * dpr
  canvas.style.width = `${config.canvasW}px`
  canvas.style.height = `${config.canvasH}px`

  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const colors = readColors()
  const spawnEvents = generateSpawnEvents(seed, config)
  let state = initState(config)
  let rafId = 0
  let lastTime = 0
  let running = false

  // Reduced motion preference
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ========== INPUT ==========
  let touchStartX = 0
  let touchStartY = 0
  let lastInputTime = 0

  function changeLane(delta: -1 | 1) {
    const now = performance.now()
    if (now - lastInputTime < 100) return // debounce
    lastInputTime = now

    const newLane = Math.max(0, Math.min(2, state.playerLane + delta)) as Lane
    if (newLane !== state.playerLane) {
      state.playerLane = newLane
      state.targetX = laneX(newLane, config)
    }
  }

  function handleTouchStart(e: TouchEvent) {
    if (state.phase === 'ready') {
      state.phase = 'running'
      return
    }
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }

  function handleTouchEnd(e: TouchEvent) {
    if (state.phase !== 'running') return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartX
    const dy = touch.clientY - touchStartY
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault()
      changeLane(dx > 0 ? 1 : -1)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (state.phase === 'ready') {
      state.phase = 'running'
      return
    }
    if (state.phase !== 'running') return
    if (e.key === 'ArrowLeft' || e.key === 'a') changeLane(-1)
    if (e.key === 'ArrowRight' || e.key === 'd') changeLane(1)
  }

  canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
  document.addEventListener('keydown', handleKeyDown)

  // ========== UPDATE ==========
  function update(dt: number) {
    if (state.phase !== 'running') return

    state.elapsed += dt

    // Check run end
    if (state.elapsed >= config.runDurationMs) {
      state.phase = 'over'
      const role = getRole(state.humo, state.cred, Math.round(state.score))
      callbacks.onGameOver({
        score: Math.round(state.score),
        humo: Math.round(state.humo),
        cred: Math.round(state.cred),
        maxCombo: state.maxCombo,
        elapsed: state.elapsed,
        role,
      })
      return
    }

    // Speed: base ramp + HUMO bonus
    const progress = state.elapsed / config.runDurationMs
    const baseRamp = config.baseSpeed + progress * (config.baseSpeed * 0.5)
    const humoBonus = baseRamp * (state.humo / 100) * 0.5
    state.speed = Math.min(baseRamp + humoBonus, config.maxSpeed)

    // Scroll
    const scrollDelta = state.speed * (dt / 16.67)
    state.scrollDistance += scrollDelta

    // Smooth lane transition
    const lerpSpeed = 0.2
    state.playerX += (state.targetX - state.playerX) * lerpSpeed

    // Passive score
    const humoMult = 1 + (state.humo / 100) * 3
    const credMult = 1 + (state.cred / 100) * 0.25
    const speedMult = state.speed / config.baseSpeed
    state.score += humoMult * credMult * speedMult * (dt / 1000) * 10

    // Spawn objects
    while (
      state.nextSpawnIdx < spawnEvents.length &&
      spawnEvents[state.nextSpawnIdx].scrollThreshold <= state.scrollDistance
    ) {
      const ev = spawnEvents[state.nextSpawnIdx]
      const def = OBJECT_DEFS[ev.type]
      state.objects.push({
        type: ev.type,
        lane: ev.lane,
        y: -def.h,
        w: def.w,
        h: def.h,
        collected: false,
        hit: false,
      })
      state.nextSpawnIdx++
    }

    // Move objects & check collisions
    const playerLeft = state.playerX - config.playerW / 2
    const playerRight = state.playerX + config.playerW / 2
    const playerTop = config.playerY - config.playerH / 2
    const playerBottom = config.playerY + config.playerH / 2

    for (const obj of state.objects) {
      obj.y += scrollDelta

      if (obj.collected || obj.hit) continue
      if (obj.y + obj.h < playerTop || obj.y > playerBottom) continue

      // Check lane overlap
      const objCenterX = laneX(obj.lane, config)
      const objLeft = objCenterX - obj.w / 2
      const objRight = objCenterX + obj.w / 2

      if (playerRight <= objLeft || playerLeft >= objRight) continue
      if (obj.y > playerBottom || obj.y + obj.h < playerTop) continue

      // Collision!
      const def = OBJECT_DEFS[obj.type]

      if (def.isObstacle) {
        obj.hit = true
        // CRED can absorb some damage
        const damageReduction = state.cred >= 60 ? 0.4 : state.cred >= 30 ? 0.2 : 0
        state.cred = Math.max(0, Math.min(100, state.cred + def.cred * (1 - damageReduction)))
        state.humo = Math.max(0, Math.min(100, state.humo + def.humo))
        if (def.breaksCombo) state.combo = 0
        state.shakeFrames = reducedMotion ? 0 : 6
      } else {
        obj.collected = true
        state.combo++
        state.maxCombo = Math.max(state.maxCombo, state.combo)
        state.humo = Math.max(0, Math.min(100, state.humo + def.humo))
        state.cred = Math.max(0, Math.min(100, state.cred + def.cred))
        const comboMult = Math.min(state.combo, 10)
        const pickupScore = def.score * comboMult
        state.score += pickupScore
        state.flashScore = pickupScore
        state.flashTimer = 500
      }
    }

    // Remove off-screen objects
    state.objects = state.objects.filter(o => o.y < config.canvasH + 60)

    // Decay shake
    if (state.shakeFrames > 0) state.shakeFrames--

    // Decay flash
    if (state.flashTimer > 0) state.flashTimer -= dt

    // Natural HUMO/CRED decay toward 50 (very slow)
    if (state.humo > 50) state.humo -= 0.02
    if (state.cred > 50) state.cred -= 0.01
  }

  // ========== RENDER ==========
  function render() {
    const W = config.canvasW
    const H = config.canvasH

    ctx.save()

    // Screen shake
    if (state.shakeFrames > 0) {
      const sx = (Math.random() - 0.5) * 6
      const sy = (Math.random() - 0.5) * 6
      ctx.translate(sx, sy)
    }

    // Background
    ctx.fillStyle = colors.bg
    ctx.fillRect(-10, -10, W + 20, H + 20)

    // Road shoulders
    ctx.strokeStyle = colors.border
    ctx.lineWidth = 3
    const gutterTotal = W - config.laneWidth * 3
    const gutter = gutterTotal / 4
    ctx.beginPath()
    ctx.moveTo(gutter - 2, 0)
    ctx.lineTo(gutter - 2, H)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(W - gutter + 2, 0)
    ctx.lineTo(W - gutter + 2, H)
    ctx.stroke()

    // Lane dividers (dashed)
    ctx.strokeStyle = colors.borderSubtle
    ctx.lineWidth = 2
    ctx.setLineDash([20, 15])
    const dashOffset = -(state.scrollDistance % 35)
    ctx.lineDashOffset = dashOffset
    for (let i = 1; i < 3; i++) {
      const x = gutter + config.laneWidth * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.lineDashOffset = 0

    // HUMO visual effect: red vignette when high
    if (state.humo > 60) {
      const alpha = ((state.humo - 60) / 40) * 0.15
      const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(1, `rgba(217, 16, 35, ${alpha})`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    }

    // Render objects
    for (const obj of state.objects) {
      if (obj.collected || obj.hit) continue
      const cx = laneX(obj.lane, config)
      renderObject(ctx, obj, cx, colors)
    }

    // Render player (combi)
    renderCombi(ctx, state.playerX, config.playerY, config.playerW, config.playerH, colors)

    // Combo popup
    if (state.combo >= 3) {
      ctx.fillStyle = colors.rankGold
      ctx.strokeStyle = colors.border
      ctx.lineWidth = 2
      ctx.font = 'bold 18px "Space Grotesk", system-ui'
      ctx.textAlign = 'center'
      const text = `x${state.combo}`
      ctx.strokeText(text, state.playerX, config.playerY - config.playerH / 2 - 12)
      ctx.fillText(text, state.playerX, config.playerY - config.playerH / 2 - 12)
    }

    // Score flash
    if (state.flashTimer > 0 && state.flashScore > 0) {
      const alpha = state.flashTimer / 500
      ctx.globalAlpha = alpha
      ctx.fillStyle = colors.scoreExcellent
      ctx.font = 'bold 16px "Space Grotesk", system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(`+${state.flashScore}`, state.playerX + 40, config.playerY - 20)
      ctx.globalAlpha = 1
    }

    // ===== HUD =====
    renderHUD(ctx, state, config, colors)

    // "TAP TO START" overlay
    if (state.phase === 'ready') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 24px "Space Grotesk", system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('TOCA PARA ARRANCAR', W / 2, H / 2 - 10)
      ctx.font = 'bold 14px "Space Grotesk", system-ui'
      ctx.fillText('← DESLIZA PARA CAMBIAR DE CARRIL →', W / 2, H / 2 + 20)
    }

    ctx.restore()
  }

  // ========== RENDER HELPERS ==========

  function renderObject(ctx: CanvasRenderingContext2D, obj: GameObject, cx: number, c: GameColors) {
    const x = cx - obj.w / 2
    const y = obj.y
    const def = OBJECT_DEFS[obj.type]

    if (def.isObstacle) {
      switch (obj.type) {
        case 'cono':
          // Orange cone triangle
          ctx.fillStyle = '#FF6B00'
          ctx.strokeStyle = c.border
          ctx.lineWidth = 3
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.2)'
          ctx.fillRect(x + 5 + 3, y + obj.h - 12 + 3, obj.w - 10, 12)
          // Base
          ctx.fillStyle = '#FF6B00'
          ctx.beginPath()
          ctx.moveTo(cx, y)
          ctx.lineTo(x + obj.w - 3, y + obj.h - 10)
          ctx.lineTo(x + 3, y + obj.h - 10)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          // Base rect
          ctx.fillStyle = '#E05500'
          ctx.fillRect(x + 2, y + obj.h - 12, obj.w - 4, 12)
          ctx.strokeRect(x + 2, y + obj.h - 12, obj.w - 4, 12)
          break

        case 'hueco':
          // Dark wide rectangle with zigzag
          ctx.fillStyle = '#1a1a1a'
          ctx.strokeStyle = c.border
          ctx.lineWidth = 3
          ctx.fillRect(x, y, obj.w, obj.h)
          ctx.strokeRect(x, y, obj.w, obj.h)
          // Zigzag lines
          ctx.strokeStyle = c.scoreLow
          ctx.lineWidth = 2
          ctx.beginPath()
          for (let i = 0; i < obj.w; i += 10) {
            ctx.lineTo(x + i, y + (i % 20 < 10 ? 5 : obj.h - 5))
          }
          ctx.stroke()
          break

        case 'prensa':
          // TV rectangle
          ctx.fillStyle = '#4B5EAA'
          ctx.strokeStyle = c.border
          ctx.lineWidth = 3
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.2)'
          ctx.fillRect(x + 3, y + 3, obj.w, obj.h)
          ctx.fillStyle = '#4B5EAA'
          ctx.fillRect(x, y, obj.w, obj.h)
          ctx.strokeRect(x, y, obj.w, obj.h)
          // Screen
          ctx.fillStyle = '#88CCFF'
          ctx.fillRect(x + 6, y + 6, obj.w - 12, obj.h - 16)
          // "TV" text
          ctx.fillStyle = c.fg
          ctx.font = 'bold 11px "Space Grotesk", system-ui'
          ctx.textAlign = 'center'
          ctx.fillText('TV', cx, y + obj.h - 5)
          break

        case 'fiscalia':
          // Red square with "!"
          ctx.fillStyle = 'rgba(0,0,0,0.2)'
          ctx.fillRect(x + 3, y + 3, obj.w, obj.h)
          ctx.fillStyle = c.scoreLow
          ctx.strokeStyle = c.border
          ctx.lineWidth = 3
          ctx.fillRect(x, y, obj.w, obj.h)
          ctx.strokeRect(x, y, obj.w, obj.h)
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 28px "Space Grotesk", system-ui'
          ctx.textAlign = 'center'
          ctx.fillText('!', cx, y + obj.h / 2 + 10)
          break
      }
    } else {
      // Pickups
      if (obj.type === 'promesa') {
        // Yellow star
        drawStar(ctx, cx, y + obj.h / 2, 14, 5, c.rankGold, c.border)
      } else if (obj.type === 'fuente') {
        // Blue book
        ctx.fillStyle = 'rgba(0,0,0,0.15)'
        ctx.fillRect(x + 3, y + 3, obj.w, obj.h)
        ctx.fillStyle = c.scoreGood
        ctx.strokeStyle = c.border
        ctx.lineWidth = 2
        ctx.fillRect(x, y, obj.w, obj.h)
        ctx.strokeRect(x, y, obj.w, obj.h)
        // Book lines
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 1.5
        for (let i = 0; i < 3; i++) {
          const ly = y + 8 + i * 7
          ctx.beginPath()
          ctx.moveTo(x + 6, ly)
          ctx.lineTo(x + obj.w - 6, ly)
          ctx.stroke()
        }
      }
    }
  }

  function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points: number, fill: string, stroke: string) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    drawStarPath(ctx, cx + 2, cy + 2, r, points)
    ctx.fill()
    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    drawStarPath(ctx, cx, cy, r, points)
    ctx.fill()
    ctx.stroke()
  }

  function drawStarPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points: number) {
    ctx.beginPath()
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? r : r * 0.45
      const angle = (i * Math.PI) / points - Math.PI / 2
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
  }

  function renderCombi(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, c: GameColors) {
    const x = cx - w / 2
    const y = cy - h / 2

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(x + 3, y + 3, w, h)

    // Body
    ctx.fillStyle = c.primary
    ctx.strokeStyle = c.border
    ctx.lineWidth = 3
    ctx.fillRect(x, y, w, h)
    ctx.strokeRect(x, y, w, h)

    // Roof
    ctx.fillStyle = c.scoreMedium
    ctx.fillRect(x + 4, y - 8, w - 8, 10)
    ctx.strokeRect(x + 4, y - 8, w - 8, 10)

    // Windshield
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(x + 8, y + 4, w - 16, h * 0.35)
    ctx.strokeRect(x + 8, y + 4, w - 16, h * 0.35)

    // Wheels
    ctx.fillStyle = c.fg
    ctx.fillRect(x - 3, y + 4, 6, 10)
    ctx.fillRect(x + w - 3, y + 4, 6, 10)
    ctx.fillRect(x - 3, y + h - 14, 6, 10)
    ctx.fillRect(x + w - 3, y + h - 14, 6, 10)
  }

  function renderHUD(ctx: CanvasRenderingContext2D, state: GameState, config: GameConfig, c: GameColors) {
    const W = config.canvasW
    const barW = 120
    const barH = 16

    // HUMO bar (top-left)
    const humoX = 12
    const humoY = 12
    // Label
    ctx.fillStyle = c.fg
    ctx.font = 'bold 10px "Space Grotesk", system-ui'
    ctx.textAlign = 'left'
    ctx.fillText('HUMO', humoX, humoY - 2)
    // Bar bg
    ctx.fillStyle = c.muted
    ctx.strokeStyle = c.border
    ctx.lineWidth = 2
    ctx.fillRect(humoX, humoY, barW, barH)
    ctx.strokeRect(humoX, humoY, barW, barH)
    // Bar fill (yellow to red gradient)
    if (state.humo > 0) {
      const grad = ctx.createLinearGradient(humoX, 0, humoX + barW, 0)
      grad.addColorStop(0, c.scoreMedium)
      grad.addColorStop(1, c.scoreLow)
      ctx.fillStyle = grad
      ctx.fillRect(humoX + 1, humoY + 1, (barW - 2) * (state.humo / 100), barH - 2)
    }
    // Percentage
    ctx.fillStyle = state.humo > 50 ? '#FFF' : c.fg
    ctx.font = 'bold 10px "Space Grotesk", system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(`${Math.round(state.humo)}%`, humoX + barW / 2, humoY + barH - 4)

    // CRED bar (top-right)
    const credX = W - barW - 12
    const credY = 12
    ctx.fillStyle = c.fg
    ctx.font = 'bold 10px "Space Grotesk", system-ui'
    ctx.textAlign = 'right'
    ctx.fillText('CRED', credX + barW, credY - 2)
    ctx.fillStyle = c.muted
    ctx.strokeStyle = c.border
    ctx.lineWidth = 2
    ctx.fillRect(credX, credY, barW, barH)
    ctx.strokeRect(credX, credY, barW, barH)
    if (state.cred > 0) {
      const grad = ctx.createLinearGradient(credX, 0, credX + barW, 0)
      grad.addColorStop(0, c.scoreGood)
      grad.addColorStop(1, c.scoreExcellent)
      ctx.fillStyle = grad
      ctx.fillRect(credX + 1, credY + 1, (barW - 2) * (state.cred / 100), barH - 2)
    }
    ctx.fillStyle = state.cred > 50 ? '#FFF' : c.fg
    ctx.font = 'bold 10px "Space Grotesk", system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(`${Math.round(state.cred)}%`, credX + barW / 2, credY + barH - 4)

    // Score (center top)
    ctx.fillStyle = c.fg
    ctx.font = 'bold 28px "Space Grotesk", system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(Math.round(state.score).toLocaleString(), W / 2, 42)

    // Timer bar (bottom)
    const timerY = config.canvasH - 6
    const timerW = W - 24
    const timeLeft = 1 - state.elapsed / config.runDurationMs
    ctx.fillStyle = c.muted
    ctx.fillRect(12, timerY, timerW, 4)
    if (timeLeft > 0) {
      ctx.fillStyle = timeLeft > 0.3 ? c.scoreExcellent : timeLeft > 0.1 ? c.scoreMedium : c.scoreLow
      ctx.fillRect(12, timerY, timerW * timeLeft, 4)
    }
  }

  // ========== GAME LOOP ==========
  function tick(now: number) {
    if (!running) return

    const dt = lastTime === 0 ? 16.67 : Math.min(now - lastTime, 33.33)
    lastTime = now

    update(dt)
    render()

    if (state.phase !== 'over') {
      rafId = requestAnimationFrame(tick)
    } else {
      render() // Final frame
    }
  }

  return {
    start() {
      running = true
      state = initState(config)
      lastTime = 0
      render() // Draw initial frame with "tap to start"
      rafId = requestAnimationFrame(tick)
    },
    stop() {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
    },
    cleanup() {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('keydown', handleKeyDown)
    },
    getState() {
      return state
    },
  }
}
