// app/api/admin/leads/queue/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { Timestamp } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

interface LeadData {
  type: 'request-info' | 'request-call' | 'whatsapp' | 'showing'
  source: 'property' | 'project' | 'agent'
  sourceId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  message?: string
}

// GET /api/admin/leads/queue - List lead queue for Master Admin
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
    const status = searchParams.get('status')?.trim()
    const type = searchParams.get('type')?.trim()
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    let ref: any = adminDb.collection('leads')

    if (status) {
      ref = ref.where('status', '==', status)
    }

    if (type) {
      ref = ref.where('type', '==', type)
    }

    try {
      const snap = await ref.orderBy('createdAt', 'desc').limit(limit).get()
      const leads = snap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }))

      const stats = {
        total: leads.length,
        unassigned: leads.filter((l: any) => l.status === 'unassigned').length,
        assigned: leads.filter((l: any) => l.status === 'assigned').length,
        contacted: leads.filter((l: any) => l.status === 'contacted').length,
        won: leads.filter((l: any) => l.status === 'won').length,
        lost: leads.filter((l: any) => l.status === 'lost').length,
      }

      return NextResponse.json({
        ok: true,
        data: leads,
        stats,
      })
    } catch (orderError: any) {
      // Fallback if ordering fails
      const snap = await ref.get()
      const leads = snap.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .slice(0, limit)

      return NextResponse.json({ ok: true, data: leads })
    }
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[admin/leads/queue] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch lead queue' },
      { status: 500 }
    )
  }
}

// POST /api/admin/leads/queue - Create new lead (called from public CTAs)
export async function POST(req: NextRequest) {
  try {
    const body: LeadData = await req.json()

    if (!body.buyerName || !body.buyerEmail || !body.type || !body.source) {
      return NextResponse.json(
        {
          ok: false,
          error: 'buyerName, buyerEmail, type, and source are required',
        },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Admin SDK not configured' },
        { status: 503 }
      )
    }

    const leadDoc = {
      type: body.type,
      source: body.source,
      sourceId: body.sourceId,
      buyerName: body.buyerName.trim(),
      buyerEmail: body.buyerEmail.trim().toLowerCase(),
      buyerPhone: body.buyerPhone?.trim() || '',
      message: body.message?.trim() || '',
      status: 'unassigned',
      assignedTo: null,
      inboxConversationId: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const docRef = await adminDb.collection('leads').add(leadDoc)

    return NextResponse.json({
      ok: true,
      data: { id: docRef.id, ...leadDoc },
      message: 'Lead created successfully',
    })
  } catch (error: any) {
    console.error('[admin/leads/queue POST] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/leads/queue - Update lead status/assignment
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
    const { id, status, assignedTo, inboxConversationId } = body

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id is required' },
        { status: 400 }
      )
    }

    const updates: any = { updatedAt: Timestamp.now() }

    if (status) updates.status = status
    if (assignedTo) updates.assignedTo = assignedTo
    if (inboxConversationId) updates.inboxConversationId = inboxConversationId

    await adminDb.collection('leads').doc(id).update(updates)

    return NextResponse.json({
      ok: true,
      message: 'Lead updated successfully',
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[admin/leads/queue PATCH] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}
