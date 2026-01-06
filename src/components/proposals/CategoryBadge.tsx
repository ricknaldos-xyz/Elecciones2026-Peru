'use client'

import { ProposalCategory } from '@/lib/sync/plans/extractor'

// Export list of all proposal categories
export const PROPOSAL_CATEGORIES: ProposalCategory[] = [
  'economia',
  'salud',
  'educacion',
  'seguridad',
  'corrupcion',
  'mineria_ambiente',
  'infraestructura',
  'social',
  'reforma_politica',
  'otros',
]

// Re-export the type for convenience
export type { ProposalCategory }

const CATEGORY_CONFIG: Record<
  ProposalCategory,
  { label: string; icon: string; color: string }
> = {
  economia: {
    label: 'Economia',
    icon: '💰',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  salud: {
    label: 'Salud',
    icon: '🏥',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  educacion: {
    label: 'Educacion',
    icon: '📚',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  seguridad: {
    label: 'Seguridad',
    icon: '🛡️',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  corrupcion: {
    label: 'Anticorrupcion',
    icon: '⚖️',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  mineria_ambiente: {
    label: 'Ambiente',
    icon: '🌿',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  infraestructura: {
    label: 'Infraestructura',
    icon: '🏗️',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  social: {
    label: 'Social',
    icon: '👥',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  },
  reforma_politica: {
    label: 'Reforma Politica',
    icon: '🏛️',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  },
  otros: {
    label: 'Otros',
    icon: '📋',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
}

interface CategoryBadgeProps {
  category: ProposalCategory
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function CategoryBadge({
  category,
  size = 'md',
  showIcon = true,
}: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.otros

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${config.color} ${sizeClasses[size]}`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  )
}

export function getCategoryConfig(category: ProposalCategory) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.otros
}

export { CATEGORY_CONFIG }
