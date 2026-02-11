'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Toast types with distinct visual indicators
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast icons - distinct shapes for colorblind accessibility
function ToastIcon({ type }: { type: ToastType }) {
  const iconClass = 'w-5 h-5 flex-shrink-0'

  switch (type) {
    case 'success':
      // Checkmark in circle
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </svg>
      )
    case 'error':
      // X in circle
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
        </svg>
      )
    case 'warning':
      // Triangle with exclamation
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
      )
    case 'info':
    default:
      // Info circle
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        </svg>
      )
  }
}

// Style configurations per type
const typeStyles: Record<ToastType, { container: string; icon: string; title: string }> = {
  success: {
    container: 'bg-[var(--score-excellent-bg)] border-[var(--score-excellent)]',
    icon: 'text-[var(--score-excellent)]',
    title: 'text-[var(--score-excellent-text)]',
  },
  error: {
    container: 'bg-[var(--flag-red-bg)] border-[var(--flag-red)]',
    icon: 'text-[var(--flag-red)]',
    title: 'text-[var(--flag-red-text)]',
  },
  warning: {
    container: 'bg-[var(--flag-amber-bg)] border-[var(--flag-amber)]',
    icon: 'text-[var(--flag-amber)]',
    title: 'text-[var(--flag-amber-text)]',
  },
  info: {
    container: 'bg-[var(--score-good-bg)] border-[var(--score-good)]',
    icon: 'text-[var(--score-good)]',
    title: 'text-[var(--score-good-text)]',
  },
}

// Accessible labels for screen readers — kept as static since Toast renders outside i18n provider context
const typeLabels: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
}

// Individual Toast component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const duration = toast.duration ?? 5000
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remainingRef = useRef(duration)
  const startTimeRef = useRef(Date.now())

  const startTimer = useCallback((remaining: number) => {
    if (remaining <= 0) return
    startTimeRef.current = Date.now()
    remainingRef.current = remaining
    timerRef.current = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onRemove, 200)
    }, remaining)
  }, [onRemove])

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      const elapsed = Date.now() - startTimeRef.current
      remainingRef.current = Math.max(remainingRef.current - elapsed, 0)
    }
  }, [])

  const resumeTimer = useCallback(() => {
    startTimer(remainingRef.current)
  }, [startTimer])

  useEffect(() => {
    if (duration > 0) {
      startTimer(duration)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }
  }, [duration, startTimer])

  const handlePause = useCallback(() => {
    if (duration > 0) {
      setIsPaused(true)
      pauseTimer()
    }
  }, [duration, pauseTimer])

  const handleResume = useCallback(() => {
    if (duration > 0) {
      setIsPaused(false)
      resumeTimer()
    }
  }, [duration, resumeTimer])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onRemove, 200)
  }

  const styles = typeStyles[toast.type]

  return (
    <div
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
      className={cn(
        // NEO BRUTAL toast
        'flex items-start gap-3',
        'p-4',
        'border-3',
        'shadow-[var(--shadow-brutal)]',
        'transition-all duration-200',
        styles.container,
        // Animation
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0',
        // Pattern for colorblind (based on type)
        toast.type === 'error' && 'pattern-severity-high',
        toast.type === 'warning' && 'pattern-severity-medium',
      )}
    >
      {/* Icon */}
      <span className={styles.icon}>
        <ToastIcon type={toast.type} />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn('font-bold uppercase tracking-wide text-sm', styles.title)}>
          <span className="sr-only">{typeLabels[toast.type]}: </span>
          {toast.title}
        </div>
        {toast.message && (
          <p className="text-sm text-[var(--foreground)] mt-1">
            {toast.message}
          </p>
        )}
      </div>

      {/* Close button - accessible */}
      <button
        onClick={handleClose}
        className={cn(
          'p-1',
          'min-w-[44px] min-h-[44px]',
          'flex items-center justify-center',
          'text-[var(--muted-foreground)]',
          'hover:text-[var(--foreground)]',
          'transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
        )}
        aria-label="Close notification"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar for auto-dismiss */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--border)]/20 overflow-hidden">
          <div
            className={cn('h-full', styles.icon.replace('text-', 'bg-'))}
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          />
        </div>
      )}
    </div>
  )
}

// Toast container that renders all active toasts
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[100]',
        'flex flex-col gap-3',
        'max-w-sm w-full',
        'pointer-events-none',
      )}
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  )
}

// Provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Convenience hooks for specific toast types
export function useSuccessToast() {
  const { addToast } = useToast()
  return useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }, [addToast])
}

export function useErrorToast() {
  const { addToast } = useToast()
  return useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message })
  }, [addToast])
}

export function useWarningToast() {
  const { addToast } = useToast()
  return useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message })
  }, [addToast])
}

export function useInfoToast() {
  const { addToast } = useToast()
  return useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }, [addToast])
}
