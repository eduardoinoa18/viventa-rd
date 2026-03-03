import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { ActivityLogger } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)
    const { userId, reason } = await req.json()

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ ok: false, error: 'userId is required' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const userRef = adminDb.collection('users').doc(userId)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const note = typeof reason === 'string' && reason.trim() ? reason.trim() : 'manual_master_admin_review'

    await userRef.set(
      {
        complianceReviewRequired: true,
        complianceReviewStatus: 'pending',
        complianceReviewReason: note,
        complianceReviewRequestedAt: now,
        complianceReviewRequestedBy: admin.email,
        updatedAt: now,
      },
      { merge: true }
    )

    await adminDb.collection('user_compliance_events').add({
      userId,
      action: 'force_compliance_check',
      status: 'pending',
      reason: note,
      actorEmail: admin.email,
      actorUid: admin.uid,
      createdAt: now,
    })

    const userData = userSnap.data() as any
    await ActivityLogger.log({
      type: 'user',
      action: 'Compliance Check Requested',
      userId,
      userName: userData?.name || 'Unknown',
      userEmail: userData?.email || 'unknown@unknown',
      metadata: {
        reason: note,
        requestedBy: admin.email,
      },
    })

    return NextResponse.json({ ok: true, message: 'Compliance check requested' })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[admin/users/compliance-check] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to request compliance check' }, { status: 500 })
  }
}
