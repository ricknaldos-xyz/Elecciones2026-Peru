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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
