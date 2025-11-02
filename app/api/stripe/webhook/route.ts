import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Stripe webhook: Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const stripe = require('stripe')(stripeSecretKey)
    const sig = req.headers.get('stripe-signature')
    const body = await req.text()

    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout completed:', session.id)
        
        // Save customer & subscription data to Firestore
        if (session.customer && session.subscription) {
          await setDoc(doc(db, 'billing_customers', session.customer as string), {
            customerId: session.customer,
            email: session.customer_email || session.customer_details?.email,
            name: session.customer_details?.name,
            createdAt: serverTimestamp(),
          }, { merge: true })

          await setDoc(doc(db, 'billing_subscriptions', session.subscription as string), {
            subscriptionId: session.subscription,
            customerId: session.customer,
            plan: session.metadata?.plan || 'unknown',
            status: 'active',
            createdAt: serverTimestamp(),
          }, { merge: true })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Subscription updated:', subscription.id)
        
        await setDoc(doc(db, 'billing_subscriptions', subscription.id), {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription deleted:', subscription.id)
        
        await setDoc(doc(db, 'billing_subscriptions', subscription.id), {
          status: 'canceled',
          canceledAt: serverTimestamp(),
        }, { merge: true })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('Invoice paid:', invoice.id)
        
        await setDoc(doc(db, 'billing_invoices', invoice.id), {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'paid',
          paidAt: serverTimestamp(),
        }, { merge: true })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('Invoice payment failed:', invoice.id)
        
        await setDoc(doc(db, 'billing_invoices', invoice.id), {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'past_due',
          failedAt: serverTimestamp(),
        }, { merge: true })
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
