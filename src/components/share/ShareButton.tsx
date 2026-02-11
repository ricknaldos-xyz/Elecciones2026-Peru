'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useSuccessToast } from '@/components/ui/Toast'

interface ShareButtonProps {
  url?: string
  title: string
  description?: string
  className?: string
  variant?: 'icon' | 'button' | 'full'
  platforms?: ('whatsapp' | 'twitter' | 'facebook' | 'copy')[]
}

const SHARE_PLATFORMS = {
  whatsapp: {
    name: 'WhatsApp',
    color: '#25D366',
    icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
  },
  twitter: {
    name: 'X',
    color: '#000000',
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  copy: {
    name: 'Copiar',
    color: '#6B7280',
    icon: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3',
  },
}

export function ShareButton({
  url,
  title,
  description,
  className,
  variant = 'button',
  platforms = ['whatsapp', 'twitter', 'facebook', 'copy'],
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const showSuccess = useSuccessToast()
  const t = useTranslations('share')

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareText = description ? `${title}\n\n${description}` : title

  const handleShare = async (platform: keyof typeof SHARE_PLATFORMS) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)

    // Track share event
    try {
      await fetch('/api/analytics/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, url: shareUrl }),
      })
    } catch {
      // Ignore analytics errors
    }

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}%0A%0A${encodedUrl}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')
        break
      case 'copy':
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        setCopied(true)
        showSuccess(t('linkCopied'), t('clipboardMessage'))
        setTimeout(() => setCopied(false), 2000)
        break
    }

    setShowMenu(false)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        })
      } catch {
        // User cancelled or error
      }
    } else {
      setShowMenu(!showMenu)
    }
  }

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={handleNativeShare}
          className={cn(
            'p-2',
            'text-[var(--foreground)]',
            'border-2 border-transparent',
            'transition-all duration-100',
            'hover:bg-[var(--muted)]',
            'hover:border-[var(--border)]',
            'hover:-translate-x-0.5 hover:-translate-y-0.5',
            'hover:shadow-[var(--shadow-brutal-sm)]',
            className
          )}
          aria-label={t('shareLabel')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>

        {showMenu && (
          <div className={cn(
            'absolute right-0 top-full mt-2 z-50',
            'bg-[var(--card)]',
            'border-3 border-[var(--border)]',
            'shadow-[var(--shadow-brutal-lg)]',
            'p-2 min-w-[150px]'
          )}>
            {platforms.map((platform) => (
              <button
                key={platform}
                onClick={() => handleShare(platform)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2',
                  'text-sm font-bold text-[var(--foreground)]',
                  'hover:bg-[var(--muted)]',
                  'transition-colors'
                )}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d={SHARE_PLATFORMS[platform].icon} />
                </svg>
                {platform === 'copy' && copied ? t('copied') : platform === 'copy' ? t('copy') : SHARE_PLATFORMS[platform].name}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => handleShare(platform)}
            className={cn(
              'flex items-center gap-2 px-4 py-2',
              'text-sm font-bold text-white',
              'border-2 border-[var(--border)]',
              'shadow-[var(--shadow-brutal-sm)]',
              'transition-all duration-100',
              'hover:-translate-x-0.5 hover:-translate-y-0.5',
              'hover:shadow-[var(--shadow-brutal)]'
            )}
            style={{ backgroundColor: SHARE_PLATFORMS[platform].color }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d={SHARE_PLATFORMS[platform].icon} />
            </svg>
            {platform === 'copy' && copied ? t('copied') : platform === 'copy' ? t('copy') : SHARE_PLATFORMS[platform].name}
          </button>
        ))}
      </div>
    )
  }

  // Default button variant
  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={handleNativeShare}
        className={className}
        leftIcon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        }
      >
        {t('share')}
      </Button>

      {showMenu && (
        <div className={cn(
          'absolute right-0 top-full mt-2 z-50',
          'bg-[var(--card)]',
          'border-3 border-[var(--border)]',
          'shadow-[var(--shadow-brutal-lg)]',
          'p-2 min-w-[150px]'
        )}>
          {platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => handleShare(platform)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2',
                'text-sm font-bold text-[var(--foreground)]',
                'hover:bg-[var(--muted)]',
                'transition-colors'
              )}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d={SHARE_PLATFORMS[platform].icon} />
              </svg>
              {platform === 'copy' && copied ? t('copied') : platform === 'copy' ? t('copy') : SHARE_PLATFORMS[platform].name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
