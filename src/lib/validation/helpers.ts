import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse }

/**
 * Parse and validate search params from a request using a Zod schema.
 * Returns validated data or a 400 error response.
 */
export function parseSearchParams<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): ParseResult<z.infer<T>> {
  const searchParams = request.nextUrl.searchParams
  const raw: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    raw[key] = value
  })

  const result = schema.safeParse(raw)

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid parameters',
          details: result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      ),
    }
  }

  return { success: true, data: result.data }
}

/**
 * Parse and validate a JSON body from a request using a Zod schema.
 * Returns validated data or a 400 error response.
 */
export async function parseBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<ParseResult<z.infer<T>>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    }
  }

  const result = schema.safeParse(body)

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid request body',
          details: result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      ),
    }
  }

  return { success: true, data: result.data }
}

/**
 * Parse and validate route params (e.g. { id: string }) using a Zod schema.
 * Returns validated data or a 400 error response.
 */
export function parseParams<T extends z.ZodType>(
  params: Record<string, string>,
  schema: T
): ParseResult<z.infer<T>> {
  const result = schema.safeParse(params)

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid route parameters',
          details: result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      ),
    }
  }

  return { success: true, data: result.data }
}
