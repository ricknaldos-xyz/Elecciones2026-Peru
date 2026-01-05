'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: () => void
  description: string
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
}

/**
 * Hook for managing keyboard shortcuts with accessibility in mind.
 * Shortcuts are disabled when user is typing in an input field.
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      // Allow Escape to work even in input fields
      if (isInputField && event.key !== 'Escape') {
        return
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault()
          shortcut.handler()
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}

/**
 * Hook for search shortcut (/) - opens search when pressed
 */
export function useSearchShortcut(onOpenSearch: () => void) {
  useKeyboardShortcuts([
    {
      key: '/',
      handler: onOpenSearch,
      description: 'Abrir búsqueda',
    },
  ])
}

/**
 * Hook for list navigation (j/k) - common pattern for accessibility
 */
export function useListNavigationShortcuts(
  onNext: () => void,
  onPrevious: () => void,
  onSelect?: () => void
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'j',
      handler: onNext,
      description: 'Siguiente elemento',
    },
    {
      key: 'k',
      handler: onPrevious,
      description: 'Elemento anterior',
    },
  ]

  if (onSelect) {
    shortcuts.push({
      key: 'Enter',
      handler: onSelect,
      description: 'Seleccionar elemento',
    })
  }

  useKeyboardShortcuts(shortcuts)
}

/**
 * Hook for modal/dialog escape handling
 */
export function useEscapeShortcut(onEscape: () => void, enabled = true) {
  useKeyboardShortcuts(
    [
      {
        key: 'Escape',
        handler: onEscape,
        description: 'Cerrar',
      },
    ],
    { enabled }
  )
}

/**
 * Returns a formatted string showing all available shortcuts
 * Useful for help dialogs
 */
export function getShortcutsHelp(): { key: string; description: string }[] {
  return [
    { key: '/', description: 'Abrir búsqueda' },
    { key: 'j', description: 'Siguiente candidato' },
    { key: 'k', description: 'Candidato anterior' },
    { key: 'Escape', description: 'Cerrar diálogos' },
    { key: 'Tab', description: 'Navegar entre elementos' },
    { key: 'Enter', description: 'Seleccionar/Activar' },
    { key: '←/→', description: 'Cambiar pestaña' },
  ]
}
