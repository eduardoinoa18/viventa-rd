import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Placeholder: Return 501 until Stripe server integration is implemented
  return NextResponse.json({ error: 'Stripe create-session not implemented yet. Add STRIPE_SECRET_KEY and wire server logic.' }, { status: 501 })
}
