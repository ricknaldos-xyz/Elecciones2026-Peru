'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, useRouter } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { AccessibilityButton } from '@/components/accessibility/AccessibilityButton'
import { useSearchShortcut } from '@/hooks/useKeyboardShortcuts'
import type { CandidateWithScores } from '@/types/database'
import type { Locale } from '@/i18n/config'

interface HeaderProps {
  currentPath?: string
}

export function Header({ currentPath }: HeaderProps) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const t = useTranslations('nav')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CandidateWithScores[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: "/" to open search
  const openSearch = useCallback(() => {
    setSearchOpen(true)
    // Focus input after state update
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [])
  useSearchShortcut(openSearch)

  // Focus trap for mobile menu (accessibility)
  useEffect(() => {
    if (!mobileMenuOpen || !mobileMenuRef.current) return

    const menuElement = mobileMenuRef.current
    const focusableElements = menuElement.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab: if on first element, go to last
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    // Focus first element when menu opens
    firstElement?.focus()

    return () => document.removeEventListener('keydown', handleTabKey)
  }, [mobileMenuOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Escape key handler for dropdowns (accessibility)
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (searchOpen) setSearchOpen(false)
        if (mobileMenuOpen) setMobileMenuOpen(false)
        if (moreMenuOpen) setMoreMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [searchOpen, mobileMenuOpen, moreMenuOpen])

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

  // Primary nav items - always visible on desktop
  const primaryNavItems = [
    { href: '/ranking' as const, labelKey: 'ranking' as const },
    { href: '/comparar' as const, labelKey: 'compare' as const },
    { href: '/quiz' as const, labelKey: 'quiz' as const, isNew: true },
    { href: '/noticias' as const, labelKey: 'news' as const },
  ]

  // Secondary nav items - in "More" dropdown on desktop
  const secondaryNavItems = [
    { href: '/transparencia' as const, labelKey: 'transparency' as const, descKey: 'transparencyDesc' as const, icon: '💰' },
    { href: '/metodologia' as const, labelKey: 'methodology' as const, descKey: 'methodologyDesc' as const, icon: '📊' },
    { href: '/docs' as const, labelKey: 'docs' as const, descKey: 'docsDesc' as const, icon: '📖' },
  ]

  // All nav items for mobile menu
  const allNavItems = [...primaryNavItems, ...secondaryNavItems]

  return (
    <>
      {/* Skip Link - Accessibility */}
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only',
          'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
          'focus:px-4 focus:py-2',
          'focus:bg-[var(--primary)] focus:text-white',
          'focus:border-3 focus:border-[var(--border)]',
          'focus:shadow-[var(--shadow-brutal)]',
          'focus:font-bold focus:uppercase focus:text-sm'
        )}
      >
        {t('skipToContent')}
      </a>
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
                <span className="text-xs text-[var(--primary)] font-bold leading-tight uppercase tracking-widest">
                  Perú 2026
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav - NEO BRUTAL */}
          <nav className="hidden md:flex items-center gap-1" aria-label={t('mainNavigation')}>
            {primaryNavItems.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={currentPath === link.href ? 'page' : undefined}
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
                {t(link.labelKey)}
                {link.isNew && (
                  <span className="text-xs font-black bg-[var(--score-medium)] text-black px-1.5 py-0.5 leading-none">
                    {t('new')}
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
                aria-label={t('search')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
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
                      ref={searchInputRef}
                      type="text"
                      placeholder={`${t('searchPlaceholder')} (presiona /)`}
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
                      aria-describedby="search-status"
                    />
                  </div>
                  {/* Screen reader announcements */}
                  <div
                    id="search-status"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                  >
                    {isSearching && t('searching')}
                    {!isSearching && searchQuery.length >= 2 && searchResults.length > 0 &&
                      `${searchResults.length} ${t('resultsFound')}`}
                    {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 &&
                      t('noResults')}
                  </div>
                  {isSearching && (
                    <div className="px-4 py-3 text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wide" aria-hidden="true">
                      {t('searching')}
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
                      {t('noResults')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher currentLocale={locale} />

            {/* Accessibility Button */}
            <AccessibilityButton />

            {/* More Menu - Desktop Only */}
            <div ref={moreMenuRef} className="relative hidden md:block">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
                className={cn(
                  'px-3 py-2',
                  'min-w-[44px] min-h-[44px]',
                  'flex items-center gap-1.5',
                  'text-sm font-bold uppercase tracking-wide',
                  'text-[var(--foreground)]',
                  'border-2 border-transparent',
                  'transition-all duration-100',
                  'hover:bg-[var(--muted)]',
                  'hover:border-[var(--border)]',
                  'hover:-translate-x-0.5 hover:-translate-y-0.5',
                  'hover:shadow-[var(--shadow-brutal-sm)]',
                  moreMenuOpen && [
                    'bg-[var(--muted)]',
                    'border-[var(--border)]',
                    'shadow-[var(--shadow-brutal-sm)]',
                  ]
                )}
              >
                <span>{t('more')}</span>
                <svg
                  className={cn('w-4 h-4 transition-transform duration-100', moreMenuOpen && 'rotate-180')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Megamenu Dropdown */}
              {moreMenuOpen && (
                <div className={cn(
                  'absolute right-0 top-full mt-2',
                  'w-72',
                  'bg-[var(--card)]',
                  'border-3 border-[var(--border)]',
                  'shadow-[var(--shadow-brutal-lg)]',
                  'z-50'
                )}>
                  {secondaryNavItems.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreMenuOpen(false)}
                      aria-current={currentPath === link.href ? 'page' : undefined}
                      className={cn(
                        'flex items-start gap-3 w-full px-4 py-4',
                        'transition-all duration-100',
                        index < secondaryNavItems.length - 1 && 'border-b-2 border-[var(--border)]',
                        currentPath === link.href
                          ? [
                              'bg-[var(--primary)]',
                              'text-white',
                            ]
                          : [
                              'text-[var(--foreground)]',
                              'hover:bg-[var(--muted)]',
                              'hover:-translate-x-0.5 hover:-translate-y-0.5',
                            ]
                      )}
                    >
                      <span className="text-xl" aria-hidden="true">{link.icon}</span>
                      <div className="flex-1">
                        <span className="block text-sm font-bold uppercase tracking-wide">
                          {t(link.labelKey)}
                        </span>
                        <span className={cn(
                          'block text-xs mt-0.5',
                          currentPath === link.href
                            ? 'text-white/80'
                            : 'text-[var(--muted-foreground)]'
                        )}>
                          {t(link.descKey)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* CTA Button - Desktop */}
            <Link href="/ranking" className="hidden md:block">
              <Button variant="primary" size="sm">
                {t('viewRanking')}
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
              aria-label={t('menu')}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
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
          <div ref={mobileMenuRef} id="mobile-menu" className="md:hidden border-t-3 border-[var(--border)] py-4">
            <nav className="flex flex-col gap-2" aria-label={t('mobileNavigation')}>
              {allNavItems.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={currentPath === link.href ? 'page' : undefined}
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
                  {t(link.labelKey)}
                  {'isNew' in link && link.isNew && (
                    <span className="text-xs font-black bg-[var(--score-medium)] text-black px-1.5 py-0.5 leading-none">
                      {t('new')}
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
                  {t('viewRanking')}
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  )
}
