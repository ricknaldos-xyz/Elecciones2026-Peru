import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#3B82F6'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Bueno'
  if (score >= 40) return 'Regular'
  return 'Bajo'
}

export async function GET(request: NextRequest) {
  try {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'candidate'

  // Test minimal OG Image
  if (type === 'test') {
    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#DC2626' }}>
          <span style={{ fontSize: '80px', fontWeight: 900, color: 'white' }}>TEST OK</span>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  // Home / Default Site OG Image
  if (type === 'home') {
    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', backgroundColor: '#DC2626' }} />
          <div style={{ flex: 1, display: 'flex', padding: '60px', gap: '60px' }}>
            {/* Left side - Branding */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: '#DC2626', border: '4px solid #000000', boxShadow: '6px 6px 0 #000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>PE</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Elecciones</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Peru 2026</span>
                </div>
              </div>
              <div style={{ fontSize: '52px', fontWeight: 900, color: '#000000', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '20px' }}>
                Elige con datos,
                <br />
                no con promesas
              </div>
              <div style={{ fontSize: '24px', color: '#64748B', fontWeight: 600, lineHeight: 1.4 }}>
                Ranking transparente de candidatos basado en merito, historial legal y evidencia
              </div>
            </div>
            {/* Right side - Election date box */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '240px', height: '240px', backgroundColor: '#DC2626', border: '6px solid #000000', boxShadow: '10px 10px 0 #000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '72px', fontWeight: 900, color: 'white', lineHeight: 1 }}>12</span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>Abril</span>
                <span style={{ fontSize: '48px', fontWeight: 900, color: 'white', lineHeight: 1 }}>2026</span>
                <div style={{ width: '60%', height: '3px', backgroundColor: 'rgba(255,255,255,0.4)', marginTop: '12px', marginBottom: '8px' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Elecciones Generales</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', backgroundColor: '#000000' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#DC2626', border: '3px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>PE</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>EleccionesPeru2026</span>
            </div>
            <span style={{ fontSize: '20px', color: '#94A3B8' }}>eleccionesperu2026.xyz</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  // Ranking OG Image
  if (type === 'ranking') {
    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', backgroundColor: '#DC2626' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '100px', height: '100px', backgroundColor: '#DC2626', border: '4px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px', boxShadow: '6px 6px 0 #000000' }}>
              <span style={{ fontSize: '48px', color: 'white', fontWeight: 900 }}>#</span>
            </div>
            <div style={{ fontSize: '64px', fontWeight: 900, color: '#000000', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1, marginBottom: '20px' }}>
              Ranking de
              <br />
              Candidatos
            </div>
            <div style={{ fontSize: '28px', color: '#64748B', textAlign: 'center', maxWidth: '700px' }}>
              Competencia, historial legal y transparencia — basado en datos oficiales del JNE y ONPE
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', backgroundColor: '#000000' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#DC2626', border: '3px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>PE</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>EleccionesPeru2026</span>
            </div>
            <span style={{ fontSize: '20px', color: '#94A3B8' }}>eleccionesperu2026.xyz/ranking</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  // Compare OG Image
  if (type === 'compare') {
    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', backgroundColor: '#DC2626' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '30px' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#3B82F6', border: '4px solid #000000', boxShadow: '6px 6px 0 #000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '36px', color: 'white', fontWeight: 900 }}>A</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '48px', fontWeight: 900, color: '#000000' }}>VS</span>
              </div>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#DC2626', border: '4px solid #000000', boxShadow: '6px 6px 0 #000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '36px', color: 'white', fontWeight: 900 }}>B</span>
              </div>
            </div>
            <div style={{ fontSize: '64px', fontWeight: 900, color: '#000000', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1, marginBottom: '20px' }}>
              Comparar
              <br />
              Candidatos
            </div>
            <div style={{ fontSize: '28px', color: '#64748B', textAlign: 'center', maxWidth: '700px' }}>
              Compara candidatos lado a lado en competencia, historial legal y transparencia
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', backgroundColor: '#000000' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#DC2626', border: '3px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>PE</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>EleccionesPeru2026</span>
            </div>
            <span style={{ fontSize: '20px', color: '#94A3B8' }}>eleccionesperu2026.xyz/comparar</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  // Quiz OG Image
  if (type === 'quiz') {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            position: 'relative',
          }}
        >
          {/* Red accent bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '8px',
              backgroundColor: '#DC2626',
            }}
          />

          {/* Main content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '100px',
                height: '100px',
                backgroundColor: '#DC2626',
                border: '4px solid #000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '30px',
                boxShadow: '6px 6px 0 #000000',
              }}
            >
              <span style={{ fontSize: '48px', color: 'white' }}>?</span>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: '64px',
                fontWeight: 900,
                color: '#000000',
                textTransform: 'uppercase',
                textAlign: 'center',
                lineHeight: 1.1,
                marginBottom: '20px',
              }}
            >
              Quien piensa
              <br />
              como tu?
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: '28px',
                color: '#64748B',
                textAlign: 'center',
                maxWidth: '700px',
              }}
            >
              Responde 10 preguntas y descubre que candidatos tienen posiciones similares a las tuyas
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 60px',
              backgroundColor: '#000000',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#DC2626',
                  border: '3px solid #FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>PE</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>
                EleccionesPeru2026
              </span>
            </div>
            <span style={{ fontSize: '20px', color: '#94A3B8' }}>
              eleccionesperu2026.xyz/quiz
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }

  // Party OG Image
  if (type === 'party') {
    const partyName = searchParams.get('name') || 'Partido Político'
    const shortName = searchParams.get('short_name') || ''
    const color = searchParams.get('color') || '#DC2626'
    const candidateCount = searchParams.get('candidates') || '0'
    const avgScore = parseFloat(searchParams.get('avgScore') || '0')

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', backgroundColor: color }} />
          <div style={{ flex: 1, display: 'flex', padding: '60px', gap: '60px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {shortName && (
                <div style={{ display: 'flex', marginBottom: '16px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: color, padding: '8px 20px', border: '3px solid #000000' }}>
                    {shortName}
                  </span>
                </div>
              )}
              <div style={{ fontSize: '52px', fontWeight: 900, color: '#000000', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '16px' }}>
                {partyName}
              </div>
              <div style={{ fontSize: '28px', color: '#64748B', fontWeight: 600 }}>
                {candidateCount} candidatos
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '220px', height: '220px', backgroundColor: getScoreColor(avgScore), border: '6px solid #000000', boxShadow: '10px 10px 0 #000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '96px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{avgScore.toFixed(0)}</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Promedio</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', backgroundColor: '#000000' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#DC2626', border: '3px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>PE</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>EleccionesPeru2026</span>
            </div>
            <span style={{ fontSize: '18px', color: '#94A3B8' }}>eleccionesperu2026.xyz</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  // News OG Image
  if (type === 'news') {
    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', backgroundColor: '#DC2626' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '100px', height: '100px', backgroundColor: '#1E293B', border: '4px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px', boxShadow: '6px 6px 0 #000000' }}>
              <span style={{ fontSize: '48px', color: 'white' }}>N</span>
            </div>
            <div style={{ fontSize: '64px', fontWeight: 900, color: '#000000', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1, marginBottom: '20px' }}>
              Noticias
              <br />
              Electorales
            </div>
            <div style={{ fontSize: '28px', color: '#64748B', textAlign: 'center', maxWidth: '700px' }}>
              Cobertura en tiempo real de las elecciones Peru 2026
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', backgroundColor: '#000000' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#DC2626', border: '3px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>PE</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>EleccionesPeru2026</span>
            </div>
            <span style={{ fontSize: '20px', color: '#94A3B8' }}>eleccionesperu2026.xyz/noticias</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  // District OG Image
  if (type === 'district') {
    const districtName = searchParams.get('name') || 'Distrito'
    const candidateCount = searchParams.get('candidates') || '0'
    const dtype = searchParams.get('dtype') || ''

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', backgroundColor: '#DC2626' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            {dtype && (
              <div style={{ display: 'flex', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: '#FEE2E2', padding: '8px 16px', border: '2px solid #DC2626' }}>
                  {dtype}
                </span>
              </div>
            )}
            <div style={{ fontSize: '64px', fontWeight: 900, color: '#000000', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1, marginBottom: '20px' }}>
              {districtName}
            </div>
            <div style={{ fontSize: '32px', color: '#64748B', fontWeight: 600 }}>
              {candidateCount} candidatos
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', backgroundColor: '#000000' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#DC2626', border: '3px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>PE</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>EleccionesPeru2026</span>
            </div>
            <span style={{ fontSize: '18px', color: '#94A3B8' }}>eleccionesperu2026.xyz</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  // Candidate OG Image
  const name = searchParams.get('name') || 'Candidato'
  const party = searchParams.get('party') || ''
  const cargo = searchParams.get('cargo') || 'Presidente'
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
          backgroundColor: '#FFFFFF',
          position: 'relative',
        }}
      >
        {/* Red accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '8px',
            backgroundColor: '#DC2626',
          }}
        />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: '60px',
            gap: '60px',
          }}
        >
          {/* Left side - Candidate info */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            {/* Cargo badge */}
            <div
              style={{
                display: 'flex',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#DC2626',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  backgroundColor: '#FEE2E2',
                  padding: '8px 16px',
                  border: '2px solid #DC2626',
                }}
              >
                Candidato a {cargo}
              </span>
            </div>

            {/* Name */}
            <div
              style={{
                fontSize: '56px',
                fontWeight: 900,
                color: '#000000',
                textTransform: 'uppercase',
                lineHeight: 1.1,
                marginBottom: '12px',
              }}
            >
              {name}
            </div>

            {/* Party */}
            {party && (
              <div
                style={{
                  fontSize: '24px',
                  color: '#64748B',
                  fontWeight: 600,
                  marginBottom: '30px',
                }}
              >
                {party}
              </div>
            )}

            {/* Sub-scores */}
            <div
              style={{
                display: 'flex',
                gap: '24px',
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px 24px',
                  backgroundColor: '#F0FDF4',
                  border: '3px solid #000000',
                }}
              >
                <span style={{ fontSize: '32px', fontWeight: 900, color: '#22C55E' }}>
                  {competence.toFixed(0)}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Competencia
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px 24px',
                  backgroundColor: '#EFF6FF',
                  border: '3px solid #000000',
                }}
              >
                <span style={{ fontSize: '32px', fontWeight: 900, color: '#3B82F6' }}>
                  {integrity.toFixed(0)}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  H. Legal
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px 24px',
                  backgroundColor: '#FEF3C7',
                  border: '3px solid #000000',
                }}
              >
                <span style={{ fontSize: '32px', fontWeight: 900, color: '#F59E0B' }}>
                  {transparency.toFixed(0)}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Transparencia
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Score */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '220px',
                height: '220px',
                backgroundColor: getScoreColor(score),
                border: '6px solid #000000',
                boxShadow: '10px 10px 0 #000000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '96px',
                  fontWeight: 900,
                  color: 'white',
                  lineHeight: 1,
                }}
              >
                {score.toFixed(0)}
              </span>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                }}
              >
                {getScoreLabel(score)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 60px',
            backgroundColor: '#000000',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#DC2626',
                border: '3px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>PE</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>
              EleccionesPeru2026
            </span>
          </div>
          <span style={{ fontSize: '18px', color: '#94A3B8' }}>
            Datos de DJHV, JNE, ONPE
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
  } catch (e) {
    return new Response(`OG Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 })
  }
}
