// app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import type { AnalyticsEventType } from '@/types/analytics'
import { getSessionFromRequest } from '@/lib/auth/session'

const VALID_EVENT_TYPES: AnalyticsEventType[] = [
  'page_view', 'login', 'signup', 'logout',
  'listing_create', 'listing_view', 'listing_edit', 'listing_delete',
  'lead_create', 'lead_opened', 'message_sent', 'file_upload',
  'email_sent', 'search_performed', 'favorite_added', 'favorite_removed',
  'application_submitted', 'conversion', 'error'
]

export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const body = await req.json()
    const { eventType, event, sessionId, metadata, data, page, referrer, userAgent: clientUserAgent } = body

    // Support both new (eventType) and legacy (event) field names
    const eventName = eventType || event
    
    if (!eventName) {
      return NextResponse.json({ ok: false, error: 'eventType required' }, { status: 400 })
    }

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(eventName)) {
      return NextResponse.json({ ok: false, error: `Invalid eventType: ${eventName}` }, { status: 400 })
    }

    const session = await getSessionFromRequest(req)
    const uid = session?.uid || null
    const role = session?.role || null

    // Create timestamp for date/hour aggregation
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const hour = now.getHours() // 0-23

    const eventData = {
      eventId: `${now.getTime()}_${Math.random().toString(36).substring(2, 9)}`,
      eventType: eventName,
      userId: uid,
      userRole: role,
      sessionId: sessionId || null,
      metadata: metadata || data || {},
      timestamp: now,
      date: dateStr,
      hour: hour,
      page: page || null,
      referrer: referrer || req.headers.get('referer') || null,
      userAgent: clientUserAgent || req.headers.get('user-agent') || null,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || null,
    }

    await db.collection('analytics_events').add(eventData)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Analytics query failed:', e)
    return NextResponse.json({ ok: false, error: 'Data temporarily unavailable' }, { status: 500 })
  }
}
