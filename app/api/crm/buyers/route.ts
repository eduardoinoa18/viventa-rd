// app/api/crm/buyers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

interface BuyerData {
  name: string
  email: string
  phone?: string
  role: 'buyer'
  lifecycleStage?: 'new' | 'active' | 'nurturing' | 'offer' | 'won' | 'lost'
  engagementScore?: number
  priority?: 'low' | 'medium' | 'high'
  assignedAgentId?: string
  assignedAgentName?: string
  lastContactAt?: string
  nextFollowUpAt?: string
  criteria?: {
    location?: string
    budgetMin?: number
    budgetMax?: number
    bedrooms?: number
    purpose?: string
    amenities?: string[]
    projectOnly?: boolean
  }
}

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

// GET /api/crm/buyers - List all buyers
export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Admin SDK not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(req.url)
    const location = searchParams.get('location')?.trim()
    const purpose = searchParams.get('purpose')?.trim()
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    let ref: any = adminDb.collection('users')
    ref = ref.where('role', '==', 'buyer')

    if (location) {
      ref = ref.where('criteria.location', '==', location)
    }
    if (purpose) {
      ref = ref.where('criteria.purpose', '==', purpose)
    }

    try {
      const snap = await ref.orderBy('createdAt', 'desc').limit(limit).get()
      const buyers = snap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        lifecycleStage: normalizeBuyerLifecycleStage(doc.data()?.lifecycleStage),
        engagementScore: normalizeEngagementScore(doc.data()?.engagementScore),
        priority: normalizeBuyerPriority(doc.data()?.priority),
        assignedAgentId: String(doc.data()?.assignedAgentId || '').trim(),
        assignedAgentName: String(doc.data()?.assignedAgentName || '').trim(),
        lastContactAt: asIsoDateOrEmpty(doc.data()?.lastContactAt),
        nextFollowUpAt: asIsoDateOrEmpty(doc.data()?.nextFollowUpAt),
      }))

      return NextResponse.json({ ok: true, data: buyers, count: buyers.length })
    } catch (orderError: any) {
      // Fallback if ordering fails
      const snap = await ref.get()
      const buyers = snap.docs
        .map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          lifecycleStage: normalizeBuyerLifecycleStage(doc.data()?.lifecycleStage),
          engagementScore: normalizeEngagementScore(doc.data()?.engagementScore),
          priority: normalizeBuyerPriority(doc.data()?.priority),
          assignedAgentId: String(doc.data()?.assignedAgentId || '').trim(),
          assignedAgentName: String(doc.data()?.assignedAgentName || '').trim(),
          lastContactAt: asIsoDateOrEmpty(doc.data()?.lastContactAt),
          nextFollowUpAt: asIsoDateOrEmpty(doc.data()?.nextFollowUpAt),
        }))
        .slice(0, limit)

      return NextResponse.json({ ok: true, data: buyers, count: buyers.length })
    }
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[crm/buyers] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch buyers' },
      { status: 500 }
    )
  }
}

// POST /api/crm/buyers - Create/add buyer
export async function POST(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Admin SDK not configured' },
        { status: 503 }
      )
    }

    const body: BuyerData = await req.json()

    if (!body.name || !body.email) {
      return NextResponse.json(
        { ok: false, error: 'name and email are required' },
        { status: 400 }
      )
    }

    const buyerDoc = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      role: 'buyer',
      criteria: body.criteria || {},
      status: 'active',
      lifecycleStage: normalizeBuyerLifecycleStage(body.lifecycleStage),
      engagementScore: normalizeEngagementScore(body.engagementScore),
      priority: normalizeBuyerPriority(body.priority),
      assignedAgentId: body.assignedAgentId?.trim() || '',
      assignedAgentName: body.assignedAgentName?.trim() || '',
      lastContactAt: body.lastContactAt ? new Date(body.lastContactAt) : null,
      nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
      verified: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const docRef = await adminDb.collection('users').add(buyerDoc)

    return NextResponse.json({
      ok: true,
      data: { id: docRef.id, ...buyerDoc },
      message: 'Buyer created successfully',
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[crm/buyers POST] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to create buyer' },
      { status: 500 }
    )
  }
}

// PATCH /api/crm/buyers - Update buyer
export async function PATCH(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Admin SDK not configured' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const {
      id,
      name,
      email,
      phone,
      criteria,
      lifecycleStage,
      engagementScore,
      priority,
      assignedAgentId,
      assignedAgentName,
      lastContactAt,
      nextFollowUpAt,
    } = body

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id is required' },
        { status: 400 }
      )
    }

    const updates: any = { updatedAt: Timestamp.now() }

    if (name) updates.name = name.trim()
    if (email) updates.email = email.trim().toLowerCase()
    if (phone !== undefined) updates.phone = phone?.trim() || ''
    if (criteria) updates.criteria = criteria
    if (lifecycleStage !== undefined) updates.lifecycleStage = normalizeBuyerLifecycleStage(lifecycleStage)
    if (engagementScore !== undefined) updates.engagementScore = normalizeEngagementScore(engagementScore)
    if (priority !== undefined) updates.priority = normalizeBuyerPriority(priority)
    if (assignedAgentId !== undefined) updates.assignedAgentId = String(assignedAgentId || '').trim()
    if (assignedAgentName !== undefined) updates.assignedAgentName = String(assignedAgentName || '').trim()
    if (lastContactAt !== undefined) updates.lastContactAt = lastContactAt ? new Date(String(lastContactAt)) : null
    if (nextFollowUpAt !== undefined) updates.nextFollowUpAt = nextFollowUpAt ? new Date(String(nextFollowUpAt)) : null

    await adminDb.collection('users').doc(id).update(updates)

    return NextResponse.json({
      ok: true,
      message: 'Buyer updated successfully',
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[crm/buyers PATCH] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to update buyer' },
      { status: 500 }
    )
  }
}
