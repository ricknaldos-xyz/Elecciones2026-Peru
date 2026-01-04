'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { CandidateWithScores } from '@/types/database'

interface HeaderProps {
  currentPath?: string
}

export function Header({ currentPath }: HeaderProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CandidateWithScores[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/candidates`)
        const candidates: CandidateWithScores[] = await response.json()
        const filtered = candidates.filter((c) =>
          c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        setSearchResults(filtered)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const toggleDarkMode = () => {
    const newDark = !darkMode
    setDarkMode(newDark)
    if (newDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const navLinks = [
    { href: '/ranking', label: 'Ranking' },
    { href: '/noticias', label: 'Noticias', isNew: true },
    { href: '/quiz', label: 'Quiz' },
    { href: '/comparar', label: 'Comparar' },
    { href: '/transparencia', label: 'Transparencia' },
    { href: '/metodologia', label: 'Metodologia' },
  ]

  return (
    <header className={cn(
      'sticky top-0 z-50',
      'bg-[var(--background)]',
      'border-b-4 border-[var(--border)]',
      'shadow-[var(--shadow-brutal-sm)]'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - NEO BRUTAL - Mobile Optimized */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              {/* Peru Flag Icon - Blocky - Responsive */}
              <div className={cn(
                'w-8 h-8 sm:w-10 sm:h-10',
                'bg-[var(--primary)]',
                'border-3 border-[var(--border)]',
                'shadow-[var(--shadow-brutal-sm)]',
                'flex items-center justify-center',
                'transition-all duration-100',
                'group-hover:-translate-x-0.5 group-hover:-translate-y-0.5',
                'group-hover:shadow-[var(--shadow-brutal)]'
              )}>
                <span className="text-white font-black text-xs sm:text-sm tracking-tighter">PE</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base lg:text-lg font-black text-[var(--foreground)] leading-tight tracking-tight uppercase">
                  Ranking Electoral
                </span>
                <span className="text-[10px] sm:text-xs text-[var(--primary)] font-bold leading-tight uppercase tracking-widest">
                  Peru 2026
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav - NEO BRUTAL */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 text-sm font-bold uppercase tracking-wide',
                  'border-2 border-transparent',
                  'transition-all duration-100',
                  'flex items-center gap-1.5',
                  currentPath === link.href
                    ? [
                        'bg-[var(--primary)]',
                        'text-white',
                        'border-[var(--border)]',
                        'shadow-[var(--shadow-brutal-sm)]',
                      ]
                    : [
                        'text-[var(--foreground)]',
                        'hover:bg-[var(--muted)]',
                        'hover:border-[var(--border)]',
                        'hover:-translate-x-0.5 hover:-translate-y-0.5',
                        'hover:shadow-[var(--shadow-brutal-sm)]',
                      ]
                )}
              >
                {link.label}
                {link.isNew && (
                  <span className="text-[10px] font-black bg-[var(--score-medium)] text-black px-1.5 py-0.5 leading-none">
                    NEW
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button - NEO BRUTAL - 44px Touch Target */}
            <div ref={searchRef} className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={cn(
                  'p-2.5 sm:p-2',
                  'min-w-[44px] min-h-[44px]',
                  'flex items-center justify-center',
                  'text-[var(--foreground)]',
                  'border-2 border-transparent',
                  'transition-all duration-100',
                  'hover:bg-[var(--muted)]',
                  'hover:border-[var(--border)]',
                  'hover:-translate-x-0.5 hover:-translate-y-0.5',
                  'hover:shadow-[var(--shadow-brutal-sm)]',
                  searchOpen && [
                    'bg-[var(--muted)]',
                    'border-[var(--border)]',
                    'shadow-[var(--shadow-brutal-sm)]',
                  ]
                )}
                aria-label="Buscar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Search Dropdown - NEO BRUTAL - Mobile Responsive */}
              {searchOpen && (
                <div className={cn(
                  'absolute right-0 top-full mt-2',
                  'w-[calc(100vw-2rem)] sm:w-80 max-w-md',
                  'bg-[var(--card)]',
                  'border-3 border-[var(--border)]',
                  'shadow-[var(--shadow-brutal-lg)]',
                  'overflow-hidden'
                )}>
                  <div className="p-3">
                    <input
                      type="text"
                      placeholder="Buscar candidato..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(
                        'w-full px-4 py-2.5',
                        'bg-[var(--background)]',
                        'border-2 border-[var(--border)]',
                        'text-[var(--foreground)]',
                        'font-bold',
                        'placeholder:text-[var(--muted-foreground)] placeholder:font-medium',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2'
                      )}
                      autoFocus
                    />
                  </div>
                  {isSearching && (
                    <div className="px-4 py-3 text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wide">
                      Buscando...
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="border-t-3 border-[var(--border)]">
                      {searchResults.map((candidate) => (
                        <button
                          key={candidate.id}
                          onClick={() => {
                            router.push(`/candidato/${candidate.slug}`)
                            setSearchOpen(false)
                            setSearchQuery('')
                          }}
                          className={cn(
                            'w-full px-4 py-3 text-left',
                            'flex items-center gap-3',
                            'transition-all duration-100',
                            'hover:bg-[var(--muted)]',
                            'border-b-2 border-[var(--border)] last:border-b-0'
                          )}
                        >
                          <div className={cn(
                            'w-10 h-10',
                            'bg-[var(--muted)]',
                            'border-2 border-[var(--border)]',
                            'flex items-center justify-center',
                            'text-sm font-black text-[var(--foreground)]'
                          )}>
                            {candidate.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-[var(--foreground)] truncate uppercase">
                              {candidate.full_name}
                            </div>
                            <div className="text-xs font-medium text-[var(--muted-foreground)]">
                              {candidate.party?.short_name || candidate.cargo}
                            </div>
                          </div>
                          <div className="text-xl font-black text-[var(--foreground)]">
                            {candidate.scores.score_balanced.toFixed(0)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                    <div className="px-4 py-3 text-sm font-bold text-[var(--muted-foreground)] border-t-3 border-[var(--border)] uppercase tracking-wide">
                      No se encontraron resultados
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle - NEO BRUTAL - 44px Touch Target */}
            <button
              onClick={toggleDarkMode}
              className={cn(
                'p-2.5 sm:p-2',
                'min-w-[44px] min-h-[44px]',
                'flex items-center justify-center',
                'text-[var(--foreground)]',
                'border-2 border-transparent',
                'transition-all duration-100',
                'hover:bg-[var(--muted)]',
                'hover:border-[var(--border)]',
                'hover:-translate-x-0.5 hover:-translate-y-0.5',
                'hover:shadow-[var(--shadow-brutal-sm)]'
              )}
              aria-label="Cambiar tema"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* CTA Button - Desktop */}
            <Link href="/ranking" className="hidden md:block">
              <Button variant="primary" size="sm">
                Ver Ranking
              </Button>
            </Link>

            {/* Mobile Menu Button - NEO BRUTAL - 44px Touch Target */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                'md:hidden p-2.5',
                'min-w-[44px] min-h-[44px]',
                'flex items-center justify-center',
                'text-[var(--foreground)]',
                'border-2 border-transparent',
                'transition-all duration-100',
                'hover:bg-[var(--muted)]',
                'hover:border-[var(--border)]',
                mobileMenuOpen && [
                  'bg-[var(--muted)]',
                  'border-[var(--border)]',
                ]
              )}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu - NEO BRUTAL - Improved Touch Targets */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-3 border-[var(--border)] py-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-3.5',
                    'min-h-[48px]',
                    'font-bold uppercase tracking-wide text-sm',
                    'border-2 transition-all duration-100',
                    'flex items-center gap-2',
                    currentPath === link.href
                      ? [
                          'bg-[var(--primary)]',
                          'text-white',
                          'border-[var(--border)]',
                          'shadow-[var(--shadow-brutal-sm)]',
                        ]
                      : [
                          'text-[var(--foreground)]',
                          'border-transparent',
                          'hover:bg-[var(--muted)]',
                          'hover:border-[var(--border)]',
                        ]
                  )}
                >
                  {link.label}
                  {link.isNew && (
                    <span className="text-[10px] font-black bg-[var(--score-medium)] text-black px-1.5 py-0.5 leading-none">
                      NEW
                    </span>
                  )}
                </Link>
              ))}
              <Link
                href="/ranking"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2"
              >
                <Button variant="primary" size="lg" className="w-full">
                  Ver Ranking
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
