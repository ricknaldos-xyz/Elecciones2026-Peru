'use client'

import { cn } from '@/lib/utils'
import { createContext, useContext, useState } from 'react'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
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
}

export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: React.ReactNode
  className?: string
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div
      className={cn(
        // NEO BRUTAL tab list
        'flex',
        'bg-[var(--muted)]',
        'border-3 border-[var(--border)]',
        'shadow-[var(--shadow-brutal-sm)]',
        'p-1',
        'gap-1',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function Tab({ value, children, className }: TabProps) {
  const { activeTab, setActiveTab } = useTabs()
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        // NEO BRUTAL tab
        'px-5 py-2.5',
        'text-sm font-bold uppercase tracking-wide',
        'transition-all duration-100',
        'border-2',
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
