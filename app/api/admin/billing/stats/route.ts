import { NextResponse } from 'next/server'

// Ephemeral mock stats for scaffold
let mockStats = {
  mrrUSD: 0,
  activeSubs: 0,
  churnRatePct: 0,
  invoicesDue: 0,
}

export async function GET() {
  return NextResponse.json({ ok: true, data: mockStats })
}
