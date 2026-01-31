/**
 * Satirical comments for the electoral games.
 * Organized by context. Each array returns a random comment.
 */

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ============================================
// BATALLA PRESIDENCIAL COMMENTS
// ============================================

export function getBatallaComment(
  category: string,
  winnerValue: number,
  loserValue: number,
  isTie: boolean
): string {
  if (isTie) return pick(TIE_COMMENTS)

  switch (category) {
    case 'competence':
      return winnerValue >= 70 ? pick(HIGH_COMPETENCE) : pick(LOW_COMPETENCE)
    case 'integrity':
      return loserValue < 30 ? pick(LOW_INTEGRITY) : pick(INTEGRITY_COMMENTS)
    case 'transparency':
      return loserValue < 30 ? pick(LOW_TRANSPARENCY) : pick(TRANSPARENCY_COMMENTS)
    case 'score_balanced':
      return winnerValue >= 70 ? pick(HIGH_SCORE) : pick(GENERAL_SCORE)
    case 'flags':
      return winnerValue >= 3 ? pick(MANY_FLAGS) : pick(FEW_FLAGS)
    case 'red_flags':
      return winnerValue >= 2 ? pick(RED_FLAGS_COMMENTS) : pick(SOME_FLAGS)
    default:
      return pick(GENERAL_COMMENTS)
  }
}

const TIE_COMMENTS = [
  '¡Empate técnico! Como las encuestas a dos semanas de la elección.',
  'Mismo nivel. Al menos en esto son iguales.',
  '¡Tablas! Ni uno ni otro se salva.',
  'Empate. Como cuando ambos prometen lo mismo y ninguno cumple.',
  'Igualdad total. Algo poco común en la política peruana.',
]

const HIGH_COMPETENCE = [
  'Al menos el CV no es de adorno.',
  'Uno que sí hizo la tarea. ¡Milagro!',
  'Con esa preparación debería estar enseñando, no postulando.',
  'CV impresionante. Lástima que el CV no gobierna.',
]

const LOW_COMPETENCE = [
  'La vara estaba baja y aún así apenas la pasa.',
  'Con ese puntaje, mejor se hubiera quedado en casa.',
  'No es que gane por mucho... es que el otro pierde por más.',
  'Victoria pírrica. Nadie sale bien parado.',
]

const LOW_INTEGRITY = [
  'Su integridad necesita un trasplante completo.',
  'Si la integridad fuera nota, jaló el curso.',
  'Tiene más expedientes que un abogado.',
  'Su historial judicial es más largo que su plan de gobierno.',
  'El Poder Judicial ya lo conoce por su nombre de pila.',
]

const INTEGRITY_COMMENTS = [
  'En el país de los ciegos, el tuerto es rey.',
  'Gana, pero tampoco es que brille.',
  'Menos mal que esto no es un concurso de santos.',
  'Victoria por nocaut... de integridad.',
]

const LOW_TRANSPARENCY = [
  'Transparente como una pared de concreto.',
  'Si no declara, es porque hay mucho que ocultar.',
  '¿Transparencia? Nunca la conoció.',
  'Sus declaraciones son más un misterio que un documento público.',
]

const TRANSPARENCY_COMMENTS = [
  'Al menos uno juega con las cartas sobre la mesa.',
  'Transparente... o al menos lo intenta.',
  'Declaró todo. O eso dice.',
]

const HIGH_SCORE = [
  '¡Puntaje alto! Existe esperanza.',
  'Impresionante. ¿Seguro que es político peruano?',
  'De los mejores rankeados. A ver si dura.',
]

const GENERAL_SCORE = [
  'Gana, pero tampoco para celebrar.',
  'El ranking no miente... aunque a veces duele.',
  'Mejor puntuado. El mérito existe.',
]

const MANY_FLAGS = [
  '¡Más banderas rojas que un desfile del primero de mayo!',
  'Tantas alertas que ya parece semáforo.',
  'Con esa cantidad de alertas, debería venir con manual de precaución.',
  'Su perfil parece árbol de navidad de alertas.',
]

const FEW_FLAGS = [
  'Algunas alertas, pero nada que asuste... mucho.',
  'Tiene sus cositas, como todo político.',
  'No es perfecto, pero al menos no tiene prontuario.',
]

const RED_FLAGS_COMMENTS = [
  '¡Alerta roja! Y no es simulacro.',
  'Más señales de peligro que curva en la carretera central.',
  'Si esto fuera Tinder, sería un left instantáneo.',
  'Con tantas red flags, ni el semáforo más rojo.',
]

const SOME_FLAGS = [
  'Una que otra alerta. Nada fuera de lo común... en Perú.',
  'Alertas menores. Pero en política, todo crece.',
  'Por ahora se salva. Por ahora.',
]

const GENERAL_COMMENTS = [
  '¡Bien jugado! ¿O bien adivinado?',
  'La data no miente. Los candidatos... a veces sí.',
  'Otro round más. ¿Cuánto aguantas?',
  'Política peruana: siempre sorprende.',
  'Dato curioso cortesía de la democracia.',
]

// ============================================
// SWIPE ELECTORAL COMMENTS
// ============================================

export function getSwipeRevealComment(
  topMatchName: string,
  topMatchPercent: number,
  topMatchIntegrity: number
): string {
  if (topMatchPercent >= 90) return pick(SWIPE_HIGH_MATCH)
  if (topMatchPercent <= 30) return pick(SWIPE_LOW_MATCH)
  if (topMatchIntegrity < 30) return pick(SWIPE_BAD_INTEGRITY_MATCH)
  return pick(SWIPE_NORMAL_MATCH)
}

