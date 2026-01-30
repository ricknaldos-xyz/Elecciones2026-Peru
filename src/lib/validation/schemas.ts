import { z } from 'zod'

// ============================================
// Shared schemas
// ============================================

export const cargoSchema = z.enum([
  'presidente',
  'vicepresidente',
  'senador',
  'diputado',
  'parlamento_andino',
])

const sanitizeString = (val: string) =>
  val.replace(/<[^>]*>/g, '').trim()

const safeString = z.string().transform(sanitizeString)

const coerceInt = (fallback: number) =>
  z.coerce.number().int().catch(fallback)

// ============================================
// Candidates
// ============================================

export const candidatesQuerySchema = z.object({
  cargo: cargoSchema.optional().catch(undefined),
  distrito: safeString.optional(),
  partido: z.string().uuid().optional().catch(undefined),
  minConfidence: coerceInt(0).pipe(z.number().min(0).max(100)).optional(),
  onlyClean: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
    .catch(undefined),
  limit: coerceInt(50).pipe(z.number().min(1).max(200)).optional(),
  offset: coerceInt(0).pipe(z.number().min(0)).optional(),
})

// ============================================
// News
// ============================================

export const newsQuerySchema = z.object({
  page: coerceInt(1).pipe(z.number().min(1)),
  limit: coerceInt(20).pipe(z.number().min(1).max(50)),
  candidato: safeString.optional(),
  fuente: safeString.optional(),
  sentimiento: z.enum(['positive', 'neutral', 'negative']).optional().catch(undefined),
  q: z.string().max(200).transform(sanitizeString).optional(),
})

export const newsTrendingSchema = z.object({
  limit: coerceInt(5).pipe(z.number().min(1).max(10)),
})

export const newsByCandidateSchema = z.object({
  limit: coerceInt(10).pipe(z.number().min(1).max(30)),
})

// ============================================
// Proposals
// ============================================

export const proposalsQuerySchema = z.object({
  candidateId: z.string().uuid().optional().catch(undefined),
  category: safeString.optional(),
  candidateIds: z
    .string()
    .transform((v) => v.split(',').filter(Boolean))
    .optional(),
})

// ============================================
// Candidates by IDs
// ============================================

export const candidateByIdsSchema = z.object({
  ids: z
    .string()
    .transform((v) => v.split(',').filter(Boolean))
    .pipe(z.array(z.string()).min(1).max(20)),
})

// ============================================
// Quiz submit
// ============================================

export const quizSubmitSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  matches: z.array(
    z.object({
      candidateSlug: z.string(),
      candidateName: z.string(),
      matchPercentage: z.number().min(0).max(100),
    })
  ).min(1).max(30),
})
