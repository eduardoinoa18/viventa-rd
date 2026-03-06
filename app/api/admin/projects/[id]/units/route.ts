import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { canManageProject } from '@/lib/projectInventory/permissions'
import { getProjectByIdOrThrow, updateProjectCounters } from '@/lib/projectInventory/repositories/projectsRepository'
import { createUnit, listUnits } from '@/lib/projectInventory/repositories/unitsRepository'
import { logUnitCreated } from '@/lib/projectInventory/repositories/eventsRepository'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

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
    const project = await getProjectByIdOrThrow(params.id)
    if (!canManageProject(project as unknown as Record<string, unknown>, context)) {
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
    console.error('[api/admin/projects/[id]/units] GET error', error)
    const status = error?.status || (String(error?.message || '').includes('not found') ? 404 : 500)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to list units' }, { status })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    const project = await getProjectByIdOrThrow(params.id)
    if (!canManageProject(project as unknown as Record<string, unknown>, context)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const unitCode = safeText(body?.unitCode)
    const phase = safeText(body?.phase)
    const propertyType = safeText(body?.propertyType)

    if (!unitCode || !phase || !propertyType) {
      return NextResponse.json({ ok: false, error: 'unitCode, phase and propertyType are required' }, { status: 400 })
    }

    const unit = await createUnit({
      projectId: project.id,
      unitCode,
      phase,
      propertyType,
      beds: Number(body?.beds || 0),
      baths: Number(body?.baths || 0),
      parking: Number(body?.parking || 0),
      areaM2: Number(body?.areaM2 || 0),
      price: Number(body?.price || 0),
      maintenanceFee: body?.maintenanceFee != null ? Number(body.maintenanceFee) : null,
      ownerType: body?.ownerType === 'broker_inventory' ? 'broker_inventory' : 'developer_inventory',
      assignedBrokerageId: safeText(body?.assignedBrokerageId) || null,
      availabilityDate: body?.availabilityDate ? new Date(body.availabilityDate) : null,
    })

    await updateProjectCounters(project.id, {
      totalUnits: 1,
      availableUnits: unit.status === 'available' ? 1 : 0,
      reservedUnits: unit.status === 'reserved' ? 1 : 0,
      soldUnits: unit.status === 'sold' ? 1 : 0,
    })

    await logUnitCreated({
      projectId: project.id,
      unitId: unit.id,
      actorUid: context.uid,
      actorRole: context.role,
      officeId: context.officeId || undefined,
      unitData: {
        unitCode: unit.unitCode,
        phase: unit.phase,
        status: unit.status,
        price: unit.price,
      },
    })

    return NextResponse.json({ ok: true, unit }, { status: 201 })
  } catch (error: any) {
    console.error('[api/admin/projects/[id]/units] POST error', error)
    const status = error?.status || (String(error?.message || '').includes('not found') ? 404 : 500)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to create unit' }, { status })
  }
}
