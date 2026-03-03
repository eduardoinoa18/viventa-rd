// app/api/crm/buyers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

function normalizeBuyerLifecycleStage(value: unknown): 'new' | 'active' | 'nurturing' | 'offer' | 'won' | 'lost' {
  const allowed = new Set(['new', 'active', 'nurturing', 'offer', 'won', 'lost'])
  if (typeof value === 'string' && allowed.has(value)) {
    return value as 'new' | 'active' | 'nurturing' | 'offer' | 'won' | 'lost'
  }
  return 'new'
}

function normalizeBuyerPriority(value: unknown): 'low' | 'medium' | 'high' {
  if (value === 'low' || value === 'medium' || value === 'high') return value
  return 'medium'
}

function normalizeEngagementScore(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 50
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function asIsoDateOrEmpty(value: unknown): string {
  if (!value) return ''
  const date = new Date(String(value))
  if (!Number.isFinite(date.getTime())) return ''
  return date.toISOString()
}

// GET /api/crm/buyers/[id] - Get single buyer detail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Admin SDK not configured' },
        { status: 503 }
      )
    }

    const buyerId = params.id

    const doc = await adminDb.collection('users').doc(buyerId).get()

    if (!doc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Buyer not found' },
        { status: 404 }
      )
    }

    const source = doc.data() as any
    const buyer = {
      id: doc.id,
      ...source,
      lifecycleStage: normalizeBuyerLifecycleStage(source?.lifecycleStage),
      engagementScore: normalizeEngagementScore(source?.engagementScore),
      priority: normalizeBuyerPriority(source?.priority),
      assignedAgentId: String(source?.assignedAgentId || '').trim(),
      assignedAgentName: String(source?.assignedAgentName || '').trim(),
      lastContactAt: asIsoDateOrEmpty(source?.lastContactAt),
      nextFollowUpAt: asIsoDateOrEmpty(source?.nextFollowUpAt),
    } as any

    // Verify it's actually a buyer
    if (buyer.role !== 'buyer') {
      return NextResponse.json(
        { ok: false, error: 'User is not a buyer' },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, data: buyer })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[crm/buyers/[id]] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch buyer' },
      { status: 500 }
    )
  }
}
