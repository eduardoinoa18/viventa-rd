import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import Stripe from 'stripe'
import { getPublicAppUrl } from '@/lib/publicAppUrl'

export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { plan, email, metadata, successUrl, cancelUrl } = await req.json()
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 })
    }

    // Check for Stripe secret key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ 
        error: 'STRIPE_SECRET_KEY not configured. Add it to your .env.local file.' 
      }, { status: 501 })
    }

    // Fetch billing settings from Firestore
    const settingsSnap = await db.collection('settings').doc('billing').get()
    const settings = settingsSnap.data() ?? { priceIds: {} }
    
    const priceId = plan === 'agent' ? settings.priceIds?.agent : settings.priceIds?.broker
    if (!priceId) {
      return NextResponse.json({ 
        error: `Price ID for ${plan} not configured. Set it in Admin → Billing → Plans & Pricing.` 
      }, { status: 400 })
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey)

    // Create Checkout Session
    const appUrl = getPublicAppUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        plan,
        ...metadata,
      },
      success_url: successUrl || `${appUrl}/search?payment=success`,
      cancel_url: cancelUrl || `${appUrl}/search?payment=canceled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      // Apple Pay and Google Pay are automatically offered by Stripe Checkout where supported
    })

    return NextResponse.json({ url: session.url, id: session.id })
  } catch (error: any) {
    console.error('Stripe create-session error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to create checkout session' 
    }, { status: 500 })
  }
}
