// app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import type { AnalyticsEventType } from '@/types/analytics'

const VALID_EVENT_TYPES: AnalyticsEventType[] = [
  'page_view', 'login', 'signup', 'logout',
  'listing_create', 'listing_view', 'listing_edit', 'listing_delete',
  'lead_create', 'lead_opened', 'message_sent', 'file_upload',
  'email_sent', 'search_performed', 'favorite_added', 'favorite_removed',
  'application_submitted', 'conversion', 'error'
]

function getCookie(req: NextRequest, name: string): string | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventType, event, userId, userRole, sessionId, metadata, data, page, referrer, userAgent: clientUserAgent } = body

    // Support both new (eventType) and legacy (event) field names
    const eventName = eventType || event
    
    if (!eventName) {
      return NextResponse.json({ ok: false, error: 'eventType required' }, { status: 400 })
    }

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(eventName)) {
      return NextResponse.json({ ok: false, error: `Invalid eventType: ${eventName}` }, { status: 400 })
    }

    const uid = userId || getCookie(req, 'viventa_uid') || null
    const role = userRole || getCookie(req, 'viventa_role') || null

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
      timestamp: serverTimestamp(),
      date: dateStr,
      hour: hour,
      page: page || null,
      referrer: referrer || req.headers.get('referer') || null,
      userAgent: clientUserAgent || req.headers.get('user-agent') || null,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || null,
    }

    try {
      await addDoc(collection(db, 'analytics_events'), eventData)
    } catch (e) {
      // Firebase not configured or error, just log
      console.log('[Analytics Event]', eventName, uid, metadata || data)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('analytics track POST error', e)
    return NextResponse.json({ ok: false, error: 'Failed to track event' }, { status: 500 })
  }
}
