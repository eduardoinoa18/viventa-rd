import { NextRequest, NextResponse } from 'next/server'

type Subscription = { id: string; customerId: string; plan: 'agent'|'broker'; status: 'active'|'trialing'|'canceled'|'past_due'; currentPeriodEnd?: string }

type Customer = { id: string; email: string }

// We import from the customers module by convention; in real code you'd query Stripe or DB
let customersStore: Customer[] = []
let subs: Subscription[] = []

export async function GET() {
  return NextResponse.json({ ok: true, data: subs })
}

export async function POST(req: NextRequest) {
  try {
    const { email, plan } = await req.json()
    if (!email || !plan) return NextResponse.json({ ok:false, error:'Email and plan are required' }, { status: 400 })

    // find or create mock customer locally (shared memory best-effort)
    let customer = customersStore.find(c=>c.email.toLowerCase()===String(email).toLowerCase())
    if (!customer) {
      customer = { id: `cus_${Math.random().toString(36).slice(2,10)}`, email }
      customersStore.push(customer)
    }

    const s: Subscription = {
      id: `sub_${Math.random().toString(36).slice(2,10)}`,
      customerId: customer.id,
      plan,
      status: 'active',
      currentPeriodEnd: new Date(Date.now()+1000*60*60*24*30).toISOString(),
    }
    subs.push(s)
    return NextResponse.json({ ok: true, data: s })
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Invalid payload' }, { status: 400 })
  }
}