const SWIPE_HIGH_MATCH = [
  '¡Match del 90%! Deberías ser su jefe de campaña.',
  'Prácticamente son almas gemelas políticas.',
  '¿Seguro que no escribiste su plan de gobierno?',
  'Compatibilidad nivel: "ya pongan la fecha de la boda política".',
]

const SWIPE_LOW_MATCH = [
  'No coincides con nadie. Eres un alma libre. O simplemente contreras.',
  'Parece que tu candidato ideal aún no ha nacido.',
  'Independiente total. O tal vez solo llevaste la contra.',
  '0% match con todos. Respetable.',
]

const SWIPE_BAD_INTEGRITY_MATCH = [
  'Propuestas bonitas, historial... no tanto.',
  'Tu match dice cosas lindas pero tiene cola que le pisen.',
  'Coincides en ideas. Lástima su expediente.',
  'En el papel suena bien. En la práctica... 👀',
]

const SWIPE_NORMAL_MATCH = [
  'Sorpresa... o tal vez no tanto 👀',
  'Interesante match. ¿Te lo esperabas?',
  'La afinidad política es misteriosa.',
  'Los datos no mienten. Tu corazón político ha hablado.',
]

// ============================================
// FRANKENSTEIN COMMENTS
// ============================================

export function getFrankensteinVerdict(
  frankensteinScore: number,
  beatsCount: number,
  totalCandidates: number
): string {
  if (frankensteinScore >= 80 && beatsCount >= totalCandidates - 2) return pick(FRANK_GODLIKE)
  if (frankensteinScore >= 60) return pick(FRANK_GOOD)
  if (frankensteinScore >= 40) return pick(FRANK_MEDIOCRE)
  return pick(FRANK_TERRIBLE)
}

const FRANK_GODLIKE = [
  'Tu candidato imaginario es mejor que todos los reales. Bienvenido a la política peruana.',
  '¡Frankenstein presidencial nivel dios! Lástima que no existe.',
  'Creaste al candidato perfecto. Ahora despierta.',
  'Mejor que todos los reales. La realidad, como siempre, decepciona.',
]

const FRANK_GOOD = [
  'No está mal tu monstruo. Mejor que varios candidatos reales.',
  'Un Frankenstein decente. Si tan solo la política fuera así de fácil.',
  'Buena combinación. ¿Seguro que no quieres postular?',
]

const FRANK_MEDIOCRE = [
  'Regular. Como la mayoría de candidatos, ni fu ni fa.',
  'Tu Frankenstein es tan mediocre como la oferta electoral real.',
  'Meh. Pero al menos lo intentaste.',
  'Inteligente pero con prontuario. El combo clásico.',
]

const FRANK_TERRIBLE = [
  'Felicidades, creaste al peor candidato posible. Tiene futuro en política.',
  'Tu monstruo es tan malo que ya tiene partido propio.',
  'Con ese Frankenstein, mejor dejamos la democracia para otro día.',
  'Impresionantemente malo. ¿Lo hiciste a propósito?',
]

// ============================================
// CRAZY CAMPAÑA (RUNNER) COMMENTS
// ============================================

export function getRunnerComment(roleId: string): string {
  return pick(RUNNER_COMMENTS[roleId] || RUNNER_COMMENTS['sobreviviente'])
}

const RUNNER_COMMENTS: Record<string, string[]> = {
  populista: [
    'Con ese nivel de humo, deberias abrir una parrilleria.',
    'El pueblo te aplaude. Todavia no saben por que.',
    'Tanto humo que ya necesitas extintor.',
    'Tus promesas llegan antes que el oxigeno.',
  ],
  florista: [
    'Vendiste humo premium. Humo artesanal. Humo gourmet.',
    'Si las promesas fueran bitcoins, serias millonario.',
    'Todo floro y nada de sustancia. Politico nato.',
    'Tu campaña huele a promesa vencida.',
  ],
  tecnocrata: [
    'Aburrido pero honesto. En Peru eso es revolucionario.',
    'Tus datos son impecables. Tu carisma, no tanto.',
    'El Excel mas bonito que nadie va a leer.',
    'Felicidades, ganaste el premio al candidato que nadie recuerda.',
  ],
  showman: [
    'Entretienes Y cumples. Eres un unicornio politico.',
    'Alto humo, alta credibilidad. Como es eso posible?',
    'Si existieras en la vida real, ya tendrias 90% en encuestas.',
    'El candidato que Peru necesita pero no merece.',
  ],
  fantasma: [
    'Tu campaña fue tan discreta que ni tu familia se entero.',
    'Candidato fantasma. Literal.',
    'Ni promesas ni datos. Solo existencia.',
    'Pasaste de largo. Como el presupuesto de educacion.',
  ],
  equilibrista: [
    'Ni fu ni fa. El clasico tibio peruano.',
    'Un poco de todo, mucho de nada. Promedio.',
    'El candidato que dice "voy a analizar la situacion" y nunca hace nada.',
    'Equilibrio perfecto entre la mediocridad y la irrelevancia.',
  ],
  sobreviviente: [
    'Llegaste al final. Eso ya es mas que muchos congresistas.',
    'Sobrevivir en politica peruana ya es un logro.',
    'No brillaste, pero tampoco te investigaron. Victoria.',
    'El arte de llegar al final sin que nadie sepa como.',
  ],
}
