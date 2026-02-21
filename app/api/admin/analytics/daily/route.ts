import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

function getStartDate(range: '7d' | '30d' | '90d' | '1y'): string {
  const now = new Date()
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
  base.setUTCDate(base.getUTCDate() - (days - 1))
  return base.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Admin DB unavailable' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const range = (searchParams.get('range') as '7d' | '30d' | '90d' | '1y') || '30d'
    const start = getStartDate(range)

    const snap = await db
      .collection('analytics_daily')
      .where('date', '>=', start)
      .orderBy('date', 'asc')
      .get()

    const days: any[] = []
    snap.forEach((doc) => days.push(doc.data()))

    return NextResponse.json({ ok: true, data: days })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
