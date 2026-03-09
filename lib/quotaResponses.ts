import { NextResponse } from 'next/server'
import type { QuotaStatus } from '@/lib/officeSubscriptionQuota'

interface BuildQuotaErrorResponseParams {
  status: QuotaStatus
  fallbackError: string
  fallbackCode: string
  officeId?: string | null
  includeOk?: boolean
  httpStatus?: number
}

export function buildQuotaErrorResponse(params: BuildQuotaErrorResponseParams) {
  const {
    status,
    fallbackError,
    fallbackCode,
    officeId,
    includeOk = false,
    httpStatus = 403,
  } = params

  const payload: Record<string, unknown> = {
    error: status.message || fallbackError,
    code: status.code || fallbackCode,
    quota: {
      used: status.used ?? null,
      limit: status.limit ?? null,
      ...(typeof officeId !== 'undefined' ? { officeId } : {}),
    },
  }

  if (includeOk) {
    payload.ok = false
  }

  return NextResponse.json(payload, { status: httpStatus })
}
