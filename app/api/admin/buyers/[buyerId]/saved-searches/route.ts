import { NextRequest, NextResponse } from 'next/server'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { listSavedSearches } from '@/lib/savedSearchService'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { buyerId: string } }
) {
  try {
    await requireMasterAdmin(request)
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status })
    }
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { buyerId } = params
  if (!buyerId) {
    return NextResponse.json({ ok: false, error: 'buyerId is required' }, { status: 400 })
  }

  try {
    const searches = await listSavedSearches(buyerId)
    return NextResponse.json({ ok: true, data: { searches } })
  } catch (error: any) {
    console.error('admin/buyers/[buyerId]/saved-searches error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load saved searches' }, { status: 500 })
  }
}
