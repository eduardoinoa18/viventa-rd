import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

// Generic email webhook receiver for SendGrid/SMTP delivery events
// Stores raw event payloads in `email_events` for observability
export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Admin DB unavailable' }, { status: 500 })

    const bodyText = await req.text()
    const payload = bodyText ? JSON.parse(bodyText) : {}
    
    const provider = req.headers.get('user-agent')?.toLowerCase().includes('sendgrid') ? 'sendgrid' : 'smtp'
    const eventType = payload?.type || payload?.event || 'unknown'
    const timestamp = new Date()

    await db.collection('email_events').add({
      provider,
      eventType,
      payload,
      receivedAt: timestamp,
      headers: Object.fromEntries(req.headers),
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function GET() {
  // Health check / simple endpoint to verify deployment
  return NextResponse.json({ ok: true })
}
