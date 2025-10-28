// app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

function getCookie(req: NextRequest, name: string): string | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, data } = body

    if (!event) {
      return NextResponse.json({ ok: false, error: 'Event type required' }, { status: 400 })
    }

    const uid = getCookie(req, 'viventa_uid')
    const role = getCookie(req, 'viventa_role')

    const eventData = {
      event,
      userId: uid || 'anonymous',
      userRole: role || 'visitor',
      data: data || {},
      timestamp: serverTimestamp(),
      userAgent: req.headers.get('user-agent') || '',
      referer: req.headers.get('referer') || '',
    }

    try {
      await addDoc(collection(db, 'analytics_events'), eventData)
    } catch (e) {
      // Firebase not configured, just log
      console.log('[Analytics Event]', event, uid, data)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('analytics track POST error', e)
    return NextResponse.json({ ok: false, error: 'Failed to track event' }, { status: 500 })
  }
}
