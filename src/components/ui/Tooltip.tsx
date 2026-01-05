'use client'

import { cn } from '@/lib/utils'
import { useState, useId } from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const positionStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
  left: 'right-full top-1/2 -translate-y-1/2 mr-3',
  right: 'left-full top-1/2 -translate-y-1/2 ml-3',
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = useId()

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <div aria-describedby={isVisible ? tooltipId : undefined}>
        {children}
      </div>
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            // NEO BRUTAL tooltip
            'absolute z-50',
            'px-4 py-2',
            'text-sm font-bold',
            'text-[var(--foreground)]',
            'bg-[var(--card)]',
            'border-3 border-[var(--border)]',
            'shadow-[var(--shadow-brutal)]',
            'whitespace-nowrap',
            positionStyles[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
