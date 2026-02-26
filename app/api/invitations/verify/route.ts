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
    const inviteData = inviteDoc.data() as any

    // Check if already accepted/used
    if (inviteData.status === 'accepted' || inviteData.used === true) {
      return NextResponse.json(
        { ok: false, error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Check if expired
    const now = new Date()
    const expiresAt = inviteData.expiresAt?.toDate?.() || new Date(inviteData.expiresAt)
    
    if (now > expiresAt) {
      // Update status to expired
      await inviteDoc.ref.update({ status: 'expired', updatedAt: new Date() })
      
      return NextResponse.json(
        { ok: false, error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    const userId = inviteData.userId
    let userProfile: any = null
    if (userId) {
      const userSnap = await adminDb.collection('users').doc(userId).get()
      if (userSnap.exists) {
        const data = userSnap.data() as any
        userProfile = {
          phone: data.phone || '',
          photoURL: data.photoURL || '',
          bio: data.bio || '',
          brokerageName: data.brokerageName || data.brokerage || '',
          companyInfo: data.companyInfo || data.company || '',
          whatsapp: data.whatsapp || '',
          licenseNumber: data.licenseNumber || '',
        }
      }
    }

    // Return invitation data
    return NextResponse.json({
      ok: true,
      invitation: {
        email: inviteData.email,
        name: inviteData.name,
        message: inviteData.message || '',
        role: inviteData.role || inviteData.inviteType || 'user',
        status: inviteData.status,
        used: inviteData.used === true,
        expiresAt: expiresAt.toISOString(),
        userProfile,
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
