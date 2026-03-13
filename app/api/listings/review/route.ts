// app/api/listings/review/route.ts
// Master Admin approves, rejects, or requests revision for a pending listing
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterAdmin } from '@/lib/adminApiAuth'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type ReviewAction = 'approve' | 'reject' | 'revision'

export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })

    const authError = await requireMasterAdmin(req)
    if (authError) return authError

    const session = await getSessionFromRequest(req)

    const { listingId, action, note }: { listingId: string; action: ReviewAction; note?: string } = await req.json()

    if (!listingId || !action) {
      return NextResponse.json({ ok: false, error: 'listingId and action are required' }, { status: 400 })
    }

    if (!['approve', 'reject', 'revision'].includes(action)) {
      return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 })
    }

    const ref = db.collection('properties').doc(listingId)
    const snap = await ref.get()
    if (!snap.exists) return NextResponse.json({ ok: false, error: 'Listing not found' }, { status: 404 })

    const now = new Date().toISOString()
    const adminUid = session?.uid || 'system-admin'

    const updates: Record<string, any> = { updatedAt: now, reviewedBy: adminUid, reviewedAt: now, approvalNotes: note || '' }

    if (action === 'approve') {
      updates.status = 'active'
      updates.approvedAt = now
      updates.approvedBy = adminUid
      updates.rejectedAt = null
      updates.rejectedBy = null
    } else if (action === 'reject') {
      updates.status = 'rejected'
      updates.rejectedAt = now
      updates.rejectedBy = adminUid
      updates.rejectionReason = note || 'Rejected by admin'
    } else {
      // revision requested → back to draft
      updates.status = 'draft'
      updates.revisionRequestedAt = now
      updates.revisionRequestedBy = adminUid
      updates.revisionNote = note || ''
    }

    await ref.update(updates)

    return NextResponse.json({ ok: true, listingId, action, newStatus: updates.status })
  } catch (err: any) {
    console.error('[listings/review] error', err)
    return NextResponse.json({ ok: false, error: 'Failed to review listing' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })

    const authError = await requireMasterAdmin(req)
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 200)

    const q = db.collection('properties').where('status', '==', status).orderBy('updatedAt', 'desc').limit(limit)

    const snap = await q.get()

    const items = snap.docs.map((doc) => {
      const d = doc.data() as Record<string, any>
      return {
        id: doc.id,
        listingId: d.listingId || doc.id,
        title: d.title || '',
        city: d.city || '',
        sector: d.sector || '',
        propertyType: d.propertyType || '',
        price: d.price || 0,
        currency: d.currency || 'USD',
        status: d.status || '',
        createdByUserId: d.createdByUserId || '',
        agentId: d.agentId || '',
        brokerName: d.brokerName || '',
        constructora: d.constructora || '',
        images: Array.isArray(d.images) ? d.images.slice(0, 2) : [],
        qualityScore: d.qualityScore || 0,
        submittedAt: d.submittedAt || d.createdAt || null,
        submissionNote: d.submissionNote || '',
        approvalNotes: d.approvalNotes || '',
        rejectionReason: d.rejectionReason || '',
        reviewedAt: d.reviewedAt || null,
        reviewedBy: d.reviewedBy || null,
        updatedAt: d.updatedAt || null,
        createdAt: d.createdAt || null,
      }
    })

    return NextResponse.json({ ok: true, count: items.length, status, items })
  } catch (err: any) {
    console.error('[listings/review] GET error', err)
    return NextResponse.json({ ok: false, error: 'Failed to load review queue' }, { status: 500 })
  }
}
