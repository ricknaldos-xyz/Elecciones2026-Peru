import { Metadata } from 'next'
import { NewsManager } from './NewsManager'

export const metadata: Metadata = {
  title: 'Curación de Noticias - Admin',
  robots: 'noindex, nofollow',
}

export default function AdminNewsPage() {
  return <NewsManager />
}
