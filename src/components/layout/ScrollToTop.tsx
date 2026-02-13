'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from '@/components/ui/icons'

export function ScrollToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[var(--primary)] text-white border-3 border-[var(--border)] shadow-[var(--shadow-brutal)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-lg)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-pressed)] transition-all duration-100 flex items-center justify-center cursor-pointer"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  )
}
