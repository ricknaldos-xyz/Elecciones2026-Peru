'use client'

import { cn } from '@/lib/utils'
import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
  tabs: string[]
  registerTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

interface TabsProps {
  defaultTab: string
  children: React.ReactNode
  className?: string
  onTabChange?: (tab: string) => void
}

export function Tabs({ defaultTab, children, className, onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [tabs, setTabs] = useState<string[]>([])

  const handleSetActiveTab = useCallback((tab: string) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }, [onTabChange])

  const registerTab = useCallback((tab: string) => {
    setTabs(prev => {
      if (prev.includes(tab)) return prev
      return [...prev, tab]
    })
  }, [])

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab, tabs, registerTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: React.ReactNode
  className?: string
  showScrollIndicators?: boolean
}

export function TabList({ children, className, showScrollIndicators = true }: TabListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Check scroll position
  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollIndicators()
    el.addEventListener('scroll', updateScrollIndicators, { passive: true })
    window.addEventListener('resize', updateScrollIndicators)

    return () => {
      el.removeEventListener('scroll', updateScrollIndicators)
      window.removeEventListener('resize', updateScrollIndicators)
    }
  }, [updateScrollIndicators])

  const scrollTo = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return

    const scrollAmount = el.clientWidth * 0.6
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative group">
      {/* Left scroll indicator */}
      {showScrollIndicators && canScrollLeft && (
        <button
          onClick={() => scrollTo('left')}
          className={cn(
            'absolute left-0 top-0 bottom-0 z-10',
            'w-8 flex items-center justify-start pl-1',
            'bg-gradient-to-r from-[var(--muted)] via-[var(--muted)]/80 to-transparent',
            'text-[var(--foreground)]',
            'opacity-0 group-hover:opacity-100 sm:opacity-100',
            'transition-opacity duration-200',
            'focus:outline-none'
          )}
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right scroll indicator */}
      {showScrollIndicators && canScrollRight && (
        <button
          onClick={() => scrollTo('right')}
          className={cn(
            'absolute right-0 top-0 bottom-0 z-10',
            'w-8 flex items-center justify-end pr-1',
            'bg-gradient-to-l from-[var(--muted)] via-[var(--muted)]/80 to-transparent',
            'text-[var(--foreground)]',
            'opacity-0 group-hover:opacity-100 sm:opacity-100',
            'transition-opacity duration-200',
            'focus:outline-none'
          )}
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div
        ref={scrollRef}
        className={cn(
          // NEO BRUTAL tab list with horizontal scroll for mobile
          'flex',
          'bg-[var(--muted)]',
          'border-3 border-[var(--border)]',
          'shadow-[var(--shadow-brutal-sm)]',
          'p-1',
          'gap-1',
          // Mobile: horizontal scroll with snap
          'overflow-x-auto',
          'snap-x snap-mandatory',
          'scrollbar-hide',
          '-webkit-overflow-scrolling-touch',
          className
        )}
        style={{
          // Hide scrollbar but keep functionality
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}

interface TabProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function Tab({ value, children, className }: TabProps) {
  const { activeTab, setActiveTab, registerTab } = useTabs()
  const isActive = activeTab === value
  const tabRef = useRef<HTMLButtonElement>(null)

  // Register tab on mount
  useEffect(() => {
    registerTab(value)
  }, [value, registerTab])

  // Scroll active tab into view
  useEffect(() => {
    if (isActive && tabRef.current) {
      tabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }, [isActive])

  return (
    <button
      ref={tabRef}
      onClick={() => setActiveTab(value)}
      className={cn(
        // NEO BRUTAL tab with mobile-friendly touch targets
        'px-3 py-3 sm:px-5 sm:py-2.5',
        'text-xs sm:text-sm font-bold uppercase tracking-wide',
        'transition-all duration-100',
        'border-2',
        'whitespace-nowrap',
        'snap-start',
        'flex-shrink-0',
        // Minimum touch target 44x44px for accessibility
        'min-h-[44px]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
        isActive
          ? [
              'bg-[var(--primary)]',
              'text-white',
              'border-[var(--border)]',
              'shadow-[var(--shadow-brutal-sm)]',
              '-translate-x-0.5 -translate-y-0.5',
            ]
          : [
              'bg-[var(--background)]',
              'text-[var(--foreground)]',
              'border-transparent',
              'hover:border-[var(--border)]',
              'hover:-translate-x-0.5 hover:-translate-y-0.5',
              'hover:shadow-[var(--shadow-brutal-sm)]',
            ],
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabPanelProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { activeTab } = useTabs()

  if (activeTab !== value) return null

  return <div className={cn('py-4', className)}>{children}</div>
}

// Swipeable Tab Content wrapper for touch gestures
interface SwipeableTabsProps {
  children: React.ReactNode
  className?: string
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function SwipeableTabContent({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50
}: SwipeableTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left -> go to next tab
        onSwipeLeft?.()
      } else {
        // Swiped right -> go to previous tab
        onSwipeRight?.()
      }
    }

    // Reset
    touchStartX.current = 0
    touchEndX.current = 0
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn('touch-pan-y', className)}
    >
      {children}
    </div>
  )
}

// Hook for using swipeable tabs
export function useSwipeableTabs(tabs: string[], currentTab: string, setTab: (tab: string) => void) {
  const currentIndex = tabs.indexOf(currentTab)

  const goToNext = useCallback(() => {
    if (currentIndex < tabs.length - 1) {
      setTab(tabs[currentIndex + 1])
    }
  }, [currentIndex, tabs, setTab])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setTab(tabs[currentIndex - 1])
    }
  }, [currentIndex, tabs, setTab])

  return { goToNext, goToPrev }
}
