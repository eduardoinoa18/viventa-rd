import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, getDocs, doc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import Stripe from 'stripe'

export async function GET() {
  try {
    const q = query(collection(db, 'billing_customers'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    const customers = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ ok: true, data: customers })
  } catch (e: any) {
    console.error('Error fetching billing customers:', e)
    // Return empty array if collection doesn't exist or permission denied
    if (e?.code === 'permission-denied' || e?.message?.includes('index') || e?.message?.includes('not found')) {
      return NextResponse.json({ ok: true, data: [] })
    }
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    if (!email) return NextResponse.json({ ok: false, error: 'Email required' }, { status: 400 })

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ ok: false, error: 'Stripe not configured' }, { status: 501 })
    }

    const stripe = new Stripe(stripeSecretKey)
    const customer = await stripe.customers.create({ email, name })

    await setDoc(doc(db, 'billing_customers', customer.id), {
      customerId: customer.id,
      email,
      name,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({ ok: true, data: { id: customer.id, email, name, createdAt: new Date().toISOString() } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Invalid payload' }, { status: 400 })
  }
}
