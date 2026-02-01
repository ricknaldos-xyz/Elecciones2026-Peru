'use client'

interface PartyLogoProps {
  name: string
  shortName?: string | null
  color?: string | null
  logoUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 sm:w-12 sm:h-12 text-sm',
  lg: 'w-16 h-16 text-xl',
}

export function PartyLogo({ name, shortName, color, logoUrl, size = 'md', className = '' }: PartyLogoProps) {
  const initials = shortName?.slice(0, 2) || name.slice(0, 2)

  return (
    <div
      className={`border-2 border-[var(--border)] flex items-center justify-center text-white font-black flex-shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color || '#6B7280' }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = 'none'
            target.nextElementSibling?.classList.remove('hidden')
          }}
        />
      ) : null}
      <span className={logoUrl ? 'hidden' : ''}>
        {initials}
      </span>
    </div>
  )
}
