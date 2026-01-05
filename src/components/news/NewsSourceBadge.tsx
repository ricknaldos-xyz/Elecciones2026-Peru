import { cn } from '@/lib/utils'

interface NewsSourceBadgeProps {
  source: string
  size?: 'sm' | 'md'
  className?: string
}

const SOURCE_CONFIG: Record<string, { abbr: string; color: string }> = {
  'El Comercio': { abbr: 'EC', color: 'bg-blue-600' },
  'La Republica': { abbr: 'LR', color: 'bg-red-600' },
  'RPP': { abbr: 'RPP', color: 'bg-green-600' },
  'Gestion': { abbr: 'G', color: 'bg-orange-600' },
  'Peru21': { abbr: 'P21', color: 'bg-purple-600' },
  'Correo': { abbr: 'CO', color: 'bg-yellow-600' },
  'Andina': { abbr: 'AN', color: 'bg-teal-600' },
  'Infobae': { abbr: 'IB', color: 'bg-pink-600' },
  'IDL Reporteros': { abbr: 'IDL', color: 'bg-indigo-600' },
  'Exitosa': { abbr: 'EX', color: 'bg-cyan-600' },
  'Google News': { abbr: 'GN', color: 'bg-[#4285F4]' },
  'news.google.com': { abbr: 'GN', color: 'bg-[#4285F4]' },
  'google': { abbr: 'GN', color: 'bg-[#4285F4]' },
  'n60.pe': { abbr: 'N60', color: 'bg-slate-700' },
  'Perú Libre': { abbr: 'PL', color: 'bg-red-700' },
  'Canal N': { abbr: 'CN', color: 'bg-red-500' },
  'ATV': { abbr: 'ATV', color: 'bg-orange-500' },
  'Latina': { abbr: 'LA', color: 'bg-blue-500' },
  'Panamericana': { abbr: 'PA', color: 'bg-blue-700' },
  'Willax': { abbr: 'WX', color: 'bg-amber-600' },
}

function getSourceConfig(source: string) {
  // Try exact match first
  if (SOURCE_CONFIG[source]) {
    return SOURCE_CONFIG[source]
  }

  // Try partial match
  for (const [key, value] of Object.entries(SOURCE_CONFIG)) {
    if (source.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  // Default
  return {
    abbr: source.slice(0, 2).toUpperCase(),
    color: 'bg-gray-500',
  }
}

export function NewsSourceBadge({ source, size = 'sm', className }: NewsSourceBadgeProps) {
  const config = getSourceConfig(source)

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center',
        'border-2 border-[var(--border)]',
        'text-white font-black',
        config.color,
        size === 'sm' && 'w-7 h-7 text-xs',
        size === 'md' && 'w-9 h-9 text-xs',
        className
      )}
      title={source}
    >
      {config.abbr}
    </div>
  )
}
