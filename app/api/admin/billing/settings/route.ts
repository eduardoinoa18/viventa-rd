import { NextRequest, NextResponse } from 'next/server'

type BillingSettings = {
  publishableKey?: string
  priceIds: { agent?: string; broker?: string }
  wallets: { applePay: boolean; googlePay: boolean }
}

let settings: BillingSettings = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  priceIds: { agent: '', broker: '' },
  wallets: { applePay: false, googlePay: false },
}

export async function GET() {
  return NextResponse.json({ ok: true, data: settings })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<BillingSettings>
    settings = {
      publishableKey: body.publishableKey ?? settings.publishableKey,
      priceIds: {
        agent: body.priceIds?.agent ?? settings.priceIds.agent,
        broker: body.priceIds?.broker ?? settings.priceIds.broker,
      },
      wallets: {
        applePay: body.wallets?.applePay ?? settings.wallets.applePay,
        googlePay: body.wallets?.googlePay ?? settings.wallets.googlePay,
      },
    }
    return NextResponse.json({ ok: true, data: settings })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Invalid payload' }, { status: 400 })
  }
}
