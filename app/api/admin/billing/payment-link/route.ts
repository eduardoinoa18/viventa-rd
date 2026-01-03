import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { doc, getDoc } from 'firebase/firestore'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json()
    if (!plan) return NextResponse.json({ ok: false, error: 'Plan required' }, { status: 400 })

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ ok: false, error: 'Stripe not configured' }, { status: 501 })
    }

    // Fetch price ID from settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'billing'))
    const settings = settingsSnap.exists() ? settingsSnap.data() : { priceIds: {} }
    const priceId = plan === 'agent' ? settings.priceIds?.agent : settings.priceIds?.broker
    if (!priceId) {
      return NextResponse.json({ ok: false, error: `Price ID for ${plan} not configured` }, { status: 400 })
    }

    const stripe = new Stripe(stripeSecretKey)

    // Create a Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: priceId, quantity: 1 }],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?payment=success`,
        },
      },
    })

    return NextResponse.json({ ok: true, url: paymentLink.url })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Invalid payload' }, { status: 400 })
  }
}
