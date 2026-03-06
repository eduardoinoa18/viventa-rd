import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { getProjectByIdOrThrow } from '@/lib/projectInventory/repositories/projectsRepository'
import { listUnits } from '@/lib/projectInventory/repositories/unitsRepository'
import { canReadProject } from '@/lib/projectInventory/permissions'

export const dynamic = 'force-dynamic'

function toSafeInt(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.floor(parsed)))
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (!['master_admin', 'admin', 'broker', 'agent'].includes(context.role)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const project = await getProjectByIdOrThrow(params.id)
    if (!canReadProject(project as unknown as Record<string, unknown>, context)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = (searchParams.get('status') || '').trim() || undefined
    const phase = (searchParams.get('phase') || '').trim() || undefined
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const limit = toSafeInt(searchParams.get('limit'), 200, 1, 2000)

    const units = await listUnits({
      projectId: project.id,
      status: status as any,
      phase,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      limit,
    })

    return NextResponse.json({ ok: true, projectId: project.id, units, total: units.length })
  } catch (error: any) {
    console.error('[api/broker/projects/[id]/units] GET error', error)
    const status = error?.status || (String(error?.message || '').includes('not found') ? 404 : 500)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to list units' }, { status })
  }
}
