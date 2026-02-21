import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN','SUPPORT'] })
  if (authResult instanceof Response) return authResult

  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const body = await request.json()
    const { userId, userName, userEmail, title } = body

    if (!userId || !userName) {
      return NextResponse.json({ error: 'User ID and name required' }, { status: 400 })
    }

    const now = new Date()

    const conversationRef = await db.collection('conversations').add({
      title: title || `Chat with ${userName}`,
      userId,
      userName,
      userEmail: userEmail || null,
      status: 'open',
      createdAt: now,
      lastMessageAt: now,
      unreadCount: 0
    })

    return NextResponse.json({ 
      success: true,
      conversationId: conversationRef.id
    })

  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
