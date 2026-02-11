'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Navigation structure grouped by category
const navSections = [
  {
    category: 'Producto',
    icon: '🎯',
    items: [
      { id: 'vision', label: 'Visión y Misión', number: 1 },
      { id: 'problema', label: 'El Problema', number: 2 },
      { id: 'solucion', label: 'Nuestra Solución', number: 3 },
      { id: 'features', label: 'Funcionalidades', number: 8 },
    ],
  },
  {
    category: 'Técnico',
    icon: '⚙️',
    items: [
      { id: 'arquitectura', label: 'Arquitectura', number: 4 },
      { id: 'tech-stack', label: 'Stack Tecnológico', number: 5 },
      { id: 'database', label: 'Base de Datos', number: 9 },
      { id: 'api', label: 'API Reference', number: 10 },
      { id: 'design-system', label: 'Sistema de Diseño', number: 11 },
    ],
  },
  {
    category: 'Metodología',
    icon: '📊',
    items: [
      { id: 'metodologia', label: 'Scoring', number: 6 },
      { id: 'fuentes', label: 'Fuentes de Datos', number: 7 },
      { id: 'seguridad', label: 'Seguridad', number: 12 },
    ],
  },
  {
    category: 'Negocio',
    icon: '💼',
    items: [
      { id: 'modelo-negocio', label: 'Modelo de Negocio', number: 13 },
      { id: 'go-to-market', label: 'Go-to-Market', number: 14 },
      { id: 'roadmap', label: 'Product Roadmap', number: 15 },
    ],
  },
  {
    category: 'Legal & Ops',
    icon: '⚖️',
    items: [
      { id: 'legal', label: 'Legal & Compliance', number: 16 },
      { id: 'operaciones', label: 'Operaciones', number: 17 },
    ],
  },
]

// Flatten for scroll tracking
const allSections = navSections.flatMap((cat) => cat.items)

interface DocsContentProps {
  children: React.ReactNode
}

export function DocsContent({ children }: DocsContentProps) {
  const [activeSection, setActiveSection] = useState<string>('vision')
  const [progress, setProgress] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100
      setProgress(Math.min(scrollPercent, 100))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Intersection Observer for active section
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    )

    // Observe all sections
    allSections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) {
        observerRef.current?.observe(element)
      }
    })

    return () => observerRef.current?.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
    setMobileNavOpen(false)
  }

  return (
    <div className="relative">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[var(--muted)]">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mobile Nav Toggle */}
      <button
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-[var(--primary)] text-white rounded-none border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center font-black text-xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        aria-label="Toggle navigation"
      >
        {mobileNavOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Nav Overlay */}
      {mobileNavOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Mobile Nav Drawer */}
      <nav
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--background)] border-t-4 border-black transform transition-transform duration-300 max-h-[70vh] overflow-y-auto',
          mobileNavOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg uppercase">Navegación</h3>
            <span className="text-sm text-[var(--muted-foreground)]">{Math.round(progress)}%</span>
          </div>
          <div className="space-y-4">
            {navSections.map((category) => (
              <div key={category.category}>
                <div className="flex items-center gap-2 text-xs font-black text-[var(--muted-foreground)] uppercase mb-2">
                  <span>{category.icon}</span>
                  {category.category}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={cn(
                        'px-3 py-2 text-left text-sm font-bold border-2 transition-all min-h-[44px]',
                        activeSection === item.id
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Desktop Layout */}
      <div className="flex gap-8 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <nav className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 pb-8">
            {/* Progress indicator */}
            <div className="mb-6 p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-[var(--muted-foreground)]">Progreso</span>
                <span className="text-sm font-black text-[var(--primary)]">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-[var(--background)] border border-[var(--border)]">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Navigation sections */}
            <div className="space-y-6">
              {navSections.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center gap-2 text-xs font-black text-[var(--muted-foreground)] uppercase mb-3 px-2">
                    <span>{category.icon}</span>
                    {category.category}
                  </div>
                  <ul className="space-y-1">
                    {category.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm font-medium transition-all flex items-center gap-2 border-l-4',
                            activeSection === item.id
                              ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] font-bold'
                              : 'border-transparent hover:bg-[var(--muted)] hover:border-[var(--border)] text-[var(--muted-foreground)]'
                          )}
                        >
                          <span
                            className={cn(
                              'w-5 h-5 flex items-center justify-center text-xs font-black rounded-sm',
                              activeSection === item.id
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                            )}
                          >
                            {item.number}
                          </span>
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="mt-8 pt-6 border-t-2 border-[var(--border)]">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full px-4 py-2 bg-[var(--muted)] border-2 border-[var(--border)] text-sm font-bold text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all"
              >
                ↑ Volver arriba
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 py-8 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  )
}
