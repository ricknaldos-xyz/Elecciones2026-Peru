/**
 * Satirical comments for the electoral games.
 * Organized by context. Each array returns a random comment.
 * Peruvian political humor — dark, specific, and shareable.
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
  '¡Empate técnico! Como las encuestas peruanas: nadie sabe nada hasta el conteo de la ONPE.',
  'Mismo nivel. Como escoger entre chicharrón con grasa y chicharrón con más grasa.',
  '¡Tablas! Ninguno gana, ninguno pierde. El Perú, como siempre, empata con la mediocridad.',
  'Empate. Ambos prometen lo mismo: arreglar todo sin decir cómo. Clásico.',
  'Igualdad total. Podrías lanzar una moneda, que es básicamente cómo elige el 30% del país.',
  'Tan iguales que hasta sus excusas se parecen.',
  'Empate. Si esto fuera fútbol, ambos irían a penales... y fallarían.',
]

const HIGH_COMPETENCE = [
  'Al menos este sí terminó la universidad. No como otros que compran el título en una imprenta del Centro de Lima.',
  'Tiene un CV real. En política peruana, eso lo convierte en especie en peligro de extinción.',
  'Con esa preparación debería estar enseñando en la PUCP, no peleando por Palacio.',
  'CV impresionante. Lástima que en el Perú el CV importa menos que el padrino.',
  'Uno que sí hizo la tarea. Sus rivales todavía están buscando la carpeta de matrícula.',
  'Con ese nivel académico podría dirigir una universidad. Claro, si el sueldo de presidente fuera mejor.',
]

const LOW_COMPETENCE = [
  'La vara estaba en el piso y aún así tropezaron ambos.',
  'Con ese puntaje, mejor se hubiera quedado en su negocio de pollerías.',
  'No es que gane por mucho... es que el otro pierde por goleada. Esto es un 1-0 con autogol.',
  'Victoria pírrica. Nadie sale bien parado. Como toda segunda vuelta peruana.',
  'Gana el menos peor. El lema no oficial de cada elección desde el 2000.',
  'Su CV parece hecho en Paint. El del otro, en Word 95.',
]

const LOW_INTEGRITY = [
  'Su integridad necesita un trasplante completo, un psicólogo y un exorcismo.',
  'Si la integridad fuera un curso en la UNI, este jalaría hasta en los sustitutorios.',
  'Tiene más expedientes judiciales que la mayoría de abogados del Jirón Azángaro.',
  'Su historial judicial es más largo que la Panamericana Sur.',
  'El Poder Judicial ya lo tutea. Los fiscales le mandan saludos por Navidad.',
  'Su hoja de vida parece un prontuario policial con foto carnet.',
  'Más denuncias que sol en Ica. Y en ambos casos, nadie hace nada.',
]

const INTEGRITY_COMMENTS = [
  'En el país de los investigados, el que solo tiene una denuncia es rey.',
  'Gana por integridad. Que en política peruana es como ganar en feo: todos pierden.',
  'Menos mal que esto no es un concurso de santos, porque se queda sin participantes.',
  'Victoria por nocaut de integridad. Su rival tiene más sombra que un ficus.',
  'Es más íntegro. Tampoco es que el otro haya puesto la vara muy alta.',
  'Su integridad brilla... pero solo porque la del otro es carbón.',
]

const LOW_TRANSPARENCY = [
  'Transparente como una pared de concreto en El Agustino.',
  'Si no declara, es porque declarar sería el inicio de una investigación fiscal.',
  '¿Transparencia? Nunca la conoció. Su declaración jurada parece escrita en tinta invisible.',
  'Sus finanzas son más misteriosas que los audios del Congreso.',
  'Declara menos que un narco en interrogatorio. Al menos el narco tiene abogado.',
  'Su declaración jurada dice más por lo que omite que por lo que incluye.',
]

const TRANSPARENCY_COMMENTS = [
  'Al menos uno juega con las cartas sobre la mesa. El otro juega con cartas marcadas.',
  'Transparente... dentro de lo que cabe en la política peruana, que no es mucho.',
  'Declaró todo. O al menos lo que no pudo esconder a tiempo.',
  'Más transparente que su rival. Pero eso es como ser el más alto de los enanos.',
]

const HIGH_SCORE = [
  '¡Puntaje alto! ¿Seguro que es candidato peruano? Revisen su DNI.',
  'Impresionante. Con ese score debería estar en Noruega, no en el Perú.',
  'De los mejores rankeados. Disfrútenlo antes de que le abran una investigación.',
  'Score alto. Pero tranquilos, dale tiempo: todavía no llega al poder.',
]

const GENERAL_SCORE = [
  'Gana, pero tampoco es para salir en procesión con banda y cohetes.',
  'El ranking no miente... aunque los candidatos sí, constantemente.',
  'Mejor puntuado. En un país normal sería mediocre. Aquí es premium.',
  'Gana por score. Recuerden: esto es Perú. Mañana puede estar preso.',
]

const MANY_FLAGS = [
  '¡Más banderas rojas que un desfile del primero de mayo en la Plaza Dos de Mayo!',
  'Tantas alertas que debería venir con sirena como ambulancia del SAMU.',
  'Con esa cantidad de alertas, la SUNAT debería revisar hasta su lonchera.',
  'Su perfil parece un árbol de navidad de la Municipalidad de Lima: puras luces rojas.',
  'Si cada alerta fuera un hueco en la pista, su perfil sería la Carretera Central.',
  'Tiene más alertas que un celular de cobrador de combi.',
]

const FEW_FLAGS = [
  'Algunas alertas, pero nada que asuste... por ahora. En el Perú todo puede empeorar.',
  'Tiene sus cositas. Como todo político peruano desde que se fundó la República.',
  'Pocas alertas. Denle chance de llegar al poder y se multiplican solas.',
  'Casi limpio. Pero recordemos que Fujimori también empezó así.',
]

const RED_FLAGS_COMMENTS = [
  '¡Alerta roja! Y no es simulacro de la PCM.',
  'Más señales de peligro que curva ciega en la Carretera Central a Huancayo.',
  'Si esto fuera Tinder, sería un left tan rápido que rompes el dedo.',
  'Con tantas red flags podrías tejer una bandera comunista.',
  'DEFCON 1. Este candidato es una emergencia nacional.',
  'Su perfil es la respuesta a "¿por qué el Perú está como está?".',
]

const SOME_FLAGS = [
  'Una que otra alerta. Nada fuera de lo común... en un país donde lo común es alarmante.',
  'Alertas menores. Pero acuérdense que el Congreso disuelto también tenía "alertas menores".',
  'Por ahora se salva. FRASE PELIGROSA en política peruana.',
  'Alertas leves. Lo cual en el Perú es casi un certificado de buena conducta.',
]

const GENERAL_COMMENTS = [
  '¡Bien jugado! ¿O bien adivinado? Da igual, acertaste más que los del JNE.',
  'La data no miente. Los candidatos sí, pero la data no.',
  'Otro round más. ¿Cuánto aguantas? Más que un gobierno peruano promedio, seguro.',
  'Política peruana: donde lo imposible sucede cada 5 años.',
  'Dato curioso cortesía de la democracia más surrealista de Sudamérica.',
  'Así funciona la democracia: eliges al menos malo y cruzas los dedos.',
  'Cada dato que descubres hace que la urna pese más.',
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
  '¡Match del 90%! Básicamente eres su ghostwriter. ¿Ya te pagó la campaña?',
  'Prácticamente son almas gemelas políticas. Solo falta que te ponga de candidato a vice.',
  '¿Seguro que no escribiste su plan de gobierno? Porque es DEMASIADA coincidencia.',
  'Compatibilidad nivel: ya están listos para el debate matrimonial en ATV.',
  '¡90% de match! Ojo que en el Perú, coincidir tanto con un político es motivo de preocupación.',
  'Son tan compatibles que deberían fundar un partido juntos. Total, ¿cuánto cuesta la inscripción?',
]

const SWIPE_LOW_MATCH = [
  'No coincides con NADIE. Eres el votante nulo hecho persona.',
  'Parece que tu candidato ideal no ha nacido. O emigró hace años.',
  'Independiente total. O simplemente odias a todos por igual. Respetable.',
  '0% match con todos. Felicidades, eres el peruano más difícil de representar.',
  'Tu candidato ideal probablemente está vendiendo empanadas en Chile.',
  'Cero match. ¿Probaste votando en blanco? Ah, cierto, eso tampoco sirve.',
]

const SWIPE_BAD_INTEGRITY_MATCH = [
  'Tu match tiene propuestas bonitas y un expediente judicial que da miedo. El clásico peruano.',
  'Coincides en ideas con alguien que tiene cola que le pisen. Bienvenido al dilema electoral peruano.',
  'Coincides en propuestas. Lástima que su ficha en el JNE parece un parte policial.',
  'En el papel suena perfecto. En la fiscalía... no tanto.',
  'Tu match ideal tiene plan de gobierno Y plan de fuga. Elige uno.',
  'Propuestas geniales, historial judicial para una miniserie de Netflix.',
]

const SWIPE_NORMAL_MATCH = [
  'Sorpresa... o quizás tu subconsciente ya sabía. Alerta: sesgo confirmado.',
  '¿Te lo esperabas? La afinidad política funciona de formas misteriosas.',
  'Los datos no mienten. Tu corazón político ha hablado. Tu billetera llora.',
  'Match revelado. ¿Te genera ilusión o depresión? Ambas respuestas son válidas en el Perú.',
  'Interesante match. Recuerda: coincidir en propuestas no significa que las cumplan.',
  'Tu match es este. Ni modo. Al menos ahora sabes a quién culpar.',
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
  'Tu candidato imaginario destruye a todos los reales. El problema: no existe. Bienvenido al Perú.',
  '¡Frankenstein nivel dios! Lástima que para tener un candidato así hay que armarlo con partes de 5 distintos.',
  'Creaste al presidente perfecto. Ahora despierta, ponte el terno y postula tú.',
  'Mejor que todos los reales. La realidad peruana, como siempre, decepciona más que panel de Willax.',
  'Tu monstruo es tan bueno que los otros candidatos ya están pidiendo que lo investiguen.',
  'Frankenstein GOD. Si esto fuera real, ya lo habrían tumbado con una moción de vacancia.',
]

const FRANK_GOOD = [
  'Tu monstruo es decente. Mejor que varios que andan por ahí pidiendo tu voto.',
  'Un Frankenstein respetable. Si tan solo la política fuera como armar un equipo en FIFA.',
  'Buena combinación. ¿Seguro que no quieres postular? Ya hay partidos que inscriben a cualquiera.',
  'Sólido. Pero en el Perú, un buen candidato sin plata es como ceviche sin limón.',
  'No está mal. Supera a candidatos que gastan millones en campaña. La ironía.',
]

const FRANK_MEDIOCRE = [
  'Regular. Tan mediocre como la oferta electoral real. ¿Coincidencia? No creo.',
  'Tu Frankenstein es el candidato "va a ser lo que dios quiera". Perú in a nutshell.',
  'Meh. Pero al menos tu monstruo no tiene investigación en el Ministerio Público.',
  'Inteligente pero con prontuario. El combo clásico: así son el 60% de candidatos reales.',
  'Tu candidato es tan promedio que ya tiene propuesta de alianza de 3 partidos.',
  'Ni bueno ni malo. Como el WiFi de provincia: funciona, pero no te ilusiones.',
]

const FRANK_TERRIBLE = [
  'Felicidades, creaste al peor candidato posible. Tiene futuro como congresista de la República.',
  'Tu monstruo es tan malo que ya tiene partido propio, bancada y 4 investigaciones.',
  'Con ese Frankenstein, mejor suspendemos la democracia hasta nuevo aviso.',
  'Impresionantemente malo. ¿Lo hiciste a propósito o simplemente tienes instinto para elegir mal?',
  'Tu candidato es tan nefasto que Antauro lo rechazaría por radical.',
  'El monstruo que creaste ya existe en la vida real. De hecho, hay como 5 iguales postulando.',
]

// ============================================
// CRAZY CAMPAÑA (RUNNER) COMMENTS
// ============================================

export function getRunnerComment(roleId: string): string {
  return pick(RUNNER_COMMENTS[roleId] || RUNNER_COMMENTS['sobreviviente'])
}

const RUNNER_COMMENTS: Record<string, string[]> = {
  populista: [
    'Con ese nivel de humo, deberías abrir una pollería en Gamarra.',
    'El pueblo te aplaude. Todavía no saben que prometiste 15 hospitales con presupuesto para 2.',
    'Tanto humo que ya te confunden con una quema de llantas en la Panamericana.',
    'Tus promesas llegan antes que el oxígeno. Y se evaporan igual de rápido.',
    'Eres el tipo de candidato que promete tren bala Lima-Iquitos. Y la gente le cree.',
    'Tu nivel de humo solo es superado por los buses del Metropolitano.',
  ],
  florista: [
    'Vendiste humo premium. Humo artesanal. Humo orgánico con certificación de la SUNAT.',
    'Si las promesas fueran soles, ya le habrías pagado la deuda externa al Perú.',
    'Todo floro y nada de sustancia. Felicidades, ya puedes trabajar en el Congreso.',
    'Tu campaña huele a promesa vencida. Como esa obra que iban a terminar en 2018.',
    'Puro labia y cero data. Eres el candidato que los memes estaban esperando.',
    'Prometes como candidato, cumples como congresista: nada.',
  ],
  tecnocrata: [
    'Aburrido pero honesto. En el Perú eso es más raro que agua potable en campaña.',
    'Tus datos son impecables. Tu carisma, inexistente. Así es la meritocracia peruana.',
    'El Excel más bonito que nadie va a leer. Ni siquiera tu equipo de campaña.',
    'Felicidades, ganaste el premio al candidato que nadie recuerda pero todos necesitan.',
    'Tienes más data que el INEI. Pero en el Perú gana el que tiene más parlantes en la combi.',
    'Honesto y técnico. En cualquier otro país serías presidente. Aquí sacas 3%.',
  ],
  showman: [
    'Entretienes Y cumples. Eres un unicornio político. Y como todo unicornio, no existes.',
    'Alto humo, alta credibilidad. ¿Cómo es eso posible? La ciencia no lo explica.',
    'Si existieras en la vida real, ya te habrían vacado por ser demasiado competente.',
    'El candidato que Perú necesita pero no merece. Literalmente: el voto preferencial no ayuda.',
    'Humo Y sustancia. Eres la cevichería con Resolución Sanitaria: todos te quieren pero nadie te encuentra.',
    'El equilibrio perfecto. Eres el mito urbano de la política peruana.',
  ],
  fantasma: [
    'Tu campaña fue tan discreta que ni la ONPE registró tu candidatura.',
    'Candidato fantasma. Tu estrategia de campaña fue no tener estrategia. Innovador.',
    'Ni promesas ni datos. Solo existencia. Como el presupuesto de salud pública.',
    'Pasaste de largo. Como las reformas educativas de los últimos 30 años.',
    'Nadie notó tu candidatura. Quizás podrías postular al Congreso, ahí nadie nota nada.',
    'Tu campaña fue más invisible que las obras del gobierno regional.',
  ],
  equilibrista: [
    'Ni fu ni fa. El clásico candidato que dice "hay que evaluar" y nunca decide nada.',
    'Un poco de todo, mucho de nada. Eres el menú ejecutivo de la política.',
    'El candidato que pide "un cuarto intermedio" cada vez que le preguntan algo incómodo.',
    'Equilibrio perfecto entre la mediocridad y la irrelevancia. El centro político peruano.',
    'Ni izquierda ni derecha. Ni arriba ni abajo. Ni nada. Pero ahí estás.',
    'Tu posición política es "depende". De qué, nadie sabe.',
  ],
  sobreviviente: [
    'Llegaste al final. Eso ya es más de lo que dura un gabinete ministerial.',
    'Sobrevivir en política peruana ya es un logro. Pregúntale a cualquier premier.',
    'No brillaste, pero tampoco te investigaron. En el Perú eso es un triunfo.',
    'El arte de llegar al final sin que nadie sepa cómo. La historia de todo segundo vicepresidente.',
    'Sobreviviste 20 segundos. Más que la estabilidad del gabinete promedio.',
    'No hiciste nada memorable. Felicidades: tampoco te pueden acusar de nada.',
  ],
}
