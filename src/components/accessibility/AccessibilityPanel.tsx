'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useAccessibility, type ColorVisionMode, type FontSizePreference } from '@/context/AccessibilityContext'

interface AccessibilityPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const t = useTranslations('accessibility')
  const panelRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)

  const {
    preferences,
    setColorVisionMode,
    setHighContrast,
    setReducedMotion,
    setFontSize,
    setShowPatterns,
    setDarkMode,
    resetToDefaults,
    resetToSystemDefaults,
    isHydrated,
  } = useAccessibility()

  // Focus trap
  useEffect(() => {
    if (!isOpen || !panelRef.current) return

    const panel = panelRef.current
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'button, input, select, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleTabKey)
    document.addEventListener('keydown', handleEscape)
    firstElement?.focus()

    return () => {
      document.removeEventListener('keydown', handleTabKey)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Delay to avoid immediate close on button click
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const colorVisionOptions: { value: ColorVisionMode; labelKey: string }[] = [
    { value: 'normal', labelKey: 'normal' },
    { value: 'protanopia', labelKey: 'protanopia' },
    { value: 'deuteranopia', labelKey: 'deuteranopia' },
    { value: 'tritanopia', labelKey: 'tritanopia' },
    { value: 'achromatopsia', labelKey: 'achromatopsia' },
  ]

  const fontSizeOptions: { value: FontSizePreference; labelKey: string }[] = [
    { value: 'normal', labelKey: 'fontNormal' },
    { value: 'large', labelKey: 'fontLarge' },
    { value: 'extra-large', labelKey: 'fontExtraLarge' },
  ]

  const handleColorVisionChange = useCallback((mode: ColorVisionMode) => {
    setColorVisionMode(mode)
    // Auto-enable patterns for achromatopsia
    if (mode === 'achromatopsia' && !preferences.showPatterns) {
      setShowPatterns(true)
    }
  }, [setColorVisionMode, setShowPatterns, preferences.showPatterns])

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
      className={cn(
        'absolute right-0 top-full mt-2',
        'w-[calc(100vw-2rem)] sm:w-96 max-w-md',
        'bg-[var(--card)]',
        'border-3 border-[var(--border)]',
        'shadow-[var(--shadow-brutal-lg)]',
        'overflow-hidden',
        'z-50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-3 border-[var(--border)] bg-[var(--muted)]">
        <h2 id="accessibility-title" className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">
          {t('title')}
        </h2>
        <button
          ref={firstFocusableRef}
          onClick={onClose}
          className={cn(
            'p-1.5',
            'min-w-[36px] min-h-[36px]',
            'flex items-center justify-center',
            'text-[var(--foreground)]',
            'border-2 border-transparent',
            'transition-all duration-100',
            'hover:bg-[var(--background)]',
            'hover:border-[var(--border)]'
          )}
          aria-label={t('close')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
        {/* Color Vision Mode */}
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
            {t('colorVision')}
          </legend>
          <div className="space-y-1">
            {colorVisionOptions.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5',
                  'min-h-[44px]',
                  'cursor-pointer',
                  'border-2 transition-all duration-100',
                  preferences.colorVisionMode === option.value
                    ? 'bg-[var(--primary)] text-white border-[var(--border)] shadow-[var(--shadow-brutal-sm)]'
                    : 'bg-[var(--background)] text-[var(--foreground)] border-transparent hover:border-[var(--border)] hover:bg-[var(--muted)]'
                )}
              >
                <input
                  type="radio"
                  name="colorVisionMode"
                  value={option.value}
                  checked={preferences.colorVisionMode === option.value}
                  onChange={() => handleColorVisionChange(option.value)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'w-4 h-4 border-2 flex items-center justify-center',
                    preferences.colorVisionMode === option.value
                      ? 'border-white bg-white'
                      : 'border-[var(--border)] bg-[var(--background)]'
                  )}
                >
                  {preferences.colorVisionMode === option.value && (
                    <span className="w-2 h-2 bg-[var(--primary)]" />
                  )}
                </span>
                <span className="text-sm font-bold">{t(option.labelKey)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Preview Colors */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
            {t('preview')}
          </span>
          <div className="flex gap-1 h-6">
            <div className="flex-1 bg-[var(--score-excellent)] border-2 border-[var(--border)] pattern-score-excellent" />
            <div className="flex-1 bg-[var(--score-good)] border-2 border-[var(--border)] pattern-score-good" />
            <div className="flex-1 bg-[var(--score-medium)] border-2 border-[var(--border)] pattern-score-medium" />
            <div className="flex-1 bg-[var(--score-poor)] border-2 border-[var(--border)] pattern-score-poor" />
            <div className="flex-1 bg-[var(--flag-red)] border-2 border-[var(--border)] pattern-severity-high" />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          {/* Show Patterns */}
          <ToggleOption
            label={t('showPatterns')}
            description={t('showPatternsDesc')}
            checked={preferences.showPatterns}
            onChange={setShowPatterns}
            disabled={preferences.colorVisionMode === 'achromatopsia'}
          />

          {/* High Contrast */}
          <ToggleOption
            label={t('highContrast')}
            checked={preferences.highContrast}
            onChange={setHighContrast}
          />

          {/* Reduced Motion */}
          <ToggleOption
            label={t('reducedMotion')}
            checked={preferences.reducedMotion}
            onChange={setReducedMotion}
          />

          {/* Dark Mode */}
          <ToggleOption
            label={t('darkMode')}
            checked={preferences.darkMode}
            onChange={setDarkMode}
          />
        </div>

        {/* Font Size */}
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
            {t('fontSize')}
          </legend>
          <div className="flex gap-2">
            {fontSizeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFontSize(option.value)}
                className={cn(
                  'flex-1 px-3 py-2.5',
                  'min-h-[44px]',
                  'text-sm font-bold uppercase',
                  'border-2 transition-all duration-100',
                  preferences.fontSize === option.value
                    ? 'bg-[var(--primary)] text-white border-[var(--border)] shadow-[var(--shadow-brutal-sm)]'
                    : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]'
                )}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t-2 border-[var(--border)]">
          <button
            onClick={resetToSystemDefaults}
            className={cn(
              'flex-1 px-3 py-2.5',
              'min-h-[44px]',
              'text-xs font-bold uppercase tracking-wide',
              'bg-[var(--muted)] text-[var(--foreground)]',
              'border-2 border-[var(--border)]',
              'transition-all duration-100',
              'hover:bg-[var(--background)]',
              'hover:-translate-x-0.5 hover:-translate-y-0.5',
              'hover:shadow-[var(--shadow-brutal-sm)]'
            )}
          >
            {t('useSystemDefaults')}
          </button>
          <button
            onClick={resetToDefaults}
            className={cn(
              'flex-1 px-3 py-2.5',
              'min-h-[44px]',
              'text-xs font-bold uppercase tracking-wide',
              'bg-[var(--background)] text-[var(--foreground)]',
              'border-2 border-[var(--border)]',
              'transition-all duration-100',
              'hover:bg-[var(--muted)]',
              'hover:-translate-x-0.5 hover:-translate-y-0.5',
              'hover:shadow-[var(--shadow-brutal-sm)]'
            )}
          >
            {t('resetAll')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Toggle component
interface ToggleOptionProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function ToggleOption({ label, description, checked, onChange, disabled }: ToggleOptionProps) {
  return (
    <label
      className={cn(
        'flex items-center justify-between gap-3 px-3 py-2.5',
        'min-h-[44px]',
        'bg-[var(--background)]',
        'border-2 border-[var(--border)]',
        'cursor-pointer',
        'transition-all duration-100',
        'hover:bg-[var(--muted)]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex-1">
        <span className="text-sm font-bold text-[var(--foreground)]">{label}</span>
        {description && (
          <span className="block text-xs text-[var(--muted-foreground)]">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative w-12 h-7',
          'border-2 border-[var(--border)]',
          'transition-all duration-100',
          checked ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]',
          !disabled && 'hover:shadow-[var(--shadow-brutal-sm)]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5',
            'bg-white border-2 border-[var(--border)]',
            'transition-all duration-100',
            checked ? 'left-[calc(100%-22px)]' : 'left-0.5'
          )}
        />
      </button>
    </label>
  )
}
