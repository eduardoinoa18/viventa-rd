// app/api/notifications/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

/**
 * Get notification preferences for a user
 * GET /api/notifications/preferences?userId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Firebase Admin not configured' },
        { status: 500 }
      )
    }

    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()

    if (!userData) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const preferences = {
      notificationsEnabled: userData.notificationsEnabled ?? true,
      messages: userData.notificationPreferences?.messages ?? true,
      properties: userData.notificationPreferences?.properties ?? true,
      achievements: userData.notificationPreferences?.achievements ?? true,
      marketing: userData.notificationPreferences?.marketing ?? false
    }

    return NextResponse.json({
      ok: true,
      data: preferences
    })
  } catch (error: any) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * Update notification preferences
 * PATCH /api/notifications/preferences
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId, preferences } = await req.json()

    if (!userId || !preferences) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId or preferences' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Firebase Admin not configured' },
        { status: 500 }
      )
    }

    await adminDb.collection('users').doc(userId).update({
      notificationPreferences: preferences,
      updatedAt: new Date()
    })

    return NextResponse.json({
      ok: true,
      message: 'Preferences updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
