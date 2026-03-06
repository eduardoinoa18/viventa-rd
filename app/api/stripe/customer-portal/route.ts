import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getPublicAppUrl } from '@/lib/publicAppUrl'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function extractCustomerId(raw: any): string | null {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.stripeCustomerId === 'string' && raw.stripeCustomerId) return raw.stripeCustomerId
  if (typeof raw.customerId === 'string' && raw.customerId) return raw.customerId
  if (raw.stripe && typeof raw.stripe.customerId === 'string' && raw.stripe.customerId) return raw.stripe.customerId
  return null
}

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 501 })
    }

    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const role = String(session.role || '')
    if (!['agent', 'broker', 'constructora', 'admin', 'master_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Admin database not configured' }, { status: 500 })
    }

    const userSnap = await db.collection('users').doc(session.uid).get()
    const userData = userSnap.exists ? userSnap.data() : null
    const customerId = extractCustomerId(userData)

    if (!customerId) {
      return NextResponse.json({ error: 'No Stripe customer found for this account. Start a subscription first.' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({})) as { returnUrl?: string }
    const appUrl = getPublicAppUrl()
    const returnUrl = body?.returnUrl || `${appUrl}/dashboard/billing`

    const stripe = new Stripe(stripeSecretKey)
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: portal.url })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create customer portal session' }, { status: 500 })
  }
}
