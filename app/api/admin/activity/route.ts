/**
 * Admin Activity API
 * Audit-grade activity logs storage and retrieval
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Verify master admin session
    const session = await getServerSession()
    
    if (!session || session.role !== 'master_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    // Parse limit from query params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const type = searchParams.get('type')?.trim()
    const action = searchParams.get('action')?.trim()

    let ref: any = adminDb.collection('activity_logs')
    if (type) ref = ref.where('type', '==', type)
    if (action) ref = ref.where('action', '==', action)

    const safeLimit = Math.min(Math.max(limit, 1), 200)

    let snap
    try {
      snap = await ref.orderBy('timestamp', 'desc').limit(safeLimit).get()
    } catch {
      snap = await ref.limit(safeLimit).get()
    }

    const activities = snap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString?.() || data.timestamp || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null,
      }
    })

    return NextResponse.json({
      ok: true,
      data: activities,
      total: activities.length,
      limit: safeLimit,
    })
  } catch (error) {
    console.error('Activity API error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify master admin session
    const session = await getServerSession()
    
    if (!session || session.role !== 'master_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const body = await req.json()
    const {
      type,
      action,
      userId,
      userName,
      userEmail,
      actorId,
      actorEmail,
      actorRole,
      entityType,
      entityId,
      metadata,
    } = body || {}

    if (!type || !action) {
      return NextResponse.json({ ok: false, error: 'type and action are required' }, { status: 400 })
    }

    const activityDoc = {
      type,
      action,
      userId: userId || null,
      userName: userName || null,
      userEmail: userEmail || null,
      actorId: actorId || session.uid,
      actorEmail: actorEmail || session.email || null,
      actorRole: actorRole || session.role,
      entityType: entityType || null,
      entityId: entityId || null,
      metadata: metadata || {},
      timestamp: new Date(),
      createdAt: new Date(),
    }

    await adminDb.collection('activity_logs').add(activityDoc)

    return NextResponse.json({
      ok: true,
      message: 'Activity logged',
      data: {
        type,
        action,
      },
    })
  } catch (error) {
    console.error('Activity POST error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
