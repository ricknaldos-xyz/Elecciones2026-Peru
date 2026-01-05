'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'

// ============================================
// TYPES
// ============================================

/** Modos de vision de color */
export type ColorVisionMode =
  | 'normal'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'

/** Tamanos de fuente disponibles */
export type FontSizePreference = 'normal' | 'large' | 'extra-large'

/** Preferencias de accesibilidad del usuario */
export interface AccessibilityPreferences {
  colorVisionMode: ColorVisionMode
  highContrast: boolean
  reducedMotion: boolean
  fontSize: FontSizePreference
  showPatterns: boolean
  darkMode: boolean
}

/** Preferencias detectadas del sistema */
export interface SystemPreferences {
  prefersReducedMotion: boolean
  prefersHighContrast: boolean
  prefersDarkMode: boolean
}

/** Valor del contexto de accesibilidad */
export interface AccessibilityContextValue {
  preferences: AccessibilityPreferences
  setColorVisionMode: (mode: ColorVisionMode) => void
  setHighContrast: (enabled: boolean) => void
  setReducedMotion: (enabled: boolean) => void
  setFontSize: (size: FontSizePreference) => void
  setShowPatterns: (enabled: boolean) => void
  setDarkMode: (enabled: boolean) => void
  resetToDefaults: () => void
  resetToSystemDefaults: () => void
  systemPreferences: SystemPreferences
  isHydrated: boolean
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = 'accessibility-preferences'

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  colorVisionMode: 'normal',
  highContrast: false,
  reducedMotion: false,
  fontSize: 'normal',
  showPatterns: false,
  darkMode: false,
}

const FONT_SIZE_MAP: Record<FontSizePreference, string> = {
  normal: '100%',
  large: '112.5%',
  'extra-large': '125%',
}

// ============================================
// CONTEXT
// ============================================

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

// ============================================
// PROVIDER
// ============================================

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES)
  const [isHydrated, setIsHydrated] = useState(false)
  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersDarkMode: false,
  })

  // Hidratar desde localStorage + detectar preferencias del sistema
  useEffect(() => {
    // Detectar preferencias del sistema
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const contrastQuery = window.matchMedia('(prefers-contrast: more)')
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const systemPrefs = {
      prefersReducedMotion: motionQuery.matches,
      prefersHighContrast: contrastQuery.matches,
      prefersDarkMode: darkQuery.matches,
    }
    setSystemPreferences(systemPrefs)

    // Listeners para cambios en preferencias del sistema
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSystemPreferences((prev) => ({ ...prev, prefersReducedMotion: e.matches }))
    }
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setSystemPreferences((prev) => ({ ...prev, prefersHighContrast: e.matches }))
    }
    const handleDarkChange = (e: MediaQueryListEvent) => {
      setSystemPreferences((prev) => ({ ...prev, prefersDarkMode: e.matches }))
    }

    motionQuery.addEventListener('change', handleMotionChange)
    contrastQuery.addEventListener('change', handleContrastChange)
    darkQuery.addEventListener('change', handleDarkChange)

    // Cargar preferencias guardadas
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AccessibilityPreferences>
        setPreferences((prev) => ({ ...prev, ...parsed }))
      } else {
        // Primera vez: usar preferencias del sistema como defaults
        const oldTheme = localStorage.getItem('theme')
        setPreferences((prev) => ({
          ...prev,
          reducedMotion: systemPrefs.prefersReducedMotion,
          highContrast: systemPrefs.prefersHighContrast,
          darkMode: oldTheme === 'dark' || (!oldTheme && systemPrefs.prefersDarkMode),
        }))
      }
    } catch (e) {
      console.error('Error loading accessibility preferences:', e)
    }

    setIsHydrated(true)

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
      contrastQuery.removeEventListener('change', handleContrastChange)
      darkQuery.removeEventListener('change', handleDarkChange)
    }
  }, [])

  // Persistir cambios
  useEffect(() => {
    if (!isHydrated) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (e) {
      console.error('Error saving accessibility preferences:', e)
    }
  }, [preferences, isHydrated])

  // Aplicar clases al documento
  useEffect(() => {
    if (!isHydrated) return

    const html = document.documentElement

    // Color vision mode - remove all, then add current
    html.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia')
    if (preferences.colorVisionMode !== 'normal') {
      html.classList.add(preferences.colorVisionMode)
    }

    // High contrast
    html.classList.toggle('high-contrast', preferences.highContrast)

    // Reduced motion
    html.classList.toggle('reduce-motion', preferences.reducedMotion)

    // Patterns
    html.classList.toggle('show-patterns', preferences.showPatterns)

    // Dark mode
    html.classList.toggle('dark', preferences.darkMode)
    localStorage.setItem('theme', preferences.darkMode ? 'dark' : 'light')

    // Font size
    document.body.style.fontSize = FONT_SIZE_MAP[preferences.fontSize]
  }, [preferences, isHydrated])

  // Setters
  const setColorVisionMode = useCallback((mode: ColorVisionMode) => {
    setPreferences((prev) => ({ ...prev, colorVisionMode: mode }))
  }, [])

  const setHighContrast = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, highContrast: enabled }))
  }, [])

  const setReducedMotion = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, reducedMotion: enabled }))
  }, [])

  const setFontSize = useCallback((size: FontSizePreference) => {
    setPreferences((prev) => ({ ...prev, fontSize: size }))
  }, [])

  const setShowPatterns = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, showPatterns: enabled }))
  }, [])

  const setDarkMode = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, darkMode: enabled }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES)
  }, [])

  const resetToSystemDefaults = useCallback(() => {
    setPreferences({
      ...DEFAULT_PREFERENCES,
      reducedMotion: systemPreferences.prefersReducedMotion,
      highContrast: systemPreferences.prefersHighContrast,
      darkMode: systemPreferences.prefersDarkMode,
    })
  }, [systemPreferences])

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      preferences,
      setColorVisionMode,
      setHighContrast,
      setReducedMotion,
      setFontSize,
      setShowPatterns,
      setDarkMode,
      resetToDefaults,
      resetToSystemDefaults,
      systemPreferences,
      isHydrated,
    }),
    [
      preferences,
      setColorVisionMode,
      setHighContrast,
      setReducedMotion,
      setFontSize,
      setShowPatterns,
      setDarkMode,
      resetToDefaults,
      resetToSystemDefaults,
      systemPreferences,
      isHydrated,
    ]
  )

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

// ============================================
// HOOK
// ============================================

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}
