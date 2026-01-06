import { Metadata } from 'next'
import { FlagsManager } from './FlagsManager'

export const metadata: Metadata = {
  title: 'Gestión de Alertas - Admin',
  robots: 'noindex, nofollow',
}

export default function AdminFlagsPage() {
  return <FlagsManager />
}
