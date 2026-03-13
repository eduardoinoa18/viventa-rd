// app/api/listings/submit/route.ts
// Professionals submit a draft listing for master-admin review (draft → pending)
import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Auth required' }, { status: 401 })

    const role = (session.role as string) || 'buyer'
    const allowed = ['agent', 'broker', 'constructora', 'master_admin', 'admin']
    if (!allowed.includes(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    const { listingId, note } = await req.json()
    if (!listingId) return NextResponse.json({ ok: false, error: 'listingId required' }, { status: 400 })

    const ref = db.collection('properties').doc(listingId)
    const snap = await ref.get()
    if (!snap.exists) return NextResponse.json({ ok: false, error: 'Listing not found' }, { status: 404 })

    const data = snap.data() as Record<string, any>

    // Only owner, their broker, or admin may submit
    const isOwner = data.createdByUserId === session.uid || data.agentId === session.uid
    const isBroker = data.brokerId && data.brokerId === (session as any).officeId
    const isAdmin = role === 'master_admin' || role === 'admin'

    if (!isOwner && !isBroker && !isAdmin) {
      return NextResponse.json({ ok: false, error: 'Forbidden: not the owner' }, { status: 403 })
    }

    if (data.status !== 'draft' && data.status !== 'rejected') {
      return NextResponse.json({ ok: false, error: `Cannot submit a listing with status "${data.status}"` }, { status: 409 })
    }

    await ref.update({
      status: 'pending',
      submittedAt: new Date().toISOString(),
      submittedBy: session.uid,
      submissionNote: note || '',
      updatedAt: new Date().toISOString(),
      // Reset any prior rejection data
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
    })

    return NextResponse.json({ ok: true, listingId, status: 'pending' })
  } catch (err: any) {
    console.error('[listings/submit] error', err)
    return NextResponse.json({ ok: false, error: 'Failed to submit listing' }, { status: 500 })
  }
}
