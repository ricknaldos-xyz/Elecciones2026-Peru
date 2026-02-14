import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#D52B1E',
          borderRadius: '22px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100px',
            height: '180px',
            background: '#FFFFFF',
          }}
        >
          <span
            style={{
              fontSize: '100px',
              fontWeight: 900,
              color: '#D52B1E',
              lineHeight: 1,
            }}
          >
            P
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
