'use client'

import { ToastProvider } from '@/components/ui/Toast'
import { AccessibilityProvider } from '@/context/AccessibilityContext'

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AccessibilityProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AccessibilityProvider>
  )
}
