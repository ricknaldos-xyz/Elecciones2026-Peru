import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number): string {
  return score.toFixed(1)
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export function displayPartyName(name: string | null | undefined): string {
  if (!name) return ''
  const idx = name.indexOf(' - ')
  return idx > 0 ? name.substring(0, idx) : name
}

/**
 * Convert UPPERCASE JNE names to Title Case.
 * Handles Spanish particles (de, del, la, las, los, y, e)
 * and hyphenated compound names (DIEZ-CANSECO → Diez-Canseco).
 */
export function formatName(name: string): string {
  if (!name) return name

  const particles = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e'])

  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && particles.has(word)) return word

      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('-')
      }

      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
