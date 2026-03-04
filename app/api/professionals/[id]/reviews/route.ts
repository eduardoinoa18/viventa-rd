import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

type ReviewDoc = {
  professionalId: string
  authorName: string
  rating: number
  comment: string
  status: 'published' | 'pending'
  createdAt: string
}

export async function GET(_: NextRequest, context: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const professionalId = context.params.id
    const snap = await db
      .collection('professional_reviews')
      .where('professionalId', '==', professionalId)
      .where('status', '==', 'published')
      .limit(50)
      .get()

    const reviews = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as ReviewDoc) }))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

    const stats = reviews.reduce(
      (acc, item) => {
        acc.count += 1
        acc.total += Number(item.rating || 0)
        return acc
      },
      { count: 0, total: 0 }
    )

    return NextResponse.json({
      ok: true,
      reviews,
      summary: {
        count: stats.count,
        average: stats.count > 0 ? Number((stats.total / stats.count).toFixed(2)) : 0,
      },
    })
  } catch (error: any) {
    console.error('[api/professionals/[id]/reviews] GET error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to load reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const professionalId = context.params.id
    const body = await req.json()

    const authorName = String(body?.authorName || '').trim().slice(0, 120)
    const comment = String(body?.comment || '').trim().slice(0, 2000)
    const rating = Number(body?.rating)

    if (!authorName || !comment || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: 'Invalid review payload' }, { status: 400 })
    }

    const professionalDoc = await db.collection('users').doc(professionalId).get()
    if (!professionalDoc.exists) {
      return NextResponse.json({ ok: false, error: 'Professional not found' }, { status: 404 })
    }

    await db.collection('professional_reviews').add({
      professionalId,
      authorName,
      rating,
      comment,
      status: 'pending',
      createdAt: new Date().toISOString(),
    } as ReviewDoc)

    return NextResponse.json({ ok: true, message: 'Review submitted for moderation' })
  } catch (error: any) {
    console.error('[api/professionals/[id]/reviews] POST error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to submit review' }, { status: 500 })
  }
}
