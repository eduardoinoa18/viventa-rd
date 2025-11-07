// app/api/invitations/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

// POST - Verify invitation token
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Find invitation by token
    const invitationsSnap = await adminDb
      .collection('invitations')
      .where('token', '==', token)
      .limit(1)
      .get()

    if (invitationsSnap.empty) {
      return NextResponse.json(
        { ok: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    const inviteDoc = invitationsSnap.docs[0]
    const inviteData = inviteDoc.data()

    // Check if already accepted
    if (inviteData.status === 'accepted') {
      return NextResponse.json(
        { ok: false, error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Check if expired
    const now = new Date()
    const expiresAt = inviteData.expiresAt.toDate()
    
    if (now > expiresAt) {
      // Update status to expired
      await inviteDoc.ref.update({ status: 'expired' })
      
      return NextResponse.json(
        { ok: false, error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Return invitation data
    return NextResponse.json({
      ok: true,
      invitation: {
        email: inviteData.email,
        name: inviteData.name,
        message: inviteData.message,
        inviteType: inviteData.inviteType,
        status: inviteData.status,
        expiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error verifying invitation:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to verify invitation' },
      { status: 500 }
    )
  }
}
