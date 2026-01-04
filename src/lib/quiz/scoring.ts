import { CANDIDATE_POSITIONS, CandidatePosition } from './candidate-positions'
import { QUIZ_QUESTIONS } from './questions'

export interface QuizMatch {
  candidateId: string
  candidateName: string
  candidateSlug: string
  partyName: string
  photoUrl?: string
  matchPercentage: number
  agreementsByTopic: Record<string, 'agree' | 'neutral' | 'disagree'>
}

/**
 * Calcula el porcentaje de coincidencia entre las respuestas del usuario
 * y las posiciones de un candidato usando distancia euclidiana normalizada
 */
function calculateMatchPercentage(
  userAnswers: Record<string, number>,
  candidatePositions: Record<string, number>
): number {
  const topics = Object.keys(userAnswers)
  if (topics.length === 0) return 0

  let totalDistance = 0
  const maxDistance = 4 // Diferencia maxima por pregunta (1 a 5 = 4)

  for (const topic of topics) {
    const userAnswer = userAnswers[topic]
    const candidatePosition = candidatePositions[topic]

    if (candidatePosition !== undefined) {
      const distance = Math.abs(userAnswer - candidatePosition)
      totalDistance += distance
    }
  }

  // Normalizar: 0 distancia = 100% match, maxDistance*topics = 0% match
  const maxTotalDistance = maxDistance * topics.length
  const matchPercentage = ((maxTotalDistance - totalDistance) / maxTotalDistance) * 100

  return Math.round(matchPercentage)
}

/**
 * Determina si hay acuerdo, neutralidad o desacuerdo en cada tema
 */
function getAgreementsByTopic(
  userAnswers: Record<string, number>,
  candidatePositions: Record<string, number>
): Record<string, 'agree' | 'neutral' | 'disagree'> {
  const agreements: Record<string, 'agree' | 'neutral' | 'disagree'> = {}

  for (const [topic, userAnswer] of Object.entries(userAnswers)) {
    const candidatePosition = candidatePositions[topic]
    if (candidatePosition === undefined) continue

    const difference = Math.abs(userAnswer - candidatePosition)

    if (difference <= 1) {
      agreements[topic] = 'agree'
    } else if (difference <= 2) {
      agreements[topic] = 'neutral'
    } else {
      agreements[topic] = 'disagree'
    }
  }

  return agreements
}

/**
 * Calcula los matches para todos los candidatos y retorna ordenados por porcentaje
 */
export function calculateMatches(userAnswers: Record<string, number>): QuizMatch[] {
  const matches: QuizMatch[] = CANDIDATE_POSITIONS.map(candidate => ({
    candidateId: candidate.candidateId,
    candidateName: candidate.candidateName,
    candidateSlug: candidate.candidateSlug,
    partyName: candidate.partyName,
    photoUrl: candidate.photoUrl,
    matchPercentage: calculateMatchPercentage(userAnswers, candidate.positions),
    agreementsByTopic: getAgreementsByTopic(userAnswers, candidate.positions),
  }))

  // Ordenar por porcentaje de coincidencia descendente
  return matches.sort((a, b) => b.matchPercentage - a.matchPercentage)
}

/**
 * Obtiene el perfil politico del usuario basado en sus respuestas
 */
export function getUserProfile(userAnswers: Record<string, number>): {
  label: string
  description: string
  color: string
} {
  const values = Object.values(userAnswers)
  if (values.length === 0) {
    return { label: 'Sin definir', description: '', color: 'gray' }
  }

  const average = values.reduce((a, b) => a + b, 0) / values.length

  if (average <= 2) {
    return {
      label: 'Progresista',
      description: 'Tiendes a posiciones de izquierda y cambio social',
      color: 'var(--score-excellent)',
    }
  } else if (average <= 2.8) {
    return {
      label: 'Centro-Izquierda',
      description: 'Combinas ideas progresistas con pragmatismo',
      color: 'var(--score-good)',
    }
  } else if (average <= 3.2) {
    return {
      label: 'Centrista',
      description: 'Buscas el equilibrio entre diferentes posiciones',
      color: 'var(--score-medium)',
    }
  } else if (average <= 4) {
    return {
      label: 'Centro-Derecha',
      description: 'Combinas pragmatismo con ideas conservadoras',
      color: 'var(--score-low)',
    }
  } else {
    return {
      label: 'Conservador',
      description: 'Tiendes a posiciones de derecha y continuidad',
      color: 'var(--primary)',
    }
  }
}

/**
 * Genera un resumen de compatibilidad para compartir
 */
export function generateShareText(matches: QuizMatch[], profile: { label: string }): string {
  const top3 = matches.slice(0, 3)
  const candidatesList = top3
    .map((m, i) => `${i + 1}. ${m.candidateName} (${m.matchPercentage}%)`)
    .join('\n')

  return `Mi perfil politico es ${profile.label}.\n\nMis candidatos mas afines:\n${candidatesList}\n\nDescubre tu match en`
}
