// app/api/crm/buyers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

// GET /api/crm/buyers/[id] - Get single buyer detail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Admin SDK not configured' },
        { status: 503 }
      )
    }

    const buyerId = params.id

    const doc = await adminDb.collection('users').doc(buyerId).get()

    if (!doc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Buyer not found' },
        { status: 404 }
      )
    }

    const buyer = { id: doc.id, ...doc.data() } as any

    // Verify it's actually a buyer
    if (buyer.role !== 'buyer') {
      return NextResponse.json(
        { ok: false, error: 'User is not a buyer' },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, data: buyer })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[crm/buyers/[id]] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch buyer' },
      { status: 500 }
    )
  }
}
