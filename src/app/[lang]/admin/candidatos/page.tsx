import { Metadata } from 'next'
import { CandidatesManager } from './CandidatesManager'

export const metadata: Metadata = {
  title: 'Gestión de Candidatos - Admin',
  robots: 'noindex, nofollow',
}

export default function AdminCandidatesPage() {
  return <CandidatesManager />
}
