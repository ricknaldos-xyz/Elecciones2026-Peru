import { Metadata } from 'next'
import { AdminDashboard } from './AdminDashboard'

export const metadata: Metadata = {
  title: 'Admin Panel - Voto Informado',
  robots: 'noindex, nofollow',
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return <AdminDashboard lang={lang} />
}
