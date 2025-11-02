// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function POST(req: Request) {
  const db = getAdminDb()
  const sig = (await headers()).get('stripe-signature') || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
  let event: Stripe.Event

  try {
    const raw = await req.text()
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err?.message || 'invalid-signature'}`, { status: 400 })
  }

  // Persist event for audit/debug
  try {
    if (db) {
      await db.collection('stripe_events').doc(event.id).set({
        id: event.id,
        type: event.type,
        created: event.created,
        data: event.data?.object ?? null,
        receivedAt: Date.now(),
      }, { merge: true })
    }
  } catch {}

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        // Example: update billing status on user by customer id
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string | null
        if (db && customerId) {
          await db.collection('billing').doc(customerId).set({
            lastPaymentStatus: 'succeeded',
            lastPaymentAt: new Date(invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : Date.now()),
            updatedAt: new Date(),
          }, { merge: true })
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string | null
        if (db && customerId) {
          await db.collection('billing').doc(customerId).set({
            subscription: {
              id: sub.id,
              status: sub.status,
              current_period_end: sub.current_period_end,
              items: sub.items?.data?.map(i => ({ price: i.price?.id, quantity: i.quantity })) || [],
            },
            updatedAt: new Date(),
          }, { merge: true })
        }
        break
      }
      default:
        // no-op for other events
        break
    }
  } catch (err) {
    // Swallow errors to avoid 5xx retries spiraling; Stripe will retry on non-2xx
  }

  return NextResponse.json({ received: true })
}
