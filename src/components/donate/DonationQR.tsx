'use client'

import { QRCodeSVG } from 'qrcode.react'

interface DonationQRProps {
  value: string
  size?: number
}

export function DonationQR({ value, size = 192 }: DonationQRProps) {
  return (
    <div className="inline-block border-2 border-[var(--border)] bg-white p-3">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  )
}
