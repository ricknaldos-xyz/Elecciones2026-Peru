export interface QuizOption {
  id: string
  text: string
  value: number // 1-5 scale
}

export interface QuizQuestion {
  id: string
  topic: string
  question: string
  description?: string
  options: QuizOption[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'security',
    topic: 'Seguridad Ciudadana',
    question: 'Como debemos combatir la delincuencia?',
    description: 'Elige la opcion que mas se acerque a tu posicion',
    options: [
      { id: 'a', text: 'Mas policia, penas mas duras y mano firme contra criminales', value: 5 },
      { id: 'b', text: 'Equilibrio entre seguridad y prevencion social', value: 3 },
      { id: 'c', text: 'Enfocarnos en educacion y oportunidades para prevenir el crimen', value: 1 },
    ],
  },
  {
    id: 'economy',
    topic: 'Economia',
    question: 'Cual debe ser el rol del Estado en la economia?',
    options: [
      { id: 'a', text: 'Minimo: libre mercado, menos impuestos, privatizacion', value: 5 },
      { id: 'b', text: 'Mixto: mercado con regulacion y proteccion social', value: 3 },
      { id: 'c', text: 'Activo: empresas estatales estrategicas y control de precios', value: 1 },
    ],
  },
  {
    id: 'education',
    topic: 'Educacion',
    question: 'Que sistema educativo necesita el Peru?',
    options: [
      { id: 'a', text: 'Fortalecer la educacion publica con mas inversion estatal', value: 1 },
      { id: 'b', text: 'Sistema mixto con estandares nacionales para ambos sectores', value: 3 },
      { id: 'c', text: 'Vouchers para que padres elijan colegios privados o publicos', value: 5 },
    ],
  },
  {
    id: 'health',
    topic: 'Salud',
    question: 'Como debe ser el sistema de salud?',
    options: [
      { id: 'a', text: 'Salud universal gratuita para todos, financiada por el Estado', value: 1 },
      { id: 'b', text: 'Sistema mixto publico-privado con cobertura basica universal', value: 3 },
      { id: 'c', text: 'Competencia entre aseguradoras con subsidios focalizados', value: 5 },
    ],
  },
  {
    id: 'mining',
    topic: 'Mineria y Medio Ambiente',
    question: 'Como balancear mineria y medio ambiente?',
    options: [
      { id: 'a', text: 'Priorizar medio ambiente: moratoria a nuevos proyectos', value: 1 },
      { id: 'b', text: 'Mineria responsable con estandares ambientales estrictos', value: 3 },
      { id: 'c', text: 'Acelerar proyectos mineros, motor del desarrollo nacional', value: 5 },
    ],
  },
  {
    id: 'pensions',
    topic: 'Pensiones',
    question: 'Cual es el mejor sistema de pensiones?',
    options: [
      { id: 'a', text: 'Sistema publico de reparto solidario', value: 1 },
      { id: 'b', text: 'Sistema mixto: pilar publico basico + ahorro individual', value: 3 },
      { id: 'c', text: 'AFP privadas con libre disponibilidad de fondos', value: 5 },
    ],
  },
  {
    id: 'corruption',
    topic: 'Corrupcion',
    question: 'Cual es la mejor estrategia contra la corrupcion?',
    options: [
      { id: 'a', text: 'Fortalecer Fiscalia, Poder Judicial y muerte civil', value: 3 },
      { id: 'b', text: 'Refundar las instituciones y nueva constitucion', value: 1 },
      { id: 'c', text: 'Penas mas severas y carcel efectiva para corruptos', value: 5 },
    ],
  },
  {
    id: 'decentralization',
    topic: 'Descentralizacion',
    question: 'Como mejorar la gestion de regiones?',
    options: [
      { id: 'a', text: 'Mas poder y recursos a gobiernos regionales', value: 1 },
      { id: 'b', text: 'Descentralizacion gradual con capacitacion y control', value: 3 },
      { id: 'c', text: 'Recentralizar funciones criticas en Lima', value: 5 },
    ],
  },
  {
    id: 'foreign_policy',
    topic: 'Politica Exterior',
    question: 'Cual debe ser nuestra posicion internacional?',
    options: [
      { id: 'a', text: 'Integracion regional latinoamericana prioritaria', value: 1 },
      { id: 'b', text: 'Pragmatismo: alianzas segun conveniencia nacional', value: 3 },
      { id: 'c', text: 'Alianza con EEUU y paises desarrollados', value: 5 },
    ],
  },
  {
    id: 'political_reform',
    topic: 'Reforma Politica',
    question: 'Que cambios necesita el sistema politico?',
    options: [
      { id: 'a', text: 'Asamblea constituyente para nueva constitucion', value: 1 },
      { id: 'b', text: 'Reformas graduales: financiamiento, partidos, reeleccion', value: 3 },
      { id: 'c', text: 'Mantener la constitucion del 93 con ajustes menores', value: 5 },
    ],
  },
]

export const TOPIC_LABELS: Record<string, string> = {
  security: 'Seguridad',
  economy: 'Economia',
  education: 'Educacion',
  health: 'Salud',
  mining: 'Mineria',
  pensions: 'Pensiones',
  corruption: 'Corrupcion',
  decentralization: 'Descentralizacion',
  foreign_policy: 'Pol. Exterior',
  political_reform: 'Ref. Politica',
}
