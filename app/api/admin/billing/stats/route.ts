import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, getDocs, query, where } from 'firebase/firestore'

export async function GET() {
  try {
    // Fetch active subscriptions
    const subsSnapshot = await getDocs(collection(db, 'billing_subscriptions'))
    const allSubs = subsSnapshot.docs.map((d: any) => d.data())
    const activeSubs = allSubs.filter((s: any) => s.status === 'active' || s.status === 'trialing')

    // Fetch invoices
    const invoicesSnapshot = await getDocs(collection(db, 'billing_invoices'))
    const allInvoices = invoicesSnapshot.docs.map((d: any) => d.data())
    const unpaidInvoices = allInvoices.filter((i: any) => i.status === 'open' || i.status === 'past_due')

    // Calculate MRR (simplified - assumes all subs are monthly at same price)
    // In production, fetch price amounts from Stripe or store them
    const mrrUSD = activeSubs.length * 50 // Placeholder: $50/mo average

    // Calculate churn (simplified)
    const totalSubs = allSubs.length
    const canceledSubs = allSubs.filter((s: any) => s.status === 'canceled').length
    const churnRatePct = totalSubs > 0 ? Math.round((canceledSubs / totalSubs) * 100) : 0

    return NextResponse.json({
      ok: true,
      data: {
        mrrUSD,
        activeSubs: activeSubs.length,
        churnRatePct,
        invoicesDue: unpaidInvoices.length,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
