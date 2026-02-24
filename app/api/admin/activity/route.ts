/**
 * Admin Activity API
 * Minimal implementation to prevent 404 errors
 * TODO: Implement full activity logging system in Phase 2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'

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

    // Parse limit from query params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Minimal response - empty activity log
    // TODO: Implement actual activity fetching from Firestore
    return NextResponse.json({
      activities: [],
      total: 0,
      limit,
    })
  } catch (error) {
    console.error('Activity API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const body = await req.json()

    // Minimal implementation - accept activity log but don't store
    // TODO: Implement actual activity storage to Firestore
    console.log('Activity logged:', {
      user: session.uid,
      action: body.action,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      ok: true,
      message: 'Activity logged',
    })
  } catch (error) {
    console.error('Activity POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
