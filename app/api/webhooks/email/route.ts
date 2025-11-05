import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import crypto from 'crypto'

// Resend webhook signature verification
// See: https://resend.com/docs/dashboard/webhooks/verify-signature
function verifyResendSignature(req: NextRequest, body: string): boolean {
  const sigHeader = req.headers.get('svix-signature') || req.headers.get('webhook-signature')
  if (!sigHeader) return false
  
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    // If not configured, log warning but allow (dev mode)
    console.warn('RESEND_WEBHOOK_SECRET not set; skipping signature verification')
    return true
  }

  try {
    // Resend uses Svix signing: extract timestamp and signatures
    // Format: "v1,t=<timestamp>,v1=<sig1>,v1=<sig2>"
    const parts = sigHeader.split(',')
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1]
    const signatures = parts.filter(p => p.startsWith('v1='))
    
    if (!timestamp || signatures.length === 0) return false
    
    // Construct signed payload: timestamp + '.' + body
    const signedPayload = `${timestamp}.${body}`
    const expectedSig = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('base64')
    
    // Check if any provided signature matches
    return signatures.some(sig => {
      const providedSig = sig.split('=')[1]
      return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(providedSig))
    })
  } catch (e) {
    console.error('Signature verification error:', e)
    return false
  }
}

// Basic webhook receiver for email providers (Resend-compatible)
// Stores raw event payloads in `email_events` for observability
export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Admin DB unavailable' }, { status: 500 })

    const bodyText = await req.text()
    const payload = bodyText ? JSON.parse(bodyText) : {}
    
    const provider = req.headers.get('user-agent')?.includes('Resend') ? 'resend' : 'unknown'
    
    // Verify signature for Resend webhooks
    if (provider === 'resend' && !verifyResendSignature(req, bodyText)) {
      console.warn('Invalid webhook signature from Resend')
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
    }
    
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
