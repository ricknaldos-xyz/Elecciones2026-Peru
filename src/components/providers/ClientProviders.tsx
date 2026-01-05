'use client'

import { ToastProvider } from '@/components/ui/Toast'

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}
