import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'

export async function GET() {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const q = query(collection(db, 'billing_subscriptions'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    const subs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ ok: true, data: subs })
  } catch (e: any) {
    console.error('Error fetching billing subscriptions:', e)
    // Return empty array if collection doesn't exist or permission denied
    if (e?.code === 'permission-denied' || e?.message?.includes('index') || e?.message?.includes('not found')) {
      return NextResponse.json({ ok: true, data: [] })
    }
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const { email, plan } = await req.json()
    if (!email || !plan) return NextResponse.json({ ok: false, error: 'Email and plan are required' }, { status: 400 })

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

    const stripe = require('stripe')(stripeSecretKey)

    // Find or create customer
    const existingCustomers = await stripe.customers.list({ email, limit: 1 })
    let customer
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({ email })
      await setDoc(doc(db, 'billing_customers', customer.id), {
        customerId: customer.id,
        email,
        createdAt: serverTimestamp(),
      })
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      metadata: { plan },
    })

    await setDoc(doc(db, 'billing_subscriptions', subscription.id), {
      subscriptionId: subscription.id,
      customerId: customer.id,
      plan,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({ ok: true, data: { id: subscription.id, customerId: customer.id, plan, status: subscription.status } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Invalid payload' }, { status: 400 })
  }
}
