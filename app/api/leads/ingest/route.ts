import { NextResponse } from 'next/server'
import { ingestLead } from '@/lib/leadIngestion'
import { keyFromRequest, rateLimit } from '@/lib/rateLimiter'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const rl = rateLimit(keyFromRequest(request), 40, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await request.json().catch(() => ({}))
    const result = await ingestLead({
      type: body.type,
      source: body.source,
      sourceId: body.sourceId,
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerPhone: body.buyerPhone,
      message: body.message,
      payload: body.payload || {},
    })

    return NextResponse.json({ ok: true, data: result })
  } catch (error: any) {
    console.error('[leads/ingest] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to ingest lead' },
      { status: 500 }
    )
  }
}
