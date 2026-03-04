import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

type ReviewStatus = 'pending' | 'published' | 'rejected'

type ReviewDoc = {
  professionalId: string
  authorName: string
  rating: number
  comment: string
  status: ReviewStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  moderationNotes?: string
}

async function recalculateProfessionalReviewStats(adminDb: any, professionalId: string) {
  const reviewsSnap = await adminDb
    .collection('professional_reviews')
    .where('professionalId', '==', professionalId)
    .where('status', '==', 'published')
    .limit(500)
    .get()

  const published = reviewsSnap.docs.map((d: any) => d.data() as ReviewDoc)
  const reviewCount = published.length
  const totalRating = published.reduce((sum: number, review: ReviewDoc) => sum + Number(review.rating || 0), 0)
  const rating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(2)) : 0

  await adminDb.collection('users').doc(professionalId).set(
    {
      reviewCount,
      rating,
      updatedAt: new Date(),
    },
    { merge: true }
  )
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })

    const { searchParams } = new URL(req.url)
    const statusParam = String(searchParams.get('status') || 'pending').toLowerCase()
    const status = statusParam === 'all' ? 'all' : statusParam
    const limitParam = Number(searchParams.get('limit') || '200')
    const safeLimit = Math.min(Math.max(limitParam, 1), 500)

    let ref: any = adminDb.collection('professional_reviews')
    if (status !== 'all') {
      ref = ref.where('status', '==', status)
    }

    let snap
    try {
      snap = await ref.orderBy('createdAt', 'desc').limit(safeLimit).get()
    } catch {
      snap = await ref.limit(safeLimit).get()
    }

    const rows = snap.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as ReviewDoc) }))

    const professionalIds: string[] = Array.from(new Set(rows.map((item: any) => item.professionalId).filter(Boolean)))
    const professionals = new Map<string, { name: string; role: string }>()

    await Promise.all(
      professionalIds.map(async (id: string) => {
        try {
          const userDoc = await adminDb.collection('users').doc(id).get()
          if (userDoc.exists) {
            const data = userDoc.data() || {}
            professionals.set(id, {
              name: String(data.name || data.displayName || data.company || 'Profesional'),
              role: String(data.role || ''),
            })
          }
        } catch {}
      })
    )

    const data = rows
      .map((row: any) => ({
        ...row,
        professionalName: professionals.get(row.professionalId)?.name || 'Profesional',
        professionalRole: professionals.get(row.professionalId)?.role || '',
      }))
      .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))

    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin/reviews][GET] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load reviews' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })

    const { id, status, moderationNotes } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'id and status are required' }, { status: 400 })
    }

    const normalizedStatus = String(status).toLowerCase()
    if (!['pending', 'published', 'rejected'].includes(normalizedStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 })
    }

    const reviewRef = adminDb.collection('professional_reviews').doc(String(id))
    const reviewSnap = await reviewRef.get()
    if (!reviewSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Review not found' }, { status: 404 })
    }

    const review = reviewSnap.data() as ReviewDoc

    await reviewRef.set(
      {
        status: normalizedStatus,
        moderationNotes: String(moderationNotes || '').trim().slice(0, 1000),
        reviewedBy: admin.email,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    if (review?.professionalId) {
      await recalculateProfessionalReviewStats(adminDb, review.professionalId)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin/reviews][PATCH] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update review' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }

    const reviewRef = adminDb.collection('professional_reviews').doc(String(id))
    const reviewSnap = await reviewRef.get()
    if (!reviewSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Review not found' }, { status: 404 })
    }

    const review = reviewSnap.data() as ReviewDoc
    await reviewRef.delete()

    if (review?.professionalId) {
      await recalculateProfessionalReviewStats(adminDb, review.professionalId)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin/reviews][DELETE] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to delete review' }, { status: 500 })
  }
}
