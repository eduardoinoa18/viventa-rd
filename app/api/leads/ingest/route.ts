import { NextResponse } from 'next/server'
import { ingestLead } from '@/lib/leadIngestion'
import { keyFromRequest, rateLimit } from '@/lib/rateLimiter'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { emitActivityEvent } from '@/lib/activityEvents'

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

    const db = getAdminDb()
    if (db) {
      const resultRecord = (result || {}) as Record<string, unknown>
      const resultId = String(resultRecord.id || resultRecord.mergedIntoLeadId || body?.sourceId || Date.now())
      await emitActivityEvent(db, {
        type: 'lead_contacted',
        actorId: body.buyerEmail || body.buyerPhone || null,
        actorRole: 'public',
        entityType: 'lead',
        entityId: resultId,
        listingId: String(body?.payload?.listingId || body?.sourceId || ''),
        metadata: {
          source: body.source || null,
          leadType: body.type || null,
          buyerName: body.buyerName || null,
        },
      })
    }

    return NextResponse.json({ ok: true, data: result })
  } catch (error: any) {
    console.error('[leads/ingest] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to ingest lead' },
      { status: 500 }
    )
  }
}
