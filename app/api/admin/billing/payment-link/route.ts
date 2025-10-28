import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json()
    if (!plan) return NextResponse.json({ ok:false, error:'Plan required' }, { status: 400 })
    // In real integration, create a Payment Link or a Checkout Session
    const url = `https://dashboard.stripe.com/test/payment-links/${plan}-placeholder`
    return NextResponse.json({ ok: true, url })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Invalid payload' }, { status: 400 })
  }
}
