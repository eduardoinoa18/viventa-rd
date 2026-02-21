import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'

export const dynamic = 'force-dynamic'

function parseRange(range: string | null): number {
  switch (range) {
    case '7d': return 7 * 24 * 60 * 60 * 1000
    case '30d': return 30 * 24 * 60 * 60 * 1000
    case '24h':
    default:
      return 24 * 60 * 60 * 1000
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN','SUPPORT'] })
  if (authResult instanceof Response) return authResult

  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Admin DB unavailable' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200)
    const sinceMs = parseRange(range)
    const since = new Date(Date.now() - sinceMs)

    // Fetch createdAt and receivedAt ranges separately, merge in memory
    const [createdSnap, receivedSnap] = await Promise.all([
      db.collection('email_events').where('createdAt', '>=', since).get(),
      db.collection('email_events').where('receivedAt', '>=', since).get(),
    ])

    const mapDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const d = doc.data() as any
      const ts: Date = d.receivedAt?.toDate?.() || d.createdAt?.toDate?.() || new Date(0)
      return {
        id: doc.id,
        provider: d.provider || 'unknown',
        eventType: d.eventType || 'unknown',
        to: d.to || d.payload?.to || null,
        subject: d.subject || d.payload?.subject || null,
        timestamp: ts,
        raw: d,
      }
    }

    const created = createdSnap.docs.map(mapDoc)
    const received = receivedSnap.docs.map(mapDoc)
    const mergedMap = new Map<string, any>()
    for (const e of [...created, ...received]) mergedMap.set(e.id, e)
    const merged = Array.from(mergedMap.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)

    return NextResponse.json({ ok: true, data: merged })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
