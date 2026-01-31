import type { GameResult } from './types'

/**
 * Generate a share card image as a data URL using canvas.
 */
export async function generateShareCard(result: GameResult): Promise<string> {
  // Wait for fonts to load
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready
  }

  const W = 600
  const H = 800
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const bg = '#FFFFFF'
  const fg = '#000000'
  const primary = '#D91023'
  const muted = '#F5F5F5'
  const border = '#000000'

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Border
  ctx.strokeStyle = border
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, W - 6, H - 6)

  // Title
  ctx.fillStyle = primary
  ctx.font = 'bold 36px "Space Grotesk", system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('CRAZY CAMPAÑA 2026', W / 2, 60)

  // Divider
  ctx.strokeStyle = border
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(40, 80)
  ctx.lineTo(W - 40, 80)
  ctx.stroke()

  // Role emoji (large text)
  ctx.font = '72px "Space Grotesk", system-ui'
  ctx.fillText(result.role.emoji, W / 2, 170)

  // Role name
  ctx.fillStyle = fg
  ctx.font = 'bold 32px "Space Grotesk", system-ui'
  ctx.fillText(result.role.name, W / 2, 220)

  // Role description
  ctx.fillStyle = '#525252'
  ctx.font = 'italic 18px "Space Grotesk", system-ui'
  wrapText(ctx, `"${result.role.description}"`, W / 2, 260, W - 100, 24)

  // Stat boxes (2x2 grid)
  const boxW = 220
  const boxH = 90
  const startY = 320
  const gap = 20
  const leftX = W / 2 - boxW - gap / 2
  const rightX = W / 2 + gap / 2

  // Score box
  drawStatBox(ctx, leftX, startY, boxW, boxH, 'SCORE', result.score.toLocaleString(), primary, bg, fg, border, muted)
  // HUMO box
  const humoColor = result.humo >= 60 ? '#EF4444' : '#FBBF24'
  drawStatBox(ctx, rightX, startY, boxW, boxH, 'HUMO%', `${result.humo}%`, humoColor, bg, fg, border, muted)
  // CRED box
  const credColor = result.cred >= 60 ? '#22C55E' : '#3B82F6'
  drawStatBox(ctx, leftX, startY + boxH + gap, boxW, boxH, 'CRED%', `${result.cred}%`, credColor, bg, fg, border, muted)
  // Combo box
  drawStatBox(ctx, rightX, startY + boxH + gap, boxW, boxH, 'COMBO', `x${result.maxCombo}`, '#FFD700', bg, fg, border, muted)

  // Bottom divider
  ctx.strokeStyle = border
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(40, 570)
  ctx.lineTo(W - 40, 570)
  ctx.stroke()

  // CTA
  ctx.fillStyle = fg
  ctx.font = 'bold 22px "Space Grotesk", system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('¿Qué tipo de político eres TÚ?', W / 2, 610)

  ctx.fillStyle = primary
  ctx.font = 'bold 18px "Space Grotesk", system-ui'
  ctx.fillText('votainformado.pe/juegos/runner', W / 2, 645)

  // Footer branding
  ctx.fillStyle = '#525252'
  ctx.font = 'bold 14px "Space Grotesk", system-ui'
  ctx.fillText('RANKING ELECTORAL PERÚ 2026', W / 2, 770)

  return canvas.toDataURL('image/png')
}

function drawStatBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  label: string, value: string,
  accent: string, bg: string, fg: string, border: string, muted: string
) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.fillRect(x + 3, y + 3, w, h)
  // Box
  ctx.fillStyle = bg
  ctx.strokeStyle = border
  ctx.lineWidth = 3
  ctx.fillRect(x, y, w, h)
  ctx.strokeRect(x, y, w, h)
  // Label
  ctx.fillStyle = '#525252'
  ctx.font = 'bold 13px "Space Grotesk", system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(label, x + w / 2, y + 28)
  // Value
  ctx.fillStyle = accent
  ctx.font = 'bold 34px "Space Grotesk", system-ui'
  ctx.fillText(value, x + w / 2, y + 68)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (const word of words) {
    const testLine = line + word + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line.length > 0) {
      ctx.fillText(line.trim(), x, currentY)
      line = word + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, currentY)
}

/**
 * Build text for ShareButton fallback
 */
export function buildRunnerShareText(result: GameResult): string {
  const roleInsults: Record<string, string> = {
    populista: 'Soy puro humo y la gente me aplaude.',
    florista: 'Prometo todo, cumplo nada. Material de congresista.',
    tecnocrata: 'Honesto y aburrido. En Perú eso vale 3% en encuestas.',
    showman: 'Entretengo Y cumplo. Básicamente no existo.',
    fantasma: 'Mi campaña fue tan invisible que ni la ONPE la registró.',
    equilibrista: 'Mi posición política es "depende". De qué, nadie sabe.',
    sobreviviente: 'Duré más que un gabinete ministerial. Victoria.',
  }
  const insult = roleInsults[result.role.id] || `"${result.role.description}"`

  return [
    `🚌 CRAZY CAMPAÑA 2026`,
    ``,
    `${result.role.emoji} Soy ${result.role.name}`,
    insult,
    ``,
    `HUMO: ${result.humo}% | CRED: ${result.cred}% | Score: ${result.score.toLocaleString()}`,
    ``,
    `¿Qué tipo de político eres TÚ?`,
    `votainformado.pe/juegos/runner`,
  ].join('\n')
}
