import { NextResponse } from 'next/server'
import { AdminAuthError } from './requireMasterAdmin'

/**
 * Standardized admin API error responses
 * 
 * All admin APIs return this shape:
 * {
 *   "error": {
 *     "code": "FORBIDDEN",
 *     "message": "Human-readable message"
 *   }
 * }
 */

export interface AdminErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

export interface AdminSuccessResponse<T = any> {
  ok: true
  data?: T
}

// Standard error codes across all admin APIs
export const ADMIN_ERRORS = {
  // Auth errors (4xx)
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    status: 401,
    message: 'Authentication required',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    status: 403,
    message: 'Access denied',
  },
  INVALID_REQUEST: {
    code: 'INVALID_REQUEST',
    status: 400,
    message: 'Invalid request',
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    status: 404,
    message: 'Resource not found',
  },
  CONFLICT: {
    code: 'CONFLICT',
    status: 409,
    message: 'Resource conflict',
  },
  RATE_LIMIT: {
    code: 'RATE_LIMIT',
    status: 429,
    message: 'Too many requests',
  },
  // Server errors (5xx)
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    status: 500,
    message: 'Internal server error',
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    status: 503,
    message: 'Service unavailable',
  },
} as const

export function adminErrorResponse(
  errorKey: keyof typeof ADMIN_ERRORS,
  details?: Record<string, any> | string,
  customMessage?: string
): NextResponse<AdminErrorResponse> {
  const errorDef = ADMIN_ERRORS[errorKey]

  const response: AdminErrorResponse = {
    error: {
      code: errorDef.code,
      message: customMessage || errorDef.message,
    },
  }

  if (details) {
    response.error.details = typeof details === 'string' ? { info: details } : details
  }

  return NextResponse.json(response, { status: errorDef.status })
}

export function adminSuccessResponse<T = any>(
  data?: T,
  status = 200
): NextResponse<AdminSuccessResponse<T>> {
  const response: AdminSuccessResponse<T> = {
    ok: true,
  }
  if (data !== undefined) {
    response.data = data
  }
  return NextResponse.json(response, { status })
}

/**
 * Convert AdminAuthError to standardized response
 */
export function handleAdminAuthError(error: AdminAuthError): NextResponse<AdminErrorResponse> {
  return adminErrorResponse(
    error.code as keyof typeof ADMIN_ERRORS,
    undefined,
    error.message
  )
}

/**
 * Utility: handle generic error in admin context
 */
export function handleAdminError(
  error: unknown,
  context?: string
): NextResponse<AdminErrorResponse> {
  if (error instanceof AdminAuthError) {
    return handleAdminAuthError(error)
  }

  const message =
    error instanceof Error ? error.message : String(error)

  console.error(`Admin API error${context ? ` (${context})` : ''}:`, message)

  return adminErrorResponse(
    'INTERNAL_ERROR',
    { message },
    'An error occurred. Please try again.'
  )
}
