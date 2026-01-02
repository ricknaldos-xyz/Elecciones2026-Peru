import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#3B82F6'
  if (score >= 40) return '#EAB308'
  return '#EF4444'
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const name = searchParams.get('name') || 'Candidato'
  const party = searchParams.get('party') || ''
  const score = parseFloat(searchParams.get('score') || '0')
  const competence = parseFloat(searchParams.get('c') || '0')
  const integrity = parseFloat(searchParams.get('i') || '0')
  const transparency = parseFloat(searchParams.get('t') || '0')

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          padding: '40px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <span style={{ fontSize: '24px', color: '#94A3B8' }}>
            Ranking Electoral Perú 2026
          </span>
        </div>

        {/* Candidate Name */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '10px',
            textAlign: 'center',
          }}
        >
          {name}
        </div>

        {/* Party */}
        {party && (
          <div
            style={{
              fontSize: '24px',
              color: '#94A3B8',
              marginBottom: '30px',
            }}
          >
            {party}
          </div>
        )}

        {/* Score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              fontSize: '96px',
              fontWeight: 'bold',
              color: getScoreColor(score),
            }}
          >
            {score.toFixed(1)}
          </div>
          <div
            style={{
              fontSize: '36px',
              color: '#64748B',
              marginLeft: '10px',
            }}
          >
            /100
          </div>
        </div>

        {/* Sub-scores */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#3B82F6' }}>
              {competence.toFixed(0)}
            </span>
            <span style={{ fontSize: '16px', color: '#94A3B8' }}>Competencia</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#22C55E' }}>
              {integrity.toFixed(0)}
            </span>
            <span style={{ fontSize: '16px', color: '#94A3B8' }}>Integridad</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#A855F7' }}>
              {transparency.toFixed(0)}
            </span>
            <span style={{ fontSize: '16px', color: '#94A3B8' }}>Transparencia</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '18px',
            color: '#64748B',
          }}
        >
          Datos basados en fuentes oficiales (DJHV, JNE)
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
