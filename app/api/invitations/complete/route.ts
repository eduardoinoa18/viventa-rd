import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const {
      token,
      password,
      phone,
      photoURL,
      bio,
      brokerageName,
      companyInfo,
      whatsapp,
      licenseNumber,
      termsAccepted,
    } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ ok: false, error: 'token and password are required' }, { status: 400 })
    }
    if (!termsAccepted) {
      return NextResponse.json({ ok: false, error: 'You must accept platform terms' }, { status: 400 })
    }
    if (String(password).length < 8) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    const adminAuth = getAdminAuth()
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const inviteSnap = await adminDb.collection('invitations').where('token', '==', token).limit(1).get()
    if (inviteSnap.empty) {
      return NextResponse.json({ ok: false, error: 'Invitation not found' }, { status: 404 })
    }

    const inviteDoc = inviteSnap.docs[0]
    const invite = inviteDoc.data() as any

    if (invite.used || invite.status === 'accepted') {
      return NextResponse.json({ ok: false, error: 'Invitation already used' }, { status: 409 })
    }

    const expiresAt = invite.expiresAt?.toDate?.() || new Date(invite.expiresAt)
    if (expiresAt.getTime() < Date.now()) {
      await inviteDoc.ref.update({ status: 'expired', updatedAt: new Date() })
      return NextResponse.json({ ok: false, error: 'Invitation expired' }, { status: 410 })
    }

    const userId = invite.userId as string
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Invitation missing user' }, { status: 400 })
    }

    const userRef = adminDb.collection('users').doc(userId)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    const userData = userSnap.data() as any

    await adminAuth.updateUser(userId, {
      password,
      displayName: userData?.name || invite.name || 'Viventa User',
      emailVerified: true,
    })

    await userRef.set(
      {
        phone: phone || userData?.phone || '',
        photoURL: photoURL || userData?.photoURL || '',
        bio: bio || userData?.bio || '',
        brokerageName: brokerageName || userData?.brokerageName || '',
        companyInfo: companyInfo || userData?.companyInfo || '',
        whatsapp: whatsapp || userData?.whatsapp || '',
        licenseNumber: licenseNumber || userData?.licenseNumber || '',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        inviteUsed: true,
        emailVerified: true,
        status: 'active',
        updatedAt: new Date(),
      },
      { merge: true }
    )

    await inviteDoc.ref.update({
      used: true,
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })

    await ActivityLogger.log({
      type: 'user',
      action: 'Invitation Completed',
      userId,
      userName: userData?.name || invite.name,
      userEmail: invite.email,
      metadata: {
        role: invite.role,
      },
    })

    await ActivityLogger.inviteAccepted(userId, invite.email, invite.role || 'user')

    return NextResponse.json({
      ok: true,
      data: {
        userId,
        email: invite.email,
        role: invite.role,
      },
      message: 'Invitation completed successfully',
    })
  } catch (error: any) {
    console.error('[invitations/complete] error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to complete invitation' }, { status: 500 })
  }
}
