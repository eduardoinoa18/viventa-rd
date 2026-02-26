import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
export const dynamic = 'force-dynamic'

// GET /api/admin/leads - compatibility endpoint backed by centralized leads collection
export async function GET(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const limitParam = Number(searchParams.get('limit') || '50')
    const safeLimit = Math.min(Math.max(limitParam, 1), 200)

    const snap = await (adminDb as any)
      .collection('leads')
      .orderBy('createdAt', 'desc')
      .limit(safeLimit)
      .get()

    const leads = snap.docs.map((d: any) => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      }
    })

    return NextResponse.json({ ok: true, leads })
  } catch (e: any) {
    console.error('leads GET error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch leads' }, { status: 500 })
  }
}

// PATCH /api/admin/leads - compatibility patch against centralized leads collection
export async function PATCH(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const { leadId, assignedTo, status } = await req.json()

    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'Missing leadId' }, { status: 400 })
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date()
    }

    // Update assignment if provided
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo || null
      updateData.assignedAt = assignedTo ? new Date() : null
    }

    // Update status if provided
    if (status !== undefined) {
      updateData.status = status
      if (status === 'converted') {
        updateData.convertedAt = new Date()
      }
    }

    // Update the lead
    await (adminDb as any).collection('leads').doc(leadId).set(updateData, { merge: true })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('leads PATCH error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to update lead' }, { status: 500 })
  }
}
